import { Prisma, User } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IUsersRepository } from '../interfaces/users.interface';

export class UsersRepository implements IUsersRepository {
  async findOne(where: Prisma.UserWhereInput): Promise<User | null> {
    return await prisma.user.findFirst({ where });
  }
  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[User[], number]> {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        ...params,
        where: { ...params.where, deletedAt: null },
      }),
      prisma.user.count({
        where: { ...params.where, deletedAt: null },
      })
    ]);
    return [users, total];
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }
}
