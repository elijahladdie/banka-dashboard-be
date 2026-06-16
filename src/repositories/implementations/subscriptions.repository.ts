import { Prisma, Subscription } from '@prisma/client';
import prisma from '../../utils/prisma';
import { ISubscriptionsRepository, SubscriptionWithUser } from '../interfaces/subscriptions.interface';
import { INCLUDE_USER } from '../../constants';


export class SubscriptionsRepository implements ISubscriptionsRepository {
  async findOne(where: Prisma.SubscriptionWhereInput): Promise<SubscriptionWithUser | null> {
    return await prisma.subscription.findFirst({
      where,
      include: INCLUDE_USER,
    }) as unknown as Promise<SubscriptionWithUser | null>;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[SubscriptionWithUser[], number]> {
    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({ ...params, include: INCLUDE_USER }),
      prisma.subscription.count({ where: params.where }),
    ]);
    return [subscriptions as SubscriptionWithUser[], total];
  }

  async findAllWithUsers(params?: {
    where?: Record<string, any>;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<SubscriptionWithUser[]> {
    return await prisma.subscription.findMany({
      ...params,
      include: INCLUDE_USER,
    }) as SubscriptionWithUser[]
  }

  async findOneWithUser(id: string): Promise<SubscriptionWithUser | null> {
    return await prisma.subscription.findUnique({
      where: { id },
      include: INCLUDE_USER,
    }) as SubscriptionWithUser;
  }

  async findByAdvisor(advisorId: string): Promise<SubscriptionWithUser[]> {
    // Find active assignments for the advisor, then get subscriptions with users
    const assignments = await prisma.subscriberAssignment.findMany({
      where: { advisorId, isActive: true },
      include: {
        subscriber: {
          include: { user: true },
        },
      },
    });
    const resp = 
    assignments
      .map((a) => a.subscriber as SubscriptionWithUser | null)
      .filter(Boolean) as SubscriptionWithUser[];

    return resp;
  }

  async findActiveSubscriptions(): Promise<SubscriptionWithUser[]> {
    return await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: INCLUDE_USER,
    }) as SubscriptionWithUser[];
  }

  async create(data: Partial<Subscription>): Promise<Subscription> {
    return await prisma.subscription.create({ data: data as any });
  }

  async update(id: string, data: Partial<Subscription>): Promise<Subscription> {
    return await prisma.subscription.update({ where: { id }, data: data as any });
  }
}
