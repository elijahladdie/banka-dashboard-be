import { Paddle, ApiError, CustomerCreatedEvent, Customer, SubscriptionStatus as PaddleSubscriptionStatus } from '@paddle/paddle-node-sdk';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from '../repositories/implementations/auth.repository';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { ForbiddenError, ServerError, UnauthorizedError } from '../helpers';
import { PADDLE_API_KEY, PADDLE_API_ENV, PADDLE_CREATION_WEBHOOK_SECRET, PADDLE_SUBSCRIPTION_WEBHOOK_SECRET, PLAN_NAME_MAP, BCRYPT_SALT_ROUNDS, JWT_ACCESS_SECRET, SUBSCRIPTION_RANK } from '../constants/constants';
import { PaddleProductQuery, WebhookResult, PaddleSignUpInput } from '../types';
import { generateTokens, normalizePaddleSubscription, mapProductToClientResponse, resolveSubscriptionEvent } from '../helpers/helper';
import { sendRegistrationEmail, sendSubsPlanChangeEmail } from './email.service';
import logger from '../utils/logger';
import prisma from '../utils/prisma';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface PaddleSubscriptionEvent {
  customerId: string;
  subscriptionId: string;
  event: any;
}

interface ReconciliationResult {
  action: 'synced' | 'replaced' | 'duplicate_ignored' | 'created' | 'canceled' | 'noop';
  previousSubscriptionId?: string;
  newSubscriptionId?: string;
}

interface SubscriptionLock {
  userId: string;
  acquiredAt: Date;
}

// ──────────────────────────────────────────────
// Lock manager for race-condition protection
// ──────────────────────────────────────────────

const subscriptionLocks = new Map<string, SubscriptionLock>();

function acquireSubscriptionLock(userId: string): boolean {
  const existing = subscriptionLocks.get(userId);
  if (existing) {
    const age = Date.now() - existing.acquiredAt.getTime();
    if (age < 30_000) return false; // Lock still valid (30s)
    subscriptionLocks.delete(userId); // Stale lock
  }
  subscriptionLocks.set(userId, { userId, acquiredAt: new Date() });
  return true;
}

function releaseSubscriptionLock(userId: string): void {
  subscriptionLocks.delete(userId);
}

// ──────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────

export class PaddleService {
  private readonly paddle: Paddle;
  private readonly authRepository: AuthRepository;
  private readonly subscriptionsRepository: SubscriptionsRepository;

  constructor() {
    this.paddle = new Paddle(PADDLE_API_KEY, {
      environment: PADDLE_API_ENV,
    });
    this.authRepository = new AuthRepository();
    this.subscriptionsRepository = new SubscriptionsRepository();
  }

  isSubscriptionActive(subscription: {
    status: string;
    endsAt?: Date | string | null;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date | string | null;
  }): boolean {
    const status = subscription.status?.toUpperCase();
    const now = new Date();
    const endsAt = subscription.endsAt ? new Date(subscription.endsAt) : null;

    // Definitely inactive statuses
    if (status === 'EXPIRED') return false;

    // Canceled: only inactive if the period has ended
    if (status === 'CANCELED') {
      if (endsAt && endsAt <= now) return false;
      // If cancelAtPeriodEnd is true but endsAt is still in future, still active
      return true;
    }

    // Active statuses
    const activeStatuses = ['ACTIVE', 'TRIALING', 'PAST_DUE'];
    if (!activeStatuses.includes(status)) return false;

    // If endsAt is in the past, subscription has expired
    if (endsAt && endsAt <= now) return false;

    return true;
  }

  /**
   * Returns the user's current effective subscription record.
   * Because the schema enforces one record per user (userId @unique),
   * this is a simple lookup.
   */
  async getCurrentEffectiveSubscription(userId: string) {
    return this.subscriptionsRepository.findOne({ userId });
  }

  // ══════════════════════════════════════════════
  // Phase 3: Subscription Reconciliation Engine
  // ══════════════════════════════════════════════

