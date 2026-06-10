export interface AnalyticsOverview {
  totalSubscribers: number;
  totalAdvisors: number;
  activeSubscriptions: number;
  revenueByPlan: { plan: string; revenue: number; count: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  advisorCapacity: { total: number; utilized: number; available: number };
  goalCompletionRate: { completed: number; total: number; rate: number };
}

export interface IAnalyticsRepository {
  getOverview(): Promise<AnalyticsOverview>;
  getRevenueByPlan(): Promise<{ plan: string; revenue: number; count: number }[]>;
  getMonthlyRevenue(months?: number): Promise<{ month: string; revenue: number }[]>;
  getAdvisorCapacity(): Promise<{ total: number; utilized: number; available: number }>;
  getGoalCompletionRate(): Promise<{ completed: number; total: number; rate: number }>;
}
