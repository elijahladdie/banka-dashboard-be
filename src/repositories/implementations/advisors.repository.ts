import { Advisor, User } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IAdvisorsRepository } from '../interfaces/advisors.interface';

export class AdvisorsRepository implements IAdvisorsRepository {
  async findById(id: string): Promise<(Advisor & { user: User }) | null> {
    return prisma.advisor.findFirst({
      where: { id, deletedAt: null },
      include: { user: true },
    });
  }

  async findByUserId(userId: string): Promise<Advisor | null> {
    return prisma.advisor.findFirst({
      where: { userId, deletedAt: null },
    });
  }

  async findByEmployeeCode(code: string): Promise<Advisor | null> {
    return prisma.advisor.findFirst({
      where: { employeeCode: code, deletedAt: null },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[(Advisor & { user: User })[], number]> {
    const [records, count] = await prisma.$transaction([
      prisma.advisor.findMany({
        ...params,
        where: { ...params.where, deletedAt: null },
        include: { user: true },
      }),
      prisma.advisor.count({
        where: { ...params.where, deletedAt: null },
      })
    ]);
    return [records, count];
  }

  async create(data: Partial<Advisor>): Promise<Advisor> {
    return prisma.advisor.create({ data: data as any });
  }

  async update(id: string, data: Partial<Advisor>): Promise<Advisor> {
    return prisma.advisor.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Advisor> {
    return prisma.advisor.update({
      where: { id },
      data: { deletedAt: new Date(), isAvailable: false },
    });
  }
}
