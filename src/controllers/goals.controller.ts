import { Request, Response } from 'express';
import { GoalsService } from '../services/goals.service';
import { AuthenticatedRequest } from '../types';
import { HTTP_STATUS } from '../constants';
import { asyncHandler } from '../helpers';

export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.goalsService.findAll(req.query);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Goals retrieved successfully.',
      ...result,
    });
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const goal = await this.goalsService.findById(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Goal retrieved successfully.',
      data: goal,
    });
  });

  findBySubscriber = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subscriberId = req.params.subscriberId || req.user!.userId;
    const result = await this.goalsService.findBySubscriber(subscriberId, req.query);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Goals retrieved successfully.',
      ...result,
    });
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const goal = await this.goalsService.create(
      { ...req.body, subscriberId: req.user!.userId },
      req.user!.userId
    );
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Goal created successfully.',
      data: goal,
    });
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const goal = await this.goalsService.update(req.params.id, req.body, req.user!.userId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Goal updated successfully.',
      data: goal,
    });
  });

  updateProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentAmount } = req.body;
    const goal = await this.goalsService.updateProgress(
      req.params.id,
      currentAmount,
      req.user!.userId
    );
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Goal progress updated successfully.',
      data: goal,
    });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.goalsService.softDelete(req.params.id, req.user!.userId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Goal deleted successfully.',
    });
  });
}
