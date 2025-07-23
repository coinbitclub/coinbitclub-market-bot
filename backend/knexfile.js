// backend/knexfile.js
import { env } from './common/env.js';

const config = {
  development: {
    client: 'pg',
    connection: {
      connectionString: env.DATABASE_URL,
      ssl: false
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  test: {
    client: 'pg',
    connection: {
      connectionString: env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub_test',
      ssl: false
    },
    pool: {
      min: 1,
      max: 5
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    pool: {
      min: 2,
      max: 20,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  }
};

export default config;
