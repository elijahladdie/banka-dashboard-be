import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { ResponseHandler } from '../utils/response-handler';

export class AnalyticsController {
  private readonly analyticsService: AnalyticsService;
  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  async getOverview(_req: Request, res: Response) {
    const overview = await this.analyticsService.getOverview();
    ResponseHandler.success(res, overview, 'Analytics overview retrieved successfully.');
  }
}
