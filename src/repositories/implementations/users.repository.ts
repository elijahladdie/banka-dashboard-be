import { User } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IUsersRepository } from '../interfaces/users.interface';

export class UsersRepository implements IUsersRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
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
