import { Request, Response } from 'express';
import { SubscriptionsService } from '../services/subscriptions.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';

export class SubscriptionsController {
  private readonly subscriptionsService: SubscriptionsService;
  constructor() {
    this.subscriptionsService = new SubscriptionsService();
  }

  async findAll(req: AuthenticatedRequest, res: Response) {
    if (req.user?.role === 'FINANCIAL_ADVISOR') {
      req.query.advisorId = req.user.userId;
    }
    const result = await this.subscriptionsService.findAll({ ...req.query, user: req?.user });
    ResponseHandler.success(res, result, 'Subscriptions retrieved successfully.');
  }

  async findById(req: Request, res: Response) {
    const subscription = await this.subscriptionsService.findById(req.params.id);
    ResponseHandler.success(res, subscription, 'Subscription retrieved successfully.');
  }

  async findByUserId(req: AuthenticatedRequest, res: Response) {
    const userId = req.params.userId || req.user!.userId;
    const subscription = await this.subscriptionsService.findByUserId(userId);
    const message = subscription ? 'Subscription retrieved successfully.' : 'No subscription found.';
    ResponseHandler.success(res, subscription, message);
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const subscription = await this.subscriptionsService.create(
      { ...req.body, userId: req.user!.userId },
      req.user!.userId
    );
    ResponseHandler.success(res, subscription, 'Subscription created successfully.', 100, 201);
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const subscription = await this.subscriptionsService.update(
      req.params.id,
      req.body,
      req.user!.userId
    );
    ResponseHandler.success(res, subscription, 'Subscription updated successfully.');
  }

  async cancel(req: AuthenticatedRequest, res: Response) {
    const subscription = await this.subscriptionsService.cancelSubscription(
      req.params.id,
      req.user!.userId
    );
    ResponseHandler.success(res, subscription, 'Subscription canceled successfully.');
  }

  async updateFeatures(req: AuthenticatedRequest, res: Response) {
    const { productid } = req.params;
    const { features, plan } = req.body;
    const result = await this.subscriptionsService.updatePlanFeatures({ productId: productid, features, plan, userId: String(req.user!.userId), billingInterval: req.body.billingInterval });
    ResponseHandler.success(res, result, 'Plan features updated successfully.');
  }
}
