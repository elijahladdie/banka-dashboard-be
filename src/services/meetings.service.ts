import { Meeting } from '@prisma/client';
import { MeetingsRepository } from '../repositories/implementations/meetings.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult, QueryParams } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { buildMeetingsFilter } from '../helpers/query-builder.helper';

export class MeetingsService {
  private readonly meetingsRepository: MeetingsRepository;
  constructor() {
    this.meetingsRepository = new MeetingsRepository();
  }

  async findAll(query: QueryParams): Promise<PaginatedResult<Meeting>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const where = buildMeetingsFilter(query);
    const [meetings, total] = await this.meetingsRepository.findAll({ skip, take, orderBy, where });
    return paginateResult(meetings, total, pagination);
  }

  async findById(id: string): Promise<Meeting> {
    const meeting = await this.meetingsRepository.findById(id);
    if (!meeting) throw new NotFoundError('Meeting');
    return meeting;
  }

  async create(data: Partial<Meeting>, _actorId: string): Promise<Meeting> {
    return this.meetingsRepository.create(data);
  }

  async update(id: string, data: Partial<Meeting>, _actorId: string): Promise<Meeting> {
    await this.findById(id);
    return this.meetingsRepository.update(id, data);
  }

  async updateStatus(id: string, status: Meeting['status'], _actorId: string): Promise<Meeting> {
    await this.findById(id);
    return this.meetingsRepository.update(id, { status });
  }

  async delete(id: string, _actorId: string): Promise<void> {
    await this.findById(id);
    await this.meetingsRepository.delete(id);
  }
}
