import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { PagamentoService } from './pagamento.service';
import { checkoutSchema, webhookSchema } from './pagamento.validator';
import { logger } from '../../utils/logger';

const pagamentoService = new PagamentoService();

export class PagamentoController {
  /**
   * POST /api/pagamentos/checkout
   * Cria checkout PIX (não requer autenticação)
   */
  async checkout(req: Request, res: Response) {
    try {
      const input = checkoutSchema.parse(req.body);
      const userId = req.user?.userId; // Opcional - pode ser undefined para clientes

      const resultado = await pagamentoService.criarCheckout(input, userId);

      logger.info({ pagamentoId: resultado.pagamentoId }, 'Checkout criado');

      return res.status(201).json({
        message: 'Checkout criado com sucesso',
        data: resultado,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Erro de validação',
          details: error.errors,
        });
      }
      if (error instanceof Error) {
        logger.error({ error: error.message, stack: error.stack }, 'Erro ao criar checkout');
        return res.status(400).json({ error: error.message });
      }
      logger.error({ error: JSON.stringify(error) }, 'Erro desconhecido ao criar checkout');
      return res.status(500).json({ error: 'Erro interno', details: JSON.stringify(error) });
    }
  }

  /**
   * POST /api/pagamentos/webhook
   * Recebe notificações do Mercado Pago
   */
  async webhook(req: Request, res: Response) {
    try {
      logger.info({ body: req.body }, 'Webhook recebido do Mercado Pago');

      const payload = webhookSchema.parse(req.body);

      // Processar apenas eventos de pagamento
      if (payload.type === 'payment') {
        await pagamentoService.processarWebhook(payload.data.id);
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      logger.error({ error }, 'Erro ao processar webhook');
      return res.status(200).json({ received: true }); // Sempre retornar 200 para MP
    }
  }

  /**
   * GET /api/pagamentos/:id
   * Busca status de um pagamento
   */
  async buscarPagamento(req: Request, res: Response) {
    try {
      const pagamentoId = Number(req.params.id);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const pagamento = await pagamentoService.buscarPagamento(pagamentoId, userId);

      return res.status(200).json({ data: pagamento });
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ error: error.message }, 'Erro ao buscar pagamento');
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  /**
   * POST /api/pagamentos/:id/simular-aprovacao
   * Simula aprovação de pagamento (apenas em modo simulação)
   */
  async simularAprovacao(req: Request, res: Response) {
    try {
      const pagamentoId = Number(req.params.id);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (process.env.MP_SIMULATE !== 'true') {
        return res.status(403).json({ error: 'Endpoint disponível apenas em modo simulação' });
      }

      await pagamentoService.simularAprovacao(pagamentoId, userId);

      return res.status(200).json({ message: 'Pagamento aprovado com sucesso' });
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ error: error.message }, 'Erro ao simular aprovação');
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno' });
    }
  }
}
