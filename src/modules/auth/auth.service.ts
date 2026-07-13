import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findUserByEmailInternal } from '../users/users.service';
import { env } from '../../config/env';
import { BadRequestError } from '../../utils/AppError';
import { LoginDTO } from './auth.validation';

export interface LoginResult {
  token: string;
}

export async function login({ email, password }: LoginDTO): Promise<LoginResult> {
  const user = await findUserByEmailInternal(email);

  if (!user) {
    throw new BadRequestError('credenciais inválidas');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new BadRequestError('credenciais inválidas');
  }

  const token = jwt.sign({ id: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);

  return { token };
}
