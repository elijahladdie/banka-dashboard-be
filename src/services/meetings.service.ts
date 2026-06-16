import { Meeting } from '@prisma/client';
import { MeetingsRepository } from '../repositories/implementations/meetings.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';

export class MeetingsService {
  private readonly meetingsRepository: MeetingsRepository;
  private readonly auditLogsRepository: AuditLogsRepository;
  constructor() {
    this.meetingsRepository = new MeetingsRepository();
    this.auditLogsRepository = new AuditLogsRepository();
  }

  async findAll(query: Record<string, any>): Promise<PaginatedResult<Meeting>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = {};
    if (query.status) where.status = query.status;
    if (query.advisorId) where.advisorId = query.advisorId;
    if (query.subscriberId) where.subscriberId = query.subscriberId;
    if (query.fromDate) where.meetingDate = { ...where.meetingDate, gte: new Date(query.fromDate) };
    if (query.toDate) where.meetingDate = { ...where.meetingDate, lte: new Date(query.toDate) };

    const [meetings, total] = await this.meetingsRepository.findAll({ skip, take, orderBy, where });

    return paginateResult(meetings, total, pagination);
  }

  async findById(id: string): Promise<Meeting> {
    const meeting = await this.meetingsRepository.findById(id);
    if (!meeting) throw new NotFoundError('Meeting');
    return meeting;
  }

  async create(data: Partial<Meeting>, actorId: string): Promise<Meeting> {
    const meeting = await this.meetingsRepository.create(data);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'MEETING_CREATED',
      entityType: 'Meeting',
      entityId: meeting.id,
      newValues: { title: data.title, meetingDate: data.meetingDate } as any,
    });

    return meeting;
  }

  async update(id: string, data: Partial<Meeting>, actorId: string): Promise<Meeting> {
    await this.findById(id);
    const updated = await this.meetingsRepository.update(id, data);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'MEETING_UPDATED',
      entityType: 'Meeting',
      entityId: id,
      newValues: data as any,
    });

    return updated;
  }

  async updateStatus(id: string, status: Meeting['status'], actorId: string): Promise<Meeting> {
    const meeting = await this.findById(id);
    const updated = await this.meetingsRepository.update(id, { status });

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'MEETING_STATUS_UPDATED',
      entityType: 'Meeting',
      entityId: id,
      oldValues: { status: meeting.status },
      newValues: { status },
    });

    return updated;
  }
}
