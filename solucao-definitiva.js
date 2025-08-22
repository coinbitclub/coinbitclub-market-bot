// SOLUÇÃO DEFINITIVA PARA ERRO 10002 - v4.0.0
console.log('🔬 IMPLEMENTANDO SOLUÇÃO DEFINITIVA PARA ERRO 10002...');

const { Pool } = require('pg');
const ccxt = require('ccxt');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function solucaoDefinitiva() {
  try {
    console.log('📊 Testando solução definitiva...');
    
    const query = `
      SELECT u.email, uea.api_key, uea.api_secret, uea.is_testnet
      FROM users u 
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE uea.is_active = true 
        AND uea.can_trade = true 
        AND uea.is_testnet = false
        AND u.email = 'erica.andrade.santos@hotmail.com'
        AND uea.account_name LIKE '%MAINNET%'
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhuma conta encontrada');
      return;
    }
    
    const account = result.rows[0];
    console.log(`🎯 Testando: ${account.email}`);
    
    await implementarSolucaoAvancada(account);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

async function implementarSolucaoAvancada(account) {
  let exchange = null;
  
  try {
    console.log('\n🚀 IMPLEMENTANDO SOLUÇÃO AVANÇADA...');
    
    // Criar exchange temporário apenas para sincronização
    const tempExchange = new ccxt.bybit({
      apiKey: account.api_key,
      secret: account.api_secret,
      sandbox: account.is_testnet,
      enableRateLimit: true,
      timeout: 30000
    });
    
    // Obter tempo do servidor sem outras operações
    console.log('⏰ Obtendo tempo do servidor...');
    const serverTime = await tempExchange.fetchTime();
    const localTime = Date.now();
    const timeDifference = serverTime - localTime;
    
    console.log(`⏰ Tempo local: ${localTime}`);
    console.log(`⏰ Tempo servidor: ${serverTime}`);
    console.log(`⏰ Diferença detectada: ${timeDifference}ms`);
    
    await tempExchange.close();
    
    // Criar exchange principal com correção de tempo
    exchange = new ccxt.bybit({
      apiKey: account.api_key,
      secret: account.api_secret,
      sandbox: account.is_testnet,
      enableRateLimit: true,
      timeout: 45000,
      options: {
        defaultType: 'linear',
        hedgeMode: true,
        portfolioMargin: false
      }
    });
    
    // APLICAR CORREÇÃO DE TEMPO DIRETAMENTE
    console.log('🔧 Aplicando correção de tempo...');
    
    // Override do método nonce para incluir correção
    const originalNonce = exchange.nonce;
    exchange.nonce = function() {
      const timestamp = originalNonce.call(this);
      const correctedTimestamp = timestamp + timeDifference;
      console.log(`⏰ Timestamp original: ${timestamp}, corrigido: ${correctedTimestamp}`);
      return correctedTimestamp;
    };
    
    // Configurar recv_window maior
    exchange.options.recvWindow = 30000;
    
    console.log('🔗 Testando com correção aplicada...');
    await exchange.loadMarkets();
    console.log('✅ CORREÇÃO FUNCIONOU! Mercados carregados com sucesso!');
    
    console.log('💰 Testando operações adicionais...');
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT'] || { free: 0, total: 0 };
    console.log(`💰 Saldo: $${usdtBalance.free?.toFixed(2) || '0.00'} USDT`);
    
    console.log('🚀 SOLUÇÃO DEFINITIVA IMPLEMENTADA COM SUCESSO!');
    console.log(`📝 Diferença de tempo a aplicar: ${timeDifference}ms`);
    console.log(`📝 Recv window recomendado: 30000ms`);
    
  } catch (error) {
    console.error('❌ Erro na solução:', error.message);
    
    if (error.message.includes('10002')) {
      console.error('💥 Erro 10002 ainda persiste - API keys podem estar realmente inválidas');
    }
    
  } finally {
    if (exchange) {
      await exchange.close();
    }
  }
}

// Executar solução
solucaoDefinitiva().catch(console.error);
