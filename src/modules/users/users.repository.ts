import { Knex } from 'knex';
import { db } from '../../database/knex';

export interface UserRow {
  id: string;
  name: string;
  cpf: string;
  birth: Date;
  email: string;
  password: string;
  cep: string;
  logradouro: string | null;
  complemento: string | null;
  bairro: string | null;
  localidade: string | null;
  uf: string | null;
  qualified: boolean;
  created_at: Date;
  updated_at: Date;
}

const TABLE = 'users';

export interface UserFilters {
  name?: string;
  cpf?: string;
  email?: string;
  localidade?: string;
  uf?: string;
  qualified?: boolean;
}

function applyFilters(query: Knex.QueryBuilder<UserRow, UserRow[]>, filters: UserFilters) {
  if (filters.name) query.whereILike('name', `%${filters.name}%`);
  if (filters.cpf) query.where('cpf', filters.cpf);
  if (filters.email) query.whereILike('email', `%${filters.email}%`);
  if (filters.localidade) query.whereILike('localidade', `%${filters.localidade}%`);
  if (filters.uf) query.whereILike('uf', filters.uf);
  if (filters.qualified !== undefined) query.where('qualified', filters.qualified);
  return query;
}

export const usersRepository = {
  async create(data: Omit<UserRow, 'created_at' | 'updated_at'>): Promise<UserRow> {
    const [row] = await db<UserRow>(TABLE).insert(data).returning('*');
    return row;
  },

  async findById(id: string): Promise<UserRow | undefined> {
    return db<UserRow>(TABLE).where({ id }).first();
  },

  async findByEmail(email: string): Promise<UserRow | undefined> {
    return db<UserRow>(TABLE).where({ email }).first();
  },

  async findByCpf(cpf: string): Promise<UserRow | undefined> {
    return db<UserRow>(TABLE).where({ cpf }).first();
  },

  async list(filters: UserFilters, limit: number, skip: number): Promise<UserRow[]> {
    const query = db<UserRow>(TABLE).select('*');
    applyFilters(query, filters);
    return query.orderBy('created_at', 'desc').limit(limit).offset(skip);
  },

  async count(filters: UserFilters): Promise<number> {
    const query = db<UserRow>(TABLE);
    applyFilters(query, filters);
    const result = await query.count<{ count: string }[]>({ count: '*' }).first();
    return Number(result?.count ?? 0);
  },

  async update(
    id: string,
    data: Partial<Omit<UserRow, 'id' | 'created_at'>>,
  ): Promise<UserRow | undefined> {
    const [row] = await db<UserRow>(TABLE)
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    return row;
  },

  async delete(id: string): Promise<number> {
    return db<UserRow>(TABLE).where({ id }).delete();
  },
};
