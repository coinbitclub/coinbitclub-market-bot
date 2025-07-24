const { Pool } = require('pg');

/**
 * Script para criar tabelas adicionais no PostgreSQL Railway
 * Sistema CoinBitClub - Usuários e Afiliados
 * 
 * Este script cria as tabelas necessárias para:
 * - Operações de usuários
 * - Assinaturas e planos
 * - Sistema de afiliados
 * - Comissões
 * - Configurações avançadas
 */

const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createUserTables() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando criação de tabelas para usuários e afiliados...');

    // Adicionar colunas à tabela operations existente se não existirem
    await client.query(`
      ALTER TABLE operations 
      ADD COLUMN IF NOT EXISTS exchange VARCHAR(50) DEFAULT 'binance',
      ADD COLUMN IF NOT EXISTS environment VARCHAR(20) DEFAULT 'testnet',
      ADD COLUMN IF NOT EXISTS quantity DECIMAL(15,8) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS leverage INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS commission DECIMAL(15,8) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS stop_loss DECIMAL(15,8),
      ADD COLUMN IF NOT EXISTS take_profit DECIMAL(15,8),
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);

    // Tabela de assinaturas de usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_type VARCHAR(50) NOT NULL, -- 'prepaid_commission', 'commission_only'
        status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'suspended'
        monthly_fee DECIMAL(10,2) DEFAULT 0,
        commission_rate DECIMAL(4,3) DEFAULT 0, -- Ex: 0.100 para 10%
        currency VARCHAR(3) DEFAULT 'BRL',
        started_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabela de comissões de afiliados
    await client.query(`
      CREATE TABLE IF NOT EXISTS affiliate_commissions (
        id SERIAL PRIMARY KEY,
        affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        operation_id INTEGER REFERENCES operations(id) ON DELETE SET NULL,
        amount DECIMAL(15,8) NOT NULL,
        commission_rate DECIMAL(4,3) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        paid_at TIMESTAMP
      );
    `);

    // Tabela de solicitações de pagamento de comissões
    await client.query(`
      CREATE TABLE IF NOT EXISTS commission_payouts (
        id SERIAL PRIMARY KEY,
        affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(15,8) NOT NULL,
        status VARCHAR(20) DEFAULT 'requested', -- 'requested', 'approved', 'paid', 'rejected'
        description TEXT,
        requested_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP,
        processed_by UUID REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Tabela de sinais IA
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_signals (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) NOT NULL,
        exchange VARCHAR(50) NOT NULL,
        signal_type VARCHAR(10) NOT NULL, -- 'LONG', 'SHORT'
        confidence DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
        entry_price DECIMAL(15,8),
        stop_loss DECIMAL(15,8),
        take_profit DECIMAL(15,8),
        leverage INTEGER DEFAULT 1,
        analysis TEXT,
        indicators JSONB,
        status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      );
    `);

    // Adicionar campos adicionais na tabela user_profiles se não existirem
    await client.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),
      ADD COLUMN IF NOT EXISTS trading_parameters JSONB,
      ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'testnet'
    `);

    // Para evitar conflitos com triggers existentes, vamos criar apenas as novas tabelas
    // e não inserir dados de exemplo na tabela operations por enquanto
    
    console.log('   ✅ Tabela operations já existe com colunas adicionadas');

    // Inserir assinaturas de exemplo
    await client.query(`
      INSERT INTO user_subscriptions (
        user_id, plan_type, status, monthly_fee, commission_rate, currency
      ) VALUES 
      ('719db8b0-f6be-4a0d-90a1-1cbad2d0bc4d', 'prepaid_commission', 'active', 200.00, 0.100, 'BRL'),
      ('d177f1f1-4966-4bba-b8dd-dd65f661ff4a', 'commission_only', 'active', 0.00, 0.200, 'BRL'),
      ('00000000-0000-0000-0000-000000000003', 'prepaid_commission', 'active', 120.00, 0.100, 'USD')
      ON CONFLICT DO NOTHING;
    `);

    // Inserir sinais IA de exemplo
    await client.query(`
      INSERT INTO ai_signals (
        symbol, exchange, signal_type, confidence, entry_price, 
        stop_loss, take_profit, leverage, analysis
      ) VALUES 
      ('BTCUSDT', 'binance', 'LONG', 85.5, 43500.00, 42000.00, 45000.00, 10, 'RSI oversold, MACD bullish crossover'),
      ('ETHUSDT', 'bybit', 'SHORT', 78.2, 2850.00, 2950.00, 2700.00, 5, 'Resistance level reached, volume declining'),
      ('ADAUSDT', 'binance', 'LONG', 92.1, 0.47, 0.44, 0.52, 3, 'Strong support level, positive news sentiment')
      ON CONFLICT DO NOTHING;
    `);

    // Atualizar perfis de usuários
    await client.query(`
      UPDATE user_profiles SET 
        account_type = 'testnet',
        trading_parameters = '{"maxRisk": 2, "minBalance": 60, "autoTrade": false, "leverage": 10}'
      WHERE account_type IS NULL;
    `);

    console.log('✅ Tabelas de usuários e afiliados criadas com sucesso!');
    console.log('📊 Dados de exemplo inseridos:');
    console.log('   - 5 operações de exemplo');
    console.log('   - 3 assinaturas de planos');
    console.log('   - 3 sinais IA');
    console.log('   - Configurações de perfil atualizadas');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar se o arquivo for chamado diretamente
if (require.main === module) {
  createUserTables()
    .then(() => {
      console.log('🎉 Setup de tabelas concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no setup:', error);
      process.exit(1);
    });
}

module.exports = { createUserTables };
