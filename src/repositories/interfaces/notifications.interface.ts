import { Notification } from '@prisma/client';

export interface INotificationsRepository {
  findById(id: string): Promise<Notification | null>;
  findByUser(userId: string, params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<Notification[]>;
  count(where?: Record<string, any>): Promise<number>;
  create(data: Partial<Notification>): Promise<Notification>;
  markAsRead(id: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<void>;
  delete(id: string): Promise<Notification>;
}
