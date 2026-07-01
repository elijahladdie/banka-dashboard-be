import { Prisma, ClientAssignment } from '@prisma/client';
import { AssignmentsRepository } from '../repositories/implementations/assignments.repository';
import { AdvisorsRepository } from '../repositories/implementations/advisors.repository';
import { ConflictError, NotFoundError, ValidationError } from '../helpers';
import { PaginatedResult, TUserSelect } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import logger from '../utils/logger';

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

    const where: Prisma.ClientAssignmentWhereInput = {};
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.advisorId) where.advisorId = query.advisorId;
    if (query.clientId) where.client = { user: { id: query.clientId } };

    const [assignments, total] = await this.assignmentsRepository.findAll({ skip, take, orderBy, where }) as [any[], number];
    type FormattedAssignment = Omit<ClientAssignment, "client"> & {
      user: TUserSelect;
    };

    const formattedAssignments: FormattedAssignment[] = assignments.map(
      ({ client, ...rest }) => ({
        ...rest,
        client: client.user as TUserSelect,
      })
    );

    return paginateResult(formattedAssignments, total, pagination);
  }

  async assignClient(
    clientId: string,
    advisorId: string,
    assignedBy: string
  ): Promise<ClientAssignment> {
    // Verify client exists and has client role
    const client = await this.subsRepository.findOne({ id: clientId });
    logger.info('Client found:', client);
    if (!client) throw new NotFoundError('Client not found');

    const hasClientRole = client.user?.userRoles?.some(
      (ur: { role: { slug: string } }) => ur.role.slug === 'client'
    );
    if (!hasClientRole) {
      throw new ValidationError('User is not a client.');
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
    const existing = await this.assignmentsRepository.findActiveByClient(clientId);
    if (existing) {
      throw new ConflictError('Client already has an active advisor assignment.');
    }

    // Create assignment
    //     await prisma.clientAssignment.create({
    //   data: 
    // });
    const assignment = await this.assignmentsRepository.create({
      assignedAt: new Date(),
      isActive: true,

      client: {
        connect: {
          id: clientId,
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

    return assignment;
  }

  async endAssignment(id: string, actorId: string): Promise<ClientAssignment> {
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

    return ended;
  }

  async getActiveAssignment(clientId: string): Promise<ClientAssignment | null> {
    return this.assignmentsRepository.findActiveByClient(clientId);
  }
}
