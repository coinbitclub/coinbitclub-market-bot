const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FYHVNKLIXYmRWdRLKNnYdCXhGNsgjLSr@autorack.proxy.rlwy.net:39170/railway'
});

// Função para testar o webhook diretamente
async function testWebhookReception() {
  console.log('📡 TESTANDO RECEPÇÃO DE WEBHOOKS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const testSignal = {
    symbol: 'BTCUSDT',
    action: 'BUY',
    price: 43500,
    quantity: 0.001,
    timestamp: new Date().toISOString(),
    source: 'DIAGNOSTIC_TEST'
  };
  
  try {
    const response = await axios.post(
      'https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal?token=210406',
      testSignal,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Webhook Response: ${response.status} - ${JSON.stringify(response.data)}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`❌ Webhook Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    return { success: false, error: error.message };
  }
}

// Função para verificar tabelas do banco
async function checkDatabaseTables() {
  console.log('🗄️ VERIFICANDO ESTRUTURA DO BANCO:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const tables = [
    'trading_signals',
    'trading_operations', 
    'market_decisions',
    'users',
    'user_trading_configs',
    'commission_history'
  ];
  
  for (const table of tables) {
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = $1
      `, [table]);
      
      if (result.rows[0].count > 0) {
        const countResult = await pool.query(`SELECT COUNT(*) as total FROM ${table}`);
        console.log(`✅ ${table}: EXISTS (${countResult.rows[0].total} registros)`);
      } else {
        console.log(`❌ ${table}: NÃO EXISTE`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ERRO - ${error.message}`);
    }
  }
  console.log('');
}

// Função para verificar sinais recebidos
async function checkReceivedSignals() {
  console.log('📨 VERIFICANDO SINAIS RECEBIDOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Verificar últimos sinais
    const signalsResult = await pool.query(`
      SELECT 
        id,
        symbol,
        action,
        price,
        quantity,
        status,
        source,
        created_at,
        processed_at,
        error_message
      FROM trading_signals 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (signalsResult.rows.length > 0) {
      console.log(`📊 Encontrados ${signalsResult.rows.length} sinais recentes:`);
      signalsResult.rows.forEach((signal, index) => {
        const timestamp = new Date(signal.created_at).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        });
        
        let statusEmoji = '';
        switch(signal.status) {
          case 'pending': statusEmoji = '⏳'; break;
          case 'processing': statusEmoji = '🔄'; break;
          case 'completed': statusEmoji = '✅'; break;
          case 'failed': statusEmoji = '❌'; break;
          case 'rejected': statusEmoji = '🚫'; break;
          default: statusEmoji = '❓'; break;
        }
        
        console.log(`${statusEmoji} [${index + 1}] ${signal.symbol} ${signal.action} - ${timestamp}`);
        console.log(`    Preço: $${signal.price} | Qtd: ${signal.quantity} | Status: ${signal.status}`);
        console.log(`    Fonte: ${signal.source || 'N/A'}`);
        
        if (signal.processed_at) {
          const processedTime = new Date(signal.processed_at).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
          });
          console.log(`    Processado: ${processedTime}`);
        }
        
        if (signal.error_message) {
          console.log(`    Erro: ${signal.error_message}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ NENHUM SINAL ENCONTRADO na tabela trading_signals');
      console.log('⚠️ Isso indica que os sinais não estão sendo salvos no banco!');
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar sinais: ${error.message}`);
  }
  console.log('');
}

// Função para verificar operações abertas
async function checkTradingOperations() {
  console.log('💼 VERIFICANDO OPERAÇÕES DE TRADING:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const operationsResult = await pool.query(`
      SELECT 
        id,
        user_id,
        symbol,
        action,
        entry_price,
        quantity,
        status,
        pnl,
        created_at,
        closed_at
      FROM trading_operations 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (operationsResult.rows.length > 0) {
      console.log(`📊 Encontradas ${operationsResult.rows.length} operações recentes:`);
      operationsResult.rows.forEach((op, index) => {
        const timestamp = new Date(op.created_at).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        });
        
        let statusEmoji = '';
        switch(op.status) {
          case 'open': statusEmoji = '🔓'; break;
          case 'closed': statusEmoji = '🔒'; break;
          case 'cancelled': statusEmoji = '❌'; break;
          default: statusEmoji = '❓'; break;
        }
        
        console.log(`${statusEmoji} [${index + 1}] ${op.symbol} ${op.action} - ${timestamp}`);
        console.log(`    User: ${op.user_id} | Preço: $${op.entry_price} | Qtd: ${op.quantity}`);
        console.log(`    Status: ${op.status} | PnL: ${op.pnl || 'N/A'}`);
        
        if (op.closed_at) {
          const closedTime = new Date(op.closed_at).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
          });
          console.log(`    Fechada: ${closedTime}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ NENHUMA OPERAÇÃO ENCONTRADA na tabela trading_operations');
      console.log('⚠️ Isso indica que as operações não estão sendo criadas!');
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar operações: ${error.message}`);
  }
  console.log('');
}

// Função para verificar usuários ativos
async function checkActiveUsers() {
  console.log('👥 VERIFICANDO USUÁRIOS ATIVOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const usersResult = await pool.query(`
      SELECT 
        id,
        email,
        trading_active,
        balance,
        created_at
      FROM users 
      WHERE trading_active = true
      ORDER BY created_at DESC
    `);
    
    if (usersResult.rows.length > 0) {
      console.log(`👤 ${usersResult.rows.length} usuários com trading ativo:`);
      usersResult.rows.forEach((user, index) => {
        console.log(`✅ [${index + 1}] ${user.email} - Saldo: $${user.balance || '0.00'}`);
      });
    } else {
      console.log('❌ NENHUM USUÁRIO COM TRADING ATIVO encontrado!');
      console.log('⚠️ Isso explica por que não há operações sendo abertas!');
    }
    
    // Verificar total de usuários
    const totalUsersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    console.log(`📊 Total de usuários cadastrados: ${totalUsersResult.rows[0].total}`);
    
  } catch (error) {
    console.log(`❌ Erro ao verificar usuários: ${error.message}`);
  }
  console.log('');
}

// Função para verificar configurações de trading
async function checkTradingConfigs() {
  console.log('⚙️ VERIFICANDO CONFIGURAÇÕES DE TRADING:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const configsResult = await pool.query(`
      SELECT 
        user_id,
        max_daily_operations,
        max_open_positions,
        risk_per_trade,
        auto_trading,
        allowed_symbols
      FROM user_trading_configs
    `);
    
    if (configsResult.rows.length > 0) {
      console.log(`⚙️ ${configsResult.rows.length} configurações de trading encontradas:`);
      configsResult.rows.forEach((config, index) => {
        console.log(`📋 [${index + 1}] User ${config.user_id}:`);
        console.log(`    Auto Trading: ${config.auto_trading ? '✅' : '❌'}`);
        console.log(`    Max Operações/Dia: ${config.max_daily_operations || 'N/A'}`);
        console.log(`    Max Posições Abertas: ${config.max_open_positions || 'N/A'}`);
        console.log(`    Risco por Trade: ${config.risk_per_trade || 'N/A'}%`);
        console.log(`    Símbolos Permitidos: ${config.allowed_symbols || 'TODOS'}`);
        console.log('');
      });
    } else {
      console.log('❌ NENHUMA CONFIGURAÇÃO DE TRADING encontrada!');
      console.log('⚠️ Usuários podem não ter configuração para trading automático!');
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar configurações: ${error.message}`);
  }
  console.log('');
}

// Função para verificar Market Intelligence
async function checkMarketIntelligence() {
  console.log('🧠 VERIFICANDO MARKET INTELLIGENCE:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const lastDecisionResult = await pool.query(`
      SELECT 
        allow_long,
        allow_short,
        confidence,
        market_pulse,
        fear_greed,
        btc_dominance,
        created_at
      FROM market_decisions 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (lastDecisionResult.rows.length > 0) {
      const decision = lastDecisionResult.rows[0];
      const timestamp = new Date(decision.created_at).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      });
      
      console.log(`📊 Última decisão de mercado: ${timestamp}`);
      console.log(`🔹 Market Pulse: ${parseFloat(decision.market_pulse).toFixed(1)}%`);
      console.log(`🔹 Fear & Greed: ${decision.fear_greed}`);
      console.log(`🔹 BTC Dominance: ${parseFloat(decision.btc_dominance).toFixed(1)}%`);
      console.log(`🔹 Confiança: ${decision.confidence}%`);
      console.log(`🔹 Permite LONG: ${decision.allow_long ? '✅' : '❌'}`);
      console.log(`🔹 Permite SHORT: ${decision.allow_short ? '✅' : '❌'}`);
      
      const diffMinutes = Math.round((new Date() - new Date(decision.created_at)) / (1000 * 60));
      if (diffMinutes > 20) {
        console.log(`⚠️ Market Intelligence desatualizado (${diffMinutes} min atrás)`);
      } else {
        console.log(`✅ Market Intelligence atualizado (${diffMinutes} min atrás)`);
      }
    } else {
      console.log('❌ NENHUMA DECISÃO DE MERCADO encontrada!');
      console.log('⚠️ Market Intelligence pode não estar funcionando!');
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar Market Intelligence: ${error.message}`);
  }
  console.log('');
}

// Função para simular processamento de sinal
async function simulateSignalProcessing() {
  console.log('🧪 SIMULANDO PROCESSAMENTO DE SINAL:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Primeiro enviar um sinal de teste via webhook
  console.log('1️⃣ Enviando sinal de teste...');
  const webhookResult = await testWebhookReception();
  
  if (webhookResult.success) {
    console.log('✅ Sinal enviado com sucesso via webhook');
    
    // Aguardar 5 segundos e verificar se foi processado
    console.log('⏳ Aguardando 5 segundos para processamento...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar se o sinal apareceu no banco
    console.log('2️⃣ Verificando se sinal foi salvo no banco...');
    const recentSignalResult = await pool.query(`
      SELECT * FROM trading_signals 
      WHERE source = 'DIAGNOSTIC_TEST' 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (recentSignalResult.rows.length > 0) {
      const signal = recentSignalResult.rows[0];
      console.log(`✅ Sinal encontrado no banco: ID ${signal.id}, Status: ${signal.status}`);
      
      // Verificar se gerou operação
      console.log('3️⃣ Verificando se gerou operação de trading...');
      const operationResult = await pool.query(`
        SELECT * FROM trading_operations 
        WHERE created_at > NOW() - INTERVAL '10 minutes'
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      if (operationResult.rows.length > 0) {
        console.log(`✅ Operação encontrada: ${operationResult.rows[0].symbol} ${operationResult.rows[0].action}`);
      } else {
        console.log(`❌ NENHUMA OPERAÇÃO foi criada a partir do sinal!`);
        console.log('⚠️ Problema está na conversão de sinal para operação!');
      }
    } else {
      console.log('❌ Sinal NÃO foi salvo no banco!');
      console.log('⚠️ Problema está na recepção/processamento inicial!');
    }
  } else {
    console.log('❌ Falha no envio do webhook de teste');
  }
  console.log('');
}

// Função principal
async function investigateSignalProcessing() {
  try {
    console.log('🔍 INVESTIGAÇÃO COMPLETA: SINAIS TRADINGVIEW → OPERAÇÕES\n');
    console.log(`🕐 Relatório gerado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);
    
    // 1. Verificar estrutura do banco
    await checkDatabaseTables();
    
    // 2. Verificar usuários ativos
    await checkActiveUsers();
    
    // 3. Verificar configurações de trading
    await checkTradingConfigs();
    
    // 4. Verificar Market Intelligence
    await checkMarketIntelligence();
    
    // 5. Verificar sinais recebidos
    await checkReceivedSignals();
    
    // 6. Verificar operações
    await checkTradingOperations();
    
    // 7. Simular processamento completo
    await simulateSignalProcessing();
    
    console.log('🎯 DIAGNÓSTICO FINAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Com base na análise acima, identifique:');
    console.log('1️⃣ Os webhooks estão chegando? (Status 200 nos logs Railway)');
    console.log('2️⃣ Os sinais estão sendo salvos na tabela trading_signals?');
    console.log('3️⃣ Existem usuários com trading_active = true?');
    console.log('4️⃣ Os usuários têm configurações de trading válidas?');
    console.log('5️⃣ O Market Intelligence está permitindo operações?');
    console.log('6️⃣ As operações estão sendo criadas na tabela trading_operations?');
    console.log('');
    console.log('💡 O gargalo estará no primeiro passo que falhar!');
    
  } catch (error) {
    console.error('❌ Erro na investigação:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

investigateSignalProcessing();
