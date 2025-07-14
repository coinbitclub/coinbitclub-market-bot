import knex from 'knex';
import retry from 'async-retry';
import logger from './logger.js';

const createClient = () =>
  knex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
  });

export const db = createClient();

export async function ensureConnection() {
  await retry(
    async () => {
      await db.raw('select 1');
    },
    {
      retries: 5,
      minTimeout: 500,
      onRetry: (err) => logger.warn({ err }, 'db connection retry'),
    },
  );
}
