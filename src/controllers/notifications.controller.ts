import { Response } from 'express';
import { NotificationsService } from '../services/notifications.service';
import { AuthenticatedRequest } from '../types';
import { HTTP_STATUS } from '../constants';
import { asyncHandler } from '../helpers';

export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  findByUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.params.userId || req.user!.userId;
    const result = await this.notificationsService.findByUser(userId, req.query);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notifications retrieved successfully.',
      ...result,
    });
  });

  findById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const notification = await this.notificationsService.findById(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notification retrieved successfully.',
      data: notification,
    });
  });

  markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const notification = await this.notificationsService.markAsRead(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notification marked as read.',
      data: notification,
    });
  });

  markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.notificationsService.markAllAsRead(req.user!.userId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  });

  getUnreadCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const count = await this.notificationsService.getUnreadCount(req.user!.userId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Unread count retrieved.',
      data: { unreadCount: count },
    });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.notificationsService.delete(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notification deleted successfully.',
    });
  });
}
