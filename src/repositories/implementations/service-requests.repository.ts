import { ServiceRequest, Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IServiceRequestsRepository } from '../interfaces/service-requests.interface';
import { QueryParams } from '../../types';

export class ServiceRequestsRepository implements IServiceRequestsRepository {
  async findById(id: string): Promise<ServiceRequest | null> {
    return prisma.serviceRequest.findUnique({ where: { id } });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: QueryParams;
  }): Promise<[ServiceRequest[], number]> {
    const [records, count] = await prisma.$transaction([
      prisma.serviceRequest.findMany({ ...params }),
      prisma.serviceRequest.count({ where: params.where }),
    ]);
    return [records, count];
  }

  async findByClient(clientId: string, params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<[ServiceRequest[], number]> {
    const where = { clientId };
    const [records, count] = await prisma.$transaction([
      prisma.serviceRequest.findMany({ where, ...params }),
      prisma.serviceRequest.count({ where }),
    ]);
    return [records, count];
  }

  async findByAdvisor(advisorId: string, params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<[ServiceRequest[], number]> {
    const where = { advisorId };
    const [records, count] = await prisma.$transaction([
      prisma.serviceRequest.findMany({ where, ...params }),
      prisma.serviceRequest.count({ where }),
    ]);
    return [records, count];
  }

  async create(data: Partial<ServiceRequest>): Promise<ServiceRequest> {
    return prisma.serviceRequest.create({ data: data as Prisma.ServiceRequestCreateInput });
  }

  async update(id: string, data: Partial<ServiceRequest>): Promise<ServiceRequest> {
    return prisma.serviceRequest.update({ where: { id }, data });
  }
}
