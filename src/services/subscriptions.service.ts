import { Prisma, Subscription } from '@prisma/client';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { PaddleService } from './paddle.service';

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

  async update(id: string, data: Prisma.SubscriptionUpdateInput & { priceId?: string }): Promise<Subscription> {
    const subscription = await this.findById(id);
    // call paddle and update subscription plan if priceId is provided
    const { priceId, ...rest } = data;
    if (priceId) {
      await this.paddleService.updateSubscription(String(subscription.subscriptionId), priceId || '');
    }
    if (Object.keys(rest).length > 0) {
      const updated = await this.subscriptionsRepository.update(id, rest);
      return updated;
    }
    return await this.findById(id);
  }

  async cancelSubscription(id: string, actorId: string): Promise<Subscription> {
    const subscription = await this.findById(id);

    const updated = await this.subscriptionsRepository.update(id, {
      status: 'CANCELED',
      canceledAt: new Date(),
      cancelAtPeriodEnd: true,
    });
    return updated;
  }
}