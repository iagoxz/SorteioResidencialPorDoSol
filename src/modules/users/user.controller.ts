import { Request, Response } from 'express';
import { UserService } from './user.service';
import { getUsersSchema } from './user.validator';
import { logger } from '../../utils/logger';

const userService = new UserService();

export class UserController {
  async getUsers(req: Request, res: Response) {
    try {
      const input = getUsersSchema.parse(req.query);
      const users = await userService.getUsers(input);

      return res.status(200).json({
        message: 'Usuários listados com sucesso',
        data: users,
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ error: error.message }, 'Erro ao listar usuários');
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      return res.status(200).json({
        message: 'Usuário encontrado',
        data: user,
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ error: error.message }, 'Erro ao buscar usuário');
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno' });
    }
  }
}
