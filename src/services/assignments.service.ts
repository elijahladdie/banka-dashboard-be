import { SubscriberAssignment } from '@prisma/client';
import { AssignmentsRepository } from '../repositories/implementations/assignments.repository';
import { AdvisorsRepository } from '../repositories/implementations/advisors.repository';
import { UsersRepository } from '../repositories/implementations/users.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { ConflictError, NotFoundError, ValidationError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';

export class AssignmentsService {
  constructor(
    private readonly assignmentsRepository: AssignmentsRepository,
    private readonly advisorsRepository: AdvisorsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly auditLogsRepository: AuditLogsRepository
  ) {}

  async findAll(query: Record<string, any>): Promise<PaginatedResult<SubscriberAssignment>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = {};
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.advisorId) where.advisorId = query.advisorId;
    if (query.subscriberId) where.subscriberId = query.subscriberId;

    const [assignments, total] = await Promise.all([
      this.assignmentsRepository.findAll({ skip, take, orderBy, where }),
      this.assignmentsRepository.count(where),
    ]);

    return paginateResult(assignments, total, pagination);
  }

  async assignSubscriber(
    subscriberId: string,
    advisorId: string,
    assignedBy: string
  ): Promise<SubscriberAssignment> {
    // Verify subscriber exists and has SUBSCRIBER role
    const subscriber = await this.usersRepository.findById(subscriberId);
    if (!subscriber) throw new NotFoundError('Subscriber');
    if (subscriber.role !== 'SUBSCRIBER') {
      throw new ValidationError('User is not a subscriber.');
    }

    // Verify advisor exists
    const advisor = await this.advisorsRepository.findById(advisorId);
    if (!advisor) throw new NotFoundError('Advisor');

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
    const assignment = await this.assignmentsRepository.create({
      subscriberId,
      advisorId,
      assignedBy,
      assignedAt: new Date(),
      isActive: true,
    });

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
