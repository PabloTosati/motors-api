import crypto from 'crypto';
import { Knex } from 'knex';
import { db } from '../../database/knex';

export interface CarRow {
  id: string;
  model: string;
  color: string;
  year: number;
  value_per_day: string; // decimal vem como string do driver pg
  number_of_passengers: number;
  created_at: Date;
  updated_at: Date;
}

export interface AccessoryRow {
  id: string;
  car_id: string;
  description: string;
  created_at: Date;
}

export interface CarWithAccessories extends CarRow {
  accessories: AccessoryRow[];
}

const CARS_TABLE = 'cars';
const ACCESSORIES_TABLE = 'accessories';

export interface CarFilters {
  model?: string;
  color?: string;
  year?: number;
  value_per_day?: number;
  number_of_passengers?: number;
}

function applyFilters(query: Knex.QueryBuilder<CarRow, CarRow[]>, filters: CarFilters) {
  if (filters.model) query.whereILike('model', `%${filters.model}%`);
  if (filters.color) query.whereILike('color', `%${filters.color}%`);
  if (filters.year !== undefined) query.where('year', filters.year);
  if (filters.value_per_day !== undefined) query.where('value_per_day', filters.value_per_day);
  if (filters.number_of_passengers !== undefined) {
    query.where('number_of_passengers', filters.number_of_passengers);
  }
  return query;
}

async function attachAccessories(cars: CarRow[]): Promise<CarWithAccessories[]> {
  if (cars.length === 0) return [];

  const carIds = cars.map((car) => car.id);
  const accessories = await db<AccessoryRow>(ACCESSORIES_TABLE).whereIn('car_id', carIds);

  return cars.map((car) => ({
    ...car,
    accessories: accessories.filter((accessory) => accessory.car_id === car.id),
  }));
}

export const carsRepository = {
  async create(
    car: Omit<CarRow, 'created_at' | 'updated_at'>,
    accessoryDescriptions: string[],
  ): Promise<CarWithAccessories> {
    return db.transaction(async (trx) => {
      const [createdCar] = await trx<CarRow>(CARS_TABLE).insert(car).returning('*');

      const accessoryRows = accessoryDescriptions.map((description) => ({
        id: crypto.randomUUID(),
        car_id: createdCar.id,
        description,
      }));

      const accessories = accessoryRows.length
        ? await trx<AccessoryRow>(ACCESSORIES_TABLE).insert(accessoryRows).returning('*')
        : [];

      return { ...createdCar, accessories };
    });
  },

  async findById(id: string): Promise<CarWithAccessories | undefined> {
    const car = await db<CarRow>(CARS_TABLE).where({ id }).first();
    if (!car) return undefined;

    const accessories = await db<AccessoryRow>(ACCESSORIES_TABLE).where({ car_id: id });
    return { ...car, accessories };
  },

  async list(filters: CarFilters, limit: number, skip: number): Promise<CarWithAccessories[]> {
    const query = db<CarRow>(CARS_TABLE).select('*');
    applyFilters(query, filters);
    const cars = await query.orderBy('created_at', 'desc').limit(limit).offset(skip);
    return attachAccessories(cars);
  },

  async count(filters: CarFilters): Promise<number> {
    const query = db<CarRow>(CARS_TABLE);
    applyFilters(query, filters);
    const result = await query.count<{ count: string }[]>({ count: '*' }).first();
    return Number(result?.count ?? 0);
  },

  async update(
    id: string,
    data: Partial<Omit<CarRow, 'id' | 'created_at'>>,
    accessoryDescriptions?: string[],
  ): Promise<CarWithAccessories> {
    return db.transaction(async (trx) => {
      const [updatedCar] = await trx<CarRow>(CARS_TABLE)
        .where({ id })
        .update({ ...data, updated_at: db.fn.now() })
        .returning('*');

      if (accessoryDescriptions) {
        await trx<AccessoryRow>(ACCESSORIES_TABLE).where({ car_id: id }).delete();
        const accessoryRows = accessoryDescriptions.map((description) => ({
          id: crypto.randomUUID(),
          car_id: id,
          description,
        }));
        if (accessoryRows.length) {
          await trx<AccessoryRow>(ACCESSORIES_TABLE).insert(accessoryRows);
        }
      }

      const accessories = await trx<AccessoryRow>(ACCESSORIES_TABLE).where({ car_id: id });
      return { ...updatedCar, accessories };
    });
  },

  async delete(id: string): Promise<number> {
    return db<CarRow>(CARS_TABLE).where({ id }).delete();
  },

  async addAccessory(carId: string, description: string): Promise<AccessoryRow> {
    const [row] = await db<AccessoryRow>(ACCESSORIES_TABLE)
      .insert({ id: crypto.randomUUID(), car_id: carId, description })
      .returning('*');
    return row;
  },

  async removeAccessory(accessoryId: string): Promise<number> {
    return db<AccessoryRow>(ACCESSORIES_TABLE).where({ id: accessoryId }).delete();
  },

  async findAccessoryByDescription(
    carId: string,
    description: string,
  ): Promise<AccessoryRow | undefined> {
    return db<AccessoryRow>(ACCESSORIES_TABLE)
      .where({ car_id: carId })
      .whereRaw('lower(description) = lower(?)', [description])
      .first();
  },
};
