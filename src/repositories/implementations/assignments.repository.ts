import { SubscriberAssignment } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IAssignmentsRepository } from '../interfaces/assignments.interface';

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
          subscriber: true,
          advisor: { include: { user: true } },
          assignedByUser: true,
        },
      }),
      prisma.subscriberAssignment.count({ where: params.where })]);
    return [records, count];
  }

  async create(data: Partial<SubscriberAssignment>): Promise<SubscriberAssignment> {
    return prisma.subscriberAssignment.create({ data: data as any });
  }

  async endAssignment(id: string): Promise<SubscriberAssignment> {
    return prisma.subscriberAssignment.update({
      where: { id },
      data: { isActive: false, endedAt: new Date() },
    });
  }
}
