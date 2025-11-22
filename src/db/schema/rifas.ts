import { pgTable, serial, uuid, varchar, text, numeric, integer, timestamp } from 'drizzle-orm/pg-core';
import { usuarios } from './users';

export const rifas = pgTable('rifas', {
  id: serial('id').primaryKey(),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  descricao: text('descricao'),
  precoCota: numeric('preco_cota', { precision: 10, scale: 2 }).notNull(),
  totalCotas: integer('total_cotas').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('ativa'), // ativa, pausada, encerrada
  dataInicio: timestamp('data_inicio').notNull().defaultNow(),
  dataFim: timestamp('data_fim').notNull(),
  sorteioTipo: varchar('sorteio_tipo', { length: 50 }).notNull().default('manual'), // federal, manual, algoritmo
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cotas = pgTable('cotas', {
  id: serial('id').primaryKey(),
  rifaId: integer('rifa_id').notNull().references(() => rifas.id),
  numero: integer('numero').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('disponivel'), // disponivel, reservada, paga
  usuarioId: uuid('usuario_id').references(() => usuarios.id), // Opcional - apenas se for usuário logado (admin)
  clienteTelefone: varchar('cliente_telefone', { length: 20 }), // Para clientes sem login
  clienteCpf: varchar('cliente_cpf', { length: 14 }), // Para clientes sem login
  reservaExpiraEm: timestamp('reserva_expira_em'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pagamentos = pgTable('pagamentos', {
  id: serial('id').primaryKey(),
  usuarioId: uuid('usuario_id').references(() => usuarios.id), // Opcional - apenas se for usuário logado
  clienteTelefone: varchar('cliente_telefone', { length: 20 }), // Para clientes sem login
  clienteCpf: varchar('cliente_cpf', { length: 14 }), // Para clientes sem login
  rifaId: integer('rifa_id').notNull().references(() => rifas.id),
  valor: numeric('valor', { precision: 10, scale: 2 }).notNull(),
  metodo: varchar('metodo', { length: 50 }).notNull(), // pix, cartao
  status: varchar('status', { length: 50 }).notNull().default('pendente'), // pendente, pago, cancelado, expirado
  
  // Mercado Pago
  mpPaymentId: varchar('mp_payment_id', { length: 255 }), // ID do pagamento no MP
  qrCode: text('qr_code'), // QR Code em base64
  qrCodeUrl: varchar('qr_code_url', { length: 500 }), // URL da imagem do QR
  pixPayload: text('pix_payload'), // Código "copiar e colar"
  
  transacaoId: varchar('transacao_id', { length: 255 }),
  expiraEm: timestamp('expira_em'), // Expiração do pagamento PIX
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cupons = pgTable('cupons', {
  id: serial('id').primaryKey(),
  pagamentoId: integer('pagamento_id').notNull().references(() => pagamentos.id),
  cotaId: integer('cota_id').notNull().references(() => cotas.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sorteios = pgTable('sorteios', {
  id: serial('id').primaryKey(),
  rifaId: integer('rifa_id').notNull().references(() => rifas.id),
  numeroGanhador: integer('numero_ganhador').notNull(),
  metodo: varchar('metodo', { length: 50 }).notNull(), // federal, manual
  referencia: varchar('referencia', { length: 255 }), // ex: código da loteria
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
