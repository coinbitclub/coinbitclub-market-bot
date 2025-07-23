import config from './knexfile.js';
import knex from 'knex';

const db = knex(config.development);

try {
  const result = await db.raw(`PRAGMA table_info(users)`);
  
  console.log('Estrutura da tabela users:');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Erro:', error.message);
} finally {
  await db.destroy();
}