  /**
   * Centralized reconciliation method.
   * All Paddle subscription webhook events must pass through here.
   *
   * Decisions:
   * - Same subscription ID + no meaningful changes → ignore duplicate
   * - Same subscription ID + meaningful changes → sync
   * - Different subscription ID + active existing → replace (cancel old at period end)
   * - Different subscription ID + inactive existing → replace (no cancel needed)
   * - No local record → create/initialize with signUp
   */
  async reconcileSubscriptionEvent(
    customerId: string,
    subscriptionId: string,
    event: any,
  ): Promise<ReconciliationResult> {
    // 1. Find local subscription by customerId
    const localSub = await this.subscriptionsRepository.findOne({ customerId });

    // 2. If no local record exists, we need to create user + subscription
    if (!localSub) {
      const customer = await this.findCustomer(customerId);
      if (!customer?.email) {
        logger.warn('[reconciliation] Customer not resolvable for subscription event', {
          customerId,
          subscriptionId,
          eventType: event.eventType,
        });
        return { action: 'noop' };
      }

      await this.signUp({
        email: customer.email,
        fullName: customer.name || customer.email.split('@')[0],
        customerId,
        subscriptionId,
        source: 'paddle',
      });

      // Now sync the subscription data
      const newSub = await this.subscriptionsRepository.findOne({ customerId });
      if (newSub) {
        const normalized = normalizePaddleSubscription(event);
        await this.subscriptionsRepository.update(newSub.id, {
          subscriptionId,
          plan: normalized.product,
          status: normalized.status,
          startsAt: normalized.startsAt,
          endsAt: normalized.endsAt,
          billingInterval: normalized.billingCycle?.interval || 'month',
          metadata: this.appendMetadataEntry(newSub.metadata, {
            event: 'subscription_created',
            subscriptionId,
            timestamp: new Date().toISOString(),
          }),
        });
      }

      logger.info('[reconciliation] Customer subscription created via reconciliation', {
        customerId,
        subscriptionId,
        eventType: event.eventType,
      });

      return { action: 'created', newSubscriptionId: subscriptionId };
    }

    // 3. Compare subscription IDs
    const existingSubId = localSub.subscriptionId;

    // ── Same subscription ──
    if (existingSubId === subscriptionId) {
      return await this.handleSameSubscription(localSub, subscriptionId, event);
    }

    // ── Different subscription — run replacement workflow ──
    logger.info('[reconciliation] Subscription ID differs — starting replacement workflow', {
      customerId,
      oldSubscriptionId: existingSubId,
      newSubscriptionId: subscriptionId,
      userId: localSub.userId,
      eventType: event.eventType,
    });

    return await this.executeReplacementWorkflow(localSub, customerId, subscriptionId, event);
  }

  // ══════════════════════════════════════════════
  // Phase 5: Handle same subscription (sync or dedup)
  // ══════════════════════════════════════════════

  private async handleSameSubscription(
    localSub: any,
    subscriptionId: string,
    event: any,
  ): Promise<ReconciliationResult> {
    const normalized = normalizePaddleSubscription(event);

    // Duplicate detection: compare key fields
    const isDuplicate =
      localSub.status === normalized.status &&
      localSub.plan === normalized.product &&
      (!localSub.endsAt || !normalized.endsAt ||
        new Date(localSub.endsAt).getTime() === new Date(normalized.endsAt).getTime());

    if (isDuplicate) {
      logger.info('[reconciliation] Duplicate subscription event ignored', {
        subscriptionId,
        eventType: event.eventType,
        customerId: localSub.customerId,
      });
      return { action: 'duplicate_ignored' };
    }

    // Perform normal synchronization
    const previousPlan = localSub.plan;
    const previousInterval = localSub.billingInterval || 'month';
    const newPlan = normalized.product;
    const newInterval = normalized.billingCycle?.interval || 'month';

    await this.subscriptionsRepository.update(localSub.id, {
      subscriptionId,
      plan: newPlan,
      status: normalized.status,
      startsAt: normalized.startsAt,
      endsAt: normalized.endsAt,
      canceledAt: normalized.canceledAt,
      billingInterval: newInterval,
      metadata: {
        ...((localSub.metadata as Record<string, any>) || {}),
        currency: normalized.currency,
        amount: normalized.amount,
        billingCycle: normalized.billingCycle,
        event: event.eventType,
        lastSyncedAt: new Date().toISOString(),
      },
    });

    // Send plan change notification if plan/interval changed
    const changed = previousPlan !== newPlan || previousInterval !== newInterval;
    if (changed) {
      const user = await this.authRepository.findById(localSub.userId);
      if (user) {
        const previousRank = SUBSCRIPTION_RANK[`${previousPlan}:${previousInterval}` as keyof typeof SUBSCRIPTION_RANK];
        const newRank = SUBSCRIPTION_RANK[`${newPlan}:${newInterval}` as keyof typeof SUBSCRIPTION_RANK];
        const isUpgrade = newRank > previousRank;

        await sendSubsPlanChangeEmail({
          email: user.email,
          firstName: user.firstName,
          previousPlan: PLAN_NAME_MAP[previousPlan] || previousPlan,
          newPlan: PLAN_NAME_MAP[newPlan] || newPlan,
          previousInterval,
          newInterval,
          isUpgrade,
        });
      }
    }

    logger.info('[reconciliation] Subscription synchronized', {
      subscriptionId,
      eventType: event.eventType,
    });

    return { action: 'synced' };
  }

