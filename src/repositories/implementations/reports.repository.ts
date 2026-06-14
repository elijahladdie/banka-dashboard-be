import { FinancialReport } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IReportsRepository } from '../interfaces/reports.interface';

export class ReportsRepository implements IReportsRepository {
  async findById(id: string): Promise<FinancialReport | null> {
    return prisma.financialReport.findUnique({ where: { id } });
  }

  async findBySubscriber(
    subscriberId: string,
    params: {
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
      where?: Record<string, any>;
    }
  ): Promise<FinancialReport[]> {
    return prisma.financialReport.findMany({
      where: { subscriberId, ...params.where },
      ...params,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[FinancialReport[], number]> {
    const [reports, total] = await Promise.all([
      prisma.financialReport.findMany(params),
      prisma.financialReport.count({ where: params.where }),
    ]);
    return [reports, total];
  }

  async create(data: Partial<FinancialReport>): Promise<FinancialReport> {
    return prisma.financialReport.create({ data: data as any });
  }

  async update(id: string, data: Partial<FinancialReport>): Promise<FinancialReport> {
    return prisma.financialReport.update({ where: { id }, data });
  }

  async delete(id: string): Promise<FinancialReport> {
    return prisma.financialReport.delete({ where: { id } });
  }
}
