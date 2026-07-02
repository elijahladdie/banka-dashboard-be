import { Prisma, UsageRecord } from '@prisma/client';

export interface IUsageRecordsRepository {
  findOne(where: Prisma.UsageRecordWhereInput): Promise<UsageRecord | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[UsageRecord[], number]>;
  findByUser(userId: string): Promise<UsageRecord[]>;
  create(data: Partial<UsageRecord>): Promise<UsageRecord>;
  update(id: string, data: Prisma.UsageRecordUpdateInput): Promise<UsageRecord>;
}
