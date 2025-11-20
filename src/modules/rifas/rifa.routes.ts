import { Router } from 'express';
import { RifaController } from './rifa.controller';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();
const rifaController = new RifaController();

router.post('/', authMiddleware, (req, res) => rifaController.createRifa(req, res));
router.get('/', (req, res) => rifaController.getRifas(req, res));
router.get('/:id', (req, res) => rifaController.getRifaById(req, res));
router.get('/:id/cotas', (req, res) => rifaController.getCotasByRifa(req, res));
router.post('/:rifaId/reservar', authMiddleware, (req, res) => rifaController.reservarCota(req, res));
router.post('/:rifaId/comprar', authMiddleware, (req, res) => rifaController.comprarCotas(req, res));

export default router;
