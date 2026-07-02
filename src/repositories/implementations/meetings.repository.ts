import { Meeting } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IMeetingsRepository } from '../interfaces/meetings.interface';

export class MeetingsRepository implements IMeetingsRepository {
  async findById(id: string): Promise<Meeting | null> {
    return prisma.meeting.findUnique({ where: { id } });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[Meeting[], number]> {
    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        ...params,
        include: {
          advisor: { include: { user: true } },
          client: true,
        },
      }),
      prisma.meeting.count({ where: params.where }),
    ]);
    return [meetings, total];
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
