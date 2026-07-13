import crypto from 'crypto';
import { carsRepository } from './cars.repository';
import { toCarResponse, CarResponse } from './cars.mapper';
import { CreateCarDTO, UpdateCarDTO } from './cars.validation';
import { BadRequestError, NotFoundError } from '../../utils/AppError';
import { isValidId } from '../../utils/idValidation';
import { parsePagination, toSkip, buildPaginationMeta } from '../../utils/pagination';

export interface PaginatedCars {
  car: CarResponse[];
  total: number;
  limit: number;
  offset: number;
  offsets: number;
}

export async function createCar(data: CreateCarDTO): Promise<CarResponse> {
  const car = await carsRepository.create(
    {
      id: crypto.randomUUID(),
      model: data.model,
      color: data.color,
      year: data.year,
      value_per_day: String(data.value_per_day),
      number_of_passengers: data.number_of_passengers,
    },
    data.accessories.map((a) => a.description),
  );

  return toCarResponse(car);
}

export async function listCars(query: Record<string, unknown>): Promise<PaginatedCars> {
  const pagination = parsePagination(query);

  const filters = {
    model: typeof query.model === 'string' ? query.model : undefined,
    color: typeof query.color === 'string' ? query.color : undefined,
    year:
      query.year !== undefined && !Number.isNaN(Number(query.year))
        ? Number(query.year)
        : undefined,
    value_per_day:
      query.value_per_day !== undefined && !Number.isNaN(Number(query.value_per_day))
        ? Number(query.value_per_day)
        : undefined,
    number_of_passengers:
      query.number_of_passengers !== undefined && !Number.isNaN(Number(query.number_of_passengers))
        ? Number(query.number_of_passengers)
        : undefined,
  };

  const [cars, total] = await Promise.all([
    carsRepository.list(filters, pagination.limit, toSkip(pagination)),
    carsRepository.count(filters),
  ]);

  return {
    car: cars.map(toCarResponse),
    ...buildPaginationMeta(total, pagination),
  };
}

export async function getCarById(id: string): Promise<CarResponse> {
  if (!isValidId(id)) throw new BadRequestError('id com formato inválido');

  const car = await carsRepository.findById(id);
  if (!car) throw new NotFoundError('carro não encontrado');

  return toCarResponse(car);
}

export async function updateCar(id: string, data: UpdateCarDTO): Promise<CarResponse> {
  if (!isValidId(id)) throw new BadRequestError('id com formato inválido');

  const existing = await carsRepository.findById(id);
  if (!existing) throw new NotFoundError('carro não encontrado');

  const updated = await carsRepository.update(
    id,
    {
      ...(data.model !== undefined && { model: data.model }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.year !== undefined && { year: data.year }),
      ...(data.value_per_day !== undefined && { value_per_day: String(data.value_per_day) }),
      ...(data.number_of_passengers !== undefined && {
        number_of_passengers: data.number_of_passengers,
      }),
    },
    data.accessories ? data.accessories.map((a) => a.description) : undefined,
  );

  return toCarResponse(updated);
}

export async function deleteCar(id: string): Promise<void> {
  if (!isValidId(id)) throw new BadRequestError('id com formato inválido');

  const existing = await carsRepository.findById(id);
  if (!existing) throw new NotFoundError('carro não encontrado');

  await carsRepository.delete(id);
}

/**
 * Alterna um acessório do carro: remove se já existir (comparação
 * case-insensitive), adiciona caso contrário.
 */
export async function toggleAccessory(carId: string, description: string): Promise<CarResponse> {
  if (!isValidId(carId)) throw new BadRequestError('id com formato inválido');

  const car = await carsRepository.findById(carId);
  if (!car) throw new NotFoundError('carro não encontrado');

  const existingAccessory = await carsRepository.findAccessoryByDescription(carId, description);

  if (existingAccessory) {
    await carsRepository.removeAccessory(existingAccessory.id);
  } else {
    await carsRepository.addAccessory(carId, description);
  }

  const updatedCar = await carsRepository.findById(carId);
  return toCarResponse(updatedCar!);
}
