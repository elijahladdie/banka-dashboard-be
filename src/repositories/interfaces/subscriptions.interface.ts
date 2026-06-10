import { Subscription } from '@prisma/client';

export interface ISubscriptionsRepository {
  findById(id: string): Promise<Subscription | null>;
  findByUserId(userId: string): Promise<Subscription | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<Subscription[]>;
  count(where?: Record<string, any>): Promise<number>;
  create(data: Partial<Subscription>): Promise<Subscription>;
  update(id: string, data: Partial<Subscription>): Promise<Subscription>;
}
