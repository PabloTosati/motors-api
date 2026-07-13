import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { authMiddleware } from '../../../src/middlewares/authMiddleware';
import { UnauthorizedError } from '../../../src/utils/AppError';
import { env } from '../../../src/config/env';

function buildReq(authorization?: string): Request {
  return { headers: { authorization } } as unknown as Request;
}

describe('authMiddleware', () => {
  const next = jest.fn();

  it('chama next() e popula req.user quando o token é válido', () => {
    const token = jwt.sign({ id: 'user-1', email: 'user@email.com' }, env.jwtSecret);
    const req = buildReq(`Bearer ${token}`);

    authMiddleware(req, {} as Response, next);

    expect(req.user).toEqual({ id: 'user-1', email: 'user@email.com' });
    expect(next).toHaveBeenCalledWith();
  });

  it('lança UnauthorizedError quando não há header Authorization', () => {
    const req = buildReq(undefined);
    expect(() => authMiddleware(req, {} as Response, next)).toThrow(UnauthorizedError);
  });

  it('lança UnauthorizedError quando o header não começa com "Bearer "', () => {
    const req = buildReq('Token abc123');
    expect(() => authMiddleware(req, {} as Response, next)).toThrow(UnauthorizedError);
  });

  it('lança UnauthorizedError quando o token é inválido', () => {
    const req = buildReq('Bearer token-invalido');
    expect(() => authMiddleware(req, {} as Response, next)).toThrow(UnauthorizedError);
  });

  it('lança UnauthorizedError quando o token está expirado', () => {
    const token = jwt.sign({ id: 'user-1', email: 'user@email.com' }, env.jwtSecret, {
      expiresIn: -10,
    });
    const req = buildReq(`Bearer ${token}`);
    expect(() => authMiddleware(req, {} as Response, next)).toThrow(UnauthorizedError);
  });
});
