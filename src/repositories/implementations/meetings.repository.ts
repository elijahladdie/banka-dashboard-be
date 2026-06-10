import { Meeting } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IMeetingsRepository } from '../interfaces/meetings.interface';

export class MeetingsRepository implements IMeetingsRepository {
  async findById(id: string): Promise<Meeting | null> {
    return prisma.meeting.findUnique({ where: { id } });
  }

  async findByAdvisor(
    advisorId: string,
    params: {
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
      where?: Record<string, any>;
    }
  ): Promise<Meeting[]> {
    return prisma.meeting.findMany({
      where: { advisorId, ...params.where },
      skip: params.skip,
      take: params.take,
      orderBy: params.orderBy,
    });
  }

  async findBySubscriber(
    subscriberId: string,
    params: {
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
      where?: Record<string, any>;
    }
  ): Promise<Meeting[]> {
    return prisma.meeting.findMany({
      where: { subscriberId, ...params.where },
      skip: params.skip,
      take: params.take,
      orderBy: params.orderBy,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<Meeting[]> {
    return prisma.meeting.findMany({
      ...params,
      include: {
        advisor: { include: { user: true } },
        subscriber: true,
      },
    });
  }

  async count(where?: Record<string, any>): Promise<number> {
    return prisma.meeting.count({ where });
  }

  async create(data: Partial<Meeting>): Promise<Meeting> {
    return prisma.meeting.create({ data: data as any });
  }

  async update(id: string, data: Partial<Meeting>): Promise<Meeting> {
    return prisma.meeting.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Meeting> {
    return prisma.meeting.delete({ where: { id } });
  }
}