  // ══════════════════════════════════════════════
  // Phase 6: Subscription Replacement Workflow
  // ══════════════════════════════════════════════

  private async executeReplacementWorkflow(
    localSub: any,
    customerId: string,
    newSubscriptionId: string,
    event: any,
  ): Promise<ReconciliationResult> {
    const existingSubId = localSub.subscriptionId;
    const normalized = normalizePaddleSubscription(event);

    // Step 1: Check if the current subscription is still active
    const currentActive = this.isSubscriptionActive(localSub);

    // Step 2: If active, schedule cancellation at period end
    if (currentActive && existingSubId) {
      try {
        await this.cancelPaddleSubscriptionAtPeriodEnd(existingSubId);
        logger.info('[reconciliation] Previous subscription scheduled for cancellation at period end', {
          customerId,
          oldSubscriptionId: existingSubId,
          newSubscriptionId,
          userId: localSub.userId,
        });
      } catch (err: any) {
        logger.error('[reconciliation] Failed to schedule cancellation of previous subscription', {
          customerId,
          oldSubscriptionId: existingSubId,
          error: err.message,
        });
        // Continue — don't block replacement if cancellation fails
      }
    }

    // Step 3: Build metadata with replacement history
    const historyEntry = {
      event: 'subscription_replaced',
      from: existingSubId,
      to: newSubscriptionId,
      timestamp: new Date().toISOString(),
    };

    const metadata = this.appendMetadataEntry(localSub.metadata, historyEntry);

    // Step 4: Update local record to reference the new subscription
    await this.subscriptionsRepository.update(localSub.id, {
      subscriptionId: newSubscriptionId,
      plan: normalized.product,
      status: normalized.status,
      startsAt: normalized.startsAt,
      endsAt: normalized.endsAt,
      canceledAt: normalized.canceledAt,
      billingInterval: normalized.billingCycle?.interval || 'month',
      metadata: {
        ...metadata,
        currency: normalized.currency,
        amount: normalized.amount,
        billingCycle: normalized.billingCycle,
        event: event.eventType,
        lastSyncedAt: new Date().toISOString(),
      },
    });

    logger.info('[reconciliation] Subscription replaced successfully', {
      customerId,
      oldSubscriptionId: existingSubId,
      newSubscriptionId,
      userId: localSub.userId,
      eventType: event.eventType,
    });

    return {
      action: 'replaced',
      previousSubscriptionId: existingSubId ?? undefined,
      newSubscriptionId,
    };
  }

  /**
   * Cancel a Paddle subscription with period-end behavior.
   * The subscription remains active until the billing period ends.
   */
  private async cancelPaddleSubscriptionAtPeriodEnd(paddleSubscriptionId: string): Promise<void> {
    try {
      await this.paddle.subscriptions.cancel(paddleSubscriptionId, {
        effectiveFrom: 'next_billing_period',
      });
    } catch (error: any) {
      throw this.handlePaddleError(error, `Failed to cancel Paddle subscription ${paddleSubscriptionId}`);
    }
  }

  // ══════════════════════════════════════════════
  // Phase 4: Harden signUp()
  // ══════════════════════════════════════════════

