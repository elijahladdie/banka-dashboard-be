import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { HTTP_STATUS } from '../constants';
import { asyncHandler } from '../helpers';

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  getOverview = asyncHandler(async (_req: Request, res: Response) => {
    const overview = await this.analyticsService.getOverview();
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Analytics overview retrieved successfully.',
      data: overview,
    });
  });

  getRevenueByPlan = asyncHandler(async (_req: Request, res: Response) => {
    const data = await this.analyticsService.getRevenueByPlan();
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Revenue by plan retrieved successfully.',
      data,
    });
  });

  getMonthlyRevenue = asyncHandler(async (req: Request, res: Response) => {
    const months = req.query.months ? parseInt(req.query.months as string, 10) : 12;
    const data = await this.analyticsService.getMonthlyRevenue(months);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Monthly revenue retrieved successfully.',
      data,
    });
  });

  getAdvisorCapacity = asyncHandler(async (_req: Request, res: Response) => {
    const data = await this.analyticsService.getAdvisorCapacity();
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Advisor capacity retrieved successfully.',
      data,
    });
  });

  getGoalCompletionRate = asyncHandler(async (_req: Request, res: Response) => {
    const data = await this.analyticsService.getGoalCompletionRate();
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Goal completion rate retrieved successfully.',
      data,
    });
  });
}
