import { AnalyticsRepository } from '../repositories/implementations/analytics.repository';
import { AnalyticsOverview } from '../repositories/interfaces/analytics.interface';

export class AnalyticsService {
  private readonly analyticsRepository: AnalyticsRepository;
  constructor() {
    this.analyticsRepository = new AnalyticsRepository();
  }

  async getOverview(): Promise<AnalyticsOverview> {
    return this.analyticsRepository.getOverview();
  }

  async getRevenueByPlan() {
    return this.analyticsRepository.getRevenueByPlan();
  }

  async getMonthlyRevenue(months?: number) {
    return this.analyticsRepository.getMonthlyRevenue(months);
  }

  async getAdvisorCapacity() {
    return this.analyticsRepository.getAdvisorCapacity();
  }

  async getGoalCompletionRate() {
    return this.analyticsRepository.getGoalCompletionRate();
  }
}
