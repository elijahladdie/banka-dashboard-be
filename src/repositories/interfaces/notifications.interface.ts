import { Notification } from '@prisma/client';

export interface INotificationsRepository {
  findById(id: string): Promise<Notification | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[Notification[], number]>;
  create(data: Partial<Notification>): Promise<Notification>;
  markAsRead(id: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<void>;
}
