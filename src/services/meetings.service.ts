import { Meeting } from '@prisma/client';
import { MeetingsRepository } from '../repositories/implementations/meetings.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';

export class MeetingsService {
  private readonly meetingsRepository: MeetingsRepository;
  constructor() {
    this.meetingsRepository = new MeetingsRepository();
  }

  async findAll(query: Record<string, any>): Promise<PaginatedResult<Meeting>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = {};
    if (query.status) where.status = query.status;
    if (query.advisorId) where.advisorId = query.advisorId;
    if (query.clientId) where.clientId = query.clientId;
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
    return meeting;
  }

  async update(id: string, data: Partial<Meeting>, actorId: string): Promise<Meeting> {
    await this.findById(id);
    const updated = await this.meetingsRepository.update(id, data);
    return updated;
  }

  async updateStatus(id: string, status: Meeting['status'], actorId: string): Promise<Meeting> {
    const meeting = await this.findById(id);
    const updated = await this.meetingsRepository.update(id, { status });
    return updated;
  }

  async delete(id: string, actorId: string): Promise<void> {
    await this.findById(id);
    await this.meetingsRepository.delete(id);
  }
}
