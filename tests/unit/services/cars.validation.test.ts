import { createCarSchema, updateCarSchema } from '../../../src/modules/cars/cars.validation';

const validPayload = {
  model: 'GM S10 2.8',
  color: 'White',
  year: '2021',
  value_per_day: 50,
  accessories: [{ description: 'air conditioner' }, { description: '4x4 traction' }],
  number_of_passengers: 5,
};

describe('createCarSchema', () => {
  it('aceita o payload de exemplo do desafio (year como string)', () => {
    const result = createCarSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe(2021);
    }
  });

  it('rejeita ano fora do intervalo 1950-2023', () => {
    expect(createCarSchema.safeParse({ ...validPayload, year: 1800 }).success).toBe(false);
    expect(createCarSchema.safeParse({ ...validPayload, year: 2024 }).success).toBe(false);
  });

  it('aceita os limites exatos do intervalo (1950 e 2023)', () => {
    expect(createCarSchema.safeParse({ ...validPayload, year: 1950 }).success).toBe(true);
    expect(createCarSchema.safeParse({ ...validPayload, year: 2023 }).success).toBe(true);
  });

  it('rejeita quando não há nenhum acessório', () => {
    const result = createCarSchema.safeParse({ ...validPayload, accessories: [] });
    expect(result.success).toBe(false);
  });

  it('rejeita acessórios duplicados (comparação case-insensitive)', () => {
    const result = createCarSchema.safeParse({
      ...validPayload,
      accessories: [{ description: 'Ar Condicionado' }, { description: 'ar condicionado' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejeita quando falta um campo obrigatório', () => {
    const { model, ...rest } = validPayload;
    void model;
    expect(createCarSchema.safeParse(rest).success).toBe(false);
  });

  it('rejeita value_per_day não positivo', () => {
    expect(createCarSchema.safeParse({ ...validPayload, value_per_day: 0 }).success).toBe(false);
    expect(createCarSchema.safeParse({ ...validPayload, value_per_day: -5 }).success).toBe(false);
  });
});

describe('updateCarSchema', () => {
  it('aceita atualização parcial (apenas um campo)', () => {
    expect(updateCarSchema.safeParse({ color: 'Black' }).success).toBe(true);
  });

  it('ainda valida duplicidade de acessórios quando eles são enviados', () => {
    const result = updateCarSchema.safeParse({
      accessories: [{ description: 'x' }, { description: 'X' }],
    });
    expect(result.success).toBe(false);
  });

  it('aceita objeto vazio (nenhum campo alterado)', () => {
    expect(updateCarSchema.safeParse({}).success).toBe(true);
  });
});
