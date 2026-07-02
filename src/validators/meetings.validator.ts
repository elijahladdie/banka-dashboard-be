import { z } from 'zod';

export const createMeetingSchema = z.object({
  body: z.object({
    advisorId: z.string().uuid('Invalid advisor ID'),
    clientId: z.string().uuid('Invalid client ID'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    meetingDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    meetingLink: z.string().url().optional().nullable(),
  }),
});

export const updateMeetingSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    meetingDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date').optional(),
    meetingLink: z.string().url().optional().nullable(),
  }),
});

export const updateMeetingStatusSchema = z.object({
  body: z.object({
    status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  }),
});
