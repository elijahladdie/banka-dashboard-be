import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET } from './constants';
import { SubscriptionStatus } from '@prisma/client/edge';

export const generateTokens = (
    payload: Record<string, string>
): string => jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '1d' });

export const normalizePaddleSubscription = (paddleEvent: any) => {
    const data = paddleEvent?.data ?? {};
    const details = data?.details ?? data;

    const lineItem =
        details?.line_items?.[0] ??
        data?.items?.[0];

    const product =
        lineItem?.product?.name ??
        lineItem?.price?.name ??
        'ADVANCED';

    const billingPeriod =
        data?.billing_period ?? details?.current_billing_period ?? {};

    const startsAt =
        billingPeriod?.starts_at ??
        details?.started_at ??
        null;

    const endsAt =
        billingPeriod?.ends_at ??
        data?.next_billed_at ??
        null;

    const canceledAt =
        details?.canceled_at ??
        data?.canceled_at ??
        null;

    const trialStart =
        details?.trial_started_at ??
        (details?.status === 'trialing' ? startsAt : null);

    const trialEnd =
        details?.trial_ends_at ??
        null;

    const currency =
        details?.totals?.currency_code ??
        data?.currency_code ??
        'USD';

    const amount =
        Number(details?.totals?.grand_total ?? 0);
    const status = mapPaddleStatus(
        details?.status ?? data?.status ?? paddleEvent?.event_type
    );

    return {
        product: product?.toUpperCase(),
        currency,
        amount,
        status,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        canceledAt: canceledAt ? new Date(canceledAt) : null,
        trialStart: trialStart ? new Date(trialStart) : null,
        trialEnd: trialEnd ? new Date(trialEnd) : null,
        billingCycle: lineItem?.price?.billing_cycle ?? null,
        collectionMode: data?.collection_mode ?? null,
    };
}
export const resolveSubscriptionEvent = (eventType: string) => {
    switch (eventType) {
        case 'transaction.completed':
            return 'PAYMENT_RECEIVED';

        case 'subscription.created':
            return 'SUBSCRIPTION_CREATED';

        case 'subscription.updated':
            return 'SUBSCRIPTION_UPDATED';

        case 'subscription.canceled':
            return 'SUBSCRIPTION_CANCELED';

        case 'subscription.paused':
            return 'SUBSCRIPTION_PAUSED';

        case 'subscription.resumed':
            return 'SUBSCRIPTION_RESUMED';

        case 'subscription.trialing':
            return 'SUBSCRIPTION_TRIAL';

        default:
            return 'SUBSCRIPTION_UPDATED';
    }
}

function mapPaddleStatus(status?: string): SubscriptionStatus {
    const s = (status ?? "").toLowerCase();

    switch (s) {
        case "active":
        case "completed":
        case "paid":
        case "succeeded":
            return "ACTIVE";

        case "past_due":
        case "payment_failed":
        case "unpaid":
            return "PAST_DUE";

        case "trialing":
        case "trial":
            return "TRIALING";

        case "canceled":
        case "cancelled":
            return "CANCELED";

        case "expired":
        case "ended":
            return "EXPIRED";

        default:
            return "ACTIVE"; // safe fallback
    }
}
