import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof ZodError) {
    logger.error({ error: error.errors }, 'Erro de validação');
    return res.status(400).json({
      error: 'Erro de validação',
      details: error.errors,
    });
  }

  logger.error({ error: error.message, stack: error.stack }, 'Erro não tratado');

  return res.status(500).json({
    error: 'Erro interno do servidor',
  });
};
