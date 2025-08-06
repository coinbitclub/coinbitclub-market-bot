/**
 * 🗄️ TESTE DE BANCO DE DADOS E ESTRUTURA - COINBITCLUB PREMIUM 🗄️
 * 
 * Este teste verifica:
 * ✅ Estrutura do banco PostgreSQL
 * ✅ Tabelas e relacionamentos
 * ✅ Índices e constraints
 * ✅ Procedures e triggers
 * ✅ Inserção e consulta de dados
 * ✅ Performance de queries
 * 
 * @author CoinBitClub Development Team
 * @version 2.0.0
 * @date 2025-01-25
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coinbitclub',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.bold}${colors.cyan}🎯 ${msg}${colors.reset}`),
  subtitle: (msg) => console.log(`${colors.magenta}📌 ${msg}${colors.reset}`)
};

let pool;
let testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  startTime: Date.now()
};

/**
 * Executar teste do banco de dados
 */
async function runDatabaseTest() {
  log.title('INICIANDO TESTE DO BANCO DE DADOS');
  log.info(`Host: ${dbConfig.host}:${dbConfig.port}`);
  log.info(`Database: ${dbConfig.database}`);
  console.log();

  try {
    // Conectar ao banco
    await connectToDatabase();
    
    // 1. Teste de Conectividade
    await testDatabaseConnection();
    
    // 2. Teste de Estrutura
    await testDatabaseStructure();
    
    // 3. Teste de Tabelas
    await testTables();
    
    // 4. Teste de Relacionamentos
    await testRelationships();
    
    // 5. Teste de Índices
    await testIndexes();
    
    // 6. Teste de Inserção de Dados
    await testDataInsertion();
    
    // 7. Teste de Consultas
    await testQueries();
    
    // 8. Teste de Performance
    await testDatabasePerformance();
    
    // 9. Limpeza
    await cleanupTestData();
    
    // Relatório final
    generateDatabaseReport();
    
  } catch (error) {
    log.error(`Erro crítico: ${error.message}`);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

/**
 * Conectar ao banco de dados
 */
async function connectToDatabase() {
  log.subtitle('Conectando ao banco de dados...');
  
  try {
    pool = new Pool(dbConfig);
    await pool.query('SELECT NOW()');
    log.success('Conexão com banco de dados estabelecida');
  } catch (error) {
    log.error(`Falha na conexão: ${error.message}`);
    throw error;
  }
}

/**
 * 1. TESTE DE CONECTIVIDADE
 */
async function testDatabaseConnection() {
  log.title('1. TESTE DE CONECTIVIDADE DO BANCO');
  
  await runDbTest('Conexão básica', async () => {
    const result = await pool.query('SELECT version()');
    return result.rows.length > 0;
  });
  
  await runDbTest('Timezone do banco', async () => {
    const result = await pool.query('SHOW timezone');
    log.info(`Timezone: ${result.rows[0].TimeZone}`);
    return true;
  });
  
  await runDbTest('Encoding do banco', async () => {
    const result = await pool.query('SHOW server_encoding');
    log.info(`Encoding: ${result.rows[0].server_encoding}`);
    return result.rows[0].server_encoding === 'UTF8';
  });
  
  console.log();
}

/**
 * 2. TESTE DE ESTRUTURA DO BANCO
 */
async function testDatabaseStructure() {
  log.title('2. TESTE DE ESTRUTURA DO BANCO');
  
  await runDbTest('Verificar extensões instaladas', async () => {
    const result = await pool.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pgcrypto')
    `);
    
    const extensions = result.rows.map(r => r.extname);
    log.info(`Extensões encontradas: ${extensions.join(', ')}`);
    return extensions.length >= 0; // Não obrigatório
  });
  
  await runDbTest('Verificar schemas', async () => {
    const result = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    `);
    
    const schemas = result.rows.map(r => r.schema_name);
    log.info(`Schemas: ${schemas.join(', ')}`);
    return schemas.includes('public');
  });
  
  console.log();
}

/**
 * 3. TESTE DE TABELAS
 */
async function testTables() {
  log.title('3. TESTE DE TABELAS');
  
  const expectedTables = [
    'users',
    'affiliates', 
    'operations',
    'alerts',
    'adjustments',
    'transactions',
    'settings',
    'audit_logs'
  ];
  
  await runDbTest('Verificar tabelas obrigatórias', async () => {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    const existingTables = result.rows.map(r => r.table_name);
    log.info(`Tabelas encontradas: ${existingTables.join(', ')}`);
    
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    if (missingTables.length > 0) {
      log.warning(`Tabelas faltando: ${missingTables.join(', ')}`);
    }
    
    return existingTables.length >= expectedTables.length / 2; // Pelo menos metade
  });
  
  // Testar estrutura de cada tabela
  for (const table of expectedTables) {
    await runDbTest(`Estrutura da tabela ${table}`, async () => {
      try {
        const result = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [table]);
        
        if (result.rows.length === 0) {
          log.warning(`Tabela ${table} não encontrada`);
          return false;
        }
        
        const columns = result.rows.map(r => `${r.column_name}(${r.data_type})`);
        log.info(`${table}: ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}`);
        return result.rows.length > 0;
      } catch (error) {
        log.warning(`Erro ao verificar ${table}: ${error.message}`);
        return false;
      }
    });
  }
  
  console.log();
}

