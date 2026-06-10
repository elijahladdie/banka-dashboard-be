import { Response } from 'express';
import { NotificationsService } from '../services/notifications.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../helpers';
import { ResponseHandler } from '../utils/response-handler';

export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  findByUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.params.userId || req.user!.userId;
    const result = await this.notificationsService.findByUser(userId, req.query);
    ResponseHandler.success(res, result, 'Notifications retrieved successfully.');
  });

  findById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const notification = await this.notificationsService.findById(req.params.id);
    ResponseHandler.success(res, notification, 'Notification retrieved successfully.');
  });

  markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const notification = await this.notificationsService.markAsRead(req.params.id);
    ResponseHandler.success(res, notification, 'Notification marked as read.');
  });

  markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.notificationsService.markAllAsRead(req.user!.userId);
    ResponseHandler.success(res, null, 'All notifications marked as read.');
  });

  getUnreadCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const count = await this.notificationsService.getUnreadCount(req.user!.userId);
    ResponseHandler.success(res, { unreadCount: count }, 'Unread count retrieved.');
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.notificationsService.delete(req.params.id);
    ResponseHandler.success(res, null, 'Notification deleted successfully.');
  });
}
