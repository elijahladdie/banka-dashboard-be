import { z } from 'zod';

export const assignClientSchema = z.object({
  body: z.object({
    clientId: z.string().uuid('Invalid client ID'),
    advisorId: z.string().uuid('Invalid advisor ID'),
  }),
});
