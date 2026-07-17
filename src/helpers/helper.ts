import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET, PLAN_NAME_MAP, PLAN_FEATURES } from '../constants/constants';
import { SubscriptionStatus } from '@prisma/client';
import { Price, Product } from '@paddle/paddle-node-sdk';


export const generateTokens = (
    payload: Record<string, string | string[]>
): string => jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '1d' });

export const formatSubscription = (event: Record<string, any>) => {
    const data = event?.data ?? {};

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
    const status = mapEventStatus(
        data?.status ?? event?.eventType
    );
    const trialDates = lineItem?.trialDates ?? lineItem?.trial_dates;

    const trialStart =
        trialDates?.startsAt ??
        trialDates?.starts_at ??
        null;

    const trialEnd =
        trialDates?.endsAt ??
        trialDates?.ends_at ??
        null;
    const canceledAt =
        data?.canceledAt ??
        null;

    return {
        product: product?.toUpperCase(),
        currency: data?.currencyCode ?? 'USD',
        amount: Number(lineItem?.price?.unitPrice?.amount ?? 0),
        status,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        canceledAt: canceledAt ? new Date(canceledAt) : null,
        trialStart: trialStart ? new Date(trialStart) : null,
        trialEnd: trialEnd ? new Date(trialEnd) : null,
        billingCycle: lineItem?.price?.billingCycle ?? null,
        collectionMode: data?.collectionMode ?? null,
    };
}

function mapEventStatus(status?: string): SubscriptionStatus {
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
            return "ACTIVE";
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

export const mapProductToClientResponse = (product: Product, interval: string = "year") => {
    const planKey = PLAN_NAME_MAP[product.customData?.plan?.toLowerCase()] || PLAN_NAME_MAP[product.name?.toLowerCase()];
    const selectedPrice = (product.prices || []).find((price: Price) => price.billingCycle?.interval === interval);
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
