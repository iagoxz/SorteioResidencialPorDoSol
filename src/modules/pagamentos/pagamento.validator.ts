import { z } from 'zod';

export const checkoutSchema = z.object({
  rifaId: z.number(),
  quantidadeCotas: z.number().min(1, 'Quantidade deve ser pelo menos 1').default(1),
  metodoPagamento: z.enum(['pix', 'cartao']),
  clienteTelefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(20),
  clienteCpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
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
