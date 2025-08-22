const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function analyzeSignalProcessing() {
  try {
    console.log('🔍 INVESTIGAÇÃO: POR QUE NENHUMA OPERAÇÃO REAL FOI ABERTA?');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📅 Análise realizada em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);
    
    // 1. Verificar sinais recebidos
    console.log('📡 ANÁLISE DOS WEBHOOKS RECEBIDOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const totalSignalsResult = await pool.query(`
      SELECT COUNT(*) as total FROM webhook_signals
    `);
    console.log(`📊 Total de webhooks recebidos: ${totalSignalsResult.rows[0].total}`);
    
    // Analisar tipos de sinais
    const signalTypesResult = await pool.query(`
      SELECT 
        CASE 
          WHEN signal_data->>'action' ILIKE '%LONG FORTE%' THEN 'SINAL LONG FORTE'
          WHEN signal_data->>'action' ILIKE '%SHORT FORTE%' THEN 'SINAL SHORT FORTE'
          WHEN signal_data->>'action' ILIKE '%FECHE LONG%' THEN 'FECHE LONG'
          WHEN signal_data->>'action' ILIKE '%FECHE SHORT%' THEN 'FECHE SHORT'
          WHEN signal_data->>'action' ILIKE '%SINAL LONG%' THEN 'SINAL LONG (fraco)'
          WHEN signal_data->>'action' ILIKE '%SINAL SHORT%' THEN 'SINAL SHORT (fraco)'
          ELSE signal_data->>'action'
        END as signal_type,
        COUNT(*) as quantidade,
        MAX(created_at) as ultimo_sinal
      FROM webhook_signals 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY 
        CASE 
          WHEN signal_data->>'action' ILIKE '%LONG FORTE%' THEN 'SINAL LONG FORTE'
          WHEN signal_data->>'action' ILIKE '%SHORT FORTE%' THEN 'SINAL SHORT FORTE'
          WHEN signal_data->>'action' ILIKE '%FECHE LONG%' THEN 'FECHE LONG'
          WHEN signal_data->>'action' ILIKE '%FECHE SHORT%' THEN 'FECHE SHORT'
          WHEN signal_data->>'action' ILIKE '%SINAL LONG%' THEN 'SINAL LONG (fraco)'
          WHEN signal_data->>'action' ILIKE '%SINAL SHORT%' THEN 'SINAL SHORT (fraco)'
          ELSE signal_data->>'action'
        END
      ORDER BY quantidade DESC
    `);
    
    console.log('\n📈 DISTRIBUIÇÃO DE TIPOS DE SINAIS (últimas 24h):');
    signalTypesResult.rows.forEach(row => {
      const emoji = row.signal_type.includes('FORTE') ? '🎯' : 
                   row.signal_type.includes('FECHE') ? '🔚' : '📍';
      const shouldOpen = row.signal_type === 'SINAL LONG FORTE' || row.signal_type === 'SINAL SHORT FORTE' ? ' ← DEVE ABRIR POSIÇÃO' : '';
      console.log(`${emoji} ${row.signal_type}: ${row.quantidade} sinais${shouldOpen}`);
      console.log(`   Último: ${new Date(row.ultimo_sinal).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    });
    
    // 2. Verificar sinais FORTES especificamente
    console.log('\n🎯 ANÁLISE DOS SINAIS FORTES (QUE DEVEM ABRIR POSIÇÕES):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const strongSignalsResult = await pool.query(`
      SELECT 
        signal_data->>'action' as action,
        signal_data->>'ticker' as ticker,
        processed,
        created_at
      FROM webhook_signals 
      WHERE (
        signal_data->>'action' ILIKE '%LONG FORTE%' OR 
        signal_data->>'action' ILIKE '%SHORT FORTE%'
      )
      AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    console.log(`🎯 Sinais FORTES recebidos (últimos 7 dias): ${strongSignalsResult.rows.length}`);
    
    if (strongSignalsResult.rows.length > 0) {
      console.log('\n📋 DETALHES DOS SINAIS FORTES:');
      strongSignalsResult.rows.forEach((signal, index) => {
        const time = new Date(signal.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const processedIcon = signal.processed ? '✅' : '⏳';
        console.log(`${index + 1}. ${processedIcon} ${signal.action} | ${signal.ticker} | ${time}`);
      });
    } else {
      console.log('❌ PROBLEMA IDENTIFICADO: Nenhum sinal FORTE recebido nos últimos 7 dias!');
      console.log('   Apenas sinais FRACOS ou de FECHAMENTO estão chegando.');
    }
    
    // 3. Verificar se sinais fortes geraram trading_signals
    console.log('\n🔄 VERIFICAÇÃO DO PROCESSAMENTO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const tradingSignalsResult = await pool.query(`
      SELECT COUNT(*) as total FROM trading_signals
    `);
    console.log(`📊 Sinais processados em trading_signals: ${tradingSignalsResult.rows[0].total}`);
    
    const tradingOrdersResult = await pool.query(`
      SELECT COUNT(*) as total FROM trading_orders
    `);
    console.log(`📊 Ordens criadas em trading_orders: ${tradingOrdersResult.rows[0].total}`);
    
    // 4. Verificar usuários ativos
    console.log('\n👥 VERIFICAÇÃO DOS USUÁRIOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const activeUsersResult = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN trading_enabled = true THEN 1 END) as trading_enabled,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_status
      FROM users
    `);
    
    const users = activeUsersResult.rows[0];
    console.log(`👥 Total de usuários: ${users.total_users}`);
    console.log(`✅ Com trading habilitado: ${users.trading_enabled}`);
    console.log(`🟢 Com status ativo: ${users.active_status}`);
    
    // 5. Diagnóstico e conclusões
    console.log('\n🧩 DIAGNÓSTICO COMPLETO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const strongSignalsCount = strongSignalsResult.rows.length;
    const processedSignalsCount = tradingSignalsResult.rows[0].total;
    const ordersCount = tradingOrdersResult.rows[0].total;
    const tradingEnabledUsers = users.trading_enabled;
    
    if (strongSignalsCount === 0) {
      console.log('❌ PROBLEMA 1: Nenhum sinal FORTE foi recebido');
      console.log('   → Apenas sinais fracos ou de fechamento estão chegando do TradingView');
      console.log('   → Verifique a configuração dos alertas no TradingView');
    } else {
      console.log('✅ Sinais FORTES foram recebidos corretamente');
    }
    
    if (tradingEnabledUsers === 0) {
      console.log('❌ PROBLEMA 2: Nenhum usuário com trading habilitado');
      console.log('   → Sem usuários ativos, nenhuma ordem pode ser criada');
    } else {
      console.log(`✅ ${tradingEnabledUsers} usuários com trading habilitado`);
    }
    
    if (processedSignalsCount === 0) {
      console.log('❌ PROBLEMA 3: Sinais não estão sendo processados em trading_signals');
      console.log('   → Possível erro no código de processamento');
    } else {
      console.log('✅ Sinais estão sendo processados');
    }
    
    if (ordersCount === 0) {
      console.log('❌ PROBLEMA 4: Nenhuma ordem foi criada');
      console.log('   → Possível erro na criação de ordens');
    } else {
      console.log('✅ Ordens estão sendo criadas');
    }
    
    // 6. Recomendações
    console.log('\n💡 PLANO DE AÇÃO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (strongSignalsCount === 0) {
      console.log('🎯 1. CONFIGURAR ALERTAS FORTES NO TRADINGVIEW:');
      console.log('   → Criar alertas que enviem "SINAL LONG FORTE"');
      console.log('   → Criar alertas que enviem "SINAL SHORT FORTE"');
      console.log('   → Verificar se a mensagem do alerta contém exatamente essas palavras');
    }
    
    if (tradingEnabledUsers > 0 && strongSignalsCount > 0 && processedSignalsCount === 0) {
      console.log('🔧 2. VERIFICAR CÓDIGO DE PROCESSAMENTO:');
      console.log('   → Analisar função processSignalAsync no servidor');
      console.log('   → Verificar se a lógica para sinais FORTES está correta');
      console.log('   → Adicionar logs de debug para rastrear o fluxo');
    }
    
    console.log('\n📝 REGRA CONFIRMADA:');
    console.log('🎯 APENAS sinais "SINAL LONG FORTE" e "SINAL SHORT FORTE" devem abrir posições');
    console.log('🔚 Sinais de "FECHE LONG" e "FECHE SHORT" apenas fecham posições existentes');
    console.log('📍 Sinais "SINAL LONG" e "SINAL SHORT" (sem FORTE) são ignorados');
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeSignalProcessing();
