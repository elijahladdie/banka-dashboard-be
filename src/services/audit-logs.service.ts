import { AuditLog } from '@prisma/client';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';

export class AuditLogsService {
  private readonly auditLogsRepository: AuditLogsRepository;
  constructor() {
    this.auditLogsRepository = new AuditLogsRepository();
  }

  async findAll(query: Record<string, any>): Promise<PaginatedResult<AuditLog>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = {};
    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.entityType) where.entityType = query.entityType;
    if (query.fromDate) where.createdAt = { ...where.createdAt, gte: new Date(query.fromDate) };
    if (query.toDate) where.createdAt = { ...where.createdAt, lte: new Date(query.toDate) };

    const [logs, total] = await this.auditLogsRepository.findAll({ skip, take, orderBy, where });

    return paginateResult(logs, total, pagination);
  }

  async findById(id: string): Promise<AuditLog> {
    const log = await this.auditLogsRepository.findById(id);
    if (!log) throw new NotFoundError('Audit log');
    return log;
  }
}
