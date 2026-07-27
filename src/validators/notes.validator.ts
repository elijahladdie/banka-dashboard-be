import { z } from 'zod';

export const createNoteSchema = z.object({
  body: z.object({
    clientId: z.string().uuid('Invalid client ID'),
    title: z.string().min(1, 'Title is required').max(255),
    content: z.string().min(1, 'Content is required'),
    noteType: z.enum(['CLIENT', 'SESSION']).optional().default('SESSION'),
  }),
});

export const updateNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid note ID'),
  }),
  body: z.object({
    clientId: z.string().uuid().optional(),
    title: z.string().min(1).max(255).optional(),
    content: z.string().min(1).optional(),
    noteType: z.enum(['CLIENT', 'SESSION']).optional(),
  }),
});
