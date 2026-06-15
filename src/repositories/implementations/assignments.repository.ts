import { Prisma, SubscriberAssignment } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IAssignmentsRepository } from '../interfaces/assignments.interface';
import { INCLUDE_USER } from '../../constants';

export class AssignmentsRepository implements IAssignmentsRepository {
  async findById(id: string): Promise<SubscriberAssignment | null> {
    return await prisma.subscriberAssignment.findUnique({ where: { id } });
  }

  async findActiveBySubscriber(subscriberId: string): Promise<SubscriberAssignment | null> {
    return await prisma.subscriberAssignment.findFirst({
      where: { subscriberId, isActive: true },
    });
  }

  async findByAdvisor(
    advisorId: string,
    params: { skip?: number; take?: number }
  ): Promise<SubscriberAssignment[]> {
    return prisma.subscriberAssignment.findMany({
      where: { advisorId },
      skip: params.skip,
      take: params.take,
      include: {
        subscriber: true,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[SubscriberAssignment[], number]> {
    const [records, count] = await prisma.$transaction([
      prisma.subscriberAssignment.findMany({
        ...params,
        include: {
          subscriber: { include: INCLUDE_USER },
          advisor: { include: INCLUDE_USER },
          assignedByUser: INCLUDE_USER.user,
        },
      }),
      prisma.subscriberAssignment.count({ where: params.where })]);

    return [records, count];
  }

  async create(data: Prisma.SubscriberAssignmentCreateInput): Promise<SubscriberAssignment> {
    const subscriber = await prisma.user.findUnique({
      where: { id: data.subscriber.connect?.id },
    });

    const advisor = await prisma.advisor.findUnique({
      where: { id: data.advisor.connect?.id },
    });

    const assignedByUser = await prisma.user.findUnique({
      where: { id: data.assignedByUser.connect?.id },
    });

    console.log({
      subscriber,
      advisor,
      assignedByUser,
    });
    return prisma.subscriberAssignment.create({ data });
  }

  async endAssignment(id: string): Promise<SubscriberAssignment> {
    return prisma.subscriberAssignment.update({
      where: { id },
      data: { isActive: false, endedAt: new Date() },
    });
  }
}
