import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import * as usuariosSchema from './schema/users';
import * as rifasSchema from './schema/rifas';

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, {
  schema: { ...usuariosSchema, ...rifasSchema },
});
