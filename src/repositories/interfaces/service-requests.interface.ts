import { ServiceRequest } from '@prisma/client';

export interface IServiceRequestsRepository {
  findById(id: string): Promise<ServiceRequest | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[ServiceRequest[], number]>;
  findByClient(clientId: string, params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<[ServiceRequest[], number]>;
  findByAdvisor(advisorId: string, params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<[ServiceRequest[], number]>;
  create(data: Partial<ServiceRequest>): Promise<ServiceRequest>;
  update(id: string, data: Partial<ServiceRequest>): Promise<ServiceRequest>;
}
