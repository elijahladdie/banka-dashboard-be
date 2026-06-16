import { Prisma, SubscriberAssignment } from '@prisma/client';
import { AssignmentsRepository } from '../repositories/implementations/assignments.repository';
import { AdvisorsRepository } from '../repositories/implementations/advisors.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { ConflictError, NotFoundError, ValidationError } from '../helpers';
import { PaginatedResult, TUserSelect } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import logger from '../utils/logger';

export class AssignmentsService {
  private readonly assignmentsRepository: AssignmentsRepository;
  private readonly advisorsRepository: AdvisorsRepository;
  private readonly subsRepository: SubscriptionsRepository;
  private readonly auditLogsRepository: AuditLogsRepository;
  constructor() {
    this.assignmentsRepository = new AssignmentsRepository();
    this.advisorsRepository = new AdvisorsRepository();
    this.subsRepository = new SubscriptionsRepository();
    this.auditLogsRepository = new AuditLogsRepository();
  }

  async findAll(query: Record<string, any>): Promise<PaginatedResult<SubscriberAssignment>> {
    logger.info('Finding assignments with query:', query);
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Prisma.SubscriberAssignmentWhereInput = {};
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.advisorId) where.advisorId = query.advisorId;
    if (query.subscriberId) where.subscriber = { user: { id: query.subscriberId } };

    const [assignments, total] = await this.assignmentsRepository.findAll({ skip, take, orderBy, where }) as [any[], number];
    type FormattedAssignment = Omit<SubscriberAssignment, "subscriber"> & {
      user: TUserSelect;
    };

    const formattedAssignments: FormattedAssignment[] = assignments.map(
      ({ subscriber, ...rest }) => ({
        ...rest,
        subscriber: subscriber.user as TUserSelect,
      })
    );

    return paginateResult(formattedAssignments, total, pagination);
  }

  async assignSubscriber(
    subscriberId: string,
    advisorId: string,
    assignedBy: string
  ): Promise<SubscriberAssignment> {
    // Verify subscriber exists and has SUBSCRIBER role
    const subscriber = await this.subsRepository.findOne({ id: subscriberId });
    logger.info('Subscriber found:', subscriber);
    if (!subscriber) throw new NotFoundError('Subscriber not found');
    if (subscriber.user.role !== 'SUBSCRIBER') {
      throw new ValidationError('User is not a subscriber.');
    }

    // Verify advisor exists
    const advisor = await this.advisorsRepository.findById(advisorId);
    if (!advisor) throw new NotFoundError('Advisor not found');

    if (!advisor.isAvailable) {
      throw new ConflictError('Advisor is not available for assignments.');
    }

    if (advisor.currentClients >= advisor.maxClients) {
      throw new ConflictError('Advisor has reached maximum client capacity.');
    }

    // Check for existing active assignment
    const existing = await this.assignmentsRepository.findActiveBySubscriber(subscriberId);
    if (existing) {
      throw new ConflictError('Subscriber already has an active advisor assignment.');
    }

    // Create assignment
    //     await prisma.subscriberAssignment.create({
    //   data: 
    // });
    const assignment = await this.assignmentsRepository.create({
      assignedAt: new Date(),
      isActive: true,

      subscriber: {
        connect: {
          id: subscriberId,
        },
      },

      advisor: {
        connect: {
          id: advisorId,
        },
      },

      assignedByUser: {
        connect: {
          id: assignedBy,
        },
      },
    },);

    // Update advisor client count
    await this.advisorsRepository.update(advisorId, {
      currentClients: advisor.currentClients + 1,
    });

    await this.auditLogsRepository.create({
      userId: assignedBy,
      action: 'ASSIGNMENT_CREATED',
      entityType: 'SubscriberAssignment',
      entityId: assignment.id,
      newValues: { subscriberId, advisorId },
    });

    return assignment;
  }

  async endAssignment(id: string, actorId: string): Promise<SubscriberAssignment> {
    const assignment = await this.assignmentsRepository.findById(id);
    if (!assignment) throw new NotFoundError('Assignment');
    if (!assignment.isActive) throw new ValidationError('Assignment is already ended.');

    const ended = await this.assignmentsRepository.endAssignment(id);

    // Update advisor client count
    const advisor = await this.advisorsRepository.findById(assignment.advisorId);
    if (advisor) {
      await this.advisorsRepository.update(assignment.advisorId, {
        currentClients: Math.max(0, advisor.currentClients - 1),
      });
    }

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'ASSIGNMENT_ENDED',
      entityType: 'SubscriberAssignment',
      entityId: id,
      oldValues: { isActive: true },
      newValues: { isActive: false },
    });

    return ended;
  }

  async getActiveAssignment(subscriberId: string): Promise<SubscriberAssignment | null> {
    return this.assignmentsRepository.findActiveBySubscriber(subscriberId);
  }
}
