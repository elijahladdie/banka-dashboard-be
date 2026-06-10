import prisma from '../../utils/prisma';
import { IAnalyticsRepository, AnalyticsOverview } from '../interfaces/analytics.interface';

export class AnalyticsRepository implements IAnalyticsRepository {
  async getOverview(): Promise<AnalyticsOverview> {
    const monthlyRevenue = await this.getMonthlyRevenue(12);

    const overview = await prisma.$transaction(async (tx) => {
      const totalSubscribers = await tx.user.count({
        where: { role: 'SUBSCRIBER', deletedAt: null },
      });

      const totalAdvisors = await tx.advisor.count({
        where: { deletedAt: null },
      });

      const activeSubscriptions = await tx.subscription.count({
        where: { status: 'ACTIVE' },
      });

      const subscriptions = await tx.subscription.groupBy({
        by: ['plan'],
        where: { status: 'ACTIVE' },
        _count: { plan: true },
      });

      const revenueByPlan = subscriptions.map((s) => ({
        plan: s.plan,
        revenue: 0,
        count: s._count.plan,
      }));

      const advisors = await tx.advisor.findMany({
        where: { deletedAt: null },
        select: { maxClients: true, currentClients: true },
      });

      const total = advisors.reduce((sum, a) => sum + a.maxClients, 0);
      const utilized = advisors.reduce((sum, a) => sum + a.currentClients, 0);

      const goalTotal = await tx.goal.count({
        where: { deletedAt: null },
      });
      const goalCompleted = await tx.goal.count({
        where: { status: 'COMPLETED', deletedAt: null },
      });

      return {
        totalSubscribers,
        totalAdvisors,
        activeSubscriptions,
        revenueByPlan,
        advisorCapacity: {
          total,
          utilized,
          available: total - utilized,
        },
        goalCompletionRate: {
          completed: goalCompleted,
          total: goalTotal,
          rate: goalTotal > 0 ? Math.round((goalCompleted / goalTotal) * 100) : 0,
        },
      };
    });

    return {
      ...overview,
      monthlyRevenue,
    };
  }

  async getRevenueByPlan(): Promise<{ plan: string; revenue: number; count: number }[]> {
    const subscriptions = await prisma.subscription.groupBy({
      by: ['plan'],
      where: { status: 'ACTIVE' },
      _count: { plan: true },
    });

    return subscriptions.map((s) => ({
      plan: s.plan,
      revenue: 0, // Computed from external billing service
      count: s._count.plan,
    }));
  }

  async getMonthlyRevenue(months: number = 12): Promise<{ month: string; revenue: number }[]> {
    const result: { month: string; revenue: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().slice(0, 7);

      const count = await prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          createdAt: {
            lte: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          },
        },
      });

      result.push({
        month: monthStr,
        revenue: count * 0, // Computed from external billing service
      });
    }

    return result;
  }

  async getAdvisorCapacity(): Promise<{ total: number; utilized: number; available: number }> {
    const advisors = await prisma.advisor.findMany({
      where: { deletedAt: null },
      select: { maxClients: true, currentClients: true },
    });

    const total = advisors.reduce((sum, a) => sum + a.maxClients, 0);
    const utilized = advisors.reduce((sum, a) => sum + a.currentClients, 0);

    return {
      total,
      utilized,
      available: total - utilized,
    };
  }

  async getGoalCompletionRate(): Promise<{ completed: number; total: number; rate: number }> {
    const [total, completed] = await prisma.$transaction([
      prisma.goal.count({ where: { deletedAt: null } }),
      prisma.goal.count({ where: { status: 'COMPLETED', deletedAt: null } }),
    ]);

    return {
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}
