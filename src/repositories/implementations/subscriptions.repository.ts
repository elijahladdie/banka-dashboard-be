import { Subscription } from '@prisma/client';
import prisma from '../../utils/prisma';
import { ISubscriptionsRepository } from '../interfaces/subscriptions.interface';

export class SubscriptionsRepository implements ISubscriptionsRepository {
  async findById(id: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({ where: { userId } });
  }

  async findByCustomerId(customerId: string): Promise<Subscription | null> {
    return prisma.subscription.findFirst({ where: { customerId } });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<Subscription[]> {
    return prisma.subscription.findMany(params);
  }

  async count(where?: Record<string, any>): Promise<number> {
    return prisma.subscription.count({ where });
  }

  async create(data: Partial<Subscription>): Promise<Subscription> {
    return prisma.subscription.create({ data: data as any });
  }

  async update(id: string, data: Partial<Subscription>): Promise<Subscription> {
    return prisma.subscription.update({ where: { id }, data: data as any });
  }
}
