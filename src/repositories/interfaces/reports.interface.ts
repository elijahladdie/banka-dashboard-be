import { FinancialReport } from '@prisma/client';

export interface IReportsRepository {
  findById(id: string): Promise<FinancialReport | null>;
  findBySubscriber(subscriberId: string, params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<FinancialReport[]>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[FinancialReport[], number]>;
  create(data: Partial<FinancialReport>): Promise<FinancialReport>;
  update(id: string, data: Partial<FinancialReport>): Promise<FinancialReport>;
  delete(id: string): Promise<FinancialReport>;
}
