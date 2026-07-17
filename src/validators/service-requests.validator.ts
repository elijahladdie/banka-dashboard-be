import { z } from 'zod';

export const createServiceRequestSchema = z.object({
  body: z.object({
    advisorId: z.string().uuid('Invalid advisor ID'),
    serviceType: z.string().min(1, 'Service type is required'),
    description: z.string().min(1, 'Description is required'),
  }),
});

export const updateServiceRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    serviceType: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const respondServiceRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'CANCELLED']),
    advisorResponse: z.string().optional(),
  }),
});

export const linkMeetingSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    meetingId: z.string().uuid('Invalid meeting ID'),
  }),
});

export const scheduleMeetingSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    meetingDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    meetingLink: z.string().optional(),
    description: z.string().optional(),
    starts_at: z.string().optional(),
    ends_at: z.string().optional(),
  }),
});
