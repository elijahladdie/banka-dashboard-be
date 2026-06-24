import { Advisor, User } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IAdvisorsRepository } from '../interfaces/advisors.interface';
import { INCLUDE_USER } from '../../constants';
import { TUserSelect } from '../../types';

export class AdvisorsRepository implements IAdvisorsRepository {
  async findById(id: string): Promise<(Advisor & { user: TUserSelect }) | null> {
    return await prisma.advisor.findFirst({
      where: { id, deletedAt: null },
      include: INCLUDE_USER,
    }) as unknown as Advisor & { user: TUserSelect };
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
        include: INCLUDE_USER,
      }),
      prisma.advisor.count({
        where: { ...params.where, deletedAt: null },
      })
    ]);
    const recs = records as unknown as (Advisor & { user: User })[];
    return [recs, count];
  }

  async create(data: Partial<Advisor>): Promise<Advisor> {
    return await prisma.advisor.create({ data: data as any });
  }

  async update(id: string, data: Partial<Advisor>): Promise<Advisor> {
    return await prisma.advisor.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Advisor> {
    return await prisma.advisor.update({
      where: { id },
      data: { deletedAt: new Date(), isAvailable: false },
    });
  }
}
