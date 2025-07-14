// migrate.js
import 'dotenv/config';
import Knex from 'knex';
import knexConfig from './knexfile.js';

async function runMigrations() {
  try {
    const env = process.env.NODE_ENV || 'production';
    console.log(`🟢 Iniciando migrations (ambiente=${env})...`);
    const knex = Knex({
      ...knexConfig[env],
      // Garante SSL mesmo com certificado self-signed:
      ...('ssl' in knexConfig[env]
        ? {}
        : { connection: { ...knexConfig[env].connection, ssl: { rejectUnauthorized: false } } })
    });
    await knex.migrate.latest();
    console.log('✅ Migrations aplicadas com sucesso!');
    await knex.destroy();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao rodar migrations:', err);
    process.exit(1);
  }
}

runMigrations();
