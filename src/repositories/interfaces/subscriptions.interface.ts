import { Prisma, Subscription, User } from '@prisma/client';

export type SubscriptionWithUser = Subscription & { user: User };

export interface ISubscriptionsRepository {
  findOne(where: Prisma.SubscriptionWhereInput): Promise<SubscriptionWithUser | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[SubscriptionWithUser[], number]>;
  findActiveSubscriptions(): Promise<SubscriptionWithUser[]>;
  create(data: Partial<Subscription>): Promise<Subscription>;
  update(id: string, data: Partial<Subscription>): Promise<Subscription>;
}