  private async signUp(input: PaddleSignUpInput): Promise<{ user: any }> {
    const existingUser = await this.authRepository.findByEmail(input.email);

    if (existingUser) {
      // Load existing subscription
      const existingSub = await this.subscriptionsRepository.findOne({ userId: existingUser.id });

      // Acquire lock to prevent race conditions
      if (!acquireSubscriptionLock(existingUser.id)) {
        logger.warn('[signUp] Subscription lock active — skipping concurrent update', {
          userId: existingUser.id,
          email: input.email,
        });
        const { password: _, ...userWithoutPassword } = existingUser;
        return { user: userWithoutPassword };
      }

      try {
        if (existingSub) {
          // Validate before overwriting
          const incomingSubscriptionId = input.subscriptionId;
          const existingSubscriptionId = existingSub.subscriptionId;

          if (incomingSubscriptionId && existingSubscriptionId && incomingSubscriptionId !== existingSubscriptionId) {
            // Check if existing subscription is active
            const isActive = this.isSubscriptionActive(existingSub);

            if (isActive) {
              logger.info('[signUp] Existing active subscription detected — incoming Paddle subscription differs', {
                userId: existingUser.id,
                existingSubscriptionId,
                incomingSubscriptionId,
              });
              logger.info('[signUp] Starting subscription reconciliation');

              // Schedule cancellation of existing subscription
              try {
                await this.cancelPaddleSubscriptionAtPeriodEnd(existingSubscriptionId);
                logger.info('[signUp] Previous subscription scheduled for cancellation at period end', {
                  userId: existingUser.id,
                  oldSubscriptionId: existingSubscriptionId,
                  newSubscriptionId: incomingSubscriptionId,
                });
              } catch (err: any) {
                logger.error('[signUp] Failed to cancel previous subscription', {
                  userId: existingUser.id,
                  subscriptionId: existingSubscriptionId,
                  error: err.message,
                });
              }

              // Store replacement history
              const historyEntry = {
                event: 'subscription_replaced',
                from: existingSubscriptionId,
                to: incomingSubscriptionId,
                timestamp: new Date().toISOString(),
              };

              await this.subscriptionsRepository.update(existingSub.id, {
                customerId: input.customerId || existingSub.customerId,
                subscriptionId: input.subscriptionId || existingSub.subscriptionId,
                metadata: this.appendMetadataEntry(existingSub.metadata, historyEntry),
              });
            } else {
              // Existing subscription is not active, safe to overwrite
              await this.subscriptionsRepository.update(existingSub.id, {
                customerId: input.customerId || existingSub.customerId,
                subscriptionId: input.subscriptionId || existingSub.subscriptionId,
              });
            }
          } else {
            // Same subscription ID or no change — normal update
            await this.subscriptionsRepository.update(existingSub.id, {
              customerId: input.customerId || existingSub.customerId,
              subscriptionId: input.subscriptionId || existingSub.subscriptionId,
            });
          }
        } else {
          // No existing subscription — create new
          await this.subscriptionsRepository.create({
            userId: existingUser.id,
            customerId: input.customerId || '',
            subscriptionId: input.subscriptionId || '',
          });
        }
      } finally {
        releaseSubscriptionLock(existingUser.id);
      }

      const { password: _, ...userWithoutPassword } = existingUser;
      return { user: userWithoutPassword };
    }

    // New user — create account + subscription
    const placeholderHash = await bcrypt.hash(uuidv4(), 1);

    const user = await this.authRepository.createUserWithRole({
      email: input.email,
      passwordHash: placeholderHash,
      firstName: input.fullName,
      lastName: '',
      isRegComplete: false,
      source: 'paddle',
      roleSlug: 'client',
    });

    await this.subscriptionsRepository.create({
      userId: user.id,
      customerId: input.customerId || '',
      subscriptionId: input.subscriptionId || '',
    });

    const roles = user.userRoles?.map((ur: any) => ur.role.slug) ?? [];
    const token = generateTokens({ userId: user.id, email: user.email, roles });
    await sendRegistrationEmail({ token, fullName: user.firstName, email: user.email });
    const { password: _, ...userWithoutPassword } = user;

    logger.info('[signUp] New user created from Paddle', {
      userId: user.id,
      email: input.email,
      customerId: input.customerId,
    });

    return { user: userWithoutPassword };
  }

  // ══════════════════════════════════════════════
  // Metadata Helpers
  // ══════════════════════════════════════════════

  /**
   * Append a history entry to subscription metadata.
   * Preserves all existing metadata values — never overwrites blindly.
   */
  private appendMetadataEntry(
    existingMetadata: any,
    entry: Record<string, any>,
  ): Record<string, any> {
    const metadata = (existingMetadata as Record<string, any>) || {};
    const history = Array.isArray(metadata.subscriptionHistory)
      ? [...metadata.subscriptionHistory]
      : [];

    history.push(entry);

    return {
      ...metadata,
      subscriptionHistory: history,
    };
  }

