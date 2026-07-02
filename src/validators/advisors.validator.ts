import { z } from 'zod';

export const createAdvisorSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    employeeCode: z.string().min(1, 'Employee code is required'),
    specialization: z.string().optional(),
    bio: z.string().optional(),
    maxClients: z.number().int().positive().optional(),
  }),
});

export const updateAdvisorSchema = z.object({
  body: z.object({
    specialization: z.string().optional(),
    bio: z.string().optional(),
    maxClients: z.number().int().positive().optional(),
    isAvailable: z.boolean().optional(),
  }),
});
