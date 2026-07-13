import { Request, Response } from 'express';
import * as authService from './auth.service';
import { loginSchema } from './auth.validation';

export async function loginController(req: Request, res: Response): Promise<void> {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);
  res.status(200).json(result);
}
