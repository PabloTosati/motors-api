import { CarWithAccessories } from './cars.repository';

export interface CarResponse {
  id: string;
  model: string;
  color: string;
  year: number;
  value_per_day: number;
  accessories: { id: string; description: string }[];
  number_of_passengers: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toCarResponse(car: CarWithAccessories): CarResponse {
  return {
    id: car.id,
    model: car.model,
    color: car.color,
    year: car.year,
    value_per_day: Number(car.value_per_day),
    accessories: car.accessories.map((a) => ({ id: a.id, description: a.description })),
    number_of_passengers: car.number_of_passengers,
    createdAt: car.created_at,
    updatedAt: car.updated_at,
  };
}