  // ══════════════════════════════════════════════
  // Phase 5: syncSubscriptionFromPaddle() — Hardened
  // ══════════════════════════════════════════════

  async syncSubscriptionFromPaddle({ customerId, subscriptionId, event }: PaddleSubscriptionEvent) {
    const sub = await this.subscriptionsRepository.findOne({ customerId });
    if (!sub) return null;

    // Compare subscription IDs
    if (sub.subscriptionId && sub.subscriptionId !== subscriptionId) {
      // Different subscription — trigger reconciliation
      logger.info('[syncSubscriptionFromPaddle] Subscription ID mismatch — delegating to reconciliation', {
        customerId,
        existingSubscriptionId: sub.subscriptionId,
        incomingSubscriptionId: subscriptionId,
      });
      return this.reconcileSubscriptionEvent(customerId, subscriptionId, event);
    }

    // Same subscription — normal sync
    const normalized = normalizePaddleSubscription(event);

    // Duplicate detection
    const isDuplicate =
      sub.status === normalized.status &&
      sub.plan === normalized.product;

    if (isDuplicate) {
      logger.info('[syncSubscriptionFromPaddle] Duplicate event ignored', {
        subscriptionId,
        customerId,
      });
      return { action: 'duplicate_ignored' };
    }

    await this.subscriptionsRepository.update(sub.id, {
      subscriptionId,
      plan: normalized.product,
      status: normalized.status,
      startsAt: normalized.startsAt,
      endsAt: normalized.endsAt,
      billingInterval: normalized.billingCycle?.interval || 'month',
      metadata: {
        ...((sub.metadata as Record<string, any>) || {}),
        lastSyncedAt: new Date().toISOString(),
      },
    });

    logger.info('[syncSubscriptionFromPaddle] Subscription synchronized', {
      subscriptionId,
      customerId,
    });

    return { action: 'synced' };
  }

  // ══════════════════════════════════════════════
  // Phase 7: updateSubscriptionFromPaddle() — Hardened
  // ══════════════════════════════════════════════

  async updateSubscriptionFromPaddle({ customerId, subscriptionId, event }: PaddleSubscriptionEvent) {
    const subscription = await this.subscriptionsRepository.findOne({ customerId });
    if (!subscription) return null;

    // Validate subscription ownership
    if (subscription.subscriptionId !== subscriptionId) {
      logger.info('[updateSubscriptionFromPaddle] Subscription ID mismatch — running reconciliation', {
        customerId,
        existingSubscriptionId: subscription.subscriptionId,
        incomingSubscriptionId: subscriptionId,
      });
      const result = await this.reconcileSubscriptionEvent(customerId, subscriptionId, event);
      return result;
    }

    // Same subscription — normal update via reconciliation
    return this.handleSameSubscription(subscription, subscriptionId, event);
  }

  // ══════════════════════════════════════════════
  // cancelSubscriptionFromPaddle() — Hardened
  // ══════════════════════════════════════════════

  async cancelSubscriptionFromPaddle({ customerId, subscriptionId }: { customerId: string; subscriptionId: string }) {
    const subscription = await this.subscriptionsRepository.findOne({ customerId });
    if (!subscription) return null;

    // Only cancel if the subscription IDs match
    if (subscription.subscriptionId && subscription.subscriptionId !== subscriptionId) {
      logger.warn('[cancelSubscriptionFromPaddle] Subscription ID mismatch — ignoring cancellation', {
        customerId,
        existingSubscriptionId: subscription.subscriptionId,
        incomingCancelSubscriptionId: subscriptionId,
      });
      return { action: 'ignored' };
    }

    await this.subscriptionsRepository.update(subscription.id, {
      status: 'CANCELED',
      canceledAt: new Date(),
      cancelAtPeriodEnd: true,
      metadata: {
        ...((subscription.metadata as Record<string, any>) || {}),
        canceledAt: new Date().toISOString(),
      },
    });

    logger.info('[cancelSubscriptionFromPaddle] Subscription canceled at period end', {
      customerId,
      subscriptionId,
      userId: subscription.userId,
    });

    return { action: 'canceled' };
  }

