// src/common/db.js
import Knex from 'knex';
import knexConfig from '../../knexfile.js';

let db;

/**
 * Inicializa a conexão com o banco usando o NODE_ENV (default "development")
 */
export async function initDB() {
  const env = process.env.NODE_ENV || 'development';
  db = Knex(knexConfig[env]);
  console.log('✅ DB initialized');
  return db;
}

/**
 * Retorna a instância já inicializada do knex
 */
export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}
