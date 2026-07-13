import { Knex } from 'knex';
import { db } from '../../database/knex';

export interface ReservationRow {
  id: string;
  user_id: string;
  car_id: string;
  start_date: Date;
  end_date: Date;
  final_value: string; // decimal vem como string do driver pg
  created_at: Date;
  updated_at: Date;
}

const TABLE = 'reservations';

export interface ReservationFilters {
  id_user?: string;
  id_car?: string;
  final_value?: number;
  userName?: string;
}

function applyFilters(
  query: Knex.QueryBuilder<ReservationRow, ReservationRow[]>,
  filters: ReservationFilters,
) {
  if (filters.id_user) query.where('user_id', filters.id_user);
  if (filters.id_car) query.where('car_id', filters.id_car);
  if (filters.final_value !== undefined) query.where('final_value', filters.final_value);
  if (filters.userName) {
    query.whereExists(function () {
      this.select('*')
        .from('users')
        .whereRaw('users.id = reservations.user_id')
        .andWhereILike('users.name', `%${filters.userName}%`);
    });
  }
  return query;
}

/** Verifica se já existe alguma reserva do carro que se sobreponha ao período informado. */
async function findOverlappingByCar(
  carId: string,
  startDate: Date,
  endDate: Date,
  ignoreReservationId?: string,
): Promise<ReservationRow | undefined> {
  const query = db<ReservationRow>(TABLE)
    .where('car_id', carId)
    .andWhere('start_date', '<=', endDate)
    .andWhere('end_date', '>=', startDate);

  if (ignoreReservationId) query.andWhereNot('id', ignoreReservationId);

  return query.first();
}

/** Verifica se o usuário já possui alguma reserva (de qualquer carro) que se sobreponha ao período. */
async function findOverlappingByUser(
  userId: string,
  startDate: Date,
  endDate: Date,
  ignoreReservationId?: string,
): Promise<ReservationRow | undefined> {
  const query = db<ReservationRow>(TABLE)
    .where('user_id', userId)
    .andWhere('start_date', '<=', endDate)
    .andWhere('end_date', '>=', startDate);

  if (ignoreReservationId) query.andWhereNot('id', ignoreReservationId);

  return query.first();
}

export const reservationsRepository = {
  findOverlappingByCar,
  findOverlappingByUser,

  async create(data: Omit<ReservationRow, 'created_at' | 'updated_at'>): Promise<ReservationRow> {
    const [row] = await db<ReservationRow>(TABLE).insert(data).returning('*');
    return row;
  },

  async findById(id: string): Promise<ReservationRow | undefined> {
    return db<ReservationRow>(TABLE).where({ id }).first();
  },

  async list(filters: ReservationFilters, limit: number, skip: number): Promise<ReservationRow[]> {
    const query = db<ReservationRow>(TABLE).select('*');
    applyFilters(query, filters);
    return query.orderBy('created_at', 'desc').limit(limit).offset(skip);
  },

  async count(filters: ReservationFilters): Promise<number> {
    const query = db<ReservationRow>(TABLE);
    applyFilters(query, filters);
    const result = await query.count<{ count: string }[]>({ count: '*' }).first();
    return Number(result?.count ?? 0);
  },

  async update(
    id: string,
    data: Partial<Omit<ReservationRow, 'id' | 'user_id' | 'created_at'>>,
  ): Promise<ReservationRow | undefined> {
    const [row] = await db<ReservationRow>(TABLE)
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    return row;
  },

  async delete(id: string): Promise<number> {
    return db<ReservationRow>(TABLE).where({ id }).delete();
  },
};
