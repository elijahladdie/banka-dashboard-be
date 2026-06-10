import { Goal } from '@prisma/client';

export interface IGoalsRepository {
  findById(id: string): Promise<Goal | null>;
  findBySubscriber(subscriberId: string, params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<Goal[]>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<Goal[]>;
  count(where?: Record<string, any>): Promise<number>;
  create(data: Partial<Goal>): Promise<Goal>;
  update(id: string, data: Partial<Goal>): Promise<Goal>;
  softDelete(id: string): Promise<Goal>;
}
