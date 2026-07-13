import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app';
import { carsRepository, CarWithAccessories } from '../../src/modules/cars/cars.repository';
import { env } from '../../src/config/env';

jest.mock('../../src/modules/cars/cars.repository');

const mockedCarsRepo = carsRepository as jest.Mocked<typeof carsRepository>;
const app = createApp();

const validToken = jwt.sign({ id: 'u1', email: 'user@email.com' }, env.jwtSecret);

function buildCar(overrides: Partial<CarWithAccessories> = {}): CarWithAccessories {
  return {
    id: 'c0000000-0000-4000-8000-000000000001',
    model: 'GM S10 2.8',
    color: 'White',
    year: 2021,
    value_per_day: '50.00',
    number_of_passengers: 5,
    created_at: new Date(),
    updated_at: new Date(),
    accessories: [],
    ...overrides,
  };
}

const validCarPayload = {
  model: 'GM S10 2.8',
  color: 'White',
  year: '2021',
  value_per_day: 50,
  accessories: [{ description: 'air conditioner' }],
  number_of_passengers: 5,
};

describe('Rotas de Carros - exigem Bearer Token em todas', () => {
  it('GET /api/v1/cars sem token retorna 401', async () => {
    const response = await request(app).get('/api/v1/cars');
    expect(response.status).toBe(401);
  });

  it('POST /api/v1/cars sem token retorna 401', async () => {
    const response = await request(app).post('/api/v1/cars').send(validCarPayload);
    expect(response.status).toBe(401);
  });

  it('rejeita token inválido com 401', async () => {
    const response = await request(app)
      .get('/api/v1/cars')
      .set('Authorization', 'Bearer token-invalido');
    expect(response.status).toBe(401);
  });
});

describe('POST /api/v1/cars', () => {
  it('cria um carro com sucesso (201) quando autenticado', async () => {
    mockedCarsRepo.create.mockResolvedValue(buildCar());

    const response = await request(app)
      .post('/api/v1/cars')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validCarPayload);

    expect(response.status).toBe(201);
    expect(response.body.id).toBe('c0000000-0000-4000-8000-000000000001');
  });

  it('retorna 400 para ano fora do intervalo permitido', async () => {
    const response = await request(app)
      .post('/api/v1/cars')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ ...validCarPayload, year: 1800 });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/v1/cars/:id', () => {
  it('retorna 400 para ID mal formatado', async () => {
    const response = await request(app)
      .get('/api/v1/cars/id-invalido')
      .set('Authorization', `Bearer ${validToken}`);
    expect(response.status).toBe(400);
  });

  it('retorna 404 quando o carro não existe', async () => {
    mockedCarsRepo.findById.mockResolvedValue(undefined);
    const response = await request(app)
      .get('/api/v1/cars/c0000000-0000-4000-8000-000000000099')
      .set('Authorization', `Bearer ${validToken}`);
    expect(response.status).toBe(404);
  });

  it('retorna 200 com o carro quando encontrado', async () => {
    mockedCarsRepo.findById.mockResolvedValue(buildCar());
    const response = await request(app)
      .get('/api/v1/cars/c0000000-0000-4000-8000-000000000001')
      .set('Authorization', `Bearer ${validToken}`);
    expect(response.status).toBe(200);
    expect(response.body.model).toBe('GM S10 2.8');
  });
});

describe('DELETE /api/v1/cars/:id', () => {
  it('retorna 204 ao remover com sucesso', async () => {
    mockedCarsRepo.findById.mockResolvedValue(buildCar());
    mockedCarsRepo.delete.mockResolvedValue(1);

    const response = await request(app)
      .delete('/api/v1/cars/c0000000-0000-4000-8000-000000000001')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(204);
  });
});

describe('PUT /api/v1/cars/:id', () => {
  it('atualiza um carro com sucesso (200)', async () => {
    mockedCarsRepo.findById.mockResolvedValue(buildCar());
    mockedCarsRepo.update.mockResolvedValue(buildCar({ model: 'Novo Modelo' }));

    const response = await request(app)
      .put('/api/v1/cars/c0000000-0000-4000-8000-000000000001')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validCarPayload);

    expect(response.status).toBe(200);
    expect(response.body.model).toBe('Novo Modelo');
  });

  it('retorna 404 ao tentar atualizar um carro inexistente', async () => {
    mockedCarsRepo.findById.mockResolvedValue(undefined);

    const response = await request(app)
      .put('/api/v1/cars/c0000000-0000-4000-8000-000000000099')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validCarPayload);

    expect(response.status).toBe(404);
  });
});

describe('GET /api/v1/cars', () => {
  it('retorna 200 com a lista paginada (chave "car")', async () => {
    mockedCarsRepo.list.mockResolvedValue([buildCar()]);
    mockedCarsRepo.count.mockResolvedValue(1);

    const response = await request(app)
      .get('/api/v1/cars?limit=10&offset=1')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.car).toHaveLength(1);
    expect(response.body).toEqual(
      expect.objectContaining({ total: 1, limit: 10, offset: 1, offsets: 1 }),
    );
  });
});
describe('PATCH /api/v1/cars/:id/accessories', () => {
  it('retorna 200 e alterna o acessório', async () => {
    mockedCarsRepo.findById.mockResolvedValue(buildCar());
    mockedCarsRepo.findAccessoryByDescription.mockResolvedValue(undefined);

    const response = await request(app)
      .patch('/api/v1/cars/c0000000-0000-4000-8000-000000000001/accessories')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ description: 'teto solar' });

    expect(response.status).toBe(200);
    expect(mockedCarsRepo.addAccessory).toHaveBeenCalled();
  });

  it('retorna 400 quando o campo description está ausente', async () => {
    const response = await request(app)
      .patch('/api/v1/cars/c0000000-0000-4000-8000-000000000001/accessories')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(response.status).toBe(400);
  });
});
