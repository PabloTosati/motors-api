import crypto from 'crypto';
import { reservationsRepository } from './reservations.repository';
import { toReservationResponse, ReservationResponse } from './reservations.mapper';
import { CreateReservationDTO, UpdateReservationDTO } from './reservations.validation';
import { BadRequestError, NotFoundError } from '../../utils/AppError';
import { isValidId } from '../../utils/idValidation';
import { daysBetween } from '../../utils/dateUtils';
import { parsePagination, toSkip, buildPaginationMeta } from '../../utils/pagination';
import { usersRepository } from '../users/users.repository';
import { carsRepository } from '../cars/cars.repository';

export interface PaginatedReservations {
  reserves: ReservationResponse[];
  total: number;
  limit: number;
  offset: number;
  offsets: number;
}

function calculateFinalValue(startDate: Date, endDate: Date, valuePerDay: number): number {
  const days = Math.max(daysBetween(startDate, endDate), 1);
  return Number((days * valuePerDay).toFixed(2));
}

export async function createReservation(
  userId: string,
  data: CreateReservationDTO,
): Promise<ReservationResponse> {
  const user = await usersRepository.findById(userId);
  if (!user) throw new NotFoundError('usuário não encontrado');
  if (!user.qualified) {
    throw new BadRequestError('usuário não está habilitado para realizar reservas');
  }

  if (!isValidId(data.id_car)) throw new BadRequestError('id_car com formato inválido');

  const car = await carsRepository.findById(data.id_car);
  if (!car) throw new NotFoundError('carro não encontrado');

  const carConflict = await reservationsRepository.findOverlappingByCar(
    data.id_car,
    data.start_date,
    data.end_date,
  );
  if (carConflict) {
    throw new BadRequestError('já existe uma reserva para este carro no período informado');
  }

  const userConflict = await reservationsRepository.findOverlappingByUser(
    userId,
    data.start_date,
    data.end_date,
  );
  if (userConflict) {
    throw new BadRequestError('usuário já possui uma reserva sobreposta no período informado');
  }

  const finalValue = calculateFinalValue(data.start_date, data.end_date, Number(car.value_per_day));

  const reservation = await reservationsRepository.create({
    id: crypto.randomUUID(),
    user_id: userId,
    car_id: data.id_car,
    start_date: data.start_date,
    end_date: data.end_date,
    final_value: String(finalValue),
  });

  return toReservationResponse(reservation);
}

export async function listReservations(
  query: Record<string, unknown>,
): Promise<PaginatedReservations> {
  const pagination = parsePagination(query);

  const filters = {
    id_user: typeof query.id_user === 'string' ? query.id_user : undefined,
    id_car: typeof query.id_car === 'string' ? query.id_car : undefined,
    final_value:
      query.final_value !== undefined && !Number.isNaN(Number(query.final_value))
        ? Number(query.final_value)
        : undefined,
    userName: typeof query.nome === 'string' ? query.nome : undefined,
  };

  const [reservations, total] = await Promise.all([
    reservationsRepository.list(filters, pagination.limit, toSkip(pagination)),
    reservationsRepository.count(filters),
  ]);

  return {
    reserves: reservations.map(toReservationResponse),
    ...buildPaginationMeta(total, pagination),
  };
}

export async function getReservationById(id: string): Promise<ReservationResponse> {
  if (!isValidId(id)) throw new BadRequestError('id com formato inválido');

  const reservation = await reservationsRepository.findById(id);
  if (!reservation) throw new NotFoundError('reserva não encontrada');

  return toReservationResponse(reservation);
}

export async function updateReservation(
  id: string,
  data: UpdateReservationDTO,
): Promise<ReservationResponse> {
  if (!isValidId(id)) throw new BadRequestError('id com formato inválido');

  const existing = await reservationsRepository.findById(id);
  if (!existing) throw new NotFoundError('reserva não encontrada');

  if (data.id_car && !isValidId(data.id_car)) {
    throw new BadRequestError('id_car com formato inválido');
  }

  const carId = data.id_car ?? existing.car_id;
  const startDate = data.start_date ?? existing.start_date;
  const endDate = data.end_date ?? existing.end_date;

  const car = await carsRepository.findById(carId);
  if (!car) throw new NotFoundError('carro não encontrado');

  const carConflict = await reservationsRepository.findOverlappingByCar(
    carId,
    startDate,
    endDate,
    id,
  );
  if (carConflict) {
    throw new BadRequestError('já existe uma reserva para este carro no período informado');
  }

  const userConflict = await reservationsRepository.findOverlappingByUser(
    existing.user_id,
    startDate,
    endDate,
    id,
  );
  if (userConflict) {
    throw new BadRequestError('usuário já possui uma reserva sobreposta no período informado');
  }

  const finalValue = calculateFinalValue(startDate, endDate, Number(car.value_per_day));

  const updated = await reservationsRepository.update(id, {
    car_id: carId,
    start_date: startDate,
    end_date: endDate,
    final_value: String(finalValue),
  });

  return toReservationResponse(updated!);
}

export async function deleteReservation(id: string): Promise<void> {
  if (!isValidId(id)) throw new BadRequestError('id com formato inválido');

  const existing = await reservationsRepository.findById(id);
  if (!existing) throw new NotFoundError('reserva não encontrada');

  await reservationsRepository.delete(id);
}
