import type { Knex } from 'knex';
import 'dotenv/config';

/**
 * Configuração central do Knex.
 *
 * A mesma configuração é usada tanto pela aplicação (src/database/knex.ts)
 * quanto pela CLI do Knex (migrations via `npm run db:migrate`).
 */
const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'grid_motors',
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
    extension: 'js',
  },
  pool: {
    min: 2,
    max: 10,
  },
};

export default config;
