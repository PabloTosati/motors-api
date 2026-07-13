import { Request, Response } from 'express';
import * as usersService from './users.service';
import { createUserSchema, updateUserSchema } from './users.validation';

export async function createUserController(req: Request, res: Response): Promise<void> {
  const data = createUserSchema.parse(req.body);
  const user = await usersService.createUser(data);
  res.status(201).json(user);
}

export async function listUsersController(req: Request, res: Response): Promise<void> {
  const result = await usersService.listUsers(req.query as Record<string, unknown>);
  res.status(200).json(result);
}

export async function getUserByIdController(req: Request, res: Response): Promise<void> {
  const user = await usersService.getUserById(String(req.params.id));
  res.status(200).json(user);
}

export async function updateUserController(req: Request, res: Response): Promise<void> {
  const data = updateUserSchema.parse(req.body);
  const user = await usersService.updateUser(String(req.params.id), data);
  res.status(200).json(user);
}

export async function deleteUserController(req: Request, res: Response): Promise<void> {
  await usersService.deleteUser(String(req.params.id));
  res.status(204).send();
}
