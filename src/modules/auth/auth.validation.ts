import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string({ error: 'email é obrigatório' }).email('email inválido'),
  password: z.string({ error: 'password é obrigatório' }).min(1, 'password é obrigatório'),
});

export type LoginDTO = z.infer<typeof loginSchema>;
