// TESTE FINAL DAS CORREÇÕES DE TIMESTAMP - v3.0.0
console.log('🧪 TESTANDO CORREÇÕES DE TIMESTAMP...');

const { Pool } = require('pg');
const ccxt = require('ccxt');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function testarCorrecoes() {
  try {
    console.log('📊 Buscando conta real para teste...');
    
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
      console.log('❌ Nenhuma conta MAINNET encontrada');
      return;
    }
    
    const account = result.rows[0];
    console.log(`🎯 Testando: ${account.email}`);
    console.log(`🔑 API Key: ${account.api_key.substring(0, 8)}...`);
    
    await testarContaComCorrecoes(account);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await pool.end();
  }
}

async function testarContaComCorrecoes(account) {
  let exchange = null;
  
  try {
    console.log('\n🔧 APLICANDO TODAS AS CORREÇÕES...');
    
    // Configuração idêntica à do servidor principal
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
      },
      headers: {
        'recv-window': '20000'
      }
    });
    
    console.log('⏰ ETAPA 1: Configurando parâmetros temporais...');
    exchange.options.recvWindow = 20000;
    exchange.options.timeDifference = 0;
    
    console.log('⏰ ETAPA 2: Sincronizando tempo...');
    const serverTime = await exchange.fetchTime();
    const localTime = Date.now();
    const timeDiff = serverTime - localTime;
    
    console.log(`⏰ Tempo local: ${new Date(localTime).toISOString()}`);
    console.log(`⏰ Tempo servidor: ${new Date(serverTime).toISOString()}`);
    console.log(`⏰ Diferença: ${timeDiff}ms`);
    
    if (Math.abs(timeDiff) > 5000) {
      console.log(`⚠️ Ajustando diferença temporal: ${timeDiff}ms`);
      exchange.options.timeDifference = timeDiff;
    }
    
    console.log('🔗 ETAPA 3: Carregando mercados...');
    await exchange.loadMarkets();
    console.log('✅ Mercados carregados com sucesso!');
    
    console.log('💰 ETAPA 4: Verificando saldo...');
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT'] || { free: 0, total: 0 };
    console.log(`💰 Saldo USDT: $${usdtBalance.free?.toFixed(2) || '0.00'}`);
    
    console.log('📊 ETAPA 5: Verificando posições...');
    const positions = await exchange.fetchPositions();
    const openPositions = positions.filter(pos => pos.contracts > 0);
    console.log(`📊 Posições abertas: ${openPositions.length}`);
    
    console.log('✅ TODAS AS CORREÇÕES FUNCIONARAM!');
    console.log('🚀 SISTEMA PRONTO PARA OPERAÇÕES REAIS!');
    
  } catch (error) {
    console.error('❌ ERRO APÓS CORREÇÕES:', error.message);
    
    if (error.message.includes('10002')) {
      console.error('💥 ERRO 10002 PERSISTE - INVESTIGAÇÃO ADICIONAL NECESSÁRIA');
    } else if (error.message.includes('10003')) {
      console.error('💥 API KEY REALMENTE INVÁLIDA');
    } else {
      console.error('💥 ERRO DESCONHECIDO:', error.code || 'NO_CODE');
    }
    
  } finally {
    if (exchange) {
      await exchange.close();
    }
  }
}

// Executar teste
testarCorrecoes().catch(console.error);
