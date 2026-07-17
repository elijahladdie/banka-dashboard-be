import { z } from 'zod';

export const createNoteSchema = z.object({
  body: z.object({
    advisorId: z.string().uuid('Invalid advisor ID'),
    clientId: z.string().uuid('Invalid client ID'),
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
  }),
});

export const updateNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
  }),
});
