import { Prisma, ClientAssignment } from '@prisma/client';
import { AssignmentsRepository } from '../repositories/implementations/assignments.repository';
import { AdvisorsRepository } from '../repositories/implementations/advisors.repository';
import { ConflictError, NotFoundError, ValidationError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { formatAssignments } from '../helpers/assignments.helper';
import { buildAssignmentsFilter } from '../helpers/query-builder.helper';

export class AssignmentsService {
  private readonly assignmentsRepository: AssignmentsRepository;
  private readonly advisorsRepository: AdvisorsRepository;
  private readonly subsRepository: SubscriptionsRepository;

  constructor() {
    this.assignmentsRepository = new AssignmentsRepository();
    this.advisorsRepository = new AdvisorsRepository();
    this.subsRepository = new SubscriptionsRepository();
  }

  async findAll(query: Record<string, any>): Promise<PaginatedResult<ClientAssignment>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const where = buildAssignmentsFilter(query);
    const [assignments, total] = await this.assignmentsRepository.findAll({ skip, take, orderBy, where }) as [any[], number];
    return paginateResult(formatAssignments(assignments), total, pagination);
  }

  async assignClient(clientId: string, advisorId: string, assignedBy: string): Promise<ClientAssignment> {
    const client = await this.subsRepository.findOne({ id: clientId });
    if (!client) throw new NotFoundError('Client not found');
    const hasClientRole = client.user?.userRoles?.some((ur: any) => ur.role.slug === 'client');
    if (!hasClientRole) throw new ValidationError('User is not a client.');

    const advisor = await this.advisorsRepository.findById(advisorId);
    if (!advisor) throw new NotFoundError('Advisor not found');
    if (!advisor.isAvailable) throw new ConflictError('Advisor is not available for assignments.');
    if (advisor.currentClients >= advisor.maxClients) throw new ConflictError('Advisor has reached maximum client capacity.');

    const existing = await this.assignmentsRepository.findActiveByClient(clientId);
    if (existing) throw new ConflictError('Client already has an active advisor assignment.');

    const assignment = await this.assignmentsRepository.create({
      assignedAt: new Date(), isActive: true,
      client: { connect: { id: clientId } },
      advisor: { connect: { id: advisorId } },
      assignedByUser: { connect: { id: assignedBy } },
    });

    await this.advisorsRepository.update(advisorId, { currentClients: advisor.currentClients + 1 });
    return assignment;
  }

  async endAssignment(id: string, _actorId: string): Promise<ClientAssignment> {
    const assignment = await this.assignmentsRepository.findById(id);
    if (!assignment) throw new NotFoundError('Assignment');
    if (!assignment.isActive) throw new ValidationError('Assignment is already ended.');

    const ended = await this.assignmentsRepository.endAssignment(id);
    const advisor = await this.advisorsRepository.findById(assignment.advisorId);
    if (advisor) {
      await this.advisorsRepository.update(assignment.advisorId, { currentClients: Math.max(0, advisor.currentClients - 1) });
    }
    return ended;
  }

  async getActiveAssignment(clientId: string): Promise<ClientAssignment | null> {
    return this.assignmentsRepository.findActiveByClient(clientId);
  }
}
