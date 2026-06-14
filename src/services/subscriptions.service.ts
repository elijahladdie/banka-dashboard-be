import { Subscription } from '@prisma/client';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';

export class SubscriptionsService {
  private readonly subscriptionsRepository: SubscriptionsRepository;
  private readonly auditLogsRepository: AuditLogsRepository;
  constructor() {
    this.subscriptionsRepository = new SubscriptionsRepository();
    this.auditLogsRepository = new AuditLogsRepository();
  }

  async findAll(query: Record<string, any>): Promise<PaginatedResult<Subscription>> {
    console.log('Finding subscriptions with query:', query);
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = {};
    if (query.plan) where.plan = query.plan;
    if (query.status) where.status = query.status;

    const [subscriptions, total] = await this.subscriptionsRepository.findAll({ skip, take, orderBy, where });

    return paginateResult(subscriptions, total, pagination);
  }

  async findById(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findById(id);
    if (!subscription) throw new NotFoundError('Subscription');
    return subscription;
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionsRepository.findByUserId(userId);
  }

  async create(data: Partial<Subscription>, actorId: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.create(data);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'SUBSCRIPTION_CREATED',
      entityType: 'Subscription',
      entityId: subscription.id,
      newValues: data as any,
    });

    return subscription;
  }

  async update(id: string, data: Partial<Subscription>, actorId: string): Promise<Subscription> {
    await this.findById(id);
    const updated = await this.subscriptionsRepository.update(id, data);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'SUBSCRIPTION_UPDATED',
      entityType: 'Subscription',
      entityId: id,
      newValues: data as any,
    });

    return updated;
  }

  async cancelSubscription(id: string, actorId: string): Promise<Subscription> {
    const subscription = await this.findById(id);

    const updated = await this.subscriptionsRepository.update(id, {
      status: 'CANCELED',
      canceledAt: new Date(),
      cancelAtPeriodEnd: true,
    });

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'SUBSCRIPTION_CANCELED',
      entityType: 'Subscription',
      entityId: id,
      oldValues: { status: subscription.status } as any,
      newValues: { status: 'CANCELED' },
    });

    return updated;
  }
}