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
  }): Promise<User[]> {
    return prisma.user.findMany({
      ...params,
      where: { ...params.where, deletedAt: null },
    });
  }

  async count(where?: Record<string, any>): Promise<number> {
    return prisma.user.count({
      where: { ...where, deletedAt: null },
    });
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
