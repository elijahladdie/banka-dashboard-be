import { Request, Response } from 'express';
import { SubscriptionsService } from '../services/subscriptions.service';
import { AuthenticatedRequest } from '../types';
import { HTTP_STATUS } from '../constants';
import { asyncHandler } from '../helpers';

export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.subscriptionsService.findAll(req.query);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Subscriptions retrieved successfully.',
      ...result,
    });
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const subscription = await this.subscriptionsService.findById(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Subscription retrieved successfully.',
      data: subscription,
    });
  });

  findByUserId = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.params.userId || req.user!.userId;
    const subscription = await this.subscriptionsService.findByUserId(userId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: subscription ? 'Subscription retrieved successfully.' : 'No subscription found.',
      data: subscription,
    });
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subscription = await this.subscriptionsService.create(
      { ...req.body, userId: req.user!.userId },
      req.user!.userId
    );
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Subscription created successfully.',
      data: subscription,
    });
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subscription = await this.subscriptionsService.update(
      req.params.id,
      req.body,
      req.user!.userId
    );
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Subscription updated successfully.',
      data: subscription,
    });
  });

  cancel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subscription = await this.subscriptionsService.cancelSubscription(
      req.params.id,
      req.user!.userId
    );
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Subscription canceled successfully.',
      data: subscription,
    });
  });
}
