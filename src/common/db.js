// src/common/db.js
import 'dotenv/config';
import knex from 'knex';

// Configurações padrão para ambiente de desenvolvimento
function getDevConfig() {
  return {
    host:     process.env.DEV_DB_HOST    || process.env.POSTGRES_HOST || process.env.PGHOST     || 'localhost',
    port:     process.env.DEV_DB_PORT    ? parseInt(process.env.DEV_DB_PORT, 10)
               : process.env.PGPORT      ? parseInt(process.env.PGPORT, 10)
               : 5433,
    user:     process.env.DEV_DB_USER    || process.env.POSTGRES_USER  || process.env.PGUSER    || 'postgres',
    password: process.env.DEV_DB_PASS    || process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || 'postgres',
    database: process.env.DEV_DB_NAME    || process.env.POSTGRES_DB   || process.env.PGDATABASE || 'railway',
  };
};


/**
 * Inicializa e retorna uma instância Knex configurada.
 */
export async function initDB() {
  const config = process.env.DATABASE_URL
    ? {
        client: 'pg',
        connection: `${process.env.DATABASE_URL}${
          process.env.DATABASE_SSL === 'true' ? '?sslmode=require' : ''
        }`,
        pool: { min: 0, max: 10 },
      }
    : {
        client: 'pg',
        connection: getDevConfig(),
        pool: { min: 0, max: 10 },
      };

  const db = knex(config);
  // Testa a conexão ao banco
  await db.raw('SELECT 1');
  return db;
}

// Alias para compatibilidade com getDB
export const getDB = initDB;
