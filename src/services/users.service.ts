import { User } from '@prisma/client';
import { UsersRepository } from '../repositories/implementations/users.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult, PaginationParams } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import logger from '../utils/logger';

export class UsersService {
  private readonly usersRepository: UsersRepository;
  constructor() {
    this.usersRepository = new UsersRepository();
  }

  async findAll(query: Record<string, any>): Promise<PaginatedResult<User>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = {};
    if (query.role) {
      where.userRoles = {
        some: {
          role: { slug: query.role },
        },
      };
    }
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await this.usersRepository.findAll({ skip, take, orderBy, where });
    return paginateResult(users, total, pagination);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ id });
    logger.info(`Finding user by ID: ${id}, found:`, user);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async update(id: string, data: Partial<User>, actorId: string): Promise<User> {
    logger.info(`Updating user with ID: ${id} and data:`, data);
    const user = await this.findById(id);

    const updated = await this.usersRepository.update(id, data);
    return updated;
  }

  async softDelete(id: string, actorId: string): Promise<User> {
    const user = await this.findById(id);

    const deleted = await this.usersRepository.softDelete(id);

    return deleted;
  }
}
