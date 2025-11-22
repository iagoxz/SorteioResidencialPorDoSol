import { Router } from 'express';
import { PagamentoController } from './pagamento.controller';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();
const pagamentoController = new PagamentoController();

// Criar checkout PIX (público - não requer autenticação)
router.post('/checkout', (req, res) =>
  pagamentoController.checkout(req, res)
);

// Webhook do Mercado Pago (público)
router.post('/webhook', (req, res) =>
  pagamentoController.webhook(req, res)
);

// Buscar pagamento por ID (requer autenticação)
router.get('/:id', authMiddleware, (req, res) =>
  pagamentoController.buscarPagamento(req, res)
);

// Simular aprovação de pagamento (apenas modo simulação)
router.post('/:id/simular-aprovacao', authMiddleware, (req, res) =>
  pagamentoController.simularAprovacao(req, res)
);

export default router;
