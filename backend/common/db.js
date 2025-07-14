import knex from 'knex';
import retry from 'async-retry';
import CircuitBreaker from 'opossum';
import logger from './logger.js';

const createClient = () =>
  knex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
  });

export const db = createClient();

const breaker = new CircuitBreaker(
  async (sql, params) => db.raw(sql, params),
  {
    errorThresholdPercentage: 50,
    resetTimeout: 10000,
  }
);

export async function ensureConnection() {
  await retry(
    async () => {
      await query('select 1');
    },
    {
      retries: 5,
      minTimeout: 500,
      onRetry: (err) => logger.warn({ err }, 'db connection retry'),
    }
  );
}

export async function query(sql, params) {
  try {
    return await breaker.fire(sql, params);
  } catch (err) {
    logger.error({ err }, 'db query failed');
    throw err;
  }
}
