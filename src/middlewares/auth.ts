import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface JwtPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ error: 'Token malformatado' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
