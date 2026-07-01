import { Prisma, Subscription } from '@prisma/client';

export type SubscriptionWithUser = Subscription & {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    status: string;
    userRoles: { role: { slug: string } }[];
  };
};

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
  update(id: string, data: Prisma.SubscriptionUpdateInput): Promise<Subscription>;
}
