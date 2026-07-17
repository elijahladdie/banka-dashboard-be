import { Prisma, Subscription } from '@prisma/client';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { NotFoundError } from '../helpers';
import { getSubscriptionAccessState, type SubscriptionAccessInfo } from '../helpers/subscription-access.helper';
import { PaginatedResult, QueryParams } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { buildSubscriptionsFilter } from '../helpers/query-builder.helper';
import paddle from '../helpers/paddle';
import { MESSAGES } from '../constants';

export class SubscriptionsService {
  private readonly subscriptionsRepository: SubscriptionsRepository;

  constructor() {
    this.subscriptionsRepository = new SubscriptionsRepository();
  }

  async findAll(query: QueryParams): Promise<PaginatedResult<Subscription>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const where = buildSubscriptionsFilter(query);
    const [subscriptions, total] = await this.subscriptionsRepository.findAll({ skip, take, orderBy, where });
    return paginateResult(subscriptions, total, pagination);
  }

  async findById(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({ id });
    if (!subscription) throw new NotFoundError(MESSAGES.SUBSCRIPTIONS.NOT_FOUND_SINGLE);
    return subscription;
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionsRepository.findOne({ userId });
  }

  async create(data: Partial<Subscription>, _actorId: string): Promise<Subscription> {
    return this.subscriptionsRepository.create(data);
  }

  async update(id: string, data: Prisma.SubscriptionUpdateInput & { priceId?: string }): Promise<Subscription> {
    const sub = await this.findById(id);
    const { priceId, ...rest } = data;
    if (priceId && sub.subscriptionId) {
      await paddle.subscriptions.update(String(sub.subscriptionId), {
        items: [{ priceId, quantity: 1 }],
        prorationBillingMode: 'prorated_immediately',
      });
    }
    if (Object.keys(rest).length > 0) {
      return this.subscriptionsRepository.update(id, rest);
    }
    return this.findById(id);
  }

  async cancelSubscription(id: string, _actorId: string, reason?: string): Promise<Subscription> {
    const sub = await this.findById(id);
    const metadata = (sub.metadata as Record<string, any>) || {};

    // Sync with Paddle: schedule cancellation at period end
    if (sub.subscriptionId) {
      await paddle.subscriptions.cancel(String(sub.subscriptionId), { effectiveFrom: 'next_billing_period' }).catch((err) => {
        console.error('Failed to sync cancel with Paddle:', err);
        // Non-blocking — DB update still proceeds
      });
    }
    return this.subscriptionsRepository.update(id, {
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
      metadata: { ...metadata, cancellationReason: reason, canceledAt: new Date().toISOString() },
    });
  }
  async reactivateSubscription(
    id: string,
    _actorId: string
  ): Promise<Subscription> {
    const sub = await this.findById(id);

    if (!sub.cancelAtPeriodEnd) {
      return sub;
    }

    if (sub.subscriptionId) {
      try {
        await paddle.subscriptions.update(
          String(sub.subscriptionId),
          {
            scheduledChange: null,
          }
        );
      } catch (err) {
        console.error('Failed to sync reactivation with Paddle:', err);
        throw new Error(
          'Failed to reactivate subscription on payment provider. Please try again.'
        );
      }
    }

    const metadata = (sub.metadata as Record<string, any>) || {};
    const {
      cancellationReason: _,
      canceledAt: __,
      ...cleanMetadata
    } = metadata;

    return this.subscriptionsRepository.update(id, {
      cancelAtPeriodEnd: false,
      canceledAt: null,
      metadata: cleanMetadata,
    });
  }

  /**
   * Get computed subscription access info for a user.
   * Returns the access state, readOnlyUntil, and whether write/view is allowed.
   */
  async getAccessInfo(userId: string): Promise<{
    accessState: SubscriptionAccessInfo;
    plan: string | null;
    status: string | null;
  } | null> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) return null;

    const accessState = getSubscriptionAccessState({
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      endsAt: subscription.endsAt,
      trialEnd: subscription.trialEnd,
    });

    return {
      accessState,
      plan: subscription.plan,
      status: subscription.status,
    };
  }
}