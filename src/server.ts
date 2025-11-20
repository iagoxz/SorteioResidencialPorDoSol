import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectRedis } from './config/redis';

const PORT = parseInt(env.PORT);

async function startServer() {
  try {
    // Conectar ao Redis
    await connectRedis();
    logger.info('✅ Redis conectado');

    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📝 Ambiente: ${env.NODE_ENV}`);
      logger.info(`🔗 http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao iniciar servidor');
    process.exit(1);
  }
}

startServer();
