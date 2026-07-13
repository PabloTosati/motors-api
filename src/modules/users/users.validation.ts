import { z } from 'zod';
import { parseBrDate, calculateAge } from '../../utils/dateUtils';
import { isValidCpf } from '../../utils/cpf';

const brDateSchema = z.string({ error: 'birth é obrigatório' }).transform((value, ctx) => {
  const parsed = parseBrDate(value);
  if (!parsed) {
    ctx.addIssue({ code: 'custom', message: 'birth inválido, utilize o formato dd/MM/yyyy' });
    return z.NEVER;
  }
  return parsed;
});

const baseUserObject = z.object({
  name: z.string({ error: 'name é obrigatório' }).min(1, 'name é obrigatório'),
  cpf: z.string({ error: 'cpf é obrigatório' }).refine(isValidCpf, { message: 'cpf inválido' }),
  birth: brDateSchema,
  email: z.string({ error: 'email é obrigatório' }).email('email inválido'),
  password: z
    .string({ error: 'password é obrigatório' })
    .min(6, 'password deve ter no mínimo 6 caracteres'),
  cep: z
    .string({ error: 'cep é obrigatório' })
    .min(8, 'cep inválido')
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 8, { message: 'cep inválido' }),
  qualified: z.enum(['yes', 'no'], { error: 'qualified deve ser "yes" ou "no"' }),
});

function checkMinimumAge(data: { birth: Date }, ctx: z.RefinementCtx) {
  if (calculateAge(data.birth) < 18) {
    ctx.addIssue({
      code: 'custom',
      message: 'usuário deve possuir pelo menos 18 anos',
      path: ['birth'],
    });
  }
}

export const createUserSchema = baseUserObject.superRefine(checkMinimumAge);

export const updateUserSchema = baseUserObject.partial().superRefine((data, ctx) => {
  if (data.birth) checkMinimumAge({ birth: data.birth }, ctx);
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
