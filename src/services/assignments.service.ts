import { Prisma, ClientAssignment } from '@prisma/client';
import { AssignmentsRepository } from '../repositories/implementations/assignments.repository';
import { AdvisorsRepository } from '../repositories/implementations/advisors.repository';
import { ConflictError, NotFoundError, ValidationError } from '../helpers';
import { PaginatedResult, QueryParams, UserRoleInfo } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { formatAssignments } from '../helpers/assignments.helper';
import { buildAssignmentsFilter } from '../helpers/query-builder.helper';
import { MESSAGES } from '../constants';

export class AssignmentsService {
  private readonly assignmentsRepository: AssignmentsRepository;
  private readonly advisorsRepository: AdvisorsRepository;
  private readonly subsRepository: SubscriptionsRepository;

  constructor() {
    this.assignmentsRepository = new AssignmentsRepository();
    this.advisorsRepository = new AdvisorsRepository();
    this.subsRepository = new SubscriptionsRepository();
  }

  async findAll(query: QueryParams): Promise<PaginatedResult<ClientAssignment>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const where = buildAssignmentsFilter(query);
    const [assignments, total] = await this.assignmentsRepository.findAll({ skip, take, orderBy, where });
    return paginateResult(formatAssignments(assignments), total, pagination);
  }

  async assignClient(clientId: string, advisorId: string, assignedBy: string): Promise<ClientAssignment> {
    const client = await this.subsRepository.findOne({ id: clientId });
    if (!client) throw new NotFoundError(MESSAGES.ASSIGNMENTS.CLIENT_NOT_FOUND);
    const hasClientRole = client.user?.userRoles?.some((ur: UserRoleInfo) => ur.role.slug === 'client');
    if (!hasClientRole) throw new ValidationError(MESSAGES.ASSIGNMENTS.NOT_A_CLIENT);

    const advisor = await this.advisorsRepository.findById(advisorId);
    if (!advisor) throw new NotFoundError(MESSAGES.ADVISORS.ADVISOR_NOT_FOUND);
    if (!advisor.isAvailable) throw new ConflictError(MESSAGES.ADVISORS.NOT_AVAILABLE);
    if (advisor.currentClients >= advisor.maxClients) throw new ConflictError(MESSAGES.ADVISORS.MAX_CAPACITY);

    const existing = await this.assignmentsRepository.findActiveByClient(clientId);
    if (existing) throw new ConflictError(MESSAGES.ASSIGNMENTS.ALREADY_ASSIGNED);

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
    if (!assignment) throw new NotFoundError(MESSAGES.ASSIGNMENTS.NOT_FOUND);
    if (!assignment.isActive) throw new ValidationError(MESSAGES.ASSIGNMENTS.ALREADY_ENDED);

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
