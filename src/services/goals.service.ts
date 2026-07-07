import { Goal } from '@prisma/client';
import { GoalsRepository } from '../repositories/implementations/goals.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult, QueryParams } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { buildGoalsFilter } from '../helpers/query-builder.helper';
import { calculateGoalStatus } from '../helpers/goals.helper';
import { MESSAGES } from '../constants';

export class GoalsService {
  private readonly goalsRepository: GoalsRepository;
  constructor() {
    this.goalsRepository = new GoalsRepository();
  }

  async findAll(query: QueryParams): Promise<PaginatedResult<Goal>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const where = buildGoalsFilter(query);
    const [goals, total] = await this.goalsRepository.findAll({ skip, take, orderBy, where });
    return paginateResult(goals, total, pagination);
  }

  async findById(id: string): Promise<Goal> {
    const goal = await this.goalsRepository.findById(id);
    if (!goal) throw new NotFoundError(MESSAGES.GOALS.NOT_FOUND);
    return goal;
  }

  async findByClient(clientId: string, query: QueryParams): Promise<PaginatedResult<Goal>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const [goals, total] = await this.goalsRepository.findAll({ where: { clientId }, skip, take, orderBy });
    return paginateResult(goals, total, pagination);
  }

  async create(data: Partial<Goal>, _actorId: string): Promise<Goal> {
    return this.goalsRepository.create(data);
  }

  async update(id: string, data: Partial<Goal>, _actorId: string): Promise<Goal> {
    await this.findById(id);
    return this.goalsRepository.update(id, data);
  }

  async updateProgress(id: string, currentAmount: number, _actorId: string): Promise<Goal> {
    const goal = await this.findById(id);
    const updateData = calculateGoalStatus(goal, currentAmount);
    return this.goalsRepository.update(id, updateData);
  }

  async softDelete(id: string, _actorId: string): Promise<Goal> {
    await this.findById(id);
    return this.goalsRepository.softDelete(id);
  }
}
