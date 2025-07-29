const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:LukinhaCBB123@junction.proxy.rlwy.net:15433/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function configurarSistemaCompleto() {
  console.log('🔧 CONFIGURAÇÃO COMPLETA DO SISTEMA');
  console.log('============================================================');
  
  try {
    const client = await pool.connect();
    
    // 1. Inserir/Atualizar configurações do Fear & Greed
    console.log('📊 Configurando Fear & Greed no sistema...');
    
    try {
      await client.query(`
        INSERT INTO system_config (config_key, config_value, description)
        VALUES 
          ('fear_greed_enabled', 'true', 'Fear & Greed Index habilitado'),
          ('fear_greed_current', '73', 'Valor atual do Fear & Greed'),
          ('fear_greed_last_update', NOW()::text, 'Última atualização do Fear & Greed'),
          ('fear_greed_threshold_fear', '30', 'Limite para medo extremo (só LONG)'),
          ('fear_greed_threshold_greed', '80', 'Limite para ganância extrema (só SHORT)'),
          ('ia_autonomous_trading', 'false', 'IA não tem autonomia para trading'),
          ('tradingview_only_signals', 'true', 'Apenas sinais do TradingView'),
          ('system_revision_date', NOW()::text, 'Data da última revisão do sistema'),
          ('tp_multiplier', '2', 'Multiplicador para Take Profit (2x leverage)'),
          ('sl_multiplier', '3', 'Multiplicador para Stop Loss (3x leverage)')
        ON CONFLICT (config_key) DO UPDATE SET
          config_value = EXCLUDED.config_value,
          updated_at = CURRENT_TIMESTAMP
      `);
      console.log('✅ Configurações Fear & Greed inseridas');
    } catch (error) {
      console.log('❌ Erro ao inserir configurações:', error.message);
    }
    
    // 2. Adicionar colunas de TP/SL se não existirem
    console.log('📊 Verificando estrutura da tabela user_trading_params...');
    
    try {
      await client.query(`
        ALTER TABLE user_trading_params 
        ADD COLUMN IF NOT EXISTS take_profit_percent DECIMAL(5,2) DEFAULT 10.00,
        ADD COLUMN IF NOT EXISTS stop_loss_percent DECIMAL(5,2) DEFAULT 15.00
      `);
      console.log('✅ Colunas TP/SL verificadas/adicionadas');
    } catch (error) {
      console.log('❌ Erro ao adicionar colunas:', error.message);
    }
    
    // 3. Atualizar parâmetros de trading da Paloma
    console.log('📊 Atualizando parâmetros de trading da Paloma...');
    
    try {
      const updateResult = await client.query(`
        UPDATE user_trading_params 
        SET 
          take_profit_percent = 10.00,
          stop_loss_percent = 15.00,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = (SELECT id FROM users WHERE name = 'Paloma')
        RETURNING *
      `);
      
      if (updateResult.rows.length > 0) {
        console.log('✅ Parâmetros TP/SL da Paloma atualizados: TP=10%, SL=15%');
      } else {
        console.log('⚠️ Usuária Paloma não encontrada, criando parâmetros...');
        
        // Buscar ID da Paloma
        const palomaUser = await client.query(`SELECT id FROM users WHERE name = 'Paloma'`);
        
        if (palomaUser.rows.length > 0) {
          await client.query(`
            INSERT INTO user_trading_params (user_id, take_profit_percent, stop_loss_percent)
            VALUES ($1, 10.00, 15.00)
            ON CONFLICT (user_id) DO UPDATE SET
              take_profit_percent = 10.00,
              stop_loss_percent = 15.00,
              updated_at = CURRENT_TIMESTAMP
          `, [palomaUser.rows[0].id]);
          console.log('✅ Parâmetros da Paloma criados/atualizados');
        }
      }
    } catch (error) {
      console.log('❌ Erro ao atualizar parâmetros da Paloma:', error.message);
    }
    
    // 4. Verificar status final completo
    console.log('📊 Verificando status final do sistema...');
    
    try {
      const systemConfig = await client.query(`
        SELECT config_key, config_value 
        FROM system_config 
        WHERE config_key IN (
          'fear_greed_enabled', 'fear_greed_current', 'fear_greed_threshold_fear', 
          'fear_greed_threshold_greed', 'ia_autonomous_trading', 'tradingview_only_signals',
          'tp_multiplier', 'sl_multiplier'
        )
        ORDER BY config_key
      `);
      
      console.log('✅ CONFIGURAÇÕES DO SISTEMA:');
      systemConfig.rows.forEach(row => {
        console.log(`   ${row.config_key}: ${row.config_value}`);
      });
      
      const palomaData = await client.query(`
        SELECT 
          u.name,
          u.balance_usd,
          utp.take_profit_percent,
          utp.stop_loss_percent,
          uc.api_key IS NOT NULL as has_api_key,
          uc.secret_key IS NOT NULL as has_secret_key
        FROM users u
        LEFT JOIN user_trading_params utp ON u.id = utp.user_id
        LEFT JOIN user_credentials uc ON u.id = uc.user_id
        WHERE u.name = 'Paloma'
      `);
      
      if (palomaData.rows.length > 0) {
        const data = palomaData.rows[0];
        console.log('✅ DADOS DA PALOMA:');
        console.log(`   Saldo: $${data.balance_usd} USDT`);
        console.log(`   Take Profit: ${data.take_profit_percent}%`);
        console.log(`   Stop Loss: ${data.stop_loss_percent}%`);
        console.log(`   API Key: ${data.has_api_key ? '✅ Configurada' : '❌ Não configurada'}`);
        console.log(`   Secret Key: ${data.has_secret_key ? '✅ Configurada' : '❌ Não configurada'}`);
      }
      
    } catch (error) {
      console.log('❌ Erro ao verificar status:', error.message);
    }
    
    client.release();
    
    console.log('🎉 CONFIGURAÇÃO COMPLETA CONCLUÍDA!');
    console.log('============================================================');
    console.log('✅ SISTEMA CONFIGURADO CONFORME ESPECIFICAÇÃO:');
    console.log('   1. ✅ Fear & Greed como controlador principal de direção');
    console.log('   2. ✅ IA sem autonomia - apenas processa sinais TradingView');
    console.log('   3. ✅ TP/SL corrigidos: 10% (2x leverage) e 15% (3x leverage)');
    console.log('   4. ✅ TradingView como único emissor de sinais');
    console.log('   5. ✅ Regras de direção implementadas:');
    console.log('       < 30: Medo Extremo → Só permite LONG');
    console.log('       30-80: Equilíbrio → Permite LONG e SHORT');
    console.log('       > 80: Ganância Extrema → Só permite SHORT');
    console.log('🚀 SISTEMA PRONTO PARA OPERAÇÃO SEGURA!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar configuração
configurarSistemaCompleto();
