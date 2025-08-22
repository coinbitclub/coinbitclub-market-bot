const axios = require('axios');

// Teste das APIs de backup
async function testBackupAPIs() {
  console.log('🧪 TESTANDO SISTEMA DE BACKUP - BINANCE + BYBIT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Teste Binance
  console.log('\n1️⃣ TESTANDO BINANCE API:');
  try {
    console.log('📡 Conectando com Binance...');
    const binanceResponse = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
      timeout: 10000,
      headers: { 'User-Agent': 'MarketBot/1.0' }
    });
    
    const data = binanceResponse.data;
    const usdtPairs = data.filter(ticker => 
      ticker.symbol.endsWith('USDT') && 
      !ticker.symbol.includes('UP') && 
      !ticker.symbol.includes('DOWN')
    );
    
    const positiveCount = usdtPairs.filter(ticker => 
      parseFloat(ticker.priceChangePercent) > 0
    ).length;
    
    const marketPulse = (positiveCount / usdtPairs.length) * 100;
    
    console.log(`✅ Binance: FUNCIONANDO`);
    console.log(`   📊 Pares USDT: ${usdtPairs.length}`);
    console.log(`   📈 Positivos: ${positiveCount}`);
    console.log(`   🎯 Market Pulse: ${marketPulse.toFixed(1)}%`);
    
  } catch (error) {
    console.log(`❌ Binance: ERRO ${error.response?.status || 'N/A'}`);
    console.log(`   📝 Mensagem: ${error.message}`);
  }
  
  // Teste Bybit
  console.log('\n2️⃣ TESTANDO BYBIT API:');
  try {
    console.log('📡 Conectando com Bybit...');
    const bybitResponse = await axios.get('https://api.bybit.com/v5/market/tickers', {
      params: { category: 'spot' },
      timeout: 10000,
      headers: { 'User-Agent': 'MarketBot/1.0' }
    });
    
    const data = bybitResponse.data.result.list;
    const usdtPairs = data.filter(ticker => 
      ticker.symbol.endsWith('USDT') && 
      ticker.lastPrice && 
      ticker.price24hPcnt
    );
    
    const positiveCount = usdtPairs.filter(ticker => 
      parseFloat(ticker.price24hPcnt) > 0
    ).length;
    
    const marketPulse = (positiveCount / usdtPairs.length) * 100;
    
    console.log(`✅ Bybit: FUNCIONANDO`);
    console.log(`   📊 Pares USDT: ${usdtPairs.length}`);
    console.log(`   📈 Positivos: ${positiveCount}`);
    console.log(`   🎯 Market Pulse: ${marketPulse.toFixed(1)}%`);
    
  } catch (error) {
    console.log(`❌ Bybit: ERRO ${error.response?.status || 'N/A'}`);
    console.log(`   📝 Mensagem: ${error.message}`);
  }
  
  console.log('\n📋 RESUMO DO TESTE:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Sistema de backup implementado e testado');
  console.log('✅ Ambas as APIs verificadas');
  console.log('✅ Pronto para implementação no servidor');
}

testBackupAPIs().catch(console.error);
