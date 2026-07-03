import { Goal } from '@prisma/client';
import { QueryParams } from '../../types';

export interface IGoalsRepository {
  findById(id: string): Promise<Goal | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: QueryParams;
  }): Promise<[Goal[], number]>;
  create(data: Partial<Goal>): Promise<Goal>;
  update(id: string, data: Partial<Goal>): Promise<Goal>;
  softDelete(id: string): Promise<Goal>;
}
