import { Request, Response } from 'express';
import { GoalsService } from '../services/goals.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';

export class GoalsController {
  private readonly goalsService: GoalsService;
  constructor() {
    this.goalsService = new GoalsService();
  }

  async findAll(req: Request, res: Response) {
    const result = await this.goalsService.findAll(req.query);
    ResponseHandler.success(res, result, 'Goals retrieved successfully.');
  }

  async findById(req: Request, res: Response) {
    const goal = await this.goalsService.findById(req.params.id);
    ResponseHandler.success(res, goal, 'Goal retrieved successfully.');
  }

  async findBySubscriber(req: AuthenticatedRequest, res: Response) {
    const subscriberId = req.params.subscriberId || req.user!.userId;
    const result = await this.goalsService.findBySubscriber(subscriberId, req.query);
    ResponseHandler.success(res, result, 'Goals retrieved successfully.');
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const goal = await this.goalsService.create(
      { ...req.body, subscriberId: req.user!.userId },
      req.user!.userId
    );
    ResponseHandler.success(res, goal, 'Goal created successfully.', 100, 201);
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const goal = await this.goalsService.update(req.params.id, req.body, req.user!.userId);
    ResponseHandler.success(res, goal, 'Goal updated successfully.');
  }

  async updateProgress(req: AuthenticatedRequest, res: Response) {
    const { currentAmount } = req.body;
    const goal = await this.goalsService.updateProgress(
      req.params.id,
      currentAmount,
      req.user!.userId
    );
    ResponseHandler.success(res, goal, 'Goal progress updated successfully.');
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    await this.goalsService.softDelete(req.params.id, req.user!.userId);
    ResponseHandler.success(res, null, 'Goal deleted successfully.');
  }
}
