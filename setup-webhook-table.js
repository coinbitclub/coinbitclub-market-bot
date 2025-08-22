// ========================================
// CRIAR TABELA WEBHOOK SIGNALS
// ========================================

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function criarTabelaWebhookSignals() {
  try {
    console.log('🗃️ Criando tabela webhook_signals...');

    // Criar tabela webhook_signals
    await pool.query(`
      CREATE TABLE IF NOT EXISTS webhook_signals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source VARCHAR(50) NOT NULL DEFAULT 'TRADINGVIEW',
          webhook_id VARCHAR(255),
          raw_data JSONB NOT NULL,
          parsed_data JSONB,
          token VARCHAR(100),
          ip_address INET,
          user_agent TEXT,
          received_at TIMESTAMP WITH TIME ZONE NOT NULL,
          processed BOOLEAN DEFAULT false,
          processed_at TIMESTAMP WITH TIME ZONE,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tabela webhook_signals criada');

    // Criar índices
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_webhook_signals_received_at ON webhook_signals(received_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_webhook_signals_processed ON webhook_signals(processed, received_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_webhook_signals_source ON webhook_signals(source)`);

    console.log('✅ Índices criados');

    // Adicionar campo na tabela trading_positions
    await pool.query(`
      ALTER TABLE trading_positions 
      ADD COLUMN IF NOT EXISTS webhook_signal_id UUID
    `);

    console.log('✅ Campo webhook_signal_id adicionado à trading_positions');

    // Criar índice para relacionamento
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_trading_positions_webhook_signal ON trading_positions(webhook_signal_id)`);

    console.log('✅ Índice de relacionamento criado');

    // Inserir registro de teste
    await pool.query(`
      INSERT INTO webhook_signals (
          source, webhook_id, raw_data, token, ip_address,
          received_at, processed
      ) VALUES (
          'TRADINGVIEW', 
          'test-webhook-001',
          '{"message": "Sistema de webhook configurado com sucesso", "test": true}',
          '210406',
          '127.0.0.1',
          CURRENT_TIMESTAMP,
          true
      ) ON CONFLICT DO NOTHING
    `);

    console.log('✅ Registro de teste inserido');

    // Verificar estrutura
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'webhook_signals' 
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Estrutura da tabela webhook_signals:');
    result.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });

    console.log('\n🎉 Banco de dados preparado para receber webhooks!');

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
  } finally {
    await pool.end();
  }
}

criarTabelaWebhookSignals();
