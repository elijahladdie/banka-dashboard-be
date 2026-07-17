export type SubscriptionAccessState = 'A' | 'B' | 'C' | 'D';

export interface SubscriptionAccessInfo {
    state: SubscriptionAccessState;
    canWrite: boolean;
    canViewData: boolean;
    isLocked: boolean;
    readOnlyUntil: Date | null;
    effectiveEnd: Date | null;
}

export function computeReadOnlyUntil(date: Date): Date {
    return new Date(Date.UTC(date?.getUTCFullYear(), date?.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

export function getSubscriptionAccessState(params: {
    status: string;
    cancelAtPeriodEnd: boolean;
    endsAt: Date | null;
    trialEnd: Date | null;
}): SubscriptionAccessInfo {
    const { status, cancelAtPeriodEnd, endsAt, trialEnd } = params;
    const now = new Date();
    const effectiveEnd = status === 'TRIALING' ? trialEnd : endsAt;
    const effectiveEndTime = effectiveEnd ? effectiveEnd.getTime() : null;

    if (status === 'ACTIVE' && !cancelAtPeriodEnd) {
        return { state: 'A', canWrite: true, canViewData: true, isLocked: false, readOnlyUntil: null, effectiveEnd };
    }

    if (status === 'TRIALING') {
        if (effectiveEndTime && now.getTime() < effectiveEndTime) {
            return { state: 'A', canWrite: true, canViewData: true, isLocked: false, readOnlyUntil: null, effectiveEnd };
        }
        return { state: 'C', canWrite: false, canViewData: true, isLocked: false, readOnlyUntil: computeReadOnlyUntil(effectiveEnd!), effectiveEnd };
    }

    if (status === 'ACTIVE' && cancelAtPeriodEnd) {
        if (effectiveEndTime && now.getTime() < effectiveEndTime) {
            return { state: 'B', canWrite: true, canViewData: true, isLocked: false, readOnlyUntil: null, effectiveEnd };
        }
        return { state: 'C', canWrite: false, canViewData: true, isLocked: false, readOnlyUntil: computeReadOnlyUntil(effectiveEnd!), effectiveEnd };
    }

    if (status === 'PAST_DUE') {
        return { state: 'B', canWrite: true, canViewData: true, isLocked: false, readOnlyUntil: null, effectiveEnd };
    }

    if (status === 'CANCELED' || status === 'EXPIRED') {
        if (!effectiveEnd) {
            return { state: 'D', canWrite: false, canViewData: false, isLocked: true, readOnlyUntil: null, effectiveEnd: null };
        }

        const readOnlyUntil = computeReadOnlyUntil(effectiveEnd);
        const nowMs = now.getTime();
        const roDeadlineMs = readOnlyUntil.getTime();

        if (nowMs <= roDeadlineMs) {
            return { state: 'C', canWrite: false, canViewData: true, isLocked: false, readOnlyUntil, effectiveEnd };
        } else {
            return { state: 'D', canWrite: false, canViewData: false, isLocked: true, readOnlyUntil, effectiveEnd };
        }
    }

    return { state: 'D', canWrite: false, canViewData: false, isLocked: true, readOnlyUntil: null, effectiveEnd: null };
}

export function isWriteAllowed(params: {
    status: string;
    cancelAtPeriodEnd: boolean;
    endsAt: Date | null;
    trialEnd: Date | null;
}): boolean {
    return getSubscriptionAccessState(params).canWrite;
}

export function getAccessStateBanner(params: {
    state: SubscriptionAccessState;
    endsAt: Date | null;
    readOnlyUntil: Date | null;
    effectiveEnd: Date | null;
}): { messageKey: string; messageArgs: Record<string, string>; type: 'INFO' | 'WARNING' | 'ERROR' } | null {
    const { state, endsAt, readOnlyUntil, effectiveEnd } = params;

    switch (state) {
        case 'A':
            return null;
        case 'B':
            return { messageKey: 'subscription.planEnding', messageArgs: { endsAt: effectiveEnd?.toISOString() ?? endsAt?.toISOString() ?? '' }, type: 'INFO' };
        case 'C':
            return { messageKey: 'subscription.readOnly', messageArgs: { endsAt: effectiveEnd?.toISOString() ?? '', readOnlyUntil: readOnlyUntil?.toISOString() ?? '' }, type: 'WARNING' };
        case 'D':
            return { messageKey: 'subscription.locked', messageArgs: {}, type: 'ERROR' };
        default:
            return null;
    }
}
