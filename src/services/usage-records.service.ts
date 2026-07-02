import { UsageRecord, Prisma } from '@prisma/client';
import { UsageRecordsRepository } from '../repositories/implementations/usage-records.repository';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import logger from '../utils/logger';

export class UsageRecordsService {
  private readonly usageRecordsRepository: UsageRecordsRepository;

  constructor() {
    this.usageRecordsRepository = new UsageRecordsRepository();
  }

  async findAll(query: Record<string, any>): Promise<PaginatedResult<UsageRecord>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = {};
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;
    if (query.billingType) where.billingType = query.billingType;

    const [records, total] = await this.usageRecordsRepository.findAll({ skip, take, orderBy, where });
    return paginateResult(records, total, pagination);
  }

  async findByUser(userId: string): Promise<UsageRecord[]> {
    return this.usageRecordsRepository.findByUser(userId);
  }

  /**
   * Track a usage-based service.
   * Only creates a record — billing is handled by Paddle transactions.
   */
  async trackUsage(data: {
    userId: string;
    serviceId: string;
    subscriptionId?: string;
    billingType: 'included' | 'usage_based';
    amount: number;
    quantity?: number;
    currency?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<UsageRecord> {
    const record = await this.usageRecordsRepository.create({
      userId: data.userId,
      serviceId: data.serviceId,
      subscriptionId: data.subscriptionId || null,
      billingType: data.billingType,
      amount: data.amount,
      quantity: data.quantity || 1,
      currency: data.currency || 'USD',
      status: 'PENDING',
      description: data.description || null,
      metadata: data.metadata || null,
    });

    logger.info('[UsageRecords] Usage tracked', {
      userId: data.userId,
      serviceId: data.serviceId,
      billingType: data.billingType,
      amount: data.amount,
    });

    return record;
  }

  /**
   * Mark a usage record as billed (after Paddle transaction completes).
   */
  async markAsBilled(id: string): Promise<UsageRecord> {
    const updated = await this.usageRecordsRepository.update(id, {
      status: 'BILLED',
    });

    logger.info('[UsageRecords] Usage marked as billed', { id });
    return updated;
  }

  /**
   * Void a usage record (e.g., if service wasn't delivered).
   */
  async void(id: string): Promise<UsageRecord> {
    const updated = await this.usageRecordsRepository.update(id, {
      status: 'VOID',
    });

    logger.info('[UsageRecords] Usage voided', { id });
    return updated;
  }
}
