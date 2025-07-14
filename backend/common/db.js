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

let failureCount = 0;
let open = false;

export async function query(...args) {
  if (open) throw new Error('circuit open');
  try {
    const result = await db(...args);
    failureCount = 0;
    return result;
  } catch (err) {
    failureCount += 1;
    if (failureCount >= 5) {
      open = true;
      setTimeout(() => (open = false), 10000);
      logger.error({ err }, 'db circuit opened');
    }
    throw err;
  }
}