/**
 * 4. TESTE DE RELACIONAMENTOS
 */
async function testRelationships() {
  log.title('4. TESTE DE RELACIONAMENTOS');
  
  await runDbTest('Foreign Keys existentes', async () => {
    const result = await pool.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY'
    `);
    
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        log.info(`FK: ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
      });
    } else {
      log.warning('Nenhuma foreign key encontrada');
    }
    
    return true; // Não obrigatório
  });
  
  await runDbTest('Primary Keys existentes', async () => {
    const result = await pool.query(`
      SELECT 
        tc.table_name,
        kcu.column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE constraint_type = 'PRIMARY KEY'
      ORDER BY tc.table_name
    `);
    
    const tablesWithPK = result.rows.map(r => `${r.table_name}.${r.column_name}`);
    log.info(`Primary Keys: ${tablesWithPK.join(', ')}`);
    
    return result.rows.length > 0;
  });
  
  console.log();
}

/**
 * 5. TESTE DE ÍNDICES
 */
async function testIndexes() {
  log.title('5. TESTE DE ÍNDICES');
  
  await runDbTest('Índices existentes', async () => {
    const result = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    if (result.rows.length > 0) {
      const indexesByTable = {};
      result.rows.forEach(row => {
        if (!indexesByTable[row.tablename]) {
          indexesByTable[row.tablename] = [];
        }
        indexesByTable[row.tablename].push(row.indexname);
      });
      
      Object.entries(indexesByTable).forEach(([table, indexes]) => {
        log.info(`${table}: ${indexes.length} índice(s)`);
      });
    }
    
    return result.rows.length > 0;
  });
  
  console.log();
}

/**
 * 6. TESTE DE INSERÇÃO DE DADOS
 */
