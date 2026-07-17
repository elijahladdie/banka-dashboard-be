import { Meeting } from '@prisma/client';
import { QueryParams } from '../../types';

export interface IMeetingsRepository {
  findById(id: string): Promise<Meeting | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: QueryParams;
  }): Promise<[Meeting[], number]>;
  create(data: Partial<Meeting>): Promise<Meeting>;
  update(id: string, data: Partial<Meeting>): Promise<Meeting>;
  delete(id: string): Promise<Meeting>;
}
