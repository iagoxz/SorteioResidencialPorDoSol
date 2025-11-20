import { Router } from 'express';
import { UserController } from './user.controller';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();
const userController = new UserController();

router.get('/', authMiddleware, (req, res) => userController.getUsers(req, res));
router.get('/:id', authMiddleware, (req, res) => userController.getUserById(req, res));

export default router;
