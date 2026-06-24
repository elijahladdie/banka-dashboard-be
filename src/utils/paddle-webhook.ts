import { AuthService } from '../services/auth.service';
import logger from './logger';
import { PaddleService } from '../services/paddle.service';
import type { WebhookResult } from '../types';
const PROCESSED_EVENTS = new Map<string, number>();
const DEDUP_TTL_MS = 86_400_00
const DEDUP_CLEANUP_INTERVAL_MS = 3_600_00

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
// AuthService lazy singleton
// ============================================================

let _authService: AuthService | null = null;

function getAuthService(): AuthService {
  if (!_authService) {
    _authService = new AuthService();
  }
  return _authService;
}
let _paddleService: PaddleService | null = null;

function getPaddleService(): PaddleService {
  if (!_paddleService) {
    _paddleService = new PaddleService();
  }
  return _paddleService;
}

const HANDLED_EVENT_TYPES = new Set([
  'customer.created',
  'transaction.completed',
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

const latestEventPerEmail = new Map<string, string>();

export async function processPaddleWebhook(event: Record<string, any>): Promise<WebhookResult> {
  const eventType = event.event_type;
  const eventId = event.event_id || '';
  const occurredAt = event.occurred_at || '';

  if (!HANDLED_EVENT_TYPES.has(eventType)) {
    return { handled: false, reason: `Unhandled event type: ${eventType}` };
  }

  if (eventId && hasProcessedEvent(eventId)) {
    return { handled: true, reason: `Duplicate event skipped: ${eventId}` };
  }

  const { email, fullName, customerId, subscriptionId } = extractCustomerInfo(event);
  if (eventType === 'customer.created') {
    if (!email) {
      return { handled: false, reason: 'No customer email found in customer.created event' };
    }


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


      return { handled: true };
    } catch (error: any) {
      return { handled: false, reason: error.message };
    }
  }

  if (!customerId) {
    return { handled: false, reason: `No customer_id in ${eventType} event` };
  }

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
      const paddleService = getPaddleService();
      const customer =
        await paddleService.findCustomer(customerId);

      if (!customer?.email) {
        return {
          handled: false,
          reason: `Unable to resolve customer ${customerId}`,
        };
      }

      await authService.signUpFromPaddle({
        email: customer.email,
        fullName:
          customer.name ||
          customer.email.split('@')[0],
        customerId,
        subscriptionId: subscriptionId || '',
        source: 'paddle',
      });

      return await authService.updateSubscriptionFromPaddle({
        customerId,
        subscriptionId: subscriptionId || '',
        paddleEvent: event,
      });
    }
    return { handled: true };
  } catch (error: any) {
    return { handled: false, reason: error.message };
  }
}
