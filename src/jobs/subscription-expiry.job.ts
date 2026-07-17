import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { computeReadOnlyUntil } from '../helpers/subscription-access.helper';

export async function processSubscriptionExpiry(): Promise<{
  expired: number;
  notified: number;
}> {
  const now = new Date();
  let expired = 0;
  let notified = 0;

  try {
    const toExpire = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        cancelAtPeriodEnd: true,
        endsAt: { lte: now },
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    for (const sub of toExpire) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });

      const readOnlyUntil = sub.endsAt ? computeReadOnlyUntil(sub.endsAt) : null;

      await prisma.notification.create({
        data: {
          userId: sub.userId,
          title: 'Plan Expired',
          message: readOnlyUntil
            ? `Your plan has ended. You're in read-only mode until ${readOnlyUntil.toLocaleDateString()}. Resubscribe to regain full access.`
            : 'Your plan has ended. Resubscribe to regain full access.',
          type: 'WARNING',
        },
      });
      notified++;
      expired++;
      logger.info(`Expired subscription ${sub.id} for user ${sub.userId}`);
    }

    const expiringTrials = await prisma.subscription.findMany({
      where: {
        status: 'TRIALING',
        trialEnd: { lte: now },
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    for (const sub of expiringTrials) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED', endsAt: sub.trialEnd },
      });

      const readOnlyUntil = sub.trialEnd ? computeReadOnlyUntil(sub.trialEnd) : null;

      await prisma.notification.create({
        data: {
          userId: sub.userId,
          title: 'Trial Ended',
          message: readOnlyUntil
            ? `Your trial has ended. You're in read-only mode until ${readOnlyUntil.toLocaleDateString()}. Subscribe to continue working with your advisor.`
            : 'Your trial has ended. Subscribe to continue working with your advisor.',
          type: 'WARNING',
        },
      });
      notified++;
      expired++;
      logger.info(`Expired trial subscription ${sub.id} for user ${sub.userId}`);
    }

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const stalePastDue = await prisma.subscription.findMany({
      where: {
        status: 'PAST_DUE',
        updatedAt: { lte: sevenDaysAgo },
      },
      include: { user: { select: { id: true } } },
    });

    for (const sub of stalePastDue) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });

      const readOnlyUntil = sub.endsAt ? computeReadOnlyUntil(sub.endsAt) : null;

      await prisma.notification.create({
        data: {
          userId: sub.userId,
          title: 'Payment Retries Exhausted',
          message: readOnlyUntil
            ? `We were unable to process your payment. Your plan has ended and you're in read-only mode until ${readOnlyUntil.toLocaleDateString()}. Update your payment method to resubscribe.`
            : 'We were unable to process your payment. Update your payment method to resubscribe.',
          type: 'WARNING',
        },
      });
      notified++;
      expired++;
      logger.info(`Expired stale PAST_DUE subscription ${sub.id} for user ${sub.userId}`);
    }

    const almostLocked = await prisma.subscription.findMany({
      where: {
        status: 'EXPIRED',
        endsAt: { not: null },
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    for (const sub of almostLocked) {
      if (!sub.endsAt) continue;
      const readOnlyUntil = computeReadOnlyUntil(sub.endsAt);
      const msUntilLocked = readOnlyUntil.getTime() - now.getTime();
      const daysUntilLocked = Math.ceil(msUntilLocked / (1000 * 60 * 60 * 24));

      if (daysUntilLocked === 7 || daysUntilLocked === 1) {
        await prisma.notification.create({
          data: {
            userId: sub.userId,
            title: 'Access Ending Soon',
            message: daysUntilLocked === 1
              ? `Your read-only access ends tomorrow (${readOnlyUntil.toLocaleDateString()}). Resubscribe now to keep viewing your data.`
              : `Your read-only access ends in 7 days (${readOnlyUntil.toLocaleDateString()}). Resubscribe to keep full access.`,
            type: 'REMINDER',
          },
        });
        notified++;
      }
    }

    logger.info(`Subscription expiry job complete: ${expired} expired, ${notified} notifications sent`);
  } catch (error) {
    logger.error('Subscription expiry job failed', { error });
  }

  return { expired, notified };
}

/**
 * Start the subscription expiry job on an interval.
 * @param intervalMs How often to run (default: 15 minutes)
 */
export function startSubscriptionExpiryJob(intervalMs = 15 * 60 * 1000): ReturnType<typeof setInterval> {
  logger.info(`Starting subscription expiry job (interval: ${intervalMs}ms)`);
  processSubscriptionExpiry();
  return setInterval(processSubscriptionExpiry, intervalMs);
}
