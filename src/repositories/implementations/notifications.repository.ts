import { Notification } from '@prisma/client';
import prisma from '../../utils/prisma';
import { INotificationsRepository } from '../interfaces/notifications.interface';

export class NotificationsRepository implements INotificationsRepository {
  async findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({ where: { id } });
  }

  async findByUser(
    userId: string,
    params: {
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
      where?: Record<string, any>;
    }
  ): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId, ...params.where },
      skip: params.skip,
      take: params.take,
      orderBy: params.orderBy,
    });
  }

  async count(where?: Record<string, any>): Promise<number> {
    return prisma.notification.count({ where });
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    return prisma.notification.create({ data: data as any });
  }

  async markAsRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async delete(id: string): Promise<Notification> {
    return prisma.notification.delete({ where: { id } });
  }
}