  // ══════════════════════════════════════════════
  // Phase 11: Plan Changes (Immediate & Renewal-Based)
  // ══════════════════════════════════════════════

  /**
   * Change a user's subscription plan.
   *
   * @param userId - The user changing their plan
   * @param newPriceId - The Paddle price ID to switch to
   * @param effectiveMode - 'immediate' or 'renewal'
   */
  async changeSubscriptionPlan(
    userId: string,
    newPriceId: string,
    effectiveMode: 'immediate' | 'renewal',
  ): Promise<{ action: string; subscription: any }> {
    const subscription = await this.subscriptionsRepository.findOne({ userId });
    if (!subscription || !subscription.subscriptionId) {
      throw new ServerError('No active subscription found for this user.');
    }

    if (!acquireSubscriptionLock(userId)) {
      throw new ServerError('A subscription change is already in progress. Please try again.');
    }

    try {
      if (effectiveMode === 'immediate') {
        return await this.executeImmediatePlanChange(subscription, newPriceId);
      } else {
        return await this.executeRenewalPlanChange(subscription, newPriceId);
      }
    } finally {
      releaseSubscriptionLock(userId);
    }
  }

  /**
   * Immediate plan change: use Paddle's subscription update API.
   * Paddle handles proration and billing behavior.
   */
  private async executeImmediatePlanChange(
    subscription: any,
    newPriceId: string,
  ): Promise<{ action: string; subscription: any }> {
    const previousPlan = subscription.plan;
    const paddleSubscriptionId = subscription.subscriptionId!;

    // Update via Paddle API — Paddle handles proration
    await this.paddle.subscriptions.update(paddleSubscriptionId, {
      items: [{ priceId: newPriceId, quantity: 1 }],
      prorationBillingMode: 'prorated_immediately',
    });

    // Store pending change in metadata (actual sync happens via webhook)
    const metadata = this.appendMetadataEntry(subscription.metadata, {
      event: 'plan_change_immediate',
      from: previousPlan,
      toPriceId: newPriceId,
      timestamp: new Date().toISOString(),
      prorationBillingMode: 'prorated_immediately',
    });

    await this.subscriptionsRepository.update(subscription.id, {
      metadata: {
        ...metadata,
        pendingPlanChange: {
          effectiveMode: 'immediate',
          requestedAt: new Date().toISOString(),
          previousPlan,
          newPriceId,
          status: 'processing',
        },
      },
    });

    logger.info('[changePlan] Immediate plan change submitted to Paddle', {
      userId: subscription.userId,
      subscriptionId: paddleSubscriptionId,
      previousPlan,
      newPriceId,
    });

    return {
      action: 'immediate_change_submitted',
      subscription: await this.subscriptionsRepository.findOne({ id: subscription.id }),
    };
  }

  /**
   * Renewal-based plan change: create a future Paddle subscription immediately,
   * store it in metadata, and activate on renewal.
   */
  private async executeRenewalPlanChange(
    subscription: any,
    newPriceId: string,
  ): Promise<{ action: string; subscription: any }> {
    const paddleSubscriptionId = subscription.subscriptionId!;
    const currentEndsAt = subscription.endsAt;

    // Create a future subscription in Paddle (payment collected now, activates later)
    // Note: Paddle doesn't support "create but don't activate" natively.
    // We store the intent in metadata and use a scheduled job for activation.

    const metadata = this.appendMetadataEntry(subscription.metadata, {
      event: 'plan_change_renewal',
      from: subscription.plan,
      toPriceId: newPriceId,
      timestamp: new Date().toISOString(),
      effectiveDate: currentEndsAt,
    });

    await this.subscriptionsRepository.update(subscription.id, {
      metadata: {
        ...metadata,
        pendingPlanChange: {
          effectiveMode: 'renewal',
          requestedAt: new Date().toISOString(),
          currentSubscriptionId: paddleSubscriptionId,
          futurePriceId: newPriceId,
          currentPlan: subscription.plan,
          futurePlan: null, // Will be resolved by the scheduled job
          effectiveDate: currentEndsAt,
          status: 'pending',
        },
      },
    });

    logger.info('[changePlan] Renewal-based plan change stored', {
      userId: subscription.userId,
      subscriptionId: paddleSubscriptionId,
      currentPlan: subscription.plan,
      newPriceId,
      effectiveDate: currentEndsAt,
    });

    return {
      action: 'renewal_change_scheduled',
      subscription: await this.subscriptionsRepository.findOne({ id: subscription.id }),
    };
  }

