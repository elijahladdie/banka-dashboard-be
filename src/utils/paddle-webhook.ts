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
// lazy singleton
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
  "subscription.created",
  "subscription.updated",
  "subscription.canceled",
  "transaction.completed",
]);

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

export async function processPaddleWebhook(
  event: Record<string, any>
): Promise<WebhookResult> {
  const eventType = event.event_type;
  const eventId = event.event_id || "";
  const occurredAt = event.occurred_at || "";

  if (!HANDLED_EVENT_TYPES.has(eventType)) {
    return {
      handled: false,
      reason: `Unhandled event type: ${eventType}`,
    };
  }

  if (eventId && hasProcessedEvent(eventId)) {
    return {
      handled: true,
      reason: `Duplicate event skipped: ${eventId}`,
    };
  }

  const {
    email,
    fullName,
    customerId,
    subscriptionId,
  } = extractCustomerInfo(event);

  const authService = getAuthService();
  const paddleService = getPaddleService();

  if (eventType === "customer.created") {
    if (!email) {
      return {
        handled: false,
        reason: "Missing email in customer.created",
      };
    }

    markEventProcessed(eventId);

    try {
      await authService.signUpFromPaddle({
        email,
        fullName: fullName || email.split("@")[0],
        customerId: customerId || "",
        subscriptionId: "",
        source: "paddle",
      });

      return { handled: true };
    } catch (err: any) {
      return { handled: false, reason: err.message };
    }
  }

  if (!customerId) {
    return {
      handled: false,
      reason: `Missing customerId in ${eventType}`,
    };
  }

  if (occurredAt) {
    const last = latestEventPerEmail.get(customerId);

    if (last && occurredAt < last) {
      logger.info(
        `[paddle-webhook] Stale event ignored ${eventId}`
      );

      return {
        handled: false,
        reason: "stale event ignored",
      };
    }

    latestEventPerEmail.set(customerId, occurredAt);
  }
  if (eventId) markEventProcessed(eventId);
  if (eventType === "subscription.created") {
    try {
      await authService.syncSubscriptionFromPaddle({
        customerId,
        subscriptionId: subscriptionId || "",
        event,
      });

      return { handled: true };
    } catch (err: any) {
      return { handled: false, reason: err.message };
    }
  }

  if (eventType === "subscription.updated") {
    try {
      const user =
        await authService.updateSubscriptionFromPaddle({
          customerId,
          subscriptionId: subscriptionId || "",
          paddleEvent: event,
        });

      // fallback if user not found
      if (!user) {
        const customer =
          await paddleService.findCustomer(customerId);

        if (!customer?.email) {
          return {
            handled: false,
            reason: "Customer not resolvable",
          };
        }

        await authService.signUpFromPaddle({
          email: customer.email,
          fullName:
            customer.name ||
            customer.email.split("@")[0],
          customerId,
          subscriptionId: subscriptionId || "",
          source: "paddle",
        });

        await authService.updateSubscriptionFromPaddle({
          customerId,
          subscriptionId: subscriptionId || "",
          paddleEvent: event,
        });
      }

      return { handled: true };
    } catch (err: any) {
      return { handled: false, reason: err.message };
    }
  }

  if (eventType === "subscription.canceled") {
    try {
      await authService.cancelSubscriptionFromPaddle({
        customerId,
        subscriptionId: subscriptionId || "",
        paddleEvent: event,
      });

      return { handled: true };
    } catch (err: any) {
      return { handled: false, reason: err.message };
    }
  }
  if (eventType === "transaction.completed") {
    try {
      await authService.handleTransactionCompleted({
        customerId,
        event,
      });

      return { handled: true };
    } catch (err: any) {
      return { handled: false, reason: err.message };
    }
  }

  return {
    handled: false,
    reason: "No handler matched",
  };
}