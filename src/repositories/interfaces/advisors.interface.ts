import { Advisor, User } from '@prisma/client';

export interface IAdvisorsRepository {
  findById(id: string): Promise<Advisor | null>;
  findByUserId(userId: string): Promise<Advisor | null>;
  findByEmployeeCode(code: string): Promise<Advisor | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[(Advisor & { user: User })[], number]>;
  create(data: Partial<Advisor>): Promise<Advisor>;
  update(id: string, data: Partial<Advisor>): Promise<Advisor>;
  softDelete(id: string): Promise<Advisor>;
}
