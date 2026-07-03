import { Prisma, Subscription } from '@prisma/client';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult, QueryParams } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { buildSubscriptionsFilter } from '../helpers/query-builder.helper';
import { PaddleService } from './paddle.service';

export class SubscriptionsService {
  private readonly subscriptionsRepository: SubscriptionsRepository;
  private readonly paddleService: PaddleService;

  constructor() {
    this.subscriptionsRepository = new SubscriptionsRepository();
    this.paddleService = new PaddleService();
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
    if (!subscription) throw new NotFoundError('Subscription');
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
      await this.paddleService.updateSubscription(String(sub.subscriptionId), priceId);
    }
    if (Object.keys(rest).length > 0) {
      return this.subscriptionsRepository.update(id, rest);
    }
    return this.findById(id);
  }

  async cancelSubscription(id: string, _actorId: string): Promise<Subscription> {
    await this.findById(id);
    return this.subscriptionsRepository.update(id, {
      status: 'CANCELED', canceledAt: new Date(), cancelAtPeriodEnd: true,
    });
  }
}