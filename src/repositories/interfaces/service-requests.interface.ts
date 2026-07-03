import { ServiceRequest } from '@prisma/client';
import { QueryParams } from '../../types';

export interface IServiceRequestsRepository {
  findById(id: string): Promise<ServiceRequest | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: QueryParams;
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
