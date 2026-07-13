import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/AppError';

export interface AuthTokenPayload {
  id: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

/**
 * Exige um Bearer Token JWT válido no header Authorization.
 * Usado em todas as rotas de Carros e Reservas.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('token de autenticação não informado');
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token) {
    throw new UnauthorizedError('token de autenticação não informado');
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    throw new UnauthorizedError('token inválido ou expirado');
  }
}
