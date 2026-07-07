import { Response } from 'express';
import { NotificationsService } from '../services/notifications.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';
import { MESSAGES } from '../constants';

export class NotificationsController {
  private readonly notificationsService: NotificationsService;
  constructor() {
    this.notificationsService = new NotificationsService();
  }

  async findByUser(req: AuthenticatedRequest, res: Response) {
    const userId = req.params.userId || req.user!.userId;
    const result = await this.notificationsService.findByUser(userId, req.query);
    ResponseHandler.success(res, result, MESSAGES.NOTIFICATIONS.RETRIEVED);
  }

  async findById(req: AuthenticatedRequest, res: Response) {
    const notification = await this.notificationsService.findById(req.params.id);
    ResponseHandler.success(res, notification, MESSAGES.NOTIFICATIONS.RETRIEVED_SINGLE);
  }

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    const notification = await this.notificationsService.markAsRead(req.params.id);
    ResponseHandler.success(res, notification, MESSAGES.NOTIFICATIONS.MARKED_READ);
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    await this.notificationsService.markAllAsRead(req.user!.userId);
    ResponseHandler.success(res, null, MESSAGES.NOTIFICATIONS.ALL_MARKED_READ);
  }

  async getUnreadCount(req: AuthenticatedRequest, res: Response) {
    const count = await this.notificationsService.getUnreadCount(req.user!.userId);
    ResponseHandler.success(res, { unreadCount: count }, MESSAGES.NOTIFICATIONS.UNREAD_COUNT);
  }
}
