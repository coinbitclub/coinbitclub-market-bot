import Knex from 'knex';
import knexfile from '../knexfile.js';
let knex;
export async function initDB() {
  knex = Knex(knexfile[process.env.NODE_ENV || 'development']);
  console.log('✅ DB initialized');
  return knex;
}
export function getDB() { return knex; }
