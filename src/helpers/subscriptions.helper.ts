import { Subscription } from '@prisma/client';
import { sendSubsPlanChangeEmail } from '../services/email.service';
import { normalizePaddleSubscription } from './helper';
import { SUBSCRIPTION_RANK, PLAN_NAME_MAP } from '../constants/constants';

export function getSubscriptionRank(plan: string, interval: string): number {
  return SUBSCRIPTION_RANK[`${plan}:${interval}` as keyof typeof SUBSCRIPTION_RANK] || 0;
}

export function isPlanUpgrade(previousPlan: string, newPlan: string, previousInterval: string, newInterval: string): boolean {
  const previousRank = getSubscriptionRank(previousPlan, previousInterval);
  const newRank = getSubscriptionRank(newPlan, newInterval);
  return newRank > previousRank;
}

export function getPlanDisplayName(planKey: string): string {
  return PLAN_NAME_MAP[planKey] || planKey;
}


export function buildSubscriptionUpdateData(event: any, subscription: Subscription) {
  const normalized = normalizePaddleSubscription(event);
  return {
    subscription: normalized,
    previousPlan: subscription.plan,
    previousInterval: subscription.billingInterval || 'month',
    newPlan: normalized.product,
    newInterval: normalized.billingCycle?.interval || 'month',
  };
}

export function isSubscriptionChanged(previousPlan: string, newPlan: string, previousInterval: string, newInterval: string): boolean {
  return previousPlan !== newPlan || previousInterval !== newInterval;
}

export function getRankComparison(previousPlan: string, newPlan: string, previousInterval: string, newInterval: string) {
  const previousRank = SUBSCRIPTION_RANK[`${previousPlan}:${previousInterval}` as keyof typeof SUBSCRIPTION_RANK];
  const newRank = SUBSCRIPTION_RANK[`${newPlan}:${newInterval}` as keyof typeof SUBSCRIPTION_RANK];
  return { previousRank, newRank, isUpgrade: newRank > previousRank };
}

export async function sendPlanChangeNotification(
  user: { email: string; firstName: string },
  previousPlan: string,
  newPlan: string,
  previousInterval: string,
  newInterval: string,
  isUpgrade: boolean
) {
  await sendSubsPlanChangeEmail({
    email: user.email,
    firstName: user.firstName,
    previousPlan: PLAN_NAME_MAP[previousPlan] || previousPlan,
    newPlan: PLAN_NAME_MAP[newPlan] || newPlan,
    previousInterval,
    newInterval,
    isUpgrade,
  });
}

export function extractWebhookPayload(event: any) {
  const data = event.data || {};
  return {
    customerId: data.customerId,
    subscriptionId: data.id || '',
    event,
  };
}
