import { Advisor, User } from '@prisma/client';
import { AdvisorsRepository } from '../repositories/implementations/advisors.repository';
import { ConflictError, NotFoundError } from '../helpers';
import { PaginatedResult, TUserSelect, QueryParams } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { buildAdvisorsFilter } from '../helpers/query-builder.helper';
import { MESSAGES } from '../constants';

export class AdvisorsService {
  private readonly advisorsRepository: AdvisorsRepository;
  constructor() {
    this.advisorsRepository = new AdvisorsRepository();
  }

  async findAll(query: QueryParams): Promise<PaginatedResult<Advisor & { user: User }>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const where = buildAdvisorsFilter(query);
    const [advisors, total] = await this.advisorsRepository.findAll({ skip, take, orderBy, where });
    return paginateResult(advisors, total, pagination);
  }

  async findById(id: string): Promise<Advisor & { user: TUserSelect }> {
    const advisor = await this.advisorsRepository.findById(id);
    if (!advisor) throw new NotFoundError(MESSAGES.ADVISORS.NOT_FOUND);
    return advisor;
  }

  async create(data: { userId: string; employeeCode: string; specialization?: string; bio?: string; maxClients?: number }, _actorId: string): Promise<Advisor> {
    const existingCode = await this.advisorsRepository.findByEmployeeCode(data.employeeCode);
    if (existingCode) throw new ConflictError('Employee code already exists.');
    const existingAdvisor = await this.advisorsRepository.findByUserId(data.userId);
    if (existingAdvisor) throw new ConflictError('User is already registered as an advisor.');

    return this.advisorsRepository.create({
      userId: data.userId, employeeCode: data.employeeCode,
      specialization: data.specialization, bio: data.bio,
      maxClients: data.maxClients || 20, currentClients: 0, isAvailable: true,
    });
  }

  async update(id: string, data: Partial<Advisor>, _actorId: string): Promise<Advisor> {
    await this.findById(id);
    return this.advisorsRepository.update(id, data);
  }

  async softDelete(id: string, _actorId: string): Promise<Advisor> {
    await this.findById(id);
    return this.advisorsRepository.softDelete(id);
  }

  async toggleAvailability(id: string): Promise<Advisor> {
    const advisor = await this.findById(id);
    return this.advisorsRepository.update(id, { isAvailable: !advisor.isAvailable });
  }
}
