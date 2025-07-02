#!/usr/bin/env node

// diagnostics.js
// Diagnóstico 360º: env, Stripe, DB, migrações e startup do servidor

import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Resolve __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1) Carrega .env (raiz do projeto ou backend)
const possibleEnvPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '.env'),
];
const envFile = possibleEnvPaths.find(p => existsSync(p));
if (!envFile) {
  console.error('❌ .env não encontrado em:', possibleEnvPaths.join(', '));
  process.exit(1);
}
console.log(`✅ Carregado .env de ${envFile}`);
dotenv.config({ path: envFile });

console.log("🔍 Iniciando diagnóstico...\n");

// 2) Verifica variáveis de ambiente obrigatórias
const requiredEnvs = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_SUCCESS_URL',
  'STRIPE_CANCEL_URL',
  'JWT_SECRET',
  'WEBHOOK_TOKEN',
  'OPENAI_API_KEY'
];
const missing = requiredEnvs.filter(e => !process.env[e]);
if (missing.length) {
  console.error(`❌ Variáveis faltando: ${missing.join(', ')}`);
  process.exit(1);
}
console.log("✅ Todas as envs obrigatórias estão definidas.\n");

// 3) Testa Stripe
(async () => {
  try {
    const stripePkg = await import('stripe');
    new stripePkg.default(process.env.STRIPE_SECRET_KEY);
    console.log("✅ Stripe instanciado com sucesso.\n");
  } catch (err) {
    console.error("❌ Erro ao instanciar Stripe:", err.message);
    process.exit(1);
  }

  // 4) Testa conexão com o banco
  try {
    const { pool } = await import('./database.js');
    await pool.query('SELECT 1');
    console.log("✅ Conexão com Banco de Dados OK.\n");
  } catch (err) {
    console.error("❌ Erro na conexão DB:", err.message);
    process.exit(1);
  }

  // 5) Confere migrações exportadas
  try {
    const migrations = await import('./services/dbMigrations.js');
    const funcs = Object.keys(migrations).filter(
      key => typeof migrations[key] === 'function' && key.startsWith('ensure')
    );
    console.log(`➡️ Migrations disponíveis: ${funcs.join(', ')}\n`);
  } catch (err) {
    console.error("❌ Erro ao ler migrações:", err.message);
    process.exit(1);
  }

  // 6) Testa carregamento de src/index.js
  try {
    await import('./src/index.js');
    console.log("✅ src/index.js carregou sem erros.\n");
  } catch (err) {
    console.error("❌ Erro em src/index.js:", err.message);
    console.error(err.stack);
    process.exit(1);
  }

  console.log("🏁 Diagnóstico 360º concluído com sucesso.");
})();
