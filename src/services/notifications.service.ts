import { Notification } from '@prisma/client';
import { NotificationsRepository } from '../repositories/implementations/notifications.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';

export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository
  ) {}

  async findByUser(userId: string, query: Record<string, any>): Promise<PaginatedResult<Notification>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = {};
    if (query.unreadOnly === 'true') where.readAt = null;
    if (query.type) where.type = query.type;

    const [notifications, total] = await Promise.all([
      this.notificationsRepository.findByUser(userId, { skip, take, orderBy, where }),
      this.notificationsRepository.count({ userId, ...where }),
    ]);

    return paginateResult(notifications, total, pagination);
  }

  async findById(id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification) throw new NotFoundError('Notification');
    return notification;
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    return this.notificationsRepository.create(data);
  }

  async markAsRead(id: string): Promise<Notification> {
    await this.findById(id);
    return this.notificationsRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string): Promise<void> {
    return this.notificationsRepository.markAllAsRead(userId);
  }

  async delete(id: string): Promise<Notification> {
    await this.findById(id);
    return this.notificationsRepository.delete(id);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({ userId, readAt: null });
  }
}
