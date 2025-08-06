import { NextApiRequest, NextApiResponse } from 'next';
import { query, testConnection, checkTables } from '../../../src/lib/database-real';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Testando conexão com PostgreSQL...');
    
    // 1. Testar conexão básica
    const connectionTest = await testConnection();
    if (!connectionTest) {
      return res.status(500).json({ 
        error: 'Falha na conexão com PostgreSQL',
        connectionString: 'postgresql://postgres:***@yamabiko.proxy.rlwy.net:32866/railway'
      });
    }

    // 2. Verificar tabelas existentes
    const tables = await checkTables();
    
    // 3. Verificar estrutura de algumas tabelas principais
    const userTableStructure = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    const operationsTableStructure = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'trade_operations' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    // 4. Contar registros nas tabelas principais
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const operationsCount = await query('SELECT COUNT(*) as count FROM trade_operations');
    const affiliatesCount = await query('SELECT COUNT(*) as count FROM affiliates');
    const signalsCount = await query('SELECT COUNT(*) as count FROM trading_signals');

    // 5. Verificar último sinal recebido
    const lastSignal = await query(`
      SELECT id, symbol, action, source, created_at 
      FROM trading_signals 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    // 6. Verificar sistema de filas
    const queueStatus = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM signal_processing_queue
      GROUP BY status
      ORDER BY status
    `);

    // 7. Verificar health do sistema
    const systemHealth = await query(`
      SELECT 
        service_name,
        status,
        last_heartbeat,
        response_time_ms
      FROM system_health
      ORDER BY last_heartbeat DESC
      LIMIT 5
    `);

    const testResults = {
      connection: {
        status: 'connected',
        server: 'yamabiko.proxy.rlwy.net:32866',
        database: 'railway',
        timestamp: new Date().toISOString()
      },
      tables: {
        total: tables.length,
        available: tables.map(t => t.table_name),
        usersStructure: userTableStructure.rows.length > 0,
        operationsStructure: operationsTableStructure.rows.length > 0
      },
      data: {
        users: parseInt(userCount.rows[0].count),
        operations: parseInt(operationsCount.rows[0].count),
        affiliates: parseInt(affiliatesCount.rows[0].count),
        signals: parseInt(signalsCount.rows[0].count)
      },
      lastSignal: lastSignal.rows[0] || null,
      queueStatus: queueStatus.rows || [],
      systemHealth: systemHealth.rows || [],
      schemas: {
        users: userTableStructure.rows || [],
        operations: operationsTableStructure.rows || []
      }
    };

    console.log('✅ Teste de conexão PostgreSQL realizado com sucesso');
    console.log(`📊 Tabelas encontradas: ${tables.length}`);
    console.log(`👥 Usuários no banco: ${userCount.rows[0].count}`);
    console.log(`📈 Operações no banco: ${operationsCount.rows[0].count}`);

    return res.status(200).json(testResults);

  } catch (error) {
    console.error('❌ Erro no teste de conexão PostgreSQL:', error);
    return res.status(500).json({ 
      error: 'Erro no teste de conexão',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
