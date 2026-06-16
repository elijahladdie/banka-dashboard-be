import { createHmac, timingSafeEqual } from 'node:crypto';
import { AuthService } from '../services/auth.service';
import logger from './logger';

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


  const timestampMs = parseInt(ts, 10) * 1000;
  if (isNaN(timestampMs) || Date.now() - timestampMs > 5_000) {
    logger.warn('[paddle-webhook] Event expired or invalid timestamp (replay protection)');
    return false;
  }


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

const HANDLED_EVENT_TYPES = new Set([
  'customer.created',
  'transaction.completed',
  'transaction.paid',
  'subscription.created',
]);

// ============================================================
// Event processing
// ============================================================

function extractCustomerInfo(event: Record<string, any>): {
  email?: string;
  fullName?: string;
  customerId?: string;
  subscriptionId?: string;
} {
  const eventType = event.event_type;
  const data = event.data || {};

  if (eventType === 'customer.created') {

    return {
      email: data.email,
      fullName: data.name,
      customerId: data.id,
      subscriptionId: undefined,
    };
  }

  if (eventType.startsWith('transaction.')) {
    return {
      email: undefined,
      fullName: undefined,
      customerId: data.customer_id,
      subscriptionId: data.subscription_id,
    };
  }

  return {
    email: undefined,
    fullName: undefined,
    customerId: data.customer_id,
    subscriptionId: data.id,
  };
}

/**
 * Track the most recent `occurred_at` per entity so we can reject
 * events that arrive out of order (stale events).
 */
const latestEventPerEmail = new Map<string, string>();

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
      return { handled: true };
    } catch (error: any) {
      return { handled: false, reason: error.message };
    }
  }

  if (!customerId) {
    return { handled: false, reason: `No customer_id in ${eventType} event` };
  }

  // Check occurred_at ordering
  if (occurredAt) {
    const lastOccurredAt = latestEventPerEmail.get(customerId);
    if (lastOccurredAt && occurredAt < lastOccurredAt) {
      logger.info(
        `[paddle-webhook] Skipping stale event ${eventId} (${occurredAt}) for customer ${customerId}; last seen ${lastOccurredAt}`,
      );
      return { handled: false, reason: `Stale event skipped (occurred_at: ${occurredAt} < ${lastOccurredAt})` };
    }
    latestEventPerEmail.set(customerId, occurredAt);
  }

  if (eventId) markEventProcessed(eventId);

  try {
    const authService = getAuthService();
    const user = await authService.updateSubscriptionFromPaddle({
      customerId,
      subscriptionId: subscriptionId || '',
      paddleEvent: event,
    });

    if (!user) {
      logger.info(
        `[paddle-webhook] No user found for customer_id ${customerId} on ${eventType} — skipping (customer.created may arrive later)`,
      );
      return { handled: false, reason: `No user found for customer_id ${customerId}` };
    }
    return { handled: true };
  } catch (error: any) {
    return { handled: false, reason: error.message };
  }
}
