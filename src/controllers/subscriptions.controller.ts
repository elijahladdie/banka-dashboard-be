import { Request, Response } from 'express';
import { SubscriptionsService } from '../services/subscriptions.service';
import { AuthenticatedRequest, QueryParams } from '../types';
import { ResponseHandler } from '../utils/response-handler';
import { MESSAGES } from '../constants';

export class SubscriptionsController {
  private readonly subscriptionsService: SubscriptionsService;
  constructor() {
    this.subscriptionsService = new SubscriptionsService();
  }

  async findAll(req: AuthenticatedRequest, res: Response) {
    const query: QueryParams = { ...req.query, user: req.user };
    if (req.user?.roles?.includes('advisor')) query.advisorId = req.user.userId;
    const result = await this.subscriptionsService.findAll(query);
    ResponseHandler.success(res, result, MESSAGES.SUBSCRIPTIONS.RETRIEVED);
  }

  async findById(req: Request, res: Response) {
    const subscription = await this.subscriptionsService.findById(req.params.id);
    ResponseHandler.success(res, subscription, MESSAGES.SUBSCRIPTIONS.RETRIEVED_SINGLE);
  }

  async findByUserId(req: AuthenticatedRequest, res: Response) {
    const userId = req.params.userId || req.user!.userId;
    const subscription = await this.subscriptionsService.findByUserId(userId);
    ResponseHandler.success(res, subscription, subscription ? MESSAGES.SUBSCRIPTIONS.RETRIEVED_SINGLE : MESSAGES.SUBSCRIPTIONS.NOT_FOUND);
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const subscription = await this.subscriptionsService.create(
      { ...req.body, userId: req.user!.userId }, req.user!.userId
    );
    ResponseHandler.success(res, subscription, MESSAGES.SUBSCRIPTIONS.CREATED, 100, 201);
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const subscription = await this.subscriptionsService.update(req.params.id, req.body);
    ResponseHandler.success(res, subscription, MESSAGES.SUBSCRIPTIONS.UPDATED);
  }

  async cancel(req: AuthenticatedRequest, res: Response) {
    const { reason } = req.body;
    const subscription = await this.subscriptionsService.cancelSubscription(req.params.id, req.user!.userId, reason);
    ResponseHandler.success(res, subscription, MESSAGES.SUBSCRIPTIONS.CANCELED);
  }

  async reactivate(req: AuthenticatedRequest, res: Response) {
    const subscription = await this.subscriptionsService.reactivateSubscription(req.params.id, req.user!.userId);
    ResponseHandler.success(res, subscription, MESSAGES.SUBSCRIPTIONS.UPDATED);
  }

  async getAccessInfo(req: AuthenticatedRequest, res: Response) {
    const userId = req.params.userId || req.user!.userId;
    const info = await this.subscriptionsService.getAccessInfo(userId);
    ResponseHandler.success(res, info, MESSAGES.SUCCESS);
  }
}
