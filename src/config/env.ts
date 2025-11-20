import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Erro nas variáveis de ambiente:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
