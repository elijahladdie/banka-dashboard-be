import { Meeting, NotificationType } from '@prisma/client';
import { MeetingsRepository } from '../repositories/implementations/meetings.repository';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { NotificationsRepository } from '../repositories/implementations/notifications.repository';
import { NotFoundError, ValidationError } from '../helpers';
import { getSubscriptionAccessState } from '../helpers/subscription-access.helper';
import { PaginatedResult, QueryParams } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { buildMeetingsFilter } from '../helpers/query-builder.helper';
import { MESSAGES } from '../constants';
import prisma from '../utils/prisma';

export class MeetingsService {
  private readonly meetingsRepository: MeetingsRepository;
  private readonly subscriptionsRepository: SubscriptionsRepository;
  private readonly notificationsRepository: NotificationsRepository;

  constructor() {
    this.meetingsRepository = new MeetingsRepository();
    this.subscriptionsRepository = new SubscriptionsRepository();
    this.notificationsRepository = new NotificationsRepository();
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
    if (!meeting) throw new NotFoundError(MESSAGES.MEETINGS.NOT_FOUND);
    return meeting;
  }

  async create(data: Partial<Meeting>, _actorId: string): Promise<Meeting> {
    // ── Check client's subscription access state (Section 6: Read-Only Mode) ──
    if (data.clientId) {
      const subscription = await this.subscriptionsRepository.findOne({ userId: data.clientId as string });
      if (subscription) {
        const access = getSubscriptionAccessState({
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          endsAt: subscription.endsAt,
          trialEnd: subscription.trialEnd,
        });
        if (!access.canWrite) {
          if (access.isLocked) {
            throw new ValidationError(
              'Your read-only access period has ended. Please resubscribe to schedule meetings.'
            );
          }
          throw new ValidationError(
            'You are in read-only mode. Please resubscribe to schedule new meetings.'
          );
        }
      }
    }

    const meeting = await this.meetingsRepository.create(data);

    // ── Notify both client and advisor about the scheduled meeting ──
    const advisorRecord = await prisma.advisor.findUnique({
      where: { id: meeting.advisorId },
      select: { userId: true },
    });

    // Notify client
    await this.notificationsRepository.create({
      userId: meeting.clientId,
      title: 'Meeting Scheduled',
      message: `A meeting "${meeting.title || 'Advisor Meeting'}" has been scheduled.`,
      type: 'REMINDER' as NotificationType,
    });

    // Notify advisor
    if (advisorRecord) {
      await this.notificationsRepository.create({
        userId: advisorRecord.userId,
        title: 'Meeting Scheduled',
        message: `A meeting with your client has been scheduled: "${meeting.title || 'Advisor Meeting'}"`,
        type: 'REMINDER' as NotificationType,
      });
    }

    return meeting;
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
