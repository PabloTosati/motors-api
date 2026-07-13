import * as carsService from '../../../src/modules/cars/cars.service';
import { carsRepository, CarWithAccessories } from '../../../src/modules/cars/cars.repository';
import { BadRequestError, NotFoundError } from '../../../src/utils/AppError';

jest.mock('../../../src/modules/cars/cars.repository');

const mockedRepo = carsRepository as jest.Mocked<typeof carsRepository>;

function buildCar(overrides: Partial<CarWithAccessories> = {}): CarWithAccessories {
  return {
    id: 'c0000000-0000-4000-8000-000000000001',
    model: 'GM S10 2.8',
    color: 'White',
    year: 2021,
    value_per_day: '50.00',
    number_of_passengers: 5,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    accessories: [
      {
        id: 'ac1',
        car_id: 'c0000000-0000-4000-8000-000000000001',
        description: 'air conditioner',
        created_at: new Date(),
      },
    ],
    ...overrides,
  };
}

const validCarInput = {
  model: 'GM S10 2.8',
  color: 'White',
  year: 2021,
  value_per_day: 50,
  accessories: [{ description: 'air conditioner' }, { description: '4x4 traction' }],
  number_of_passengers: 5,
};

describe('cars.service', () => {
  describe('createCar', () => {
    it('cria o carro com os acessórios informados', async () => {
      mockedRepo.create.mockResolvedValue(buildCar());

      const result = await carsService.createCar(validCarInput);

      expect(mockedRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'GM S10 2.8', value_per_day: '50' }),
        ['air conditioner', '4x4 traction'],
      );
      expect(result.id).toBe('c0000000-0000-4000-8000-000000000001');
      expect(result.value_per_day).toBe(50);
    });
  });

  describe('getCarById', () => {
    it('lança BadRequestError para ID mal formatado', async () => {
      await expect(carsService.getCarById('invalido')).rejects.toBeInstanceOf(BadRequestError);
    });

    it('lança NotFoundError quando o carro não existe', async () => {
      mockedRepo.findById.mockResolvedValue(undefined);
      await expect(
        carsService.getCarById('c0000000-0000-4000-8000-000000000001'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('retorna o carro mapeado quando encontrado', async () => {
      mockedRepo.findById.mockResolvedValue(buildCar());
      const result = await carsService.getCarById('c0000000-0000-4000-8000-000000000001');
      expect(result.model).toBe('GM S10 2.8');
      expect(result.accessories).toHaveLength(1);
    });
  });

  describe('updateCar', () => {
    it('lança NotFoundError se o carro não existir', async () => {
      mockedRepo.findById.mockResolvedValue(undefined);
      await expect(
        carsService.updateCar('c0000000-0000-4000-8000-000000000001', {}),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('atualiza os campos informados, incluindo acessórios quando fornecidos', async () => {
      mockedRepo.findById.mockResolvedValue(buildCar());
      mockedRepo.update.mockResolvedValue(buildCar({ model: 'Novo Modelo' }));

      const result = await carsService.updateCar('c0000000-0000-4000-8000-000000000001', {
        model: 'Novo Modelo',
        accessories: [{ description: 'teto solar' }],
      });

      expect(mockedRepo.update).toHaveBeenCalledWith(
        'c0000000-0000-4000-8000-000000000001',
        expect.objectContaining({ model: 'Novo Modelo' }),
        ['teto solar'],
      );
      expect(result.model).toBe('Novo Modelo');
    });
  });

  describe('deleteCar', () => {
    it('lança NotFoundError se o carro não existir', async () => {
      mockedRepo.findById.mockResolvedValue(undefined);
      await expect(
        carsService.deleteCar('c0000000-0000-4000-8000-000000000001'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('toggleAccessory', () => {
    it('remove o acessório quando ele já existe (case-insensitive)', async () => {
      const car = buildCar();
      mockedRepo.findById
        .mockResolvedValueOnce(car)
        .mockResolvedValueOnce(buildCar({ accessories: [] }));
      mockedRepo.findAccessoryByDescription.mockResolvedValue(car.accessories[0]);

      const result = await carsService.toggleAccessory(car.id, 'AIR CONDITIONER');

      expect(mockedRepo.removeAccessory).toHaveBeenCalledWith('ac1');
      expect(mockedRepo.addAccessory).not.toHaveBeenCalled();
      expect(result.accessories).toHaveLength(0);
    });

    it('adiciona o acessório quando ele ainda não existe', async () => {
      const car = buildCar();
      mockedRepo.findById.mockResolvedValueOnce(car).mockResolvedValueOnce(car);
      mockedRepo.findAccessoryByDescription.mockResolvedValue(undefined);

      await carsService.toggleAccessory(car.id, 'teto solar');

      expect(mockedRepo.addAccessory).toHaveBeenCalledWith(car.id, 'teto solar');
      expect(mockedRepo.removeAccessory).not.toHaveBeenCalled();
    });

    it('lança NotFoundError se o carro não existir', async () => {
      mockedRepo.findById.mockResolvedValue(undefined);
      await expect(
        carsService.toggleAccessory('c0000000-0000-4000-8000-000000000001', 'x'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('listCars', () => {
    it('retorna a lista paginada de carros com a chave "car" (contrato do desafio)', async () => {
      mockedRepo.list.mockResolvedValue([buildCar()]);
      mockedRepo.count.mockResolvedValue(1);

      const result = await carsService.listCars({});

      expect(result.car).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
