import { z } from 'zod';

export const checkoutSchema = z.object({
  rifaId: z.number(),
  numerosCota: z.array(z.number()).min(1, 'Selecione pelo menos uma cota'),
  metodoPagamento: z.enum(['pix', 'cartao']),
});

export const webhookSchema = z.object({
  action: z.string(),
  api_version: z.string(),
  data: z.object({
    id: z.string(),
  }),
  date_created: z.string(),
  id: z.number(),
  live_mode: z.boolean(),
  type: z.string(),
  user_id: z.string(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type WebhookPayload = z.infer<typeof webhookSchema>;
