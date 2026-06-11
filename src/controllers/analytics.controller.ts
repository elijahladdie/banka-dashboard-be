import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { ResponseHandler } from '../utils/response-handler';

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  async getOverview(_req: Request, res: Response) {
    const overview = await this.analyticsService.getOverview();
    ResponseHandler.success(res, overview, 'Analytics overview retrieved successfully.');
  }

  async getRevenueByPlan(_req: Request, res: Response) {
    const data = await this.analyticsService.getRevenueByPlan();
    ResponseHandler.success(res, data, 'Revenue by plan retrieved successfully.');
  }

  async getMonthlyRevenue(req: Request, res: Response) {
    const months = req.query.months ? parseInt(req.query.months as string, 10) : 12;
    const data = await this.analyticsService.getMonthlyRevenue(months);
    ResponseHandler.success(res, data, 'Monthly revenue retrieved successfully.');
  }

  async getAdvisorCapacity(_req: Request, res: Response) {
    const data = await this.analyticsService.getAdvisorCapacity();
    ResponseHandler.success(res, data, 'Advisor capacity retrieved successfully.');
  }

  async getGoalCompletionRate(_req: Request, res: Response) {
    const data = await this.analyticsService.getGoalCompletionRate();
    ResponseHandler.success(res, data, 'Goal completion rate retrieved successfully.');
  }
}
