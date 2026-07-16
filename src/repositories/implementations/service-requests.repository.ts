import { ServiceRequest, Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IServiceRequestsRepository } from '../interfaces/service-requests.interface';
import { QueryParams } from '../../types';
import { NotFoundError } from '../../helpers';

const COMMON_INCLUDE = {
  meeting: true,
  client: {
    select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true },
  },
  advisor: {
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  },
} as const;

export class ServiceRequestsRepository implements IServiceRequestsRepository {
  async findById(id: string): Promise<ServiceRequest | null> {
    return prisma.serviceRequest.findUnique({ where: { id }, include: COMMON_INCLUDE }) as any;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: QueryParams;
  }): Promise<[ServiceRequest[], number]> {
    const [records, count] = await prisma.$transaction([
      prisma.serviceRequest.findMany({ ...params, include: COMMON_INCLUDE }),
      prisma.serviceRequest.count({ where: params.where }),
    ]);
    return [records as any, count];
  }

  async findByClient(clientId: string, params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<[ServiceRequest[], number]> {
    const where = { clientId };
    const [records, count] = await prisma.$transaction([
      prisma.serviceRequest.findMany({ where, ...params, include: COMMON_INCLUDE }),
      prisma.serviceRequest.count({ where }),
    ]);
    return [records as any, count];
  }

  async findByAdvisor(userID: string, params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<[ServiceRequest[], number]> {
    const advisor = await prisma.advisor.findFirst({ where: { userId: userID }, select: { id: true } });
    if (!advisor) throw new NotFoundError('No Advisor found');
    const where = { advisorId: advisor.id };
    const [records, count] = await prisma.$transaction([
      prisma.serviceRequest.findMany({ where, ...params, include: COMMON_INCLUDE }),
      prisma.serviceRequest.count({ where }),
    ]);
    return [records as any, count];
  }

  async create(data: Partial<ServiceRequest>): Promise<ServiceRequest> {
    return prisma.serviceRequest.create({ data: data as Prisma.ServiceRequestCreateInput });
  }

  async update(id: string, data: Partial<ServiceRequest>): Promise<ServiceRequest> {
    return prisma.serviceRequest.update({ where: { id }, data });
  }
}
