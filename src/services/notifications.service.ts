import { Notification } from '@prisma/client';
import { NotificationsRepository } from '../repositories/implementations/notifications.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { buildNotificationsFilter } from '../helpers/query-builder.helper';

export class NotificationsService {
  private readonly notificationsRepository: NotificationsRepository;
  constructor() {
    this.notificationsRepository = new NotificationsRepository();
  }

  async findByUser(userId: string, query: Record<string, any>): Promise<PaginatedResult<Notification>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const where = { ...buildNotificationsFilter(query), userId };
    const [notifications, total] = await this.notificationsRepository.findAll({ skip, take, orderBy, where });
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

  async getUnreadCount(userId: string): Promise<number> {
    const [notifications] = await this.notificationsRepository.findAll({ where: { userId, readAt: null } });
    return notifications.length;
  }
}
