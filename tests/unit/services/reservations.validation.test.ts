import {
  createReservationSchema,
  updateReservationSchema,
} from '../../../src/modules/reservations/reservations.validation';

const validPayload = {
  start_date: '20/04/2023',
  end_date: '30/04/2023',
  id_car: 'c0000000-0000-4000-8000-000000000001',
};

describe('createReservationSchema', () => {
  it('aceita o payload de exemplo do desafio', () => {
    const result = createReservationSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejeita quando end_date é anterior a start_date', () => {
    const result = createReservationSchema.safeParse({
      ...validPayload,
      start_date: '30/04/2023',
      end_date: '20/04/2023',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita quando falta id_car', () => {
    const { id_car, ...rest } = validPayload;
    void id_car;
    expect(createReservationSchema.safeParse(rest).success).toBe(false);
  });

  it('rejeita datas em formato inválido', () => {
    expect(
      createReservationSchema.safeParse({ ...validPayload, start_date: '2023-04-20' }).success,
    ).toBe(false);
  });
});

describe('updateReservationSchema', () => {
  it('aceita atualização parcial (somente id_car)', () => {
    expect(
      updateReservationSchema.safeParse({ id_car: 'c0000000-0000-4000-8000-000000000002' }).success,
    ).toBe(true);
  });

  it('rejeita quando start_date/end_date juntos ficam fora de ordem', () => {
    expect(
      updateReservationSchema.safeParse({ start_date: '30/04/2023', end_date: '20/04/2023' })
        .success,
    ).toBe(false);
  });
});
