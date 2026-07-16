import { Goal, NotificationType } from '@prisma/client';
import { GoalsRepository } from '../repositories/implementations/goals.repository';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { NotificationsRepository } from '../repositories/implementations/notifications.repository';
import { NotFoundError, ValidationError } from '../helpers';
import { getSubscriptionAccessState } from '../helpers/subscription-access.helper';
import { PaginatedResult, QueryParams } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { buildGoalsFilter } from '../helpers/query-builder.helper';
import { calculateGoalStatus } from '../helpers/goals.helper';
import { MESSAGES } from '../constants';

export class GoalsService {
  private readonly goalsRepository: GoalsRepository;
  private readonly subscriptionsRepository: SubscriptionsRepository;
  private readonly notificationsRepository: NotificationsRepository;

  constructor() {
    this.goalsRepository = new GoalsRepository();
    this.subscriptionsRepository = new SubscriptionsRepository();
    this.notificationsRepository = new NotificationsRepository();
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

  /**
   * Check whether the client (identified by clientId) is allowed to write.
   * Throws ValidationError if not in State A or B.
   */
  private async requireWriteAccess(clientId: string, action: string): Promise<void> {
    const subscription = await this.subscriptionsRepository.findOne({ userId: clientId });
    if (!subscription) return; // No sub yet, let other guards handle it
    const access = getSubscriptionAccessState({
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      endsAt: subscription.endsAt,
      trialEnd: subscription.trialEnd,
    });
    if (!access.canWrite) {
      if (access.isLocked) {
        throw new ValidationError(
          'Your read-only access period has ended. Please resubscribe to manage goals.'
        );
      }
      throw new ValidationError(
        `You are in read-only mode and cannot ${action}. Please resubscribe to continue.`
      );
    }
  }

  async create(data: Partial<Goal>, actorId: string): Promise<Goal> {
    const clientId = data.clientId as string;
    await this.requireWriteAccess(clientId, 'create new goals');
    return this.goalsRepository.create(data);
  }

  async update(id: string, data: Partial<Goal>, actorId: string): Promise<Goal> {
    const goal = await this.findById(id);
    await this.requireWriteAccess(goal.clientId, 'edit goals');
    return this.goalsRepository.update(id, data);
  }

  async updateProgress(id: string, currentAmount: number, actorId: string): Promise<Goal> {
    const goal = await this.findById(id);
    await this.requireWriteAccess(goal.clientId, 'update goal progress');
    const updateData = calculateGoalStatus(goal, currentAmount);
    const updated = await this.goalsRepository.update(id, updateData);

    // ── Check if goal reached a milestone for notification ──
    if (updated.status === 'COMPLETED' && goal.status !== 'COMPLETED') {
      await this.notificationsRepository.create({
        userId: goal.clientId,
        title: 'Goal Completed',
        message: `Congratulations! Your goal "${goal.title}" has been achieved.`,
        type: 'SUCCESS' as NotificationType,
      });
    }

    return updated;
  }

  /**
   * Check for stalled goals and notify the client.
   * A goal is considered stalled if it's IN_PROGRESS or NOT_STARTED,
   * has a targetDate that's within 7 days, and currentAmount is less than targetAmount.
   */
  async checkStalledGoals(): Promise<void> {
    const now = new Date();
    const nearFuture = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const allGoals = await this.goalsRepository.findAll({
      where: {
        status: { in: ['IN_PROGRESS', 'NOT_STARTED'] },
        targetDate: { lte: nearFuture, gte: now },
      },
    });

    for (const goal of allGoals[0]) {
      const targetAmount = goal.targetAmount ? Number(goal.targetAmount) : null;
      const currentAmount = Number(goal.currentAmount);

      if (targetAmount && currentAmount < targetAmount) {
        await this.notificationsRepository.create({
          userId: goal.clientId,
          title: 'Goal Reminder',
          message: `Your goal "${goal.title}" is approaching its target date. Current progress: ${currentAmount}/${targetAmount}.`,
          type: 'REMINDER' as NotificationType,
        });
      }
    }
  }

  async softDelete(id: string, _actorId: string): Promise<Goal> {
    await this.findById(id);
    return this.goalsRepository.softDelete(id);
  }
}
