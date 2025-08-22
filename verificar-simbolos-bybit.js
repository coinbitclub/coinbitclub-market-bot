// VERIFICAR SÍMBOLOS DISPONÍVEIS NA BYBIT - v1.0.0
console.log('🔍 VERIFICANDO SÍMBOLOS DISPONÍVEIS NA BYBIT...');

const ccxt = require('ccxt');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function verificarSimbolos() {
  try {
    // Usar uma das contas funcionais
    const query = `
      SELECT api_key, api_secret, is_testnet
      FROM user_exchange_accounts uea
      JOIN users u ON u.id = uea.user_id
      WHERE uea.is_active = true 
        AND uea.can_trade = true 
        AND uea.is_testnet = false
        AND u.email = 'erica.andrade.santos@hotmail.com'
        AND uea.account_name LIKE '%MAINNET%'
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    const account = result.rows[0];
    
    if (!account) {
      console.log('❌ Nenhuma conta encontrada');
      return;
    }
    
    console.log('🔑 Usando conta Erica para verificar símbolos...');
    
    // Criar exchange com sincronização de tempo
    const tempExchange = new ccxt.bybit({
      apiKey: account.api_key,
      secret: account.api_secret,
      sandbox: account.is_testnet,
      enableRateLimit: true,
      timeout: 30000
    });
    
    // Sincronização
    const serverTime = await tempExchange.fetchTime();
    const localTime = Date.now();
    const timeDifference = serverTime - localTime;
    await tempExchange.close();
    
    // Exchange principal
    const exchange = new ccxt.bybit({
      apiKey: account.api_key,
      secret: account.api_secret,
      sandbox: account.is_testnet,
      enableRateLimit: true,
      timeout: 45000,
      options: {
        defaultType: 'linear',
        hedgeMode: true,
        portfolioMargin: false,
        recvWindow: 30000
      }
    });
    
    // Aplicar correção de timestamp
    const originalNonce = exchange.nonce;
    exchange.nonce = function() {
      const timestamp = originalNonce.call(this);
      return timestamp + timeDifference;
    };
    
    console.log('🔗 Carregando mercados...');
    await exchange.loadMarkets();
    
    // Procurar símbolos LINK
    console.log('\n🔍 PROCURANDO SÍMBOLOS LINK DISPONÍVEIS:');
    const linkSymbols = [];
    
    for (const symbol in exchange.markets) {
      if (symbol.includes('LINK')) {
        linkSymbols.push({
          symbol: symbol,
          base: exchange.markets[symbol].base,
          quote: exchange.markets[symbol].quote,
          type: exchange.markets[symbol].type,
          active: exchange.markets[symbol].active
        });
      }
    }
    
    console.log(`📊 Encontrados ${linkSymbols.length} símbolos LINK:`);
    linkSymbols.forEach(s => {
      const status = s.active ? '✅' : '❌';
      console.log(`${status} ${s.symbol} (${s.type})`);
    });
    
    // Procurar símbolos BTC também
    console.log('\n🔍 PROCURANDO SÍMBOLOS BTC DISPONÍVEIS:');
    const btcSymbols = [];
    
    for (const symbol in exchange.markets) {
      if (symbol.includes('BTC') && symbol.includes('USDT')) {
        btcSymbols.push({
          symbol: symbol,
          base: exchange.markets[symbol].base,
          quote: exchange.markets[symbol].quote,
          type: exchange.markets[symbol].type,
          active: exchange.markets[symbol].active
        });
      }
    }
    
    console.log(`📊 Encontrados ${btcSymbols.length} símbolos BTC/USDT:`);
    btcSymbols.slice(0, 5).forEach(s => {
      const status = s.active ? '✅' : '❌';
      console.log(`${status} ${s.symbol} (${s.type})`);
    });
    
    // Testar um símbolo válido
    if (linkSymbols.length > 0) {
      const validSymbol = linkSymbols.find(s => s.active);
      if (validSymbol) {
        console.log(`\n🎯 TESTANDO SÍMBOLO VÁLIDO: ${validSymbol.symbol}`);
        
        try {
          const ticker = await exchange.fetchTicker(validSymbol.symbol);
          console.log(`✅ Preço atual: $${ticker.last?.toFixed(4)}`);
          
          // Testar capacidade de criação de ordem (dry run)
          console.log(`📊 Testando parâmetros de ordem para ${validSymbol.symbol}...`);
          
          const orderBook = await exchange.fetchOrderBook(validSymbol.symbol, 5);
          console.log(`📋 Spread: $${(orderBook.asks[0][0] - orderBook.bids[0][0]).toFixed(4)}`);
          
        } catch (testError) {
          console.error(`❌ Erro testando ${validSymbol.symbol}:`, testError.message);
        }
      }
    }
    
    await exchange.close();
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

// Executar verificação
verificarSimbolos().catch(console.error);
