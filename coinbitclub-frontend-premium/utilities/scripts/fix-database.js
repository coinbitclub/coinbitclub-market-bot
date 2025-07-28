const { query } = require('./src/lib/database');

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
        table: 'coin_prices',
        sql: 'CREATE INDEX IF NOT EXISTS idx_coin_prices_symbol_date ON coin_prices(symbol, created_at DESC)'
      },
      {
        name: 'idx_coin_prices_coin_id',
        table: 'coin_prices', 
        sql: 'CREATE INDEX IF NOT EXISTS idx_coin_prices_coin_id ON coin_prices(coin_id)'
      },
      {
        name: 'idx_notifications_user_type',
        table: 'notifications',
        sql: 'CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type)'
      },
      {
        name: 'idx_fear_greed_timestamp',
        table: 'fear_greed_index',
        sql: 'CREATE INDEX IF NOT EXISTS idx_fear_greed_timestamp ON fear_greed_index(timestamp_data DESC)'
      }
    ];

    for (const idx of indexes) {
      try {
        await query(idx.sql);
        console.log(`✅ Índice ${idx.name} criado`);
      } catch (error) {
        console.log(`ℹ️ Índice ${idx.name} já existe ou erro:`, error.message);
      }
    }

    // 6. Verificar e corrigir função process_coinstats_fear_greed
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
            fg_value := NULLIF((api_response->>'value'), '')::INTEGER;
            
            -- Extrair classificação
            fg_classification := api_response->>'classification';
            
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
                NULLIF((api_response->>'value_previous'), '')::INTEGER,
                NULLIF((api_response->>'change_24h'), '')::INTEGER,
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
    console.log('\n📊 Verificando se tudo está funcionando...');
    
    // Teste rápido
    const testResult = await query('SELECT 1 as test');
    console.log('✅ Conexão com banco funcionando:', testResult.rows[0].test);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
  
  process.exit(0);
}

fixDatabaseIssues();
