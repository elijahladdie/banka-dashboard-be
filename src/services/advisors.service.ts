import { Advisor, User } from '@prisma/client';
import { AdvisorsRepository } from '../repositories/implementations/advisors.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { ConflictError, NotFoundError, ValidationError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';

export class AdvisorsService {
  private readonly advisorsRepository: AdvisorsRepository;
  private readonly auditLogsRepository: AuditLogsRepository;
  constructor() {
    this.advisorsRepository = new AdvisorsRepository();
    this.auditLogsRepository = new AuditLogsRepository();
  }

  async findAll(query: Record<string, any>): Promise<PaginatedResult<Advisor & { user: User }>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = {};
    if (query.isAvailable !== undefined) where.isAvailable = query.isAvailable === 'true';
    if (query.specialization) where.specialization = { contains: query.specialization, mode: 'insensitive' };

    const [advisors, total] = await this.advisorsRepository.findAll({ skip, take, orderBy, where });

    return paginateResult(advisors, total, pagination);
  }

  async findById(id: string): Promise<Advisor & { user: User }> {
    const advisor = await this.advisorsRepository.findById(id);
    if (!advisor) throw new NotFoundError('Advisor');
    return advisor;
  }

  async create(data: {
    userId: string;
    employeeCode: string;
    specialization?: string;
    bio?: string;
    maxClients?: number;
  }, actorId: string): Promise<Advisor> {
    const existingCode = await this.advisorsRepository.findByEmployeeCode(data.employeeCode);
    if (existingCode) {
      throw new ConflictError('Employee code already exists.');
    }

    const existingAdvisor = await this.advisorsRepository.findByUserId(data.userId);
    if (existingAdvisor) {
      throw new ConflictError('User is already registered as an advisor.');
    }

    const advisor = await this.advisorsRepository.create({
      userId: data.userId,
      employeeCode: data.employeeCode,
      specialization: data.specialization,
      bio: data.bio,
      maxClients: data.maxClients || 20,
      currentClients: 0,
      isAvailable: true,
    });

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'ADVISOR_CREATED',
      entityType: 'Advisor',
      entityId: advisor.id,
      newValues: data,
    });

    return advisor;
  }

  async update(id: string, data: Partial<Advisor>, actorId: string): Promise<Advisor> {
    await this.findById(id);
    const updated = await this.advisorsRepository.update(id, data);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'ADVISOR_UPDATED',
      entityType: 'Advisor',
      entityId: id,
      newValues: data as any,
    });

    return updated;
  }

  async softDelete(id: string, actorId: string): Promise<Advisor> {
    await this.findById(id);
    const deleted = await this.advisorsRepository.softDelete(id);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'ADVISOR_DELETED',
      entityType: 'Advisor',
      entityId: id,
    });

    return deleted;
  }

  async toggleAvailability(id: string): Promise<Advisor> {
    const advisor = await this.findById(id);
    return this.advisorsRepository.update(id, {
      isAvailable: !advisor.isAvailable,
    });
  }
}
