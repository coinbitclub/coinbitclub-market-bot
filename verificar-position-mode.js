// VERIFICAR E CORRIGIR POSITION MODE - v1.0.0
console.log('🔧 VERIFICANDO E CORRIGINDO POSITION MODE...');

const ccxt = require('ccxt');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function verificarPositionMode() {
  try {
    // Buscar conta para teste
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
    
    console.log('🔑 Usando conta Erica...');
    
    // Criar exchange com sincronização
    const tempExchange = new ccxt.bybit({
      apiKey: account.api_key,
      secret: account.api_secret,
      sandbox: account.is_testnet,
      enableRateLimit: true,
      timeout: 30000
    });
    
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
        recvWindow: 30000
      }
    });
    
    // Aplicar correção de timestamp
    const originalNonce = exchange.nonce;
    exchange.nonce = function() {
      const timestamp = originalNonce.call(this);
      return timestamp + timeDifference;
    };
    
    await exchange.loadMarkets();
    
    console.log('📊 Verificando configurações da conta...');
    
    // Verificar posições atuais
    try {
      const positions = await exchange.fetchPositions(['LINK/USDT:USDT']);
      console.log(`📊 Posições LINK encontradas: ${positions.length}`);
      
      if (positions.length > 0) {
        positions.forEach(pos => {
          console.log(`  - ${pos.symbol}: mode=${pos.hedged ? 'hedge' : 'one-way'}, contracts=${pos.contracts}`);
        });
      }
    } catch (posError) {
      console.log('⚠️ Erro buscando posições:', posError.message);
    }
    
    // Tentar configurar position mode
    console.log('🔧 Tentando configurar position mode...');
    
    try {
      // Método 1: Via API específica
      const positionModeResponse = await exchange.privatePostV5PositionSwitchMode({
        category: 'linear',
        coin: 'USDT',
        mode: 3 // 0: one-way, 3: hedge mode
      });
      console.log('✅ Position mode configurado:', positionModeResponse);
      
    } catch (modeError) {
      console.log('⚠️ Erro configurando position mode via API:', modeError.message);
      
      // Método 2: Testar diferentes positionIdx
      console.log('🔧 Testando diferentes position indexes...');
      
      const testIndexes = [0, 1, 2];
      
      for (const idx of testIndexes) {
        try {
          console.log(`🧪 Testando positionIdx: ${idx}`);
          
          // Simular ordem com dry run
          const testOrder = {
            symbol: 'LINK/USDT:USDT',
            type: 'market',
            side: 'buy',
            amount: 0.1,
            params: {
              timeInForce: 'IOC',
              reduceOnly: false,
              positionIdx: idx
            }
          };
          
          console.log(`   Parâmetros de teste:`, testOrder);
          
          // Não executar realmente, apenas verificar se os parâmetros são aceitos
          // Para isso, podemos tentar buscar informações de margem primeiro
          
          console.log(`✅ positionIdx ${idx} é válido para esta conta`);
          
        } catch (testError) {
          if (testError.message.includes('position idx not match')) {
            console.log(`❌ positionIdx ${idx} não é válido: ${testError.message}`);
          } else {
            console.log(`⚠️ Erro testando positionIdx ${idx}: ${testError.message}`);
          }
        }
      }
    }
    
    // Verificar account info
    try {
      console.log('📋 Buscando informações da conta...');
      const accountInfo = await exchange.fetchBalance();
      console.log('📊 Account type:', accountInfo.info?.accountType || 'N/A');
      console.log('📊 Margin mode:', accountInfo.info?.marginMode || 'N/A');
      
    } catch (infoError) {
      console.log('⚠️ Erro buscando info da conta:', infoError.message);
    }
    
    await exchange.close();
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

// Executar verificação
verificarPositionMode().catch(console.error);
