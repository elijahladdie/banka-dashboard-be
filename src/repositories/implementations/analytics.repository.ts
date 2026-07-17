import { AnalyticsOverview } from '../../types';
import prisma from '../../utils/prisma';
import { IAnalyticsRepository } from '../interfaces/analytics.interface';

export class AnalyticsRepository implements IAnalyticsRepository {
  async getOverview(): Promise<AnalyticsOverview> {
    const [
      clientTrend,
      subscriptionTrend,
      goalTrend,
    ] = await Promise.all([
      this.getClientTrend(),
      this.getSubscriptionTrend(),
      this.getGoalTrend(),
    ]);


    return prisma.$transaction(async (tx) => {
      const totalUsers = await tx.user.count({
        where: {
          closedAt: null,
        },
      });

      const totalClients = await tx.user.count({
        where: {
          closedAt: null,
          userRoles: {
            some: {
              role: { slug: 'client' },
            },
          },
        },
      });

      const totalAdmins = await tx.user.count({
        where: {
          closedAt: null,
          userRoles: {
            some: {
              role: { slug: 'admin' },
            },
          },
        },
      });

      const totalAdvisors = await tx.advisor.count({
        where: {
          closedAt: null,
        },
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentClients = await tx.user.count({
        where: {
          closedAt: null,
          userRoles: {
            some: {
              role: { slug: 'client' },
            },
          },
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      const activeSubscriptions = await tx.subscription.count({
        where: {
          status: 'ACTIVE',
        },
      });

      const cancelledSubscriptions = await tx.subscription.count({
        where: {
          status: 'CANCELED',
        },
      });

      const inactiveSubscriptions = await tx.subscription.count({
        where: {
          status: {
            not: 'ACTIVE',
          },
        },
      });
  
      const monthlyPlans = await tx.subscription.count({
        where: {
          status: 'ACTIVE',
          billingInterval: 'month',
        },
      });

      const yearlyPlans = await tx.subscription.count({
        where: {
          status: 'ACTIVE',
          billingInterval: 'year',
        },
      });

      const goalTotal = await tx.goal.count({
        where: {
          closedAt: null,
        },
      });

      const goalCompleted = await tx.goal.count({
        where: {
          status: 'COMPLETED',
          closedAt: null,
        },
      });

      const goalActive = await tx.goal.count({
        where: {
          status: 'IN_PROGRESS',
          closedAt: null,
        },
      });

      const goalCancelled = await tx.goal.count({
        where: {
          status: 'CANCELED',
          closedAt: null,
        },
      });

      const advisors = await tx.advisor.findMany({
        where: {
          closedAt: null,
        },
        select: {
          maxClients: true,
          currentClients: true,
        },
      });

      const totalCapacity = advisors.reduce(
        (sum, advisor) => sum + advisor.maxClients,
        0,
      );

      const utilizedCapacity = advisors.reduce(
        (sum, advisor) => sum + advisor.currentClients,
        0,
      );

      const availableCapacity =
        totalCapacity - utilizedCapacity;

      return {
        users: {
          total: totalUsers,
          clients: totalClients,
          advisors: totalAdvisors,
          admins: totalAdmins,
          newClientsLast30Days: recentClients,
        },

        subscriptions: {
          active: activeSubscriptions,
          inactive: inactiveSubscriptions,
          cancelled: cancelledSubscriptions,

          monthlyPlans,
          yearlyPlans,

          monthlyPercentage:
            activeSubscriptions > 0
              ? Math.round(
                (monthlyPlans / activeSubscriptions) * 100,
              )
              : 0,

          yearlyPercentage:
            activeSubscriptions > 0
              ? Math.round(
                (yearlyPlans / activeSubscriptions) * 100,
              )
              : 0,
        },

        goals: {
          total: goalTotal,
          active: goalActive,
          completed: goalCompleted,
          cancelled: goalCancelled,

          completionRate:
            goalTotal > 0
              ? Math.round(
                (goalCompleted / goalTotal) * 100,
              )
              : 0,
        },

        advisorCapacity: {
          totalCapacity,
          utilizedCapacity,
          availableCapacity,

          utilizationRate:
            totalCapacity > 0
              ? Math.round(
                (utilizedCapacity / totalCapacity) * 100,
              )
              : 0,
        },

        trends: {
          clients: clientTrend,
          subscriptions: subscriptionTrend,
          goals: goalTrend,
        },
      };
    });

  }

  private async getClientTrend(months = 12) {
    const result: { month: string; count: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const start = new Date(
        date.getFullYear(),
        date.getMonth(),
        1,
      );

      const end = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        1,
      );

      const count = await prisma.user.count({
        where: {
          userRoles: {
            some: {
              role: { slug: 'client' },
            },
          },
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      });

      result.push({
        month: start.toISOString().slice(0, 7),
        count,
      });
    }

    return result;

  }

  private async getSubscriptionTrend(months = 12) {
    const result: { month: string; count: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const start = new Date(
        date.getFullYear(),
        date.getMonth(),
        1,
      );

      const end = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        1,
      );

      const count = await prisma.subscription.count({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      });

      result.push({
        month: start.toISOString().slice(0, 7),
        count,
      });
    }

    return result;

  }

  private async getGoalTrend(months = 12) {
    const result: { month: string; count: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const start = new Date(
        date.getFullYear(),
        date.getMonth(),
        1,
      );

      const end = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        1,
      );

      const count = await prisma.goal.count({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
          closedAt: null,
        },
      });

      result.push({
        month: start.toISOString().slice(0, 7),
        count,
      });
    }

    return result;

  }
}
