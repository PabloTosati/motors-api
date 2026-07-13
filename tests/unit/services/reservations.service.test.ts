import * as reservationsService from '../../../src/modules/reservations/reservations.service';
import {
  reservationsRepository,
  ReservationRow,
} from '../../../src/modules/reservations/reservations.repository';
import { usersRepository, UserRow } from '../../../src/modules/users/users.repository';
import { carsRepository, CarWithAccessories } from '../../../src/modules/cars/cars.repository';
import { BadRequestError, NotFoundError } from '../../../src/utils/AppError';

jest.mock('../../../src/modules/reservations/reservations.repository');
jest.mock('../../../src/modules/users/users.repository');
jest.mock('../../../src/modules/cars/cars.repository');

const mockedReservations = reservationsRepository as jest.Mocked<typeof reservationsRepository>;
const mockedUsers = usersRepository as jest.Mocked<typeof usersRepository>;
const mockedCars = carsRepository as jest.Mocked<typeof carsRepository>;

const QUALIFIED_USER_ID = 'a1000000-0000-4000-8000-000000000001';
const CAR_ID = 'c0000000-0000-4000-8000-000000000001';

function buildUser(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: QUALIFIED_USER_ID,
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
    user_id: QUALIFIED_USER_ID,
    car_id: CAR_ID,
    start_date: new Date('2023-04-20'),
    end_date: new Date('2023-04-30'),
    final_value: '500.00',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

const validInput = {
  start_date: new Date('2023-04-20'),
  end_date: new Date('2023-04-30'),
  id_car: CAR_ID,
};

describe('reservations.service', () => {
  describe('createReservation', () => {
    it('cria a reserva e calcula final_value = value_per_day x dias (exemplo do desafio: 50 x 10 = 500,00)', async () => {
      mockedUsers.findById.mockResolvedValue(buildUser());
      mockedCars.findById.mockResolvedValue(buildCar({ value_per_day: '50.00' }));
      mockedReservations.findOverlappingByCar.mockResolvedValue(undefined);
      mockedReservations.findOverlappingByUser.mockResolvedValue(undefined);
      mockedReservations.create.mockResolvedValue(buildReservation());

      const result = await reservationsService.createReservation(QUALIFIED_USER_ID, validInput);

      expect(mockedReservations.create).toHaveBeenCalledWith(
        expect.objectContaining({ final_value: '500' }),
      );
      expect(result.final_value).toBe('500,00');
      expect(result.id_user).toBe(QUALIFIED_USER_ID);
    });

    it('rejeita quando o usuário não está habilitado (qualified = false)', async () => {
      mockedUsers.findById.mockResolvedValue(buildUser({ qualified: false }));

      await expect(
        reservationsService.createReservation(QUALIFIED_USER_ID, validInput),
      ).rejects.toBeInstanceOf(BadRequestError);
      expect(mockedCars.findById).not.toHaveBeenCalled();
    });

    it('lança NotFoundError quando o usuário do token não existe mais', async () => {
      mockedUsers.findById.mockResolvedValue(undefined);
      await expect(
        reservationsService.createReservation(QUALIFIED_USER_ID, validInput),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('lança NotFoundError quando o carro não existe', async () => {
      mockedUsers.findById.mockResolvedValue(buildUser());
      mockedCars.findById.mockResolvedValue(undefined);

      await expect(
        reservationsService.createReservation(QUALIFIED_USER_ID, validInput),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('rejeita quando já existe reserva sobreposta para o mesmo carro', async () => {
      mockedUsers.findById.mockResolvedValue(buildUser());
      mockedCars.findById.mockResolvedValue(buildCar());
      mockedReservations.findOverlappingByCar.mockResolvedValue(buildReservation());

      await expect(
        reservationsService.createReservation(QUALIFIED_USER_ID, validInput),
      ).rejects.toBeInstanceOf(BadRequestError);
      expect(mockedReservations.create).not.toHaveBeenCalled();
    });

    it('rejeita quando o usuário já possui reserva sobreposta (mesmo em outro carro)', async () => {
      mockedUsers.findById.mockResolvedValue(buildUser());
      mockedCars.findById.mockResolvedValue(buildCar());
      mockedReservations.findOverlappingByCar.mockResolvedValue(undefined);
      mockedReservations.findOverlappingByUser.mockResolvedValue(
        buildReservation({ car_id: 'outro-carro' }),
      );

      await expect(
        reservationsService.createReservation(QUALIFIED_USER_ID, validInput),
      ).rejects.toBeInstanceOf(BadRequestError);
      expect(mockedReservations.create).not.toHaveBeenCalled();
    });
  });

  describe('getReservationById', () => {
    it('lança BadRequestError para ID mal formatado', async () => {
      await expect(reservationsService.getReservationById('xxx')).rejects.toBeInstanceOf(
        BadRequestError,
      );
    });

    it('lança NotFoundError quando a reserva não existe', async () => {
      mockedReservations.findById.mockResolvedValue(undefined);
      await expect(
        reservationsService.getReservationById('b0000000-0000-4000-8000-000000000001'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('updateReservation', () => {
    it('recalcula final_value e reaplica as checagens de sobreposição, ignorando a própria reserva', async () => {
      const existing = buildReservation();
      mockedReservations.findById.mockResolvedValue(existing);
      mockedCars.findById.mockResolvedValue(buildCar({ value_per_day: '50.00' }));
      mockedReservations.findOverlappingByCar.mockResolvedValue(undefined);
      mockedReservations.findOverlappingByUser.mockResolvedValue(undefined);
      mockedReservations.update.mockResolvedValue(
        buildReservation({ end_date: new Date('2023-05-05') }),
      );

      await reservationsService.updateReservation(existing.id, {
        end_date: new Date('2023-05-05'),
      });

      expect(mockedReservations.findOverlappingByCar).toHaveBeenCalledWith(
        existing.car_id,
        existing.start_date,
        new Date('2023-05-05'),
        existing.id,
      );
    });

    it('lança NotFoundError se a reserva não existir', async () => {
      mockedReservations.findById.mockResolvedValue(undefined);
      await expect(
        reservationsService.updateReservation('b0000000-0000-4000-8000-000000000001', {}),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('deleteReservation', () => {
    it('lança NotFoundError se a reserva não existir', async () => {
      mockedReservations.findById.mockResolvedValue(undefined);
      await expect(
        reservationsService.deleteReservation('b0000000-0000-4000-8000-000000000001'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('remove a reserva quando ela existe', async () => {
      mockedReservations.findById.mockResolvedValue(buildReservation());
      mockedReservations.delete.mockResolvedValue(1);

      await reservationsService.deleteReservation('b0000000-0000-4000-8000-000000000001');
      expect(mockedReservations.delete).toHaveBeenCalledWith(
        'b0000000-0000-4000-8000-000000000001',
      );
    });
  });

  describe('listReservations', () => {
    it('retorna a lista paginada com a chave "reserves" (contrato do desafio)', async () => {
      mockedReservations.list.mockResolvedValue([buildReservation()]);
      mockedReservations.count.mockResolvedValue(1);

      const result = await reservationsService.listReservations({});

      expect(result.reserves).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
