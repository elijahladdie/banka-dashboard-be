import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET, PLAN_NAME_MAP, PLAN_FEATURES } from '../constants/constants';
import { SubscriptionStatus } from '@prisma/client';
import { Paddle } from '@paddle/paddle-node-sdk';

export const generateTokens = (
    payload: Record<string, string | string[]>
): string => jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '1d' });

export const normalizePaddleSubscription = (paddleEvent: any) => {
    const data = paddleEvent?.data ?? {};

    const lineItem =
        data?.items?.[0];

    const product =
        lineItem?.product?.name ??
        lineItem?.price?.name ??
        'ADVANCED';

    const billingPeriod =
        data?.billingPeriod ?? data?.currentBillingPeriod ?? {};

    const startsAt =
        billingPeriod?.startsAt ??
        data?.startedAt ??
        null;

    const endsAt =
        billingPeriod?.endsAt ??
        data?.nextBilledAt ??
        null;

    const canceledAt =
        data?.canceledAt ??
        null;

    const status = mapPaddleStatus(
        data?.status ?? paddleEvent?.eventType
    );
    console.log("Normalized subscription data from Paddle webhook:===>", data.items?.[0])
    return {
        product: product?.toUpperCase(),
        currency: data?.currencyCode ?? 'USD',
        amount: Number(lineItem?.price?.unitPrice?.amount ?? 0),
        status,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        canceledAt: canceledAt ? new Date(canceledAt) : null,
        trialStart: null,
        trialEnd: null,
        billingCycle: lineItem?.price?.billingCycle ?? null,
        collectionMode: data?.collectionMode ?? null,
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

const getPlanFeatures = (planKey?: string) => {
    const starterPlan = PLAN_FEATURES.find(plan => plan.name.toLowerCase() === 'starter');
    const proPlan = PLAN_FEATURES.find(plan => plan.name.toLowerCase() === 'pro');
    const advancedPlan = PLAN_FEATURES.find(plan => plan.name.toLowerCase() === 'advanced');

    switch (planKey?.toUpperCase()) {
        case 'STARTER':
            return starterPlan?.features ?? [];
        case 'PRO':
            return [...(proPlan?.subtitle ? [proPlan?.subtitle] : []), ...(proPlan?.features ?? [])];
        case 'ADVANCED':
            return [...(advancedPlan?.subtitle ? [advancedPlan?.subtitle] : []), ...(advancedPlan?.features ?? [])];
        default:
            return [];
    }
};

export const mapProductToClientResponse = (product: any, interval: string = "year") => {
    const planKey = PLAN_NAME_MAP[product.customData?.plan?.toLowerCase()] || PLAN_NAME_MAP[product.name?.toLowerCase()];
    const selectedPrice = (product.prices || []).find((price: any) => price.billingCycle?.interval === interval);
    if (!selectedPrice) return null;

    return {
        id: product.id,
        name: product.name,
        type: product.type,
        description: product.description,
        taxCategory: product.taxCategory,
        imageUrl: product.imageUrl,
        customData: product.customData,
        status: product.status,
        billingInterval: interval,
        prices: [selectedPrice],
        features: getPlanFeatures(planKey),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,

    };
};
