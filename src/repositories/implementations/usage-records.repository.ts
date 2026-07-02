import { Prisma, UsageRecord } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IUsageRecordsRepository } from '../interfaces/usage-records.interface';

export class UsageRecordsRepository implements IUsageRecordsRepository {
  async findOne(where: Prisma.UsageRecordWhereInput): Promise<UsageRecord | null> {
    return prisma.usageRecord.findFirst({ where });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[UsageRecord[], number]> {
    const [records, total] = await Promise.all([
      prisma.usageRecord.findMany({ ...params }),
      prisma.usageRecord.count({ where: params.where }),
    ]);
    return [records, total];
  }

  async findByUser(userId: string): Promise<UsageRecord[]> {
    return prisma.usageRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Partial<UsageRecord>): Promise<UsageRecord> {
    return prisma.usageRecord.create({ data: data as any });
  }

  async update(id: string, data: Prisma.UsageRecordUpdateInput): Promise<UsageRecord> {
    return prisma.usageRecord.update({ where: { id }, data });
  }
}
