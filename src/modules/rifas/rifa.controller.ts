import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { RifaService } from './rifa.service';
import { createRifaSchema, reservarCotaSchema, comprarCotaSchema } from './rifa.validator';
import { logger } from '../../utils/logger';

const rifaService = new RifaService();

export class RifaController {
  async createRifa(req: Request, res: Response) {
    try {
      const input = createRifaSchema.parse(req.body);
      const role = req.user?.role;

      if (role !== 'admin') {
        return res.status(403).json({ error: 'Apenas admins podem criar rifas' });
      }

      const rifa = await rifaService.createRifa(input);

      logger.info({ rifaId: rifa.id }, 'Rifa criada');

      return res.status(201).json({
        message: 'Rifa criada com sucesso',
        data: rifa,
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ error: error.message }, 'Erro ao criar rifa');
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  async getRifas(req: Request, res: Response) {
    try {
      const rifas = await rifaService.getRifas();

      return res.status(200).json({
        message: 'Rifas listadas com sucesso',
        data: rifas,
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ error: error.message }, 'Erro ao listar rifas');
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  async getRifaById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const rifa = await rifaService.getRifaById(parseInt(id));

      return res.status(200).json({
        message: 'Rifa encontrada',
        data: rifa,
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ error: error.message }, 'Erro ao buscar rifa');
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  async getCotasByRifa(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cotas = await rifaService.getCotasByRifa(parseInt(id));

      return res.status(200).json({
        message: 'Cotas listadas com sucesso',
        data: cotas,
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ error: error.message }, 'Erro ao listar cotas');
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  async reservarCota(req: Request, res: Response) {
    try {
      const rifaId = Number(req.params.rifaId);
      logger.info({ params: req.params, body: req.body, rifaId }, 'Payload recebido para reservar cota');
      
      const input = reservarCotaSchema.parse({ ...req.body, rifaId });
      
      logger.info({ input }, 'Payload validado');
      
      const userId = req.user?.userId;
      
      logger.info({ userId, userRole: req.user?.role, userObject: req.user }, 'Dados do usuário autenticado');

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const cota = await rifaService.reservarCota(input, userId);

      logger.info({ cotaId: cota.id }, 'Cota reservada');

      return res.status(200).json({
        message: 'Cota reservada com sucesso',
        data: cota,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        logger.error({ errors: error.errors }, 'Erro de validação ao reservar');
        return res.status(400).json({ 
          error: 'Erro de validação',
          details: error.errors 
        });
      }
      if (error instanceof Error) {
        logger.error({ error: error.message, stack: error.stack }, 'Erro ao reservar cota');
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  async comprarCotas(req: Request, res: Response) {
    try {
      const rifaId = Number(req.params.rifaId);
      const input = comprarCotaSchema.parse({ ...req.body, rifaId });
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const resultado = await rifaService.comprarCotas(input, userId);

      logger.info({ pagamentoId: resultado.pagamento.id }, 'Cotas compradas');

      return res.status(201).json({
        message: 'Cotas compradas com sucesso',
        data: resultado,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        logger.error({ errors: error.errors }, 'Erro de validação ao comprar');
        return res.status(400).json({ 
          error: 'Erro de validação',
          details: error.errors 
        });
      }
      if (error instanceof Error) {
        logger.error({ error: error.message }, 'Erro ao comprar cotas');
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno' });
    }
  }
}
