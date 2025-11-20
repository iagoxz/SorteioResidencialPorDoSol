import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 255 }).notNull(),
  cpf: varchar('cpf', { length: 14 }),
  telefone: varchar('telefone', { length: 20 }),
  email: varchar('email', { length: 255 }).unique(),
  password: varchar('password', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('cliente'), // admin, cliente
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
