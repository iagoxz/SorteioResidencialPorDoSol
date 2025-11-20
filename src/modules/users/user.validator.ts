import { z } from 'zod';

export const getUsersSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
});

export type GetUsersInput = z.infer<typeof getUsersSchema>;
