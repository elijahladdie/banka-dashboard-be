import { Request, Response } from 'express';
import { GoalsService } from '../services/goals.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../helpers';
import { ResponseHandler } from '../utils/response-handler';

export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.goalsService.findAll(req.query);
    ResponseHandler.success(res, result, 'Goals retrieved successfully.');
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const goal = await this.goalsService.findById(req.params.id);
    ResponseHandler.success(res, goal, 'Goal retrieved successfully.');
  });

  findBySubscriber = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subscriberId = req.params.subscriberId || req.user!.userId;
    const result = await this.goalsService.findBySubscriber(subscriberId, req.query);
    ResponseHandler.success(res, result, 'Goals retrieved successfully.');
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const goal = await this.goalsService.create(
      { ...req.body, subscriberId: req.user!.userId },
      req.user!.userId
    );
    ResponseHandler.success(res, goal, 'Goal created successfully.', 100, 201);
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const goal = await this.goalsService.update(req.params.id, req.body, req.user!.userId);
    ResponseHandler.success(res, goal, 'Goal updated successfully.');
  });

  updateProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentAmount } = req.body;
    const goal = await this.goalsService.updateProgress(
      req.params.id,
      currentAmount,
      req.user!.userId
    );
    ResponseHandler.success(res, goal, 'Goal progress updated successfully.');
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.goalsService.softDelete(req.params.id, req.user!.userId);
    ResponseHandler.success(res, null, 'Goal deleted successfully.');
  });
}
