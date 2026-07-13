import knexLib, { Knex } from 'knex';
import { env } from '../config/env';

const config: Knex.Config = {
  client: 'pg',
  connection: env.databaseUrl,
  pool: {
    min: 2,
    max: 10,
  },
};

export const db: Knex = knexLib(config);
