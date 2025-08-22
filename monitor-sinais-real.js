const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FYHVNKLIXYmRWdRLKNnYdCXhGNsgjLSr@autorack.proxy.rlwy.net:39170/railway'
});

async function monitorarSinaisReal() {
  console.log('🚀 MONITORAMENTO DE SINAIS EM TEMPO REAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🕐 Iniciado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  console.log('');

  // Verificar última análise de mercado
  const lastAnalysis = await pool.query(`
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
    LIMIT 1
  `);

  if (lastAnalysis.rows.length > 0) {
    const analysis = lastAnalysis.rows[0];
    const lastTime = new Date(analysis.created_at);
    const diffMinutes = Math.round((new Date() - lastTime) / (1000 * 60));
    
    console.log('📊 ÚLTIMA ANÁLISE DE MERCADO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🕐 ${lastTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (há ${diffMinutes}min)`);
    console.log(`📈 Market Pulse: ${parseFloat(analysis.market_pulse).toFixed(1)}%`);
    console.log(`😨 Fear & Greed: ${analysis.fear_greed}`);
    console.log(`₿ BTC Dominance: ${parseFloat(analysis.btc_dominance).toFixed(1)}%`);
    console.log(`🎯 Confiança: ${analysis.confidence}%`);
    console.log(`📊 Permite LONG: ${analysis.allow_long ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`📉 Permite SHORT: ${analysis.allow_short ? '✅ SIM' : '❌ NÃO'}`);
    console.log('');
  }

  // Verificar sinais recentes (últimas 2 horas)
  const recentSignals = await pool.query(`
    SELECT 
      signal_type,
      symbol,
      strategy,
      confidence,
      created_at
    FROM trading_signals 
    WHERE created_at > NOW() - INTERVAL '2 hours'
    ORDER BY created_at DESC
    LIMIT 10
  `);

  console.log('📡 SINAIS RECENTES (ÚLTIMAS 2 HORAS):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (recentSignals.rows.length > 0) {
    recentSignals.rows.forEach((signal, index) => {
      const time = new Date(signal.created_at).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const typeEmoji = signal.signal_type === 'LONG' ? '🟢' : '🔴';
      console.log(`${typeEmoji} ${time} | ${signal.signal_type} ${signal.symbol} | ${signal.strategy} | Conf: ${signal.confidence}%`);
    });
  } else {
    console.log('⏳ Nenhum sinal recebido nas últimas 2 horas');
    console.log('🔄 Sistema aguardando sinais do TradingView...');
  }
  
  console.log('');

  // Verificar webhooks recentes
  const recentWebhooks = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'success' THEN 1 END) as success,
      COUNT(CASE WHEN status = 'error' THEN 1 END) as errors
    FROM webhook_logs 
    WHERE created_at > NOW() - INTERVAL '1 hour'
  `);

  if (recentWebhooks.rows.length > 0) {
    const stats = recentWebhooks.rows[0];
    console.log('🔌 WEBHOOKS (ÚLTIMA HORA):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total: ${stats.total} | ✅ Sucesso: ${stats.success} | ❌ Erros: ${stats.errors}`);
    console.log('');
  }

  // Status das exchanges
  console.log('🏢 STATUS DAS EXCHANGES:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Verificar Binance
    const binanceTest = await axios.get('https://api.binance.com/api/v3/ping', { timeout: 5000 });
    console.log('🟡 Binance: ✅ CONECTADA');
  } catch (error) {
    console.log('🟡 Binance: ❌ DESCONECTADA');
  }

  console.log('');
  console.log('🎯 PRÓXIMOS PASSOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. ✅ Sistema operacional aguardando sinais');
  console.log('2. 📡 Dashboard ativo em: https://coinbitclub-market-bot.up.railway.app/dashboard');
  console.log('3. 🔄 Market Intelligence rodando a cada 15 minutos');
  console.log('4. ⚡ Webhooks prontos para receber sinais do TradingView');
  console.log('5. 💰 Sistema de comissões ativo');
  console.log('');
  console.log('🚨 AGUARDANDO PRIMEIRO SINAL...');
  console.log('Configure seus alertas no TradingView para:');
  console.log('📡 https://coinbitclub-market-bot.up.railway.app/api/webhook/tradingview');
}

// Função para monitoramento contínuo
async function monitoramentoContinuo() {
  while (true) {
    try {
      console.clear();
      await monitorarSinaisReal();
      
      console.log('');
      console.log('⏱️ Próxima atualização em 30 segundos...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Aguardar 30 segundos
      await new Promise(resolve => setTimeout(resolve, 30000));
    } catch (error) {
      console.error('❌ Erro no monitoramento:', error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Execução única ou contínua
if (process.argv.includes('--continuo')) {
  monitoramentoContinuo().catch(console.error);
} else {
  monitorarSinaisReal()
    .then(() => {
      console.log('');
      console.log('💡 Para monitoramento contínuo, execute:');
      console.log('node monitor-sinais-real.js --continuo');
      process.exit(0);
    })
    .catch(console.error)
    .finally(() => pool.end());
}
