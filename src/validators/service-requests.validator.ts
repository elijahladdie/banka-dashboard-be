import { z } from 'zod';

export const createServiceRequestSchema = z.object({
  body: z.object({
    advisorId: z.string().uuid('Invalid advisor ID'),
    serviceType: z.string().min(1, 'Service type is required'),
    description: z.string().min(1, 'Description is required'),
  }),
});

export const updateServiceRequestSchema = z.object({
  body: z.object({
    serviceType: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const respondServiceRequestSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED']),
    advisorResponse: z.string().optional(),
  }),
});

export const linkMeetingSchema = z.object({
  body: z.object({
    meetingId: z.string().uuid('Invalid meeting ID'),
  }),
});
