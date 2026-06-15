import { AnalyticsRepository } from '../repositories/implementations/analytics.repository';
import { AnalyticsOverview } from '../types';

export class AnalyticsService {
  private readonly analyticsRepository: AnalyticsRepository;
  constructor() {
    this.analyticsRepository = new AnalyticsRepository();
  }

  async getOverview(): Promise<AnalyticsOverview> {
    return this.analyticsRepository.getOverview();
  }
}