  /**
   * Process pending subscription transitions (scheduled job).
   * Scans subscriptions with pendingPlanChange.status === 'pending'
   * and activates them when endsAt has passed.
   */
  async processPendingTransitions(): Promise<number> {
    const subscriptions = await this.subscriptionsRepository.findAllWithUsers({
      where: {
        status: { in: ['ACTIVE', 'CANCELED', 'TRIALING'] },
      },
    });

    let activated = 0;
    const now = new Date();

    for (const sub of subscriptions) {
      const metadata = (sub.metadata as Record<string, any>) || {};
      const pending = metadata.pendingPlanChange;

      if (!pending || pending.status !== 'pending') continue;
      if (pending.effectiveMode !== 'renewal') continue;

      // Check if the current subscription's period has ended
      const endsAt = sub.endsAt ? new Date(sub.endsAt) : null;
      if (!endsAt || endsAt > now) continue;

      // Activate the future subscription
      try {
        // Update via Paddle with new price
        if (pending.futurePriceId && sub.subscriptionId) {
          await this.paddle.subscriptions.update(sub.subscriptionId, {
            items: [{ priceId: pending.futurePriceId, quantity: 1 }],
            prorationBillingMode: 'prorated_immediately',
          });
        }

        // Update metadata
        const historyEntry = {
          event: 'scheduled_activation',
          from: pending.currentSubscriptionId,
          to: sub.subscriptionId,
          timestamp: now.toISOString(),
        };

        await this.subscriptionsRepository.update(sub.id, {
          metadata: {
            ...metadata,
            pendingPlanChange: { ...pending, status: 'completed' },
            subscriptionHistory: [
              ...(Array.isArray(metadata.subscriptionHistory) ? metadata.subscriptionHistory : []),
              historyEntry,
            ],
          },
        });

        activated++;
        logger.info('[pendingTransitions] Scheduled plan change activated', {
          userId: sub.userId,
          subscriptionId: sub.subscriptionId,
          previousPlan: pending.currentPlan,
          futurePriceId: pending.futurePriceId,
        });
      } catch (err: any) {
        logger.error('[pendingTransitions] Failed to activate scheduled change', {
          userId: sub.userId,
          subscriptionId: sub.subscriptionId,
          error: err.message,
        });
      }
    }

    return activated;
  }

  // ══════════════════════════════════════════════
  // Legacy / Unchanged Public API Methods
  // ══════════════════════════════════════════════

  async listProducts(query: PaddleProductQuery = {}) {
    try {
      const params: Record<string, any> = {};

      if (query.include?.length) params.include = query.include;
      if (query.interval) params.interval = query.interval;

      const products = this.paddle.products.list(params);
      const page = await products.next();
      return page;
    } catch (error: any) {
      throw this.handlePaddleError(error, 'Failed to fetch products from Paddle');
    }
  }

  async findCustomer(customerId: string): Promise<Customer | null> {
    try {
      const customer = await this.paddle.customers.get(customerId);
      return customer;
    } catch (error: any) {
      if (error instanceof ApiError && error.code === 'not_found') {
        return null;
      }
      throw this.handlePaddleError(error, `Failed to fetch Paddle customer ${customerId}`);
    }
  }

  async listProductsWithPrices(query: PaddleProductQuery = {}) {
    const interval =
      String(query.interval || 'year')
        .toLowerCase() === 'month'
        ? 'month'
        : 'year';

    const products = await this.listProducts({ ...query, include: ['prices'] }) ;

    return (products || [])
      .map((product: any) => mapProductToClientResponse(product, interval))
      .filter(Boolean);
  }

  /**
   * Direct Paddle subscription update (for immediate changes from user-facing endpoints).
   * Use for admin/manual price changes.
   */
  async updateSubscription(subscriptionId: string, priceId: string) {
    try {
      const result = await this.paddle.subscriptions.update(subscriptionId, {
        items: [{ priceId, quantity: 1 }],
        prorationBillingMode: 'prorated_immediately',
      });
      return result;
    } catch (error: any) {
      throw this.handlePaddleError(error, 'Failed to update subscription');
    }
  }

