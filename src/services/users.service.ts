import { User } from '@prisma/client';
import { UsersRepository } from '../repositories/implementations/users.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { buildUsersFilter } from '../helpers/query-builder.helper';

export class UsersService {
  private readonly usersRepository: UsersRepository;
  constructor() {
    this.usersRepository = new UsersRepository();
  }

  async findAll(query: Record<string, any>): Promise<PaginatedResult<User>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const where = buildUsersFilter(query);
    const [users, total] = await this.usersRepository.findAll({ skip, take, orderBy, where });
    return paginateResult(users, total, pagination);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ id });
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async update(id: string, data: Partial<User>, _actorId: string): Promise<User> {
    await this.findById(id);
    return this.usersRepository.update(id, data);
  }

  async softDelete(id: string, _actorId: string): Promise<User> {
    await this.findById(id);
    return this.usersRepository.softDelete(id);
  }
}
