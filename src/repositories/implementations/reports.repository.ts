import { FinancialReport, Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IReportsRepository } from '../interfaces/reports.interface';

export class ReportsRepository implements IReportsRepository {
  async findOne(where: Prisma.FinancialReportWhereInput): Promise<FinancialReport | null> {
    return prisma.financialReport.findFirst({ where });
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
  async create(data: Prisma.FinancialReportCreateInput): Promise<FinancialReport> {
    return await prisma.financialReport.create({ data });
  }

  async update(id: string, data: Prisma.FinancialReportUpdateInput): Promise<FinancialReport> {
    return await prisma.financialReport.update({ where: { id }, data });
  }
}
