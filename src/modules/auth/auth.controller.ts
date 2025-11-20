import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema } from './auth.validator';
import { logger } from '../../utils/logger';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const input = registerSchema.parse(req.body);
      const result = await authService.register(input);

      logger.info({ userId: result.user.id }, 'Usuário registrado');

      return res.status(201).json({
        message: 'Usuário criado com sucesso',
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        logger.error({ errors: error.errors }, 'Erro de validação');
        return res.status(400).json({ 
          error: 'Erro de validação',
          details: error.errors 
        });
      }
      if (error instanceof Error) {
        logger.error({ error: error.message }, 'Erro ao registrar usuário');
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const input = loginSchema.parse(req.body);
      const result = await authService.login(input);

      logger.info({ userId: result.user.id }, 'Login realizado');

      return res.status(200).json({
        message: 'Login realizado com sucesso',
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        logger.error({ errors: error.errors }, 'Erro de validação');
        return res.status(400).json({ 
          error: 'Erro de validação',
          details: error.errors 
        });
      }
      if (error instanceof Error) {
        logger.error({ error: error.message }, 'Erro ao fazer login');
        return res.status(401).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno' });
    }
  }
}
