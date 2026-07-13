import { z } from 'zod';
import { Request, Response } from 'express';
import { errorHandler } from '../../../src/middlewares/errorHandler';
import { BadRequestError, NotFoundError } from '../../../src/utils/AppError';

function buildRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  it('trata ZodError retornando 400 com a lista de problemas', () => {
    const schema = z.object({ name: z.string().min(1, 'name é obrigatório') });
    const result = schema.safeParse({ name: '' });
    const res = buildRes();

    errorHandler(result.error, {} as Request, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'erro de validação',
        errors: expect.arrayContaining([
          expect.objectContaining({ path: 'name', message: 'name é obrigatório' }),
        ]),
      }),
    );
  });

  it('trata AppError (ex: NotFoundError) com o status code correto', () => {
    const res = buildRes();
    errorHandler(new NotFoundError('carro não encontrado'), {} as Request, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'carro não encontrado' });
  });

  it('inclui "details" no corpo da resposta quando o AppError os fornece', () => {
    const res = buildRes();
    errorHandler(new BadRequestError('inválido', { campo: 'x' }), {} as Request, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({ message: 'inválido', errors: { campo: 'x' } });
  });

  it('trata erros genéricos como 500, sem vazar detalhes internos', () => {
    const res = buildRes();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    errorHandler(new Error('algo quebrou'), {} as Request, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'erro interno do servidor' });
    consoleSpy.mockRestore();
  });
});
