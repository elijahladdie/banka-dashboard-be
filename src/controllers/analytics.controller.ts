import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { ResponseHandler } from '../utils/response-handler';
import { MESSAGES } from '../constants';

export class AnalyticsController {
  private readonly analyticsService: AnalyticsService;
  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  async getOverview(_req: Request, res: Response) {
    const overview = await this.analyticsService.getOverview();
    ResponseHandler.success(res, overview, MESSAGES.ANALYTICS.OVERVIEW_RETRIEVED);
  }
}
