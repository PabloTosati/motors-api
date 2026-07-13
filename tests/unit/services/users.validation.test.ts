import { createUserSchema, updateUserSchema } from '../../../src/modules/users/users.validation';

const validPayload = {
  name: 'Joãozinho Ciclano',
  cpf: '131.147.860-49',
  birth: '03/03/2000',
  email: 'joazinho@email.com',
  password: '123456',
  cep: '01001000',
  qualified: 'yes',
};

describe('createUserSchema', () => {
  it('aceita o payload de exemplo do desafio', () => {
    expect(createUserSchema.safeParse(validPayload).success).toBe(true);
  });

  it('rejeita CPF inválido', () => {
    expect(createUserSchema.safeParse({ ...validPayload, cpf: '111.111.111-11' }).success).toBe(
      false,
    );
  });

  it('rejeita e-mail com formato inválido', () => {
    expect(createUserSchema.safeParse({ ...validPayload, email: 'não-é-email' }).success).toBe(
      false,
    );
  });

  it('rejeita senha com menos de 6 caracteres', () => {
    expect(createUserSchema.safeParse({ ...validPayload, password: '123' }).success).toBe(false);
  });

  it('rejeita usuário menor de 18 anos', () => {
    const result = createUserSchema.safeParse({ ...validPayload, birth: '01/01/2015' });
    expect(result.success).toBe(false);
  });

  it('rejeita "qualified" com valor diferente de yes/no', () => {
    expect(createUserSchema.safeParse({ ...validPayload, qualified: 'sim' }).success).toBe(false);
  });

  it('rejeita data de nascimento em formato inválido', () => {
    expect(createUserSchema.safeParse({ ...validPayload, birth: '2000-03-03' }).success).toBe(
      false,
    );
  });

  it('rejeita data de nascimento inexistente no calendário', () => {
    expect(createUserSchema.safeParse({ ...validPayload, birth: '31/02/2000' }).success).toBe(
      false,
    );
  });
});

describe('updateUserSchema', () => {
  it('aceita atualização parcial de um único campo', () => {
    expect(updateUserSchema.safeParse({ name: 'Novo Nome' }).success).toBe(true);
  });

  it('ainda valida idade mínima quando "birth" é enviado', () => {
    expect(updateUserSchema.safeParse({ birth: '01/01/2020' }).success).toBe(false);
  });

  it('aceita objeto vazio', () => {
    expect(updateUserSchema.safeParse({}).success).toBe(true);
  });
});
