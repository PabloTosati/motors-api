import { z } from 'zod';

const accessorySchema = z.object({
  description: z.string({ error: 'description é obrigatório' }).min(1, 'description é obrigatório'),
});

const baseCarObject = z.object({
  model: z.string({ error: 'model é obrigatório' }).min(1, 'model é obrigatório'),
  color: z.string({ error: 'color é obrigatório' }).min(1, 'color é obrigatório'),
  // O desafio mostra "year" como string no payload de exemplo ("2021"), mas a
  // regra de negócio exige comparação numérica (1950-2023) — por isso aceitamos
  // string ou number e convertemos.
  year: z.coerce
    .number({ error: 'year é obrigatório' })
    .int('year deve ser um número inteiro')
    .min(1950, 'year deve estar entre 1950 e 2023')
    .max(2023, 'year deve estar entre 1950 e 2023'),
  value_per_day: z.coerce
    .number({ error: 'value_per_day é obrigatório' })
    .positive('value_per_day deve ser maior que zero'),
  accessories: z
    .array(accessorySchema, { error: 'accessories é obrigatório' })
    .min(1, 'deve existir pelo menos um acessório'),
  number_of_passengers: z.coerce
    .number({ error: 'number_of_passengers é obrigatório' })
    .int('number_of_passengers deve ser um número inteiro')
    .positive('number_of_passengers deve ser maior que zero'),
});

function checkNoDuplicateAccessories(
  data: { accessories: { description: string }[] },
  ctx: z.RefinementCtx,
) {
  const descriptions = data.accessories.map((a) => a.description.trim().toLowerCase());
  const hasDuplicates = new Set(descriptions).size !== descriptions.length;

  if (hasDuplicates) {
    ctx.addIssue({
      code: 'custom',
      message: 'não pode haver acessórios repetidos',
      path: ['accessories'],
    });
  }
}

export const createCarSchema = baseCarObject.superRefine(checkNoDuplicateAccessories);

export const updateCarSchema = baseCarObject.partial().superRefine((data, ctx) => {
  if (data.accessories) {
    checkNoDuplicateAccessories(
      { accessories: data.accessories as { description: string }[] },
      ctx,
    );
  }
});

export const updateAccessorySchema = z.object({
  description: z.string({ error: 'description é obrigatório' }).min(1, 'description é obrigatório'),
});

export type CreateCarDTO = z.infer<typeof createCarSchema>;
export type UpdateCarDTO = z.infer<typeof updateCarSchema>;
export type UpdateAccessoryDTO = z.infer<typeof updateAccessorySchema>;
