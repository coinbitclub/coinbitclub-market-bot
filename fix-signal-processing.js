const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function analyzeSignalProcessing() {
  try {
    console.log('🎯 ANÁLISE DO PROCESSAMENTO DE SINAIS TRADINGVIEW');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🕐 Análise em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);
    
    // 1. VERIFICAR TODOS OS SINAIS RECEBIDOS
    console.log('📊 SINAIS RECEBIDOS DO TRADINGVIEW:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const allSignals = await pool.query(`
      SELECT 
        signal_type,
        symbol,
        timestamp,
        processed,
        webhook_id
      FROM webhook_signals 
      ORDER BY timestamp DESC 
      LIMIT 20
    `);
    
    console.log(`📈 Total de sinais: ${allSignals.rows.length}`);
    
    // Agrupar por tipo de sinal
    const signalTypes = {};
    allSignals.rows.forEach(signal => {
      if (!signalTypes[signal.signal_type]) {
        signalTypes[signal.signal_type] = 0;
      }
      signalTypes[signal.signal_type]++;
    });
    
    console.log('\n📋 TIPOS DE SINAIS RECEBIDOS:');
    Object.entries(signalTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} sinais`);
    });
    
    // 2. ANALISAR QUAIS DEVERIAM ABRIR POSIÇÕES
    console.log('\n🎯 CRITÉRIO DE ABERTURA DE POSIÇÕES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ABRIR LONG: "SINAL LONG FORTE"');
    console.log('✅ ABRIR SHORT: "SINAL SHORT FORTE"');
    console.log('❌ IGNORAR: "SINAL LONG", "SINAL SHORT", "FECHE LONG", "FECHE SHORT"');
    
    // Contar sinais FORTES
    const strongLongSignals = await pool.query(`
      SELECT COUNT(*) as count 
      FROM webhook_signals 
      WHERE signal_type = 'SINAL LONG FORTE'
    `);
    
    const strongShortSignals = await pool.query(`
      SELECT COUNT(*) as count 
      FROM webhook_signals 
      WHERE signal_type = 'SINAL SHORT FORTE'
    `);
    
    console.log(`\n📊 SINAIS QUE DEVERIAM ABRIR POSIÇÕES:`);
    console.log(`   🟢 SINAL LONG FORTE: ${strongLongSignals.rows[0].count} sinais`);
    console.log(`   🔴 SINAL SHORT FORTE: ${strongShortSignals.rows[0].count} sinais`);
    
    // 3. VERIFICAR SE FORAM PROCESSADOS
    console.log('\n🔍 VERIFICAÇÃO DE PROCESSAMENTO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const processedStrong = await pool.query(`
      SELECT 
        signal_type,
        symbol,
        timestamp,
        processed
      FROM webhook_signals 
      WHERE signal_type IN ('SINAL LONG FORTE', 'SINAL SHORT FORTE')
      ORDER BY timestamp DESC
      LIMIT 10
    `);
    
    if (processedStrong.rows.length > 0) {
      console.log('🎯 SINAIS FORTES RECEBIDOS:');
      processedStrong.rows.forEach(signal => {
        const timeStr = new Date(signal.timestamp).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        const status = signal.processed ? '✅ PROCESSADO' : '❌ PENDENTE';
        console.log(`   ${timeStr} | ${signal.symbol} | ${signal.signal_type} | ${status}`);
      });
    } else {
      console.log('❌ NENHUM SINAL FORTE RECEBIDO AINDA');
    }
    
    // 4. VERIFICAR ORDENS CRIADAS
    console.log('\n💰 VERIFICAÇÃO DE ORDENS CRIADAS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const tradingOrders = await pool.query(`
      SELECT COUNT(*) as count FROM trading_orders
    `);
    
    const tradingSignals = await pool.query(`
      SELECT COUNT(*) as count FROM trading_signals
    `);
    
    console.log(`📋 Ordens de trading criadas: ${tradingOrders.rows[0].count}`);
    console.log(`📋 Sinais de trading processados: ${tradingSignals.rows[0].count}`);
    
    if (tradingOrders.rows[0].count === '0' && processedStrong.rows.length > 0) {
      console.log('\n⚠️ PROBLEMA IDENTIFICADO:');
      console.log('   - Sinais FORTES foram recebidos');
      console.log('   - Mas NENHUMA ordem foi criada');
      console.log('   - Há um problema no processamento interno');
    }
    
    // 5. CRIAR SOLUÇÃO
    console.log('\n🔧 SOLUÇÃO PROPOSTA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. ✅ Verificar se Market Intelligence permite operações');
    console.log('2. ✅ Corrigir lógica de processamento de sinais FORTES');
    console.log('3. ✅ Garantir criação de ordens para sinais válidos');
    console.log('4. ✅ Implementar logs detalhados de processamento');
    
    // 6. VERIFICAR MARKET DECISIONS ATUAL
    console.log('\n📊 VERIFICAR PERMISSÕES DE TRADING:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const latestDecision = await pool.query(`
      SELECT 
        allow_long,
        allow_short,
        confidence,
        timestamp
      FROM market_decisions 
      ORDER BY timestamp DESC 
      LIMIT 1
    `);
    
    if (latestDecision.rows.length > 0) {
      const decision = latestDecision.rows[0];
      const timeStr = new Date(decision.timestamp).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      });
      
      console.log(`🕐 Última decisão: ${timeStr}`);
      console.log(`📊 Permite LONG: ${decision.allow_long ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`📊 Permite SHORT: ${decision.allow_short ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`📊 Confiança: ${decision.confidence}%`);
      
      if (!decision.allow_long && !decision.allow_short) {
        console.log('\n⚠️ PROBLEMA ENCONTRADO:');
        console.log('   Market Intelligence NÃO está permitindo operações!');
        console.log('   Mesmo sinais FORTES não abrem posições por segurança.');
      }
    } else {
      console.log('❌ Nenhuma decisão de mercado encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

analyzeSignalProcessing();
