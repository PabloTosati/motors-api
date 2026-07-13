import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../../src/app';
import { usersRepository } from '../../src/modules/users/users.repository';

jest.mock('../../src/modules/users/users.repository');

const mockedUsersRepo = usersRepository as jest.Mocked<typeof usersRepository>;
const app = createApp();

describe('POST /api/v1/auth/login', () => {
  it('retorna 200 e um token quando as credenciais são válidas', async () => {
    const hashedPassword = await bcrypt.hash('123456', 10);
    mockedUsersRepo.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'joazinho@email.com',
      password: hashedPassword,
    } as never);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'joazinho@email.com', password: '123456' });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
  });

  it('retorna 400 quando as credenciais são inválidas', async () => {
    mockedUsersRepo.findByEmail.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'inexistente@email.com', password: '123456' });

    expect(response.status).toBe(400);
  });

  it('retorna 400 (erro de validação) quando faltam campos obrigatórios', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({ email: '' });
    expect(response.status).toBe(400);
  });
});
