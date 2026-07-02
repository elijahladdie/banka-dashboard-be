import { z } from 'zod';

export const updateSubscriptionSchema = z.object({
  body: z.object({
    plan: z.enum(['STARTER', 'PRO', 'ADVANCED']).optional(),
    status: z.enum(['ACTIVE', 'PAST_DUE', 'TRIALING', 'CANCELED', 'EXPIRED']).optional(),
    billingInterval: z.enum(['month', 'year']).optional(),
    priceId: z.string().optional(),
  }),
});
