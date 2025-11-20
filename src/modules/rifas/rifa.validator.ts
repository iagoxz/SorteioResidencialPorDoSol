import { z } from 'zod';

export const createRifaSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
  preco: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Preço inválido'),
  totalCotas: z.coerce.number().int().positive('Total de cotas deve ser positivo'),
  dataSorteio: z.string().datetime('Data inválida'),
  sorteioTipo: z.enum(['federal', 'manual', 'algoritmo']).default('manual'),
});

export const reservarCotaSchema = z.object({
  rifaId: z.coerce.number().int().positive('ID da rifa inválido'),
  numeroCota: z.coerce.number().int().positive('Número da cota inválido'),
});

export const comprarCotaSchema = z.object({
  rifaId: z.coerce.number().int().positive('ID da rifa inválido'),
  cotaIds: z.array(z.coerce.number().int().positive()).min(1, 'Selecione pelo menos uma cota'),
  metodo: z.enum(['pix', 'cartao']),
});

export type CreateRifaInput = z.infer<typeof createRifaSchema>;
export type ReservarCotaInput = z.infer<typeof reservarCotaSchema>;
export type ComprarCotaInput = z.infer<typeof comprarCotaSchema>;
