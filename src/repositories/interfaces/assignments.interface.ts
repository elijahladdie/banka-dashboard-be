import { SubscriberAssignment } from '@prisma/client';

export interface IAssignmentsRepository {
  findById(id: string): Promise<SubscriberAssignment | null>;
  findActiveBySubscriber(subscriberId: string): Promise<SubscriberAssignment | null>;
  findByAdvisor(advisorId: string, params: {
    skip?: number;
    take?: number;
  }): Promise<SubscriberAssignment[]>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[SubscriberAssignment[], number]>;
  create(data: Partial<SubscriberAssignment>): Promise<SubscriberAssignment>;
  endAssignment(id: string): Promise<SubscriberAssignment>;
}
