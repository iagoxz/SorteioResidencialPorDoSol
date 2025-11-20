import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const PORT = parseInt(env.PORT);

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`📝 Ambiente: ${env.NODE_ENV}`);
  logger.info(`🔗 http://localhost:${PORT}/health`);
});
