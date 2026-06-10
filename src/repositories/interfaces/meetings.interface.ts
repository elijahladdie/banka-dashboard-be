import { Meeting } from '@prisma/client';

export interface IMeetingsRepository {
  findById(id: string): Promise<Meeting | null>;
  findByAdvisor(advisorId: string, params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<Meeting[]>;
  findBySubscriber(subscriberId: string, params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<Meeting[]>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<Meeting[]>;
  count(where?: Record<string, any>): Promise<number>;
  create(data: Partial<Meeting>): Promise<Meeting>;
  update(id: string, data: Partial<Meeting>): Promise<Meeting>;
  delete(id: string): Promise<Meeting>;
}
