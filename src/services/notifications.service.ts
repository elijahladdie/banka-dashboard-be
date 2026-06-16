import { Notification } from '@prisma/client';
import { NotificationsRepository } from '../repositories/implementations/notifications.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';

export class NotificationsService {
  private readonly notificationsRepository: NotificationsRepository;
  constructor() {
    this.notificationsRepository = new NotificationsRepository();
  }

  async findByUser(userId: string, query: Record<string, any>): Promise<PaginatedResult<Notification>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = {};
    if (query.unreadOnly === 'true') where.readAt = null;
    if (query.type) where.type = query.type;
    where.userId = userId;

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
    return this.notificationsRepository.findAll({
      where: { userId, readAt: null }
    }).then(([notifications, _]) => notifications.length);
  }
}
