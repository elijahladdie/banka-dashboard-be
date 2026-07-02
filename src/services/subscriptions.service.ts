import { Prisma, Subscription } from '@prisma/client';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { NotFoundError, ServerError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { PaddleService } from './paddle.service';
import logger from '../utils/logger';

export class SubscriptionsService {
  private readonly subscriptionsRepository: SubscriptionsRepository;
  private readonly paddleService: PaddleService;

  constructor() {
    this.subscriptionsRepository = new SubscriptionsRepository();
    this.paddleService = new PaddleService();
  }

  async findAll(query: Record<string, any>): Promise<PaginatedResult<Subscription>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = {};
    if (query.plan) where.plan = query.plan;
    if (query.status) where.status = query.status;

    const [subscriptions, total] = await this.subscriptionsRepository.findAll({ skip, take, orderBy, where });

    return paginateResult(subscriptions, total, pagination);
  }

  async findById(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({ id });
    if (!subscription) throw new NotFoundError('Subscription');
    return subscription;
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionsRepository.findOne({ userId });
  }

  async create(data: Partial<Subscription>, actorId: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.create(data);
    return subscription;
  }

  /**
   * Update subscription plan.
   * Supports both immediate and renewal-based plan changes.
   *
   * @param id - Local subscription record ID
   * @param data - Update data, may include `priceId` for Paddle changes and `effectiveMode`
   */
  async update(id: string, data: Prisma.SubscriptionUpdateInput & {
    priceId?: string;
    effectiveMode?: 'immediate' | 'renewal';
  }): Promise<Subscription> {
    const subscription = await this.findById(id);
    const { priceId, effectiveMode, ...rest } = data;

    if (priceId) {
      const effective = effectiveMode || 'immediate';

      // Use the PaddleService's changeSubscriptionPlan for proper handling
      const result = await this.paddleService.changeSubscriptionPlan(
        subscription.userId,
        priceId,
        effective,
      );

      logger.info('[SubscriptionsService] Plan change processed', {
        subscriptionId: id,
        userId: subscription.userId,
        priceId,
        effectiveMode: effective,
        action: result.action,
      });
    }

    if (Object.keys(rest).length > 0) {
      const updated = await this.subscriptionsRepository.update(id, rest);
      return updated;
    }

    // If we changed plan via paddle, re-fetch to get updated state
    if (priceId) {
      return await this.findById(id);
    }

    return await this.findById(id);
  }

  /**
   * Cancel a subscription at period end.
   * Sets status to CANCELED and cancelAtPeriodEnd to true.
   * The user retains access until the billing period ends.
   */
  async cancelSubscription(id: string, actorId: string): Promise<Subscription> {
    const subscription = await this.findById(id);

    const updated = await this.subscriptionsRepository.update(id, {
      status: 'CANCELED',
      canceledAt: new Date(),
      cancelAtPeriodEnd: true,
    });

    logger.info('[SubscriptionsService] Subscription canceled at period end', {
      subscriptionId: id,
      userId: subscription.userId,
      actorId,
    });

    return updated;
  }

  /**
   * Check if a user has an active subscription.
   * Delegates to PaddleService's centralized helper.
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) return false;
    return this.paddleService.isSubscriptionActive(subscription);
  }

  /**
   * Process pending subscription transitions.
   * Called by a scheduled job to activate renewal-based plan changes.
   */
  async processPendingTransitions(): Promise<number> {
    return this.paddleService.processPendingTransitions();
  }

  /**
   * Phase 12: Resolve user entitlements centrally.
   * Returns the user's current plan, status, and feature access information.
   * Frontend must consume this — never calculate entitlements independently.
   */
  async getUserEntitlements(userId: string) {
    const subscription = await this.findByUserId(userId);

    const hasActive = subscription
      ? this.paddleService.isSubscriptionActive(subscription)
      : false;

    const metadata = (subscription?.metadata as Record<string, any>) || {};
    const pendingPlanChange = metadata.pendingPlanChange;
    const hasScheduledChange = pendingPlanChange?.status === 'pending';

    // Determine the effective plan
    const effectivePlan = hasScheduledChange
      ? subscription?.plan
      : subscription?.plan || null;

    return {
      hasSubscription: !!subscription,
      hasActiveSubscription: hasActive,
      id: subscription?.id || null,
      plan: subscription?.plan || null,
      effectivePlan,
      status: subscription?.status || null,
      billingInterval: subscription?.billingInterval || null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
      endsAt: subscription?.endsAt,
      customerId: subscription?.customerId,
      pendingPlanChange: hasScheduledChange
        ? {
            futurePlan: pendingPlanChange.futurePlan,
            effectiveMode: pendingPlanChange.effectiveMode,
            effectiveDate: pendingPlanChange.effectiveDate,
            status: pendingPlanChange.status,
          }
        : null,
      metadata: {
        amount: metadata.amount,
        currency: metadata.currency,
        billingCycle: metadata.billingCycle,
      },
    };
  }
}