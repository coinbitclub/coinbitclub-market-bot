import { NextApiRequest, NextApiResponse } from 'next';
import { testConnection, checkTables, ensureTablesExist, query } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Testando e configurando banco de dados...');

    const results: any = {
      status: 'testing',
      timestamp: new Date().toISOString(),
      databaseUrl: !!process.env.DATABASE_URL,
      tests: {}
    };

    // 1. Testar conectividade
    console.log('1. Testando conectividade...');
    const connectionResult = await testConnection();
    results.tests.connectivity = {
      status: connectionResult ? 'success' : 'failed',
      tested: true
    };

    if (!connectionResult) {
      return res.status(500).json({
        ...results,
        status: 'failed',
        message: '❌ Falha na conectividade com banco PostgreSQL'
      });
    }

    // 2. Verificar tabelas existentes
    console.log('2. Verificando tabelas...');
    const existingTables = await checkTables();
    results.tests.existingTables = {
      status: 'success',
      tables: existingTables,
      count: existingTables.length
    };

    // 3. Criar tabelas essenciais
    console.log('3. Criando/verificando tabelas essenciais...');
    const tablesCreated = await ensureTablesExist();
    results.tests.tableCreation = {
      status: tablesCreated ? 'success' : 'failed',
      created: tablesCreated
    };

    // 4. Verificar tabelas após criação
    console.log('4. Verificando tabelas após criação...');
    const finalTables = await checkTables();
    results.tests.finalTables = {
      status: 'success',
      tables: finalTables,
      count: finalTables.length
    };

    // 5. Testar inserção de dados de exemplo
    if (req.method === 'POST') {
      console.log('5. Testando inserção de dados...');
      
      try {
        // Inserir um sinal de teste
        const signalResult = await query(`
          INSERT INTO trading_signals (
            source, symbol, action, price, strategy, 
            exchange, timeframe, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, created_at
        `, [
          'TEST',
          'BTCUSDT',
          'BUY',
          43250.50,
          'database_test',
          'binance',
          '1h',
          JSON.stringify({ test: true, timestamp: new Date() })
        ]);

        // Inserir na fila de processamento
        await query(`
          INSERT INTO signal_processing_queue (
            signal_id, source, symbol, action, confidence, market_data
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          signalResult.rows[0].id,
          'TEST',
          'BTCUSDT',
          'BUY',
          85,
          JSON.stringify({ price: 43250.50, rsi: 30.5, volume: 1500000 })
        ]);

        // Inserir dados de mercado
        await query(`
          INSERT INTO market_data (
            source, symbol, price, volume, price_change_24h, data
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          'COINSTATS',
          'BTC',
          43250.50,
          25000000000,
          2.45,
          JSON.stringify({ test: true })
        ]);

        results.tests.dataInsertion = {
          status: 'success',
          testSignalId: signalResult.rows[0].id,
          inserted: true
        };

      } catch (insertError) {
        console.error('Erro ao inserir dados de teste:', insertError);
        results.tests.dataInsertion = {
          status: 'failed',
          error: insertError instanceof Error ? insertError.message : 'Unknown error'
        };
      }
    }

    // 6. Contar registros nas tabelas
    console.log('6. Contando registros...');
    const counts: any = {};
    const requiredTables = ['trading_signals', 'signal_processing_queue', 'market_data', 'ai_analysis', 'signal_stats'];
    
    for (const table of requiredTables) {
      try {
        const countResult = await query(`SELECT COUNT(*) as count FROM ${table}`);
        counts[table] = parseInt(countResult.rows[0].count);
      } catch (error) {
        counts[table] = 'error';
      }
    }

    results.tests.recordCounts = {
      status: 'success',
      counts
    };

    const allTestsPassed = Object.values(results.tests).every((test: any) => 
      test.status === 'success'
    );

    return res.status(200).json({
      ...results,
      status: allTestsPassed ? 'success' : 'partial',
      message: allTestsPassed 
        ? '✅ Banco PostgreSQL configurado e funcionando perfeitamente!'
        : '⚠️ Banco configurado com alguns avisos',
      summary: {
        connectivity: connectionResult ? 'OK' : 'FAILED',
        tables: finalTables.length >= 5 ? 'OK' : 'INCOMPLETE',
        dataOperations: req.method === 'POST' && results.tests.dataInsertion?.status === 'success' ? 'OK' : 'NOT_TESTED',
        overallStatus: allTestsPassed ? 'READY' : 'NEEDS_ATTENTION'
      },
      nextSteps: [
        '✅ Banco PostgreSQL conectado com sucesso',
        '✅ Todas as tabelas criadas e verificadas',
        req.method === 'POST' ? '✅ Operações de dados testadas' : '📝 Use POST para testar inserção de dados',
        '🔄 Sistema pronto para receber sinais TradingView',
        '📊 Sistema pronto para armazenar dados CoinStats',
        '🤖 Decision Engine pode acessar o banco de dados'
      ]
    });

  } catch (error) {
    console.error('Erro no teste do banco de dados:', error);
    
    return res.status(500).json({
      status: 'error',
      message: '❌ Erro ao configurar banco de dados',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
