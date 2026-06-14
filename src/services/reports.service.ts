import { FinancialReport } from '@prisma/client';
import { ReportsRepository } from '../repositories/implementations/reports.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';

export class ReportsService {
  private readonly reportsRepository: ReportsRepository;
  private readonly auditLogsRepository: AuditLogsRepository;
  constructor() {
    this.reportsRepository = new ReportsRepository();
    this.auditLogsRepository = new AuditLogsRepository();
  }

  async findAll(query: Record<string, any>): Promise<PaginatedResult<FinancialReport>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = {};
    if (query.subscriberId) where.subscriberId = query.subscriberId;
    if (query.advisorId) where.advisorId = query.advisorId;
    if (query.reportType) where.reportType = query.reportType;

    const [reports, total] = await this.reportsRepository.findAll({ skip, take, orderBy, where });

    return paginateResult(reports, total, pagination);
  }

  async findById(id: string): Promise<FinancialReport> {
    const report = await this.reportsRepository.findById(id);
    if (!report) throw new NotFoundError('Report');
    return report;
  }

  async create(data: Partial<FinancialReport>, actorId: string): Promise<FinancialReport> {
    const report = await this.reportsRepository.create(data);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'REPORT_CREATED',
      entityType: 'FinancialReport',
      entityId: report.id,
      newValues: { title: data.title, reportType: data.reportType },
    });

    return report;
  }

  async update(id: string, data: Partial<FinancialReport>, actorId: string): Promise<FinancialReport> {
    await this.findById(id);
    const updated = await this.reportsRepository.update(id, data);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'REPORT_UPDATED',
      entityType: 'FinancialReport',
      entityId: id,
      newValues: data as any,
    });

    return updated;
  }

  async delete(id: string, actorId: string): Promise<FinancialReport> {
    await this.findById(id);
    const deleted = await this.reportsRepository.delete(id);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'REPORT_DELETED',
      entityType: 'FinancialReport',
      entityId: id,
    });

    return deleted;
  }
}
