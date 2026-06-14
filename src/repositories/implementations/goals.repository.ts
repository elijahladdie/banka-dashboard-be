import { Goal } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IGoalsRepository } from '../interfaces/goals.interface';

export class GoalsRepository implements IGoalsRepository {
  async findById(id: string): Promise<Goal | null> {
    return prisma.goal.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[Goal[], number]> {
    const [records, count] = await prisma.$transaction([
      prisma.goal.findMany({
        ...params,
        where: { ...params.where, deletedAt: null },
      }),
      prisma.goal.count({ where: { ...params.where, deletedAt: null } })
    ]);
    return [records, count];
  }
  async create(data: Partial<Goal>): Promise<Goal> {
    return prisma.goal.create({ data: data as any });
  }

  async update(id: string, data: Partial<Goal>): Promise<Goal> {
    return prisma.goal.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Goal> {
    return prisma.goal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
