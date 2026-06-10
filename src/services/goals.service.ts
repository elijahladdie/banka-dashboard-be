import { Goal } from '@prisma/client';
import { GoalsRepository } from '../repositories/implementations/goals.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';

export class GoalsService {
  constructor(
    private readonly goalsRepository: GoalsRepository,
    private readonly auditLogsRepository: AuditLogsRepository
  ) {}

  async findAll(query: Record<string, any>): Promise<PaginatedResult<Goal>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = {};
    if (query.subscriberId) where.subscriberId = query.subscriberId;
    if (query.status) where.status = query.status;

    const [goals, total] = await Promise.all([
      this.goalsRepository.findAll({ skip, take, orderBy, where }),
      this.goalsRepository.count(where),
    ]);

    return paginateResult(goals, total, pagination);
  }

  async findById(id: string): Promise<Goal> {
    const goal = await this.goalsRepository.findById(id);
    if (!goal) throw new NotFoundError('Goal');
    return goal;
  }

  async findBySubscriber(subscriberId: string, query: Record<string, any>): Promise<PaginatedResult<Goal>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const [goals, total] = await Promise.all([
      this.goalsRepository.findBySubscriber(subscriberId, { skip, take, orderBy }),
      this.goalsRepository.count({ subscriberId }),
    ]);

    return paginateResult(goals, total, pagination);
  }

  async create(data: Partial<Goal>, actorId: string): Promise<Goal> {
    const goal = await this.goalsRepository.create(data as any);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'GOAL_CREATED',
      entityType: 'Goal',
      entityId: goal.id,
      newValues: { title: data.title } as any,
    });

    return goal;
  }

  async update(id: string, data: Partial<Goal>, actorId: string): Promise<Goal> {
    await this.findById(id);
    const updated = await this.goalsRepository.update(id, data as any);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'GOAL_UPDATED',
      entityType: 'Goal',
      entityId: id,
      newValues: data as any,
    });

    return updated;
  }

  async updateProgress(id: string, currentAmount: number, actorId: string): Promise<Goal> {
    const goal = await this.findById(id);

    const targetAmount = goal.targetAmount ? Number(goal.targetAmount) : null;
    const data: any = { currentAmount };
    if (targetAmount && currentAmount >= targetAmount) {
      data.status = 'COMPLETED';
    } else if (goal.status === 'NOT_STARTED' && currentAmount > 0) {
      data.status = 'IN_PROGRESS';
    }

    const updated = await this.goalsRepository.update(id, data);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'GOAL_PROGRESS_UPDATED',
      entityType: 'Goal',
      entityId: id,
      oldValues: { currentAmount: Number(goal.currentAmount) },
      newValues: { currentAmount },
    });

    return updated;
  }

  async softDelete(id: string, actorId: string): Promise<Goal> {
    await this.findById(id);
    const deleted = await this.goalsRepository.softDelete(id);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'GOAL_DELETED',
      entityType: 'Goal',
      entityId: id,
    });

    return deleted;
  }
}
