import Knex from 'knex';
<<<<<<< HEAD
import config from '../../knexfile.js';
=======
import knexfile from '../knexfile.js';
>>>>>>> aacf3516e63892bec79e9806af8daf54878b8cb5
let knex;
export async function initDB() {
  knex = Knex(knexfile[process.env.NODE_ENV || 'development']);
  console.log('✅ DB initialized');
  return knex;
}
export function getDB() { return knex; }
