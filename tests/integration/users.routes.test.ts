import request from 'supertest';
import { createApp } from '../../src/app';
import { usersRepository, UserRow } from '../../src/modules/users/users.repository';
import { fetchAddressByCep } from '../../src/utils/viaCep';

jest.mock('../../src/modules/users/users.repository');
jest.mock('../../src/utils/viaCep');

const mockedUsersRepo = usersRepository as jest.Mocked<typeof usersRepository>;
const mockedFetchAddress = fetchAddressByCep as jest.MockedFunction<typeof fetchAddressByCep>;
const app = createApp();

function buildUserRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 'a0000000-0000-4000-8000-000000000001',
    name: 'Joãozinho Ciclano',
    cpf: '13114786049',
    birth: new Date('2000-03-03'),
    email: 'joazinho@email.com',
    password: 'hashed',
    cep: '01001000',
    logradouro: 'Praça da Sé',
    complemento: null,
    bairro: 'Sé',
    localidade: 'São Paulo',
    uf: 'SP',
    qualified: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

const validUserPayload = {
  name: 'Joãozinho Ciclano',
  cpf: '131.147.860-49',
  birth: '03/03/2000',
  email: 'joazinho@email.com',
  password: '123456',
  cep: '01001000',
  qualified: 'yes',
};

describe('POST /api/v1/users', () => {
  it('cria um usuário com sucesso (201) e nunca retorna a senha', async () => {
    mockedUsersRepo.findByCpf.mockResolvedValue(undefined);
    mockedUsersRepo.findByEmail.mockResolvedValue(undefined);
    mockedFetchAddress.mockResolvedValue({
      cep: '01001-000',
      logradouro: 'Praça da Sé',
      complemento: '',
      bairro: 'Sé',
      localidade: 'São Paulo',
      uf: 'SP',
    });
    mockedUsersRepo.create.mockResolvedValue(buildUserRow());

    const response = await request(app).post('/api/v1/users').send(validUserPayload);

    expect(response.status).toBe(201);
    expect(response.body).not.toHaveProperty('password');
    expect(response.body.qualified).toBe('yes');
  });

  it('retorna 400 quando o CPF é inválido', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({ ...validUserPayload, cpf: '111.111.111-11' });
    expect(response.status).toBe(400);
  });

  it('retorna 400 quando o CPF já está cadastrado', async () => {
    mockedUsersRepo.findByCpf.mockResolvedValue(buildUserRow());
    const response = await request(app).post('/api/v1/users').send(validUserPayload);
    expect(response.status).toBe(400);
  });

  it('não exige token (rota pública)', async () => {
    mockedUsersRepo.findByCpf.mockResolvedValue(undefined);
    mockedUsersRepo.findByEmail.mockResolvedValue(undefined);
    mockedFetchAddress.mockResolvedValue({
      cep: '01001-000',
      logradouro: '',
      complemento: '',
      bairro: '',
      localidade: '',
      uf: '',
    });
    mockedUsersRepo.create.mockResolvedValue(buildUserRow());

    const response = await request(app).post('/api/v1/users').send(validUserPayload);
    expect(response.status).not.toBe(401);
  });
});

describe('GET /api/v1/users/:id', () => {
  it('retorna 404 quando o usuário não existe', async () => {
    mockedUsersRepo.findById.mockResolvedValue(undefined);
    const response = await request(app).get('/api/v1/users/a0000000-0000-4000-8000-000000000099');
    expect(response.status).toBe(404);
  });

  it('retorna 200 com o usuário quando encontrado', async () => {
    mockedUsersRepo.findById.mockResolvedValue(buildUserRow());
    const response = await request(app).get('/api/v1/users/a0000000-0000-4000-8000-000000000001');
    expect(response.status).toBe(200);
    expect(response.body.email).toBe('joazinho@email.com');
  });
});

describe('PUT /api/v1/users/:id', () => {
  it('atualiza um usuário com sucesso (200), consultando o ViaCEP novamente se o CEP mudar', async () => {
    mockedUsersRepo.findById.mockResolvedValue(buildUserRow());
    mockedFetchAddress.mockResolvedValue({
      cep: '20000-000',
      logradouro: 'Rua Nova',
      complemento: '',
      bairro: 'Centro',
      localidade: 'Rio de Janeiro',
      uf: 'RJ',
    });
    mockedUsersRepo.update.mockResolvedValue(
      buildUserRow({ localidade: 'Rio de Janeiro', uf: 'RJ' }),
    );

    const response = await request(app)
      .put('/api/v1/users/a0000000-0000-4000-8000-000000000001')
      .send({ cep: '20000000' });

    expect(response.status).toBe(200);
    expect(response.body.localidade).toBe('Rio de Janeiro');
  });

  it('retorna 404 ao atualizar um usuário inexistente', async () => {
    mockedUsersRepo.findById.mockResolvedValue(undefined);

    const response = await request(app)
      .put('/api/v1/users/a0000000-0000-4000-8000-000000000099')
      .send({ name: 'Novo Nome' });

    expect(response.status).toBe(404);
  });
});

describe('GET /api/v1/users', () => {
  it('retorna 200 com a lista paginada de usuários', async () => {
    mockedUsersRepo.list.mockResolvedValue([buildUserRow()]);
    mockedUsersRepo.count.mockResolvedValue(1);

    const response = await request(app).get('/api/v1/users');

    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(1);
  });
});
describe('DELETE /api/v1/users/:id', () => {
  it('retorna 204 ao remover com sucesso', async () => {
    mockedUsersRepo.findById.mockResolvedValue(buildUserRow());
    mockedUsersRepo.delete.mockResolvedValue(1);

    const response = await request(app).delete(
      '/api/v1/users/a0000000-0000-4000-8000-000000000001',
    );
    expect(response.status).toBe(204);
  });

  it('retorna 400 para ID mal formatado', async () => {
    const response = await request(app).delete('/api/v1/users/id-invalido');
    expect(response.status).toBe(400);
  });
});
