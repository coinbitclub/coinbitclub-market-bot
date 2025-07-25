const { Pool } = require('pg');

// Configuração do PostgreSQL Railway
const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: { rejectUnauthorized: false }
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('🔍 Query executada em:', duration, 'ms');
  return res;
}

async function fixDatabaseIssues() {
  console.log('🔧 Corrigindo problemas do banco de dados...\n');
  
  try {
    // 1. Adicionar coluna 'type' na tabela stripe_products se não existir
    console.log('1️⃣ Corrigindo tabela stripe_products...');
    try {
      await query(`
        ALTER TABLE stripe_products 
        ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'product'
      `);
      console.log('✅ Coluna type adicionada na tabela stripe_products');
    } catch (error) {
      console.log('ℹ️ Coluna type já existe ou erro:', error.message);
    }

    // 2. Modificar coluna 'value' na tabela fear_greed_index para permitir NULL
    console.log('\n2️⃣ Corrigindo tabela fear_greed_index...');
    try {
      await query(`
        ALTER TABLE fear_greed_index 
        ALTER COLUMN value DROP NOT NULL
      `);
      console.log('✅ Coluna value agora permite NULL na tabela fear_greed_index');
    } catch (error) {
      console.log('ℹ️ Erro ao modificar coluna value:', error.message);
    }

    // 3. Adicionar coluna 'title' na tabela notifications se não existir
    console.log('\n3️⃣ Corrigindo tabela notifications...');
    try {
      await query(`
        ALTER TABLE notifications 
        ADD COLUMN IF NOT EXISTS title VARCHAR(255)
      `);
      console.log('✅ Coluna title adicionada na tabela notifications');
    } catch (error) {
      console.log('ℹ️ Coluna title já existe ou erro:', error.message);
    }

    // 4. Criar tabela coin_prices se não existir
    console.log('\n4️⃣ Criando tabela coin_prices...');
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS coin_prices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          coin_id VARCHAR(50) NOT NULL,
          symbol VARCHAR(20) NOT NULL,
          name VARCHAR(100) NOT NULL,
          price DECIMAL(20,8),
          market_cap BIGINT,
          volume_24h DECIMAL(20,8),
          change_1d DECIMAL(10,4),
          change_7d DECIMAL(10,4),
          rank INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(coin_id, DATE(created_at))
        )
      `);
      console.log('✅ Tabela coin_prices criada com sucesso');
    } catch (error) {
      console.log('ℹ️ Tabela coin_prices já existe ou erro:', error.message);
    }

    // 5. Criar índices para melhor performance
    console.log('\n5️⃣ Criando índices para performance...');
    
    const indexes = [
      {
        name: 'idx_coin_prices_symbol_date',
        sql: 'CREATE INDEX IF NOT EXISTS idx_coin_prices_symbol_date ON coin_prices(symbol, created_at DESC)'
      },
      {
        name: 'idx_coin_prices_coin_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_coin_prices_coin_id ON coin_prices(coin_id)'
      },
      {
        name: 'idx_notifications_user_type',
        sql: 'CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type)'
      },
      {
        name: 'idx_fear_greed_timestamp',
        sql: 'CREATE INDEX IF NOT EXISTS idx_fear_greed_timestamp ON fear_greed_index(timestamp_data DESC)'
      }
    ];

    for (const idx of indexes) {
      try {
        await query(idx.sql);
        console.log(`✅ Índice ${idx.name} criado`);
      } catch (error) {
        console.log(`ℹ️ Índice ${idx.name} já existe:`, error.message.split('\n')[0]);
      }
    }

    // 6. Corrigir função process_coinstats_fear_greed
    console.log('\n6️⃣ Corrigindo função process_coinstats_fear_greed...');
    try {
      await query(`
        CREATE OR REPLACE FUNCTION process_coinstats_fear_greed(api_response JSONB)
        RETURNS UUID AS $$
        DECLARE
            fg_value INTEGER;
            fg_classification TEXT;
            fg_classificacao_pt TEXT;
            result_id UUID;
        BEGIN
            -- Extrair valor (permitir NULL)
            BEGIN
                fg_value := NULLIF((api_response->>'value'), '')::INTEGER;
            EXCEPTION
                WHEN OTHERS THEN
                    fg_value := NULL;
            END;
            
            -- Extrair classificação
            fg_classification := COALESCE(api_response->>'classification', 'Unknown');
            
            -- Traduzir classificação para português
            fg_classificacao_pt := CASE 
                WHEN fg_classification = 'Extreme Fear' THEN 'Medo Extremo'
                WHEN fg_classification = 'Fear' THEN 'Medo'
                WHEN fg_classification = 'Neutral' THEN 'Neutro'
                WHEN fg_classification = 'Greed' THEN 'Ganância'
                WHEN fg_classification = 'Extreme Greed' THEN 'Ganância Extrema'
                ELSE fg_classification
            END;
            
            -- Inserir dados (value pode ser NULL agora)
            INSERT INTO fear_greed_index (
                timestamp_data,
                value,
                classification,
                classificacao_pt,
                value_previous,
                change_24h,
                source,
                raw_payload
            ) VALUES (
                NOW(),
                fg_value,  -- Pode ser NULL
                fg_classification,
                fg_classificacao_pt,
                CASE 
                    WHEN api_response->>'value_previous' IS NOT NULL AND api_response->>'value_previous' != '' 
                    THEN (api_response->>'value_previous')::INTEGER 
                    ELSE NULL 
                END,
                CASE 
                    WHEN api_response->>'change_24h' IS NOT NULL AND api_response->>'change_24h' != '' 
                    THEN (api_response->>'change_24h')::INTEGER 
                    ELSE NULL 
                END,
                'COINSTATS',
                api_response
            ) RETURNING id INTO result_id;
            
            RETURN result_id;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('✅ Função process_coinstats_fear_greed corrigida');
    } catch (error) {
      console.log('⚠️ Erro ao corrigir função:', error.message);
    }

    console.log('\n🎉 Todas as correções foram aplicadas com sucesso!');
    
    // Teste rápido das correções
    console.log('\n📊 Testando correções...');
    
    // Testar stripe_products
    const stripeTest = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'stripe_products' AND column_name = 'type'");
    console.log('✅ Coluna type em stripe_products:', stripeTest.rows.length > 0 ? 'EXISTS' : 'NOT EXISTS');
    
    // Testar notifications
    const notificationTest = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'title'");
    console.log('✅ Coluna title em notifications:', notificationTest.rows.length > 0 ? 'EXISTS' : 'NOT EXISTS');
    
    // Testar coin_prices
    const coinPricesTest = await query("SELECT table_name FROM information_schema.tables WHERE table_name = 'coin_prices'");
    console.log('✅ Tabela coin_prices:', coinPricesTest.rows.length > 0 ? 'EXISTS' : 'NOT EXISTS');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

fixDatabaseIssues();