  async verifyCreationWebhook(rawBody: string, signature: string): Promise<CustomerCreatedEvent> {
    return await this.paddle.webhooks.unmarshal(rawBody, PADDLE_CREATION_WEBHOOK_SECRET, signature) as CustomerCreatedEvent;
  }

  async verifySubscriptionWebhook(rawBody: string, signature: string) {
    return this.paddle.webhooks.unmarshal(rawBody, PADDLE_SUBSCRIPTION_WEBHOOK_SECRET, signature);
  }

  async listTransactions(query: { after?: string; per_page?: number; status?: string } = {}) {
    try {
      const params: Record<string, any> = {};
      if (query.after) params.after = query.after;
      if (query.per_page) params.perPage = query.per_page;
      if (query.status) params.status = query.status;

      const transactions = this.paddle.transactions.list(params);
      const page = await transactions.next();
      return page;
    } catch (error: any) {
      throw this.handlePaddleError(error, 'Failed to fetch transactions from Paddle');
    }
  }

  async processCreationWebhook(rawBody: string, signature: string): Promise<void> {
    if (!rawBody || !signature) {
      logger.warn('[paddle-webhook] Missing raw body or signature');
      return;
    }

    try {
      const event = await this.verifyCreationWebhook(rawBody, signature);
      const eventType = event.eventType;
      const data = event.data || {};
      const email = data.email;

      if (eventType !== 'customer.created') {
        logger.warn(`[paddle-webhook] Ignoring non-customer.created event: ${eventType}`);
        return;
      }

      if (!email) {
        logger.warn('[paddle-webhook] Missing email in customer.created event');
        return;
      }

      await this.signUp({
        email,
        fullName: data.name || email.split('@')[0],
        customerId: data.id || '',
        subscriptionId: '',
        source: 'paddle',
      });

      logger.info('[paddle-webhook] Customer creation webhook processed', {
        customerId: data.id,
        email,
      });
    } catch (err) {
      logger.error('[paddle-webhook] Creation webhook processing error:', err);
    }
  }

  async processSubscriptionWebhook(rawBody: string, signature: string): Promise<WebhookResult | void> {
    if (!rawBody || !signature) {
      logger.warn('[paddle-webhook] Missing raw body or signature');
      return;
    }

    try {
      const event = await this.verifySubscriptionWebhook(rawBody, signature) as any;
      const eventType = event.eventType;
      const data = event.data || {};
      const customerId = data.customerId;

      if (!customerId) {
        logger.warn(`[paddle-webhook] Missing customerId in subscription event: ${eventType}`);
        return;
      }

      const subscriptionId = data.id || '';

      // All subscription events pass through the centralized reconciliation engine
      const result = await this.reconcileSubscriptionEvent(customerId, subscriptionId, event);

      logger.info('[paddle-webhook] Subscription event reconciled', {
        eventType,
        customerId,
        subscriptionId,
        action: result.action,
      });

      if (result.action === 'replaced') {
        logger.info('[paddle-webhook] Existing active subscription replaced by newer Paddle subscription', {
          customerId,
          oldSubscriptionId: result.previousSubscriptionId,
          newSubscriptionId: result.newSubscriptionId,
          eventType,
        });
      }

      return { handled: true, reason: `Subscription event processed: ${eventType} (${result.action})` };
    } catch (err) {
      logger.error('[paddle-webhook] Subscription webhook processing error:', err);
      return { handled: false, reason: 'Internal processing error' };
    }
  }

  async listTransactionsFromQuery(query: Record<string, any>) {
    const after = query.after as string | undefined;
    const perPage = query.per_page ? parseInt(query.per_page as string, 10) : undefined;
    const status = query.status as string | undefined;
    return this.listTransactions({ after, per_page: perPage, status });
  }
  private handlePaddleError(error: any, fallbackMessage: string): never {
    if (error instanceof ApiError) {
      const code = error.code;

      if (code === 'invalid_token' || code === 'authentication_malformed' || code === 'authentication_missing') {
        throw new UnauthorizedError('Paddle API authentication failed. Check your API key.');
      }
      if (code === 'forbidden') {
        throw new ForbiddenError('Paddle API permission denied. Check your API key permissions.');
      }
      if (code === 'too_many_requests') {
        throw new ServerError('Paddle API rate limit exceeded. Please try again later.');
      }

      throw new ServerError(`Paddle API error: ${error.detail || error.message || fallbackMessage}`);
    }

    throw new ServerError(fallbackMessage);
  }
}
