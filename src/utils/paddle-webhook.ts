import { createHmac, timingSafeEqual } from 'node:crypto';
import { AuthService } from '../services/auth.service';
import { sendRegistrationEmail } from '../services/email.service';

// ============================================================
// Event deduplication (in-memory)
//
// Paddle guarantees at-least-once delivery — the same event_id
// can arrive multiple times. We store recently-seen event_ids
// in memory to skip duplicates.
//
// For multi-process deployments, replace with a DB-backed store
// (e.g. a `webhook_events` table keyed on event_id).
// ============================================================

const PROCESSED_EVENTS = new Map<string, number>();
const DEDUP_TTL_MS = 86_400_000; // 24 hours
const DEDUP_CLEANUP_INTERVAL_MS = 3_600_000; // cleanup every hour

// Periodic cleanup of stale entries
setInterval(() => {
  const cutoff = Date.now() - DEDUP_TTL_MS;
  for (const [id, ts] of PROCESSED_EVENTS) {
    if (ts < cutoff) PROCESSED_EVENTS.delete(id);
  }
}, DEDUP_CLEANUP_INTERVAL_MS).unref();

function hasProcessedEvent(eventId: string): boolean {
  return PROCESSED_EVENTS.has(eventId);
}

function markEventProcessed(eventId: string): void {
  PROCESSED_EVENTS.set(eventId, Date.now());
}

// ============================================================
// Signature verification
// ============================================================

/**
 * Verify a Paddle webhook signature.
 *
 * Per Paddle docs:
 * 1. Extract `ts` and `h1` from the `Paddle-Signature` header.
 * 2. Build signed payload: `ts` + `:` + rawBody
 * 3. Compute HMAC-SHA256 with the endpoint secret key.
 * 4. Compare using a timing-safe function.
 * 5. (Optional) Reject if timestamp is older than 5 seconds (replay protection).
 *
 * @see https://developer.paddle.com/webhooks/about/signature-verification
 */
export function verifyPaddleSignature(
  rawBody: string,
  paddleSignature: string,
  secret: string,
): boolean {
  const parts = paddleSignature.split(';');
  let ts = '';
  let signature = '';

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 'ts') ts = value;
    if (key === 'h1') signature = value;
  }

  if (!ts || !signature) return false;

  // Replay protection: reject if timestamp is more than 5 seconds old
  const timestampMs = parseInt(ts, 10) * 1000;
  if (isNaN(timestampMs) || Date.now() - timestampMs > 5_000) {
    console.warn('[paddle-webhook] Event expired or invalid timestamp (replay protection)');
    return false;
  }

  // Per Paddle docs: signed payload = ts + ":" + rawBody
  const signedPayload = `${ts}:${rawBody}`;
  const expectedSignature = createHmac('sha256', secret)
    .update(signedPayload, 'utf-8')
    .digest('hex');

  try {
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  } catch {
    return false;
  }
}

// ============================================================
// AuthService lazy singleton
// ============================================================

let _authService: AuthService | null = null;

function getAuthService(): AuthService {
  if (!_authService) {
    _authService = new AuthService();
  }
  return _authService;
}

export interface WebhookResult {
  handled: boolean;
  reason?: string;
}

/**
 * Handled Paddle event types.
 *
 * Checkout event sequence: transaction.created → customer.created →
 * address.created → transaction.paid → subscription.created (if recurring)
 * → transaction.completed
 *
 * @see https://developer.paddle.com/webhooks/about/how-webhooks-work#what-happens-at-checkout
 */
const HANDLED_EVENT_TYPES = new Set([
  'customer.created',
  'transaction.completed',
  'transaction.paid',
  'subscription.created',
]);

// ============================================================
// Event processing
// ============================================================

/**
 * Paddle webhook payload structures (from actual events):
 *
 * customer.created:
 *   data = { id: "ctm_...", email: "...", name: null|null, ... }
 *   → data IS the customer entity directly (not nested under data.customer)
 *   → has email + customerId, name is often null
 *
 * transaction.completed / transaction.paid:
 *   data = { id: "txn_...", customer_id: "ctm_...", subscription_id: "sub_...", items: [...], ... }
 *   → customer_id is a STRING reference, NOT an embedded object
 *   → NO data.customer object — email/name NOT in this payload
 *
 * subscription.created:
 *   data = { id: "sub_...", customer_id: "ctm_...", transaction_id: "txn_...", items: [...], ... }
 *   → customer_id is a STRING reference
 *   → NO embedded customer info
 */
function extractCustomerInfo(event: Record<string, any>): {
  email?: string;
  fullName?: string;
  customerId?: string;
  subscriptionId?: string;
} {
  const eventType = event.event_type;
  const data = event.data || {};

  if (eventType === 'customer.created') {
    // customer.created: data IS the customer entity
    return {
      email: data.email,
      fullName: data.name, // may be null — caller handles fallback
      customerId: data.id,
      subscriptionId: undefined, // no subscription info at this stage
    };
  }

  if (eventType.startsWith('transaction.')) {
    // transaction.*: customer_id is a string ref, not an object
    return {
      email: undefined, // NOT in transaction payload
      fullName: undefined,
      customerId: data.customer_id, // e.g. "ctm_..."
      subscriptionId: data.subscription_id, // e.g. "sub_..."
    };
  }

  // subscription.*: customer_id is a string ref
  return {
    email: undefined,
    fullName: undefined,
    customerId: data.customer_id,
    subscriptionId: data.id, // subscription ID is data.id for subscription events
  };
}

