import { Prisma, ClientAssignment } from '@prisma/client';
import { QueryParams } from '../../types';

export interface IAssignmentsRepository {
  findById(id: string): Promise<ClientAssignment | null>;
  findActiveByClient(clientId: string): Promise<ClientAssignment | null>;
  findByAdvisor(advisorId: string, params: {
    skip?: number;
    take?: number;
  }): Promise<ClientAssignment[]>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: QueryParams;
  }): Promise<[ClientAssignment[], number]>;
  create(data: Prisma.ClientAssignmentCreateInput): Promise<ClientAssignment>;
  endAssignment(id: string): Promise<ClientAssignment>;
}
