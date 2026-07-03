import { Prisma, ClientAssignment } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IAssignmentsRepository } from '../interfaces/assignments.interface';
import { INCLUDE_USER } from '../../constants';
import logger from '../../utils/logger';
import { QueryParams , TSelectClientAssignment} from '../../types';

export class AssignmentsRepository implements IAssignmentsRepository {
  async findById(id: string): Promise<ClientAssignment | null> {
    return await prisma.clientAssignment.findUnique({ where: { id } });
  }

  async findActiveByClient(clientId: string): Promise<ClientAssignment | null> {
    return await prisma.clientAssignment.findFirst({
      where: { clientId, isActive: true },
    });
  }

  async findByAdvisor(
    advisorId: string,
    params: { skip?: number; take?: number }
  ): Promise<ClientAssignment[]> {
    return prisma.clientAssignment.findMany({
      where: { advisorId },
      skip: params.skip,
      take: params.take,
      include: {
        client: true,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: QueryParams;
  }): Promise<[TSelectClientAssignment[], number]> {
    logger.info('Finding all assignments with params:', params);
    const [records, count] = await prisma.$transaction([
      prisma.clientAssignment.findMany({
        ...params,
        include: {
          client: { include: INCLUDE_USER },
          advisor: { include: INCLUDE_USER },
          assignedByUser: INCLUDE_USER.user,
        },
      }),
      prisma.clientAssignment.count({ where: params.where })]);

    return [records as unknown as TSelectClientAssignment[], count];
  }

  async create(data: Prisma.ClientAssignmentCreateInput): Promise<ClientAssignment> {
    const client = await prisma.user.findUnique({
      where: { id: data.client.connect?.id },
    });

    const advisor = await prisma.advisor.findUnique({
      where: { id: data.advisor.connect?.id },
    });

    const assignedByUser = await prisma.user.findUnique({
      where: { id: data.assignedByUser.connect?.id },
    });

    return prisma.clientAssignment.create({ data });
  }

  async endAssignment(id: string): Promise<ClientAssignment> {
    return prisma.clientAssignment.update({
      where: { id },
      data: { isActive: false, endedAt: new Date() },
    });
  }
}
