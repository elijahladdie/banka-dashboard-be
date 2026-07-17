import { Prisma, Subscription } from '@prisma/client';
import { QueryParams, SubscriptionWithUser } from '../../types';

export interface ISubscriptionsRepository {
  findOne(where: Prisma.SubscriptionWhereInput): Promise<SubscriptionWithUser | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: QueryParams;
  }): Promise<[SubscriptionWithUser[], number]>;
  findActiveSubscriptions(): Promise<SubscriptionWithUser[]>;
  create(data: Partial<Subscription>): Promise<Subscription>;
  update(id: string, data: Prisma.SubscriptionUpdateInput): Promise<Subscription>;
}
