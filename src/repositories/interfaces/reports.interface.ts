import { FinancialReport, Prisma } from '@prisma/client';

export interface IReportsRepository {
  findOne(where: Prisma.FinancialReportWhereInput): Promise<FinancialReport | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[FinancialReport[], number]>;
  create(data: Prisma.FinancialReportCreateInput): Promise<FinancialReport>;
  update(id: string, data: Prisma.FinancialReportUpdateInput): Promise<FinancialReport>;
  
}
