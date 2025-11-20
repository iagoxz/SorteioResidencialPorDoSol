import express from 'express';
import { errorHandler } from './middlewares/error-handler';
import { logger } from './utils/logger';

// Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import rifaRoutes from './modules/rifas/rifa.routes';

export const app = express();

// Middlewares
app.use(express.json());

// Log de requisições
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Requisição recebida');
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rifas', rifaRoutes);

// Error handler (deve ser o último middleware)
app.use(errorHandler);
