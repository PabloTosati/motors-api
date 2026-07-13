import { Request, Response } from 'express';
import * as carsService from './cars.service';
import { createCarSchema, updateCarSchema, updateAccessorySchema } from './cars.validation';

export async function createCarController(req: Request, res: Response): Promise<void> {
  const data = createCarSchema.parse(req.body);
  const car = await carsService.createCar(data);
  res.status(201).json(car);
}

export async function listCarsController(req: Request, res: Response): Promise<void> {
  const result = await carsService.listCars(req.query as Record<string, unknown>);
  res.status(200).json(result);
}

export async function getCarByIdController(req: Request, res: Response): Promise<void> {
  const car = await carsService.getCarById(String(req.params.id));
  res.status(200).json(car);
}

export async function updateCarController(req: Request, res: Response): Promise<void> {
  const data = updateCarSchema.parse(req.body);
  const car = await carsService.updateCar(String(req.params.id), data);
  res.status(200).json(car);
}

export async function deleteCarController(req: Request, res: Response): Promise<void> {
  await carsService.deleteCar(String(req.params.id));
  res.status(204).send();
}

export async function toggleAccessoryController(req: Request, res: Response): Promise<void> {
  const { description } = updateAccessorySchema.parse(req.body);
  const car = await carsService.toggleAccessory(String(req.params.id), description);
  res.status(200).json(car);
}
