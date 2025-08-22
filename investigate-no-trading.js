const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FYHVNKLIXYmRWdRLKNnYdCXhGNsgjLSr@autorack.proxy.rlwy.net:39170/railway'
});

// Investigação completa do sistema de trading
async function investigateNoTradingActivity() {
  console.log('🔍 INVESTIGAÇÃO: POR QUE NENHUMA OPERAÇÃO REAL FOI ABERTA?');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🕐 Investigação iniciada: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  
  try {
    // 1. VERIFICAR SINAIS RECEBIDOS
    console.log('\n1️⃣ VERIFICANDO SINAIS TRADINGVIEW RECEBIDOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const webhookSignals = await pool.query(`
      SELECT 
        source,
        raw_data,
        token,
        processed,
        received_at,
        processed_at
      FROM webhook_signals 
      ORDER BY received_at DESC 
      LIMIT 10
    `);
    
    console.log(`📊 Total de sinais recebidos: ${webhookSignals.rows.length}`);
    
    if (webhookSignals.rows.length === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: Nenhum sinal do TradingView foi recebido!');
      console.log('   💡 Possíveis causas:');
      console.log('   ├─ TradingView não está enviando sinais');
      console.log('   ├─ URL do webhook incorreta');
      console.log('   ├─ Token de autenticação incorreto');
      console.log('   └─ Problemas de conectividade');
    } else {
      console.log('✅ Sinais foram recebidos:');
      webhookSignals.rows.forEach((signal, index) => {
        try {
          const rawData = typeof signal.raw_data === 'string' ? JSON.parse(signal.raw_data) : signal.raw_data;
          console.log(`   ${index + 1}. ${signal.received_at}: ${rawData.symbol || 'N/A'} - ${rawData.action || 'N/A'} (Processado: ${signal.processed ? 'Sim' : 'Não'})`);
        } catch (e) {
          console.log(`   ${index + 1}. ${signal.received_at}: Dados inválidos (Processado: ${signal.processed ? 'Sim' : 'Não'})`);
        }
      });
    }
    
    // 2. VERIFICAR USUÁRIOS ATIVOS
    console.log('\n2️⃣ VERIFICANDO USUÁRIOS COM CONTAS ATIVAS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const activeUsers = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.subscription_status,
        COUNT(uea.id) as exchange_accounts,
        COUNT(CASE WHEN uea.is_active = true THEN 1 END) as active_accounts
      FROM users u
      LEFT JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE u.subscription_status = 'ACTIVE'
      GROUP BY u.id, u.email, u.subscription_status
      ORDER BY active_accounts DESC
    `);
    
    console.log(`📊 Usuários com assinatura ativa: ${activeUsers.rows.length}`);
    
    if (activeUsers.rows.length === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: Nenhum usuário com assinatura ativa!');
      console.log('   💡 Sem usuários ativos, não há contas para fazer trading');
    } else {
      console.log('✅ Usuários ativos encontrados:');
      activeUsers.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}: ${user.active_accounts}/${user.exchange_accounts} contas ativas`);
      });
      
      // Verificar contas de exchange específicas
      const exchangeAccounts = await pool.query(`
        SELECT 
          uea.exchange_name,
          uea.is_active,
          uea.api_key_encrypted,
          uea.secret_key_encrypted,
          uea.created_at,
          u.email
        FROM user_exchange_accounts uea
        JOIN users u ON uea.user_id = u.id
        WHERE u.subscription_status = 'ACTIVE'
        ORDER BY uea.created_at DESC
      `);
      
      console.log(`\n📋 Detalhes das contas de exchange (${exchangeAccounts.rows.length} total):`);
      exchangeAccounts.rows.forEach((account, index) => {
        const hasKeys = !!(account.api_key_encrypted && account.secret_key_encrypted);
        console.log(`   ${index + 1}. ${account.email} - ${account.exchange_name}: ${account.is_active ? 'ATIVA' : 'INATIVA'} | Chaves: ${hasKeys ? 'Configuradas' : 'FALTANDO'}`);
      });
    }
    
    // 3. VERIFICAR DECISÕES DE MARKET INTELLIGENCE
    console.log('\n3️⃣ VERIFICANDO DECISÕES DO MARKET INTELLIGENCE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const marketDecisions = await pool.query(`
      SELECT 
        allow_long,
        allow_short,
        confidence,
        fear_greed,
        market_pulse,
        btc_dominance,
        created_at
      FROM market_decisions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (marketDecisions.rows.length === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: Nenhuma decisão de Market Intelligence!');
      console.log('   💡 O sistema de IA não está analisando o mercado');
    } else {
      console.log('✅ Decisões de Market Intelligence encontradas:');
      marketDecisions.rows.forEach((decision, index) => {
        const timestamp = new Date(decision.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        console.log(`   ${index + 1}. ${timestamp}:`);
        console.log(`      Market Pulse: ${decision.market_pulse}% | F&G: ${decision.fear_greed} | BTC Dom: ${decision.btc_dominance}%`);
        console.log(`      LONG: ${decision.allow_long ? '✅ PERMITIDO' : '❌ BLOQUEADO'} | SHORT: ${decision.allow_short ? '✅ PERMITIDO' : '❌ BLOQUEADO'}`);
        console.log(`      Confiança: ${decision.confidence}%`);
      });
      
      // Verificar se as condições atuais permitem trading
      const latestDecision = marketDecisions.rows[0];
      if (!latestDecision.allow_long && !latestDecision.allow_short) {
        console.log('\n⚠️ POSSÍVEL PROBLEMA: Market Intelligence está BLOQUEANDO todos os trades!');
        console.log(`   📊 Condições atuais: Market Pulse ${latestDecision.market_pulse}%`);
        console.log(`   💭 Sistema está sendo conservador - isso pode estar impedindo operações`);
      }
    }
    
    // 4. VERIFICAR POSIÇÕES ABERTAS/FECHADAS
    console.log('\n4️⃣ VERIFICANDO HISTÓRICO DE POSIÇÕES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const positions = await pool.query(`
      SELECT 
        symbol,
        side,
        status,
        quantity,
        entry_price,
        exit_price,
        created_at,
        closed_at,
        u.email
      FROM trading_positions tp
      JOIN users u ON tp.user_id = u.id
      ORDER BY tp.created_at DESC 
      LIMIT 10
    `);
    
    console.log(`📊 Total de posições encontradas: ${positions.rows.length}`);
    
    if (positions.rows.length === 0) {
      console.log('❌ PROBLEMA CONFIRMADO: Nenhuma posição foi aberta!');
      console.log('   💡 Isso confirma que o sistema não está executando trades');
    } else {
      console.log('✅ Posições encontradas:');
      positions.rows.forEach((pos, index) => {
        const created = new Date(pos.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        console.log(`   ${index + 1}. ${pos.symbol} ${pos.side} - Status: ${pos.status} - ${created}`);
      });
    }
    
    // 5. VERIFICAR LOGS DE TRADING
    console.log('\n5️⃣ VERIFICANDO LOGS DE TRADING:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const tradingLogs = await pool.query(`
      SELECT 
        event_type,
        details,
        success,
        created_at
      FROM system_monitoring 
      WHERE event_type IN ('TRADING_EXECUTED', 'TRADING_ERROR', 'WEBHOOK_PROCESSED', 'WEBHOOK_ERROR')
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (tradingLogs.rows.length === 0) {
      console.log('❌ Nenhum log de trading encontrado');
    } else {
      console.log(`📊 Logs de trading encontrados: ${tradingLogs.rows.length}`);
      tradingLogs.rows.forEach((log, index) => {
        const timestamp = new Date(log.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        console.log(`   ${index + 1}. ${log.event_type} - ${log.success ? 'SUCESSO' : 'ERRO'} - ${timestamp}`);
        if (log.details) {
          try {
            const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            console.log(`      Detalhes: ${JSON.stringify(details, null, 2).substring(0, 200)}...`);
          } catch (e) {
            console.log(`      Detalhes: ${log.details}`);
          }
        }
      });
    }
    
    // 6. VERIFICAR SERVIDOR EM TEMPO REAL
    console.log('\n6️⃣ VERIFICANDO SERVIDOR RAILWAY EM TEMPO REAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const serverStatus = await axios.get('https://coinbitclub-market-bot.up.railway.app/api/system/status', {
        timeout: 10000
      });
      
      console.log('✅ Servidor Railway: ONLINE');
      console.log(`📊 Dados do servidor:`, JSON.stringify(serverStatus.data, null, 2));
      
    } catch (error) {
      console.log('❌ Erro ao conectar com servidor Railway:', error.message);
    }
    
    // 7. ANÁLISE DE CAUSA RAIZ
    console.log('\n🎯 ANÁLISE DE CAUSA RAIZ:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const issues = [];
    
    if (webhookSignals.rows.length === 0) {
      issues.push('❌ CRÍTICO: Nenhum sinal do TradingView recebido');
    }
    
    if (activeUsers.rows.length === 0) {
      issues.push('❌ CRÍTICO: Nenhum usuário com assinatura ativa');
    }
    
    const hasActiveAccounts = activeUsers.rows.some(user => user.active_accounts > 0);
    if (!hasActiveAccounts) {
      issues.push('❌ CRÍTICO: Nenhuma conta de exchange ativa configurada');
    }
    
    if (marketDecisions.rows.length > 0) {
      const latestDecision = marketDecisions.rows[0];
      if (!latestDecision.allow_long && !latestDecision.allow_short) {
        issues.push('⚠️ IMPORTANTE: Market Intelligence bloqueando todos os trades');
      }
    }
    
    if (positions.rows.length === 0) {
      issues.push('❌ CONFIRMADO: Nenhuma posição de trading executada');
    }
    
    console.log('\n📋 PROBLEMAS IDENTIFICADOS:');
    if (issues.length === 0) {
      console.log('✅ Nenhum problema crítico identificado - investigação necessária');
    } else {
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    // 8. RECOMENDAÇÕES
    console.log('\n💡 RECOMENDAÇÕES PARA RESOLVER:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (webhookSignals.rows.length === 0) {
      console.log('🔧 1. CONFIGURAR WEBHOOKS TRADINGVIEW:');
      console.log('   ├─ URL: https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal?token=210406');
      console.log('   ├─ Verificar se TradingView está enviando sinais');
      console.log('   └─ Testar webhook manualmente');
    }
    
    if (activeUsers.rows.length === 0) {
      console.log('🔧 2. ATIVAR USUÁRIOS:');
      console.log('   ├─ Criar usuários de teste com subscription_status = ACTIVE');
      console.log('   └─ Configurar pelo menos 1 usuário para testes');
    }
    
    if (!hasActiveAccounts) {
      console.log('🔧 3. CONFIGURAR CONTAS DE EXCHANGE:');
      console.log('   ├─ Adicionar API keys válidas do Bybit/Binance');
      console.log('   ├─ Marcar contas como is_active = true');
      console.log('   └─ Testar conectividade com exchanges');
    }
    
    console.log('🔧 4. MONITORAR EM TEMPO REAL:');
    console.log('   ├─ Acompanhar logs do Railway');
    console.log('   ├─ Verificar Market Intelligence ativo');
    console.log('   └─ Testar sinais manuais');
    
  } catch (error) {
    console.error('❌ Erro na investigação:', error.message);
  } finally {
    await pool.end();
  }
}

investigateNoTradingActivity();
