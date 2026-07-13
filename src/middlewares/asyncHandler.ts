import { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Envolve um handler assíncrono para que qualquer rejeição de Promise seja
 * encaminhada ao middleware de erro via next(err), em vez de virar uma
 * "unhandled promise rejection". Mantido explicitamente por clareza e
 * portabilidade, mesmo o Express 5 já reencaminhando rejeições automaticamente.
 */
export function asyncHandler(fn: AsyncRouteHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
