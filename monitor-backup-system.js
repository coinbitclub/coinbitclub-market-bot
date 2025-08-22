const axios = require('axios');

// Monitor do sistema de backup em tempo real
async function monitorBackupSystem() {
  console.log('📡 MONITORANDO SISTEMA DE BACKUP BINANCE + BYBIT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🕐 Monitoramento iniciado: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  console.log('');

  let monitorCount = 0;
  
  const monitorInterval = setInterval(async () => {
    monitorCount++;
    
    try {
      console.log(`\n📊 VERIFICAÇÃO #${monitorCount} - ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Monitorar Market Intelligence no Railway
      try {
        const response = await axios.get('https://coinbitclub-market-bot.up.railway.app/api/market/intelligence', {
          timeout: 10000
        });
        
        const data = response.data;
        console.log('✅ Railway Market Intelligence: ATIVO');
        console.log(`   📊 Market Pulse: ${data.marketPulse}%`);
        console.log(`   📈 Fonte: ${data.source || 'N/A'}`);
        console.log(`   🎯 Trend: ${data.trend || 'N/A'}`);
        console.log(`   🕐 Timestamp: ${data.timestamp || 'N/A'}`);
        
        // Verificar se está usando backup
        if (data.source && data.source.includes('bybit')) {
          console.log('🟡 ⚠️ USANDO BYBIT COMO BACKUP - Binance pode estar bloqueada');
        } else if (data.source && data.source.includes('binance')) {
          console.log('🟢 ✅ USANDO BINANCE - Sistema funcionando normalmente');
        } else if (data.source && data.source.includes('emergency')) {
          console.log('🔴 🆘 USANDO CACHE DE EMERGÊNCIA - Ambas APIs falharam');
        }
        
      } catch (error) {
        console.log('❌ Railway Market Intelligence: ERRO');
        console.log(`   📝 Erro: ${error.response?.status || error.message}`);
      }
      
      // Testar APIs diretamente
      console.log('\n🔍 TESTE DIRETO DAS APIs:');
      
      // Teste Binance
      try {
        const binanceTest = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
          timeout: 5000,
          headers: { 'User-Agent': 'MarketBot/1.0' }
        });
        console.log('✅ Binance API: DISPONÍVEL');
      } catch (binanceError) {
        const status = binanceError.response?.status || 'N/A';
        console.log(`❌ Binance API: ERRO ${status}`);
        if (status === 451) {
          console.log('   🚫 Bloqueio geográfico detectado (451)');
        } else if (status === 429) {
          console.log('   ⏰ Rate limit excedido (429)');
        } else if (status === 403) {
          console.log('   🔒 Acesso negado (403)');
        }
      }
      
      // Teste Bybit
      try {
        const bybitTest = await axios.get('https://api.bybit.com/v5/market/tickers?category=spot', {
          timeout: 5000,
          headers: { 'User-Agent': 'MarketBot/1.0' }
        });
        console.log('✅ Bybit API: DISPONÍVEL');
      } catch (bybitError) {
        console.log(`❌ Bybit API: ERRO ${bybitError.response?.status || 'N/A'}`);
      }
      
    } catch (error) {
      console.log(`❌ Erro no monitoramento: ${error.message}`);
    }
    
    // Parar após 10 verificações (50 minutos)
    if (monitorCount >= 10) {
      console.log('\n🏁 MONITORAMENTO CONCLUÍDO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Sistema de backup monitorado com sucesso');
      console.log('📊 Dados coletados para análise');
      clearInterval(monitorInterval);
    }
    
  }, 5 * 60 * 1000); // A cada 5 minutos
  
  console.log('⏰ Monitoramento automático a cada 5 minutos...');
  console.log('🔄 Pressione Ctrl+C para parar o monitoramento');
}

// Executar uma verificação inicial imediata
async function quickCheck() {
  console.log('⚡ VERIFICAÇÃO RÁPIDA INICIAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const response = await axios.get('https://coinbitclub-market-bot.up.railway.app/api/market/intelligence', {
      timeout: 10000
    });
    
    const data = response.data;
    console.log('✅ Sistema Railway: ONLINE');
    console.log(`📊 Market Pulse atual: ${data.marketPulse}%`);
    console.log(`📈 Fonte de dados: ${data.source || 'N/A'}`);
    console.log(`🎯 Tendência: ${data.trend || 'N/A'}`);
    
    if (data.source && data.source.includes('bybit')) {
      console.log('🟡 Usando Bybit como backup (Binance pode estar bloqueada)');
    } else if (data.source && data.source.includes('binance')) {
      console.log('🟢 Usando Binance (funcionamento normal)');
    }
    
  } catch (error) {
    console.log('❌ Erro na verificação inicial:', error.message);
  }
  
  console.log('');
}

// Executar
quickCheck().then(() => {
  monitorBackupSystem();
}).catch(console.error);
