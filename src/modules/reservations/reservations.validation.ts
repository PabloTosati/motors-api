import { z } from 'zod';
import { parseBrDate } from '../../utils/dateUtils';

const brDateSchema = z.string({ error: 'data é obrigatória' }).transform((value, ctx) => {
  const parsed = parseBrDate(value);
  if (!parsed) {
    ctx.addIssue({ code: 'custom', message: 'data inválida, utilize o formato dd/MM/yyyy' });
    return z.NEVER;
  }
  return parsed;
});

const baseReservationObject = z.object({
  start_date: brDateSchema,
  end_date: brDateSchema,
  id_car: z.string({ error: 'id_car é obrigatório' }).min(1, 'id_car é obrigatório'),
});

function checkDateOrder(data: { start_date: Date; end_date: Date }, ctx: z.RefinementCtx) {
  if (data.end_date < data.start_date) {
    ctx.addIssue({
      code: 'custom',
      message: 'end_date deve ser igual ou posterior a start_date',
      path: ['end_date'],
    });
  }
}

export const createReservationSchema = baseReservationObject.superRefine(checkDateOrder);

export const updateReservationSchema = baseReservationObject.partial().superRefine((data, ctx) => {
  if (data.start_date && data.end_date) {
    checkDateOrder({ start_date: data.start_date, end_date: data.end_date }, ctx);
  }
});

export type CreateReservationDTO = z.infer<typeof createReservationSchema>;
export type UpdateReservationDTO = z.infer<typeof updateReservationSchema>;
