import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { usersRepository } from './users.repository';
import { toUserResponse, UserResponse } from './users.mapper';
import { CreateUserDTO, UpdateUserDTO } from './users.validation';
import { BadRequestError, NotFoundError } from '../../utils/AppError';
import { fetchAddressByCep } from '../../utils/viaCep';
import { normalizeCpf } from '../../utils/cpf';
import { isValidId } from '../../utils/idValidation';
import { parsePagination, toSkip, buildPaginationMeta } from '../../utils/pagination';

const SALT_ROUNDS = 10;

export interface PaginatedUsers {
  users: UserResponse[];
  total: number;
  limit: number;
  offset: number;
  offsets: number;
}

export async function createUser(data: CreateUserDTO): Promise<UserResponse> {
  const cpf = normalizeCpf(data.cpf);

  const [existingCpf, existingEmail] = await Promise.all([
    usersRepository.findByCpf(cpf),
    usersRepository.findByEmail(data.email),
  ]);

  if (existingCpf) throw new BadRequestError('cpf já cadastrado');
  if (existingEmail) throw new BadRequestError('email já cadastrado');

  const address = await fetchAddressByCep(data.cep);
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await usersRepository.create({
    id: crypto.randomUUID(),
    name: data.name,
    cpf,
    birth: data.birth,
    email: data.email,
    password: hashedPassword,
    cep: data.cep,
    logradouro: address.logradouro,
    complemento: address.complemento,
    bairro: address.bairro,
    localidade: address.localidade,
    uf: address.uf,
    qualified: data.qualified === 'yes',
  });

  return toUserResponse(user);
}

export async function listUsers(query: Record<string, unknown>): Promise<PaginatedUsers> {
  const pagination = parsePagination(query);

  const filters = {
    name: typeof query.name === 'string' ? query.name : undefined,
    email: typeof query.email === 'string' ? query.email : undefined,
    cpf: typeof query.cpf === 'string' ? normalizeCpf(query.cpf) : undefined,
    localidade: typeof query.localidade === 'string' ? query.localidade : undefined,
    uf: typeof query.uf === 'string' ? query.uf : undefined,
    qualified: query.qualified === 'yes' ? true : query.qualified === 'no' ? false : undefined,
  };

  const [users, total] = await Promise.all([
    usersRepository.list(filters, pagination.limit, toSkip(pagination)),
    usersRepository.count(filters),
  ]);

  return {
    users: users.map(toUserResponse),
    ...buildPaginationMeta(total, pagination),
  };
}

export async function getUserById(id: string): Promise<UserResponse> {
  if (!isValidId(id)) throw new BadRequestError('id com formato inválido');

  const user = await usersRepository.findById(id);
  if (!user) throw new NotFoundError('usuário não encontrado');

  return toUserResponse(user);
}

export async function updateUser(id: string, data: UpdateUserDTO): Promise<UserResponse> {
  if (!isValidId(id)) throw new BadRequestError('id com formato inválido');

  const existing = await usersRepository.findById(id);
  if (!existing) throw new NotFoundError('usuário não encontrado');

  if (data.cpf) {
    const cpf = normalizeCpf(data.cpf);
    const owner = await usersRepository.findByCpf(cpf);
    if (owner && owner.id !== id) throw new BadRequestError('cpf já cadastrado');
  }

  if (data.email) {
    const owner = await usersRepository.findByEmail(data.email);
    if (owner && owner.id !== id) throw new BadRequestError('email já cadastrado');
  }

  let addressFields: Partial<{
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
  }> = {};

  if (data.cep && data.cep !== existing.cep) {
    const address = await fetchAddressByCep(data.cep);
    addressFields = {
      logradouro: address.logradouro,
      complemento: address.complemento,
      bairro: address.bairro,
      localidade: address.localidade,
      uf: address.uf,
    };
  }

  const updated = await usersRepository.update(id, {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.cpf !== undefined && { cpf: normalizeCpf(data.cpf) }),
    ...(data.birth !== undefined && { birth: data.birth }),
    ...(data.email !== undefined && { email: data.email }),
    ...(data.password !== undefined && { password: await bcrypt.hash(data.password, SALT_ROUNDS) }),
    ...(data.cep !== undefined && { cep: data.cep }),
    ...(data.qualified !== undefined && { qualified: data.qualified === 'yes' }),
    ...addressFields,
  });

  return toUserResponse(updated!);
}

export async function deleteUser(id: string): Promise<void> {
  if (!isValidId(id)) throw new BadRequestError('id com formato inválido');

  const existing = await usersRepository.findById(id);
  if (!existing) throw new NotFoundError('usuário não encontrado');

  await usersRepository.delete(id);
}

/** Usado pelo módulo de autenticação para localizar o usuário pelo e-mail. */
export async function findUserByEmailInternal(email: string) {
  return usersRepository.findByEmail(email);
}
