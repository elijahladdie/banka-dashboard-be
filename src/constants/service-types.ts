import { SubscriptionPlan } from '@prisma/client';

/**
 * Maps each serviceType value to the minimum subscription plan tier required.
 * Based on lorem.md section 3 — Service-by-Service Use Cases.
 */
export const SERVICE_TYPE_TIER: Record<string, SubscriptionPlan> = {
  // ── Core Banking (STARTER) ──
  budget_planning: 'STARTER',
  loan_assessment: 'STARTER',
  digital_banking: 'STARTER',

  // ── Goals & Tracking (STARTER) ──
  savings_goals: 'STARTER',
  financial_reports: 'STARTER',
  credit_improvement: 'STARTER',

  // ── Advisor Services (STARTER) ──
  advisor_meeting: 'STARTER',
  general_inquiry: 'STARTER',

  // ── Business (PRO) ──
  cash_flow_analysis: 'PRO',
  business_consulting: 'PRO',
  tax_compliance: 'PRO',

  // ── Investment (ADVANCED) ──
  investment_advisory: 'ADVANCED',
  pitch_deck: 'ADVANCED',
  investor_introductions: 'ADVANCED',
};

/**
 * Tier rank for comparison: STARTER=1, PRO=2, ADVANCED=3
 */
const TIER_RANK: Record<SubscriptionPlan, number> = {
  STARTER: 1,
  PRO: 2,
  ADVANCED: 3,
};

/**
 * Returns true if the user's subscription plan meets or exceeds the minimum
 * tier required for the given service type.
 */
export function isTierSufficient(
  userPlan: SubscriptionPlan,
  serviceType: string,
): boolean {
  const minTier = SERVICE_TYPE_TIER[serviceType];
  if (!minTier) return false; // Unknown service type
  return TIER_RANK[userPlan] >= TIER_RANK[minTier];
}

/**
 * Returns the minimum tier label for a service type, or null if unknown.
 */
export function getMinTierForService(serviceType: string): SubscriptionPlan | null {
  return SERVICE_TYPE_TIER[serviceType] ?? null;
}
