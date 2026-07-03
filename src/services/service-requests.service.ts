import { ServiceRequest, RequestStatus } from '@prisma/client';
import { ServiceRequestsRepository } from '../repositories/implementations/service-requests.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult, QueryParams } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { buildServiceRequestsFilter } from '../helpers/query-builder.helper';

export class ServiceRequestsService {
  private readonly repository: ServiceRequestsRepository;
  constructor() {
    this.repository = new ServiceRequestsRepository();
  }

  async findAll(query: QueryParams): Promise<PaginatedResult<ServiceRequest>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const where = buildServiceRequestsFilter(query);
    const [requests, total] = await this.repository.findAll({ skip, take, orderBy, where });
    return paginateResult(requests, total, pagination);
  }

  async findById(id: string): Promise<ServiceRequest> {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundError('Service request');
    return request;
  }

  async findByClient(clientId: string, query: QueryParams): Promise<PaginatedResult<ServiceRequest>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const [requests, total] = await this.repository.findByClient(clientId, { skip, take, orderBy });
    return paginateResult(requests, total, pagination);
  }

  async findByAdvisor(advisorId: string, query: QueryParams): Promise<PaginatedResult<ServiceRequest>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const [requests, total] = await this.repository.findByAdvisor(advisorId, { skip, take, orderBy });
    return paginateResult(requests, total, pagination);
  }

  async create(data: Partial<ServiceRequest>, clientId: string): Promise<ServiceRequest> {
    return this.repository.create({ ...data, clientId });
  }

  async update(id: string, data: Partial<ServiceRequest>, _actorId: string): Promise<ServiceRequest> {
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async respond(id: string, status: RequestStatus, advisorResponse?: string): Promise<ServiceRequest> {
    await this.findById(id);
    return this.repository.update(id, { status, ...(advisorResponse ? { advisorResponse } : {}) });
  }

  async linkMeeting(id: string, meetingId: string): Promise<ServiceRequest> {
    await this.findById(id);
    return this.repository.update(id, { meetingId, status: 'ACCEPTED' });
  }
}