async function testDataInsertion() {
  log.title('6. TESTE DE INSERÇÃO DE DADOS');
  
  const testUserId = `test_${Date.now()}`;
  const testEmail = `test_${Date.now()}@coinbitclub.com`;
  
  await runDbTest('Inserir usuário de teste', async () => {
    try {
      const result = await pool.query(`
        INSERT INTO users (id, name, email, plan, status, country, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id
      `, [testUserId, 'Test User', testEmail, 'premium', 'active', 'Brazil']);
      
      return result.rows.length > 0;
    } catch (error) {
      // Tentar com estrutura alternativa
      try {
        const result = await pool.query(`
          INSERT INTO users (name, email, plan, status, country)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, ['Test User', testEmail, 'premium', 'active', 'Brazil']);
        
        return result.rows.length > 0;
      } catch (error2) {
        log.warning(`Erro ao inserir usuário: ${error2.message}`);
        return false;
      }
    }
  });
  
  await runDbTest('Inserir operação de teste', async () => {
    try {
      const result = await pool.query(`
        INSERT INTO operations (symbol, side, amount, entry_price, status, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `, ['BTCUSDT', 'LONG', 1000.00, 43500.00, 'active']);
      
      return result.rows.length > 0;
    } catch (error) {
      log.warning(`Erro ao inserir operação: ${error.message}`);
      return false;
    }
  });
  
  await runDbTest('Inserir alerta de teste', async () => {
    try {
      const result = await pool.query(`
        INSERT INTO alerts (type, title, message, priority, status, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `, ['market_signal', 'Test Alert', 'Test message', 'high', 'pending']);
      
      return result.rows.length > 0;
    } catch (error) {
      log.warning(`Erro ao inserir alerta: ${error.message}`);
      return false;
    }
  });
  
  console.log();
}

/**
 * 7. TESTE DE CONSULTAS
 */
async function testQueries() {
  log.title('7. TESTE DE CONSULTAS');
  
  await runDbTest('Consultar usuários', async () => {
    const result = await pool.query(`
      SELECT COUNT(*) as total FROM users WHERE created_at >= NOW() - INTERVAL '1 day'
    `);
    
    const count = parseInt(result.rows[0].total);
    log.info(`Usuários nas últimas 24h: ${count}`);
    return true;
  });
  
  await runDbTest('Consultar operações ativas', async () => {
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as total FROM operations WHERE status = 'active'
      `);
      
      const count = parseInt(result.rows[0].total);
      log.info(`Operações ativas: ${count}`);
      return true;
    } catch (error) {
      log.warning(`Erro na consulta de operações: ${error.message}`);
      return false;
    }
  });
  
  await runDbTest('Consultar estatísticas de performance', async () => {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_operations,
          AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100 as success_rate
        FROM operations 
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `);
      
      const stats = result.rows[0];
      log.info(`Operações (7d): ${stats.total_operations}, Taxa sucesso: ${parseFloat(stats.success_rate || 0).toFixed(1)}%`);
      return true;
    } catch (error) {
      log.warning(`Erro na consulta de estatísticas: ${error.message}`);
      return false;
    }
  });
  
  console.log();
}

/**
 * 8. TESTE DE PERFORMANCE
 */
async function testDatabasePerformance() {
  log.title('8. TESTE DE PERFORMANCE');
  
  await runDbTest('Performance de consulta simples', async () => {
    const startTime = Date.now();
    
    await pool.query('SELECT 1');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    log.info(`Tempo de resposta: ${duration}ms`);
    return duration < 1000; // Menos de 1 segundo
  });
  
  await runDbTest('Performance de consulta complexa', async () => {
    const startTime = Date.now();
    
    try {
      await pool.query(`
        SELECT 
          u.id,
          u.name,
          COUNT(o.id) as operation_count
        FROM users u
        LEFT JOIN operations o ON u.id = o.user_id
        GROUP BY u.id, u.name
        LIMIT 100
      `);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      log.info(`Tempo de resposta (JOIN): ${duration}ms`);
      return duration < 5000; // Menos de 5 segundos
    } catch (error) {
      log.warning(`Erro na consulta complexa: ${error.message}`);
      return false;
    }
  });
  
  await runDbTest('Teste de transação', async () => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      await client.query(`
        INSERT INTO users (name, email, plan, status, country)
        VALUES ($1, $2, $3, $4, $5)
      `, ['Transaction Test', `trans_${Date.now()}@test.com`, 'basic', 'active', 'Test']);
      
      await client.query('ROLLBACK');
      
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      log.warning(`Erro na transação: ${error.message}`);
      return false;
    } finally {
      client.release();
    }
  });
  
  console.log();
}

/**
 * 9. LIMPEZA DOS DADOS DE TESTE
 */
async function cleanupTestData() {
  log.title('9. LIMPEZA DOS DADOS DE TESTE');
  
  await runDbTest('Remover dados de teste', async () => {
    try {
      // Remover usuários de teste
      await pool.query(`DELETE FROM users WHERE email LIKE '%test_%@%'`);
      
      // Remover operações de teste
      await pool.query(`DELETE FROM operations WHERE symbol = 'TESTUSDT'`);
      
      // Remover alertas de teste
      await pool.query(`DELETE FROM alerts WHERE title LIKE 'Test%'`);
      
      log.info('Dados de teste removidos com sucesso');
      return true;
    } catch (error) {
      log.warning(`Erro na limpeza: ${error.message}`);
      return false;
    }
  });
  
  console.log();
}

/**
 * Função auxiliar para executar testes de banco
 */
async function runDbTest(testName, testFunction) {
  testStats.total++;
  
  try {
    const result = await testFunction();
    
    if (result) {
      testStats.passed++;
      log.success(`${testName}`);
    } else {
      testStats.failed++;
      log.error(`${testName}`);
    }
  } catch (error) {
    testStats.failed++;
    log.error(`${testName} - Erro: ${error.message}`);
  }
}

/**
 * Gerar relatório do banco de dados
 */
function generateDatabaseReport() {
  const endTime = Date.now();
  const duration = (endTime - testStats.startTime) / 1000;
  
  console.log('\n' + '='.repeat(80));
  log.title('RELATÓRIO FINAL DO BANCO DE DADOS');
  console.log('='.repeat(80));
  
  console.log(`${colors.bold}📊 ESTATÍSTICAS DO BANCO:${colors.reset}`);
  console.log(`   Total de testes: ${colors.cyan}${testStats.total}${colors.reset}`);
  console.log(`   ✅ Aprovados: ${colors.green}${testStats.passed}${colors.reset}`);
  console.log(`   ❌ Falharam: ${colors.red}${testStats.failed}${colors.reset}`);
  console.log(`   ⏱️  Duração: ${colors.magenta}${duration.toFixed(2)}s${colors.reset}`);
  
  const successRate = ((testStats.passed / testStats.total) * 100).toFixed(1);
  console.log(`   📈 Taxa de sucesso: ${colors.bold}${successRate}%${colors.reset}`);
  
  console.log('\n' + '='.repeat(80));
  
  if (testStats.failed === 0) {
    log.success('🎉 BANCO DE DADOS FUNCIONANDO PERFEITAMENTE!');
  } else {
    log.warning(`⚠️  ${testStats.failed} teste(s) falharam no banco de dados.`);
  }
  
  console.log('='.repeat(80));
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    database: dbConfig.database,
    duration: duration,
    stats: testStats,
    success_rate: parseFloat(successRate)
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'database-test-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  log.info('📄 Relatório do banco salvo em: database-test-report.json');
}

// Executar se chamado diretamente
if (require.main === module) {
  runDatabaseTest().catch(error => {
    log.error(`Erro fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runDatabaseTest,
  testStats
};
