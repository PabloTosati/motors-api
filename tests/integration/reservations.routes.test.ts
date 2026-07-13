import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app';
import {
  reservationsRepository,
  ReservationRow,
} from '../../src/modules/reservations/reservations.repository';
import { usersRepository, UserRow } from '../../src/modules/users/users.repository';
import { carsRepository, CarWithAccessories } from '../../src/modules/cars/cars.repository';
import { env } from '../../src/config/env';

jest.mock('../../src/modules/reservations/reservations.repository');
jest.mock('../../src/modules/users/users.repository');
jest.mock('../../src/modules/cars/cars.repository');

const mockedReservationsRepo = reservationsRepository as jest.Mocked<typeof reservationsRepository>;
const mockedUsersRepo = usersRepository as jest.Mocked<typeof usersRepository>;
const mockedCarsRepo = carsRepository as jest.Mocked<typeof carsRepository>;
const app = createApp();

const USER_ID = 'a1000000-0000-4000-8000-000000000001';
const CAR_ID = 'c0000000-0000-4000-8000-000000000001';
const token = jwt.sign({ id: USER_ID, email: 'user@email.com' }, env.jwtSecret);

function buildUser(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: USER_ID,
    name: 'Joãozinho',
    cpf: '13114786049',
    birth: new Date('2000-01-01'),
    email: 'joazinho@email.com',
    password: 'hash',
    cep: '01001000',
    logradouro: null,
    complemento: null,
    bairro: null,
    localidade: null,
    uf: null,
    qualified: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function buildCar(overrides: Partial<CarWithAccessories> = {}): CarWithAccessories {
  return {
    id: CAR_ID,
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

function buildReservation(overrides: Partial<ReservationRow> = {}): ReservationRow {
  return {
    id: 'b0000000-0000-4000-8000-000000000001',
    user_id: USER_ID,
    car_id: CAR_ID,
    start_date: new Date('2023-04-20'),
    end_date: new Date('2023-04-30'),
    final_value: '500.00',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

const validPayload = {
  start_date: '20/04/2023',
  end_date: '30/04/2023',
  id_car: CAR_ID,
};

describe('Rotas de Reservas', () => {
  it('POST sem token retorna 401', async () => {
    const response = await request(app).post('/api/v1/reservations').send(validPayload);
    expect(response.status).toBe(401);
  });

  it('POST cria a reserva com sucesso (201) e final_value no formato "500,00"', async () => {
    mockedUsersRepo.findById.mockResolvedValue(buildUser());
    mockedCarsRepo.findById.mockResolvedValue(buildCar());
    mockedReservationsRepo.findOverlappingByCar.mockResolvedValue(undefined);
    mockedReservationsRepo.findOverlappingByUser.mockResolvedValue(undefined);
    mockedReservationsRepo.create.mockResolvedValue(buildReservation());

    const response = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body.final_value).toBe('500,00');
    expect(response.body.id_user).toBe(USER_ID);
    // O corpo da requisição não envia id_user — ele deve vir do token.
    expect(response.body).not.toHaveProperty('user_id');
  });

  it('POST retorna 400 quando o usuário não está habilitado', async () => {
    mockedUsersRepo.findById.mockResolvedValue(buildUser({ qualified: false }));

    const response = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(response.status).toBe(400);
  });

  it('POST retorna 400 quando já existe reserva sobreposta para o carro', async () => {
    mockedUsersRepo.findById.mockResolvedValue(buildUser());
    mockedCarsRepo.findById.mockResolvedValue(buildCar());
    mockedReservationsRepo.findOverlappingByCar.mockResolvedValue(buildReservation());

    const response = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(response.status).toBe(400);
  });

  it('GET /reservations retorna 200 com a lista paginada', async () => {
    mockedReservationsRepo.list.mockResolvedValue([buildReservation()]);
    mockedReservationsRepo.count.mockResolvedValue(1);

    const response = await request(app)
      .get('/api/v1/reservations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.reserves).toHaveLength(1);
    expect(response.body.total).toBe(1);
  });

  it('DELETE retorna 204 ao remover com sucesso', async () => {
    mockedReservationsRepo.findById.mockResolvedValue(buildReservation());
    mockedReservationsRepo.delete.mockResolvedValue(1);

    const response = await request(app)
      .delete(`/api/v1/reservations/${buildReservation().id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('PUT atualiza a reserva com sucesso (200)', async () => {
    const existing = buildReservation();
    mockedReservationsRepo.findById.mockResolvedValue(existing);
    mockedCarsRepo.findById.mockResolvedValue(buildCar());
    mockedReservationsRepo.findOverlappingByCar.mockResolvedValue(undefined);
    mockedReservationsRepo.findOverlappingByUser.mockResolvedValue(undefined);
    mockedReservationsRepo.update.mockResolvedValue(
      buildReservation({ end_date: new Date('2023-05-05'), final_value: '750.00' }),
    );

    const response = await request(app)
      .put(`/api/v1/reservations/${existing.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ end_date: '05/05/2023' });

    expect(response.status).toBe(200);
    expect(response.body.final_value).toBe('750,00');
  });

  it('GET por ID retorna 400 para ID mal formatado', async () => {
    const response = await request(app)
      .get('/api/v1/reservations/id-invalido')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('GET por ID retorna 404 quando a reserva não existe', async () => {
    mockedReservationsRepo.findById.mockResolvedValue(undefined);

    const response = await request(app)
      .get('/api/v1/reservations/b0000000-0000-4000-8000-000000000099')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
