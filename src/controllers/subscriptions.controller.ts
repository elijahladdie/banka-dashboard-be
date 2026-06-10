import { Request, Response } from 'express';
import { SubscriptionsService } from '../services/subscriptions.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../helpers';
import { ResponseHandler } from '../utils/response-handler';

export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.subscriptionsService.findAll(req.query);
    ResponseHandler.success(res, result, 'Subscriptions retrieved successfully.');
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const subscription = await this.subscriptionsService.findById(req.params.id);
    ResponseHandler.success(res, subscription, 'Subscription retrieved successfully.');
  });

  findByUserId = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.params.userId || req.user!.userId;
    const subscription = await this.subscriptionsService.findByUserId(userId);
    const message = subscription ? 'Subscription retrieved successfully.' : 'No subscription found.';
    ResponseHandler.success(res, subscription, message);
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subscription = await this.subscriptionsService.create(
      { ...req.body, userId: req.user!.userId },
      req.user!.userId
    );
    ResponseHandler.success(res, subscription, 'Subscription created successfully.', 100, 201);
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subscription = await this.subscriptionsService.update(
      req.params.id,
      req.body,
      req.user!.userId
    );
    ResponseHandler.success(res, subscription, 'Subscription updated successfully.');
  });

  cancel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subscription = await this.subscriptionsService.cancelSubscription(
      req.params.id,
      req.user!.userId
    );
    ResponseHandler.success(res, subscription, 'Subscription canceled successfully.');
  });
}
