import { createClient } from 'redis';
import { env } from './env';
import { logger } from '../utils/logger';

const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (err) => {
  logger.error({ error: err.message }, 'Erro no Redis');
});

redisClient.on('connect', () => {
  logger.info('✅ Redis conectado');
});

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export { redisClient };
