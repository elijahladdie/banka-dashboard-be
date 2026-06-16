import { Meeting } from '@prisma/client';

export interface IMeetingsRepository {
  findById(id: string): Promise<Meeting | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[Meeting[], number]>;
  create(data: Partial<Meeting>): Promise<Meeting>;
  update(id: string, data: Partial<Meeting>): Promise<Meeting>;
}
