import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';
import logger from './common/logger.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5435/coinbitclub';
  
  logger.info('🚀 Iniciando migrações do banco de dados');
  logger.info(`📍 Conectando em: ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`);

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: false
  });

  try {
    // Teste de conexão
    const client = await pool.connect();
    logger.info('✅ Conectado ao banco de dados PostgreSQL');
    
    // Criar tabela de migrações se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ler arquivos de migração
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    logger.info(`📁 Encontradas ${migrationFiles.length} migrações`);

    for (const file of migrationFiles) {
      const migrationName = path.basename(file, '.js');
      
      // Verificar se migração já foi executada
      const result = await client.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [migrationName]
      );

      if (result.rows.length > 0) {
        logger.info(`⏭️  Migração ${migrationName} já executada`);
        continue;
      }

      logger.info(`🔄 Executando migração: ${migrationName}`);
      
      try {
        // Executar migração
        const migration = await import(path.join(migrationsDir, file));
        
        if (typeof migration.up === 'function') {
          await migration.up(client);
        } else {
          logger.error(`❌ Migração ${migrationName} não possui função 'up'`);
          continue;
        }

        // Registrar migração como executada
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [migrationName]
        );

        logger.info(`✅ Migração ${migrationName} executada com sucesso`);
      } catch (error) {
        logger.error(`❌ Erro ao executar migração ${migrationName}:`, error);
        throw error;
      }
    }

    client.release();
    logger.info('🎉 Todas as migrações foram executadas com sucesso!');

    // Executar seeds se especificado
    if (process.env.RUN_SEEDS === 'true') {
      await runSeeds(pool);
    }

  } catch (error) {
    logger.error('💥 Erro durante as migrações:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function runSeeds(pool) {
  logger.info('🌱 Executando seeds...');
  
  try {
    const client = await pool.connect();
    
    const seedsDir = path.join(__dirname, 'seeds');
    if (!fs.existsSync(seedsDir)) {
      logger.info('📁 Pasta de seeds não encontrada, criando dados iniciais...');
      await createInitialData(client);
      client.release();
      return;
    }

    const seedFiles = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    for (const file of seedFiles) {
      const seedName = path.basename(file, '.js');
      logger.info(`🌱 Executando seed: ${seedName}`);
      
      try {
        const seed = await import(path.join(seedsDir, file));
        
        if (typeof seed.seed === 'function') {
          await seed.seed(client);
          logger.info(`✅ Seed ${seedName} executado com sucesso`);
        } else {
          logger.warn(`⚠️  Seed ${seedName} não possui função 'seed'`);
        }
      } catch (error) {
        logger.error(`❌ Erro ao executar seed ${seedName}:`, error);
        // Não interromper por erro em seeds
      }
    }

    client.release();
    logger.info('🎉 Seeds executados com sucesso!');
  } catch (error) {
    logger.error('💥 Erro durante execução dos seeds:', error);
  }
}

async function createInitialData(client) {
  try {
    // Criar usuário admin padrão
    const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LVkhemOBGxhz7OQti'; // "admin123"
    
    await client.query(`
      INSERT INTO users (id, name, email, password, role, is_active, created_at)
      VALUES (
        gen_random_uuid(),
        'Administrador',
        'admin@coinbitclub.com',
        $1,
        'admin',
        true,
        NOW()
      )
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword]);

    // Criar planos básicos
    await client.query(`
      INSERT INTO plans (id, name, description, price, features, is_active, created_at)
      VALUES 
      (
        gen_random_uuid(),
        'Básico',
        'Plano básico para iniciantes',
        0.00,
        '["Sinais básicos", "Suporte por email"]'::jsonb,
        true,
        NOW()
      ),
      (
        gen_random_uuid(),
        'Premium',
        'Plano premium com recursos avançados',
        49.99,
        '["Todos os sinais", "AI Trading", "Suporte prioritário", "Analytics avançado"]'::jsonb,
        true,
        NOW()
      )
      ON CONFLICT (name) DO NOTHING
    `);

    logger.info('✅ Dados iniciais criados com sucesso');
  } catch (error) {
    logger.error('❌ Erro ao criar dados iniciais:', error);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      logger.info('🏁 Processo de migração concluído');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Falha na migração:', error);
      process.exit(1);
    });
}

export { runMigrations };
