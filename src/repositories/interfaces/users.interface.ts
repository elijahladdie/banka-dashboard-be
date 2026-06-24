import { Prisma, User } from '@prisma/client';

export interface IUsersRepository {
  findOne(where: Prisma.UserWhereInput): Promise<User | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[User[], number]>;
  update(id: string, data: Partial<User>): Promise<User>;
  softDelete(id: string): Promise<User>;
}
