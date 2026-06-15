import { Response } from 'express';
import { NotificationsService } from '../services/notifications.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';

export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  async findByUser(req: AuthenticatedRequest, res: Response) {
    const userId = req.params.userId || req.user!.userId;
    const result = await this.notificationsService.findByUser(userId, req.query);
    ResponseHandler.success(res, result, 'Notifications retrieved successfully.');
  }

  async findById(req: AuthenticatedRequest, res: Response) {
    const notification = await this.notificationsService.findById(req.params.id);
    ResponseHandler.success(res, notification, 'Notification retrieved successfully.');
  }

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    const notification = await this.notificationsService.markAsRead(req.params.id);
    ResponseHandler.success(res, notification, 'Notification marked as read.');
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    await this.notificationsService.markAllAsRead(req.user!.userId);
    ResponseHandler.success(res, null, 'All notifications marked as read.');
  }

  async getUnreadCount(req: AuthenticatedRequest, res: Response) {
    const count = await this.notificationsService.getUnreadCount(req.user!.userId);
    ResponseHandler.success(res, { unreadCount: count }, 'Unread count retrieved.');
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    await this.notificationsService.delete(req.params.id);
    ResponseHandler.success(res, null, 'Notification deleted successfully.');
  }
}
