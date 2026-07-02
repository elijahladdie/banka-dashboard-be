import { z } from 'zod';

export const createGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    targetAmount: z.number().positive().optional().nullable(),
    targetDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date').optional().nullable(),
  }),
});

export const updateGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    targetAmount: z.number().positive().optional().nullable(),
    targetDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date').optional().nullable(),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']).optional(),
  }),
});

export const updateGoalProgressSchema = z.object({
  body: z.object({
    currentAmount: z.number().min(0, 'Current amount must be non-negative'),
  }),
});
