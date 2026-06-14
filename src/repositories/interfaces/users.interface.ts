import { User } from '@prisma/client';

export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[User[], number]>;
  update(id: string, data: Partial<User>): Promise<User>;
  softDelete(id: string): Promise<User>;
}
