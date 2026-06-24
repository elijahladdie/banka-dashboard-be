import { Goal } from '@prisma/client';

export interface IGoalsRepository {
  findById(id: string): Promise<Goal | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[Goal[], number]>;
  create(data: Partial<Goal>): Promise<Goal>;
  update(id: string, data: Partial<Goal>): Promise<Goal>;
  softDelete(id: string): Promise<Goal>;
}
