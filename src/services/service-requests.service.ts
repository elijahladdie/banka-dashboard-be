import { ServiceRequest } from '@prisma/client';
import { ServiceRequestsRepository } from '../repositories/implementations/service-requests.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';

export class ServiceRequestsService {
  private readonly repository: ServiceRequestsRepository;
  constructor() {
    this.repository = new ServiceRequestsRepository();
  }

  async findAll(query: Record<string, any>): Promise<PaginatedResult<ServiceRequest>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = {};
    if (query.clientId) where.clientId = query.clientId;
    if (query.advisorId) where.advisorId = query.advisorId;
    if (query.status) where.status = query.status;
    if (query.serviceType) where.serviceType = query.serviceType;

    const [requests, total] = await this.repository.findAll({ skip, take, orderBy, where });
    return paginateResult(requests, total, pagination);
  }

  async findById(id: string): Promise<ServiceRequest> {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundError('Service request');
    return request;
  }

  async findByClient(clientId: string, query: Record<string, any>): Promise<PaginatedResult<ServiceRequest>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const [requests, total] = await this.repository.findByClient(clientId, { skip, take, orderBy });
    return paginateResult(requests, total, pagination);
  }

  async findByAdvisor(advisorId: string, query: Record<string, any>): Promise<PaginatedResult<ServiceRequest>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const [requests, total] = await this.repository.findByAdvisor(advisorId, { skip, take, orderBy });
    return paginateResult(requests, total, pagination);
  }

  async create(data: Partial<ServiceRequest>, clientId: string): Promise<ServiceRequest> {
    return this.repository.create({ ...data, clientId });
  }

  async update(id: string, data: Partial<ServiceRequest>, actorId: string): Promise<ServiceRequest> {
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async respond(id: string, status: string, advisorResponse?: string): Promise<ServiceRequest> {
    await this.findById(id);
    const data: any = { status };
    if (advisorResponse) data.advisorResponse = advisorResponse;
    return this.repository.update(id, data);
  }

  async linkMeeting(id: string, meetingId: string): Promise<ServiceRequest> {
    await this.findById(id);
    return this.repository.update(id, { meetingId, status: 'ACCEPTED' });
  }
}