/**
 * Track the most recent `occurred_at` per entity so we can reject
 * events that arrive out of order (stale events).
 */
const latestEventPerEmail = new Map<string, string>();

/**
 * Process a Paddle webhook event.
 *
 * Two-phase provisioning flow (aligned with actual Paddle payloads):
 *
 * Phase 1 — customer.created:
 *   Has email + customerId. Creates the user record in DB. NO email sent yet
 *   because payment hasn't been confirmed at this point.
 *
 * Phase 2 — transaction.completed / transaction.paid:
 *   Has customer_id (string ref) + subscription_id. Finds the user by
 *   paddleCustomerId, updates subscription info, and SENDS the
 *   registration-completion email (payment is now confirmed).
 *
 * Phase 2b — subscription.created:
 *   Has customer_id + subscription id. Finds user by paddleCustomerId and
 *   updates subscription info. Email should already have been sent by
 *   transaction.completed.
 */
export async function processPaddleWebhook(event: Record<string, any>): Promise<WebhookResult> {
  const eventType = event.event_type;
  const eventId = event.event_id || '';
  const occurredAt = event.occurred_at || '';

  // 1. Reject unhandled event types
  if (!HANDLED_EVENT_TYPES.has(eventType)) {
    return { handled: false, reason: `Unhandled event type: ${eventType}` };
  }

  // 2. Deduplicate by event_id (at-least-once delivery guarantee)
  if (eventId && hasProcessedEvent(eventId)) {
    return { handled: true, reason: `Duplicate event skipped: ${eventId}` };
  }

  // 3. Extract info from event payload
  const { email, fullName, customerId, subscriptionId } = extractCustomerInfo(event);

  // ====================================================================
  // Phase 1: customer.created — create user with email + customerId
  // ====================================================================
  if (eventType === 'customer.created') {
    if (!email) {
      return { handled: false, reason: 'No customer email found in customer.created event' };
    }

    // Mark as processed before async work
    if (eventId) markEventProcessed(eventId);

    try {
      const authService = getAuthService();
      await authService.signUpFromPaddle({
        email,
        fullName: fullName || email.split('@')[0],
        source: 'paddle',
        subscriptionId: '',
        customerId: customerId || '',
      });

      // DO NOT send registration email here — payment hasn't been confirmed yet.
      // The email will be sent on transaction.completed.
      return { handled: true };
    } catch (error: any) {
      return { handled: false, reason: error.message };
    }
  }

  // ====================================================================
  // Phase 2: transaction.completed / transaction.paid / subscription.created
  //          — find user by paddleCustomerId, update subscription, send email
  // ====================================================================

  if (!customerId) {
    return { handled: false, reason: `No customer_id in ${eventType} event` };
  }

  // Check occurred_at ordering
  if (occurredAt) {
    const lastOccurredAt = latestEventPerEmail.get(customerId);
    if (lastOccurredAt && occurredAt < lastOccurredAt) {
      console.log(
        `[paddle-webhook] Skipping stale event ${eventId} (${occurredAt}) for customer ${customerId}; last seen ${lastOccurredAt}`,
      );
      return { handled: false, reason: `Stale event skipped (occurred_at: ${occurredAt} < ${lastOccurredAt})` };
    }
    latestEventPerEmail.set(customerId, occurredAt);
  }

  // Mark as processed before async work
  if (eventId) markEventProcessed(eventId);

  try {
    const authService = getAuthService();
    const user = await authService.updateSubscriptionFromPaddle({
      customerId,
      subscriptionId: subscriptionId || '',
    });

    if (!user) {
      // customer.created hasn't arrived yet — this is safe to skip.
      // When customer.created arrives later, the user will be created without email.
      // The email should be triggered separately (e.g. manually or via a Paddle replay).
      console.log(
        `[paddle-webhook] No user found for customer_id ${customerId} on ${eventType} — skipping (customer.created may arrive later)`,
      );
      return { handled: false, reason: `No user found for customer_id ${customerId}` };
    }

    // Only send registration email on payment-confirmed events (transaction.completed/paid),
    // not on subscription.created (which may fire after the email was already sent)
    const isPaymentEvent = eventType === 'transaction.completed' || eventType === 'transaction.paid';
console.log(`[paddle-webhook] Processing ${eventType} for user ${user.email} (customer_id: ${customerId})`);
    if (isPaymentEvent && !user.registrationCompleted) {
      const displayName = fullName || user.firstName || email || user.email.split('@')[0];
      sendRegistrationEmail(user.email, displayName).catch((err) =>
        console.error('[paddle-webhook] Failed to send registration email:', err),
      );
    }

    return { handled: true };
  } catch (error: any) {
    return { handled: false, reason: error.message };
  }
}
