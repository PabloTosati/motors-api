import { Request, Response } from 'express';
import * as reservationsService from './reservations.service';
import { createReservationSchema, updateReservationSchema } from './reservations.validation';
import { UnauthorizedError } from '../../utils/AppError';

export async function createReservationController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = createReservationSchema.parse(req.body);
  const reservation = await reservationsService.createReservation(req.user.id, data);
  res.status(201).json(reservation);
}

export async function listReservationsController(req: Request, res: Response): Promise<void> {
  const result = await reservationsService.listReservations(req.query as Record<string, unknown>);
  res.status(200).json(result);
}

export async function getReservationByIdController(req: Request, res: Response): Promise<void> {
  const reservation = await reservationsService.getReservationById(String(req.params.id));
  res.status(200).json(reservation);
}

export async function updateReservationController(req: Request, res: Response): Promise<void> {
  const data = updateReservationSchema.parse(req.body);
  const reservation = await reservationsService.updateReservation(String(req.params.id), data);
  res.status(200).json(reservation);
}

export async function deleteReservationController(req: Request, res: Response): Promise<void> {
  await reservationsService.deleteReservation(String(req.params.id));
  res.status(204).send();
}
