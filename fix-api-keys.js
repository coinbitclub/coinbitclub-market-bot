// VERIFICADOR E CORRETOR DE API KEYS - v2.0.0
console.log('🔧 INICIANDO DIAGNÓSTICO E CORREÇÃO DE API KEYS...');

const { Pool } = require('pg');
const ccxt = require('ccxt');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function diagnosticarECorrigir() {
  try {
    console.log('📊 Buscando todas as contas...');
    
    const query = `
      SELECT u.id as user_id, u.email, uea.id as account_id, 
             uea.account_name, uea.api_key, uea.api_secret, 
             uea.is_testnet, uea.is_active, uea.can_trade
      FROM users u 
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE uea.is_active = true AND uea.can_trade = true
      ORDER BY u.email
    `;
    
    const result = await pool.query(query);
    const accounts = result.rows;
    
    console.log(`🔑 Encontradas ${accounts.length} contas para diagnóstico`);
    
    const statusReport = [];
    
    for (const account of accounts) {
      console.log(`\n📋 DIAGNÓSTICO: ${account.email} (${account.account_name})`);
      
      const accountStatus = await diagnosticarConta(account);
      statusReport.push(accountStatus);
      
      if (accountStatus.needsfix) {
        console.log(`🔧 Aplicando correções...`);
        await aplicarCorrecoes(account, accountStatus);
      }
    }
    
    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    statusReport.forEach(status => {
      const emoji = status.working ? '✅' : (status.needsfix ? '🔧' : '❌');
      console.log(`${emoji} ${status.email}: ${status.status}`);
    });
    
    console.log('\n✅ DIAGNÓSTICO COMPLETO!');
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  } finally {
    await pool.end();
  }
}

async function diagnosticarConta(account) {
  const status = {
    email: account.email,
    account_name: account.account_name,
    working: false,
    needsfix: false,
    errors: [],
    fixes: []
  };
  
  try {
    // Verificar se é API key de teste
    const isTestKey = account.api_key.length < 15 || 
                      account.api_key.startsWith('test_') ||
                      account.api_key.startsWith('demo_') ||
                      account.api_key === 'test_key';
    
    if (isTestKey) {
      status.status = 'API KEY DE TESTE';
      status.needsfix = true;
      status.fixes.push('Substituir por API key real da Bybit');
      return status;
    }
    
    // Criar exchange com configurações otimizadas
    const exchange = new ccxt.bybit({
      apiKey: account.api_key,
      secret: account.api_secret,
      sandbox: account.is_testnet,
      enableRateLimit: true,
      timeout: 30000,
      options: {
        defaultType: 'linear',
        hedgeMode: true,
        recvWindow: 15000 // Janela mais ampla
      }
    });
    
    // Teste 1: Sincronização de tempo
    console.log('⏰ Testando sincronização...');
    await exchange.fetchTime();
    console.log('✅ Sincronização: OK');
    
    // Teste 2: Carregar mercados
    console.log('🔗 Testando conectividade...');
    await exchange.loadMarkets();
    console.log('✅ Conectividade: OK');
    
    // Teste 3: Verificar saldo
    console.log('💰 Verificando saldo...');
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT'] || { free: 0, total: 0 };
    console.log(`💰 Saldo USDT: $${usdtBalance.free?.toFixed(2) || '0.00'}`);
    
    if (usdtBalance.free < 1) {
      status.needsfix = true;
      status.fixes.push('Depositar USDT na conta');
    }
    
    // Teste 4: Verificar configuração de posição
    console.log('⚙️ Testando configuração...');
    const positions = await exchange.fetchPositions(['BTCUSDT/USDT:USDT']);
    console.log('✅ Configuração de posição: OK');
    
    status.working = true;
    status.status = 'FUNCIONANDO PERFEITAMENTE';
    
    await exchange.close();
    
  } catch (error) {
    console.error(`❌ Erro:`, error.message);
    status.errors.push(error.message);
    
    // Analisar tipo de erro
    if (error.message.includes('10003')) {
      status.status = 'API KEY INVÁLIDA';
      status.needsfix = true;
      status.fixes.push('Gerar nova API key na Bybit');
      
    } else if (error.message.includes('10002')) {
      status.status = 'PROBLEMA DE TIMESTAMP';
      status.needsfix = true;
      status.fixes.push('Configurar recvWindow maior');
      
    } else if (error.message.includes('10001')) {
      status.status = 'CONFIGURAÇÃO DE POSIÇÃO';
      status.needsfix = true;
      status.fixes.push('Ativar hedge mode na Bybit');
      
    } else if (error.message.includes('timeout')) {
      status.status = 'TIMEOUT DE CONEXÃO';
      status.needsfix = true;
      status.fixes.push('Aumentar timeout');
      
    } else {
      status.status = 'ERRO DESCONHECIDO';
      status.needsfix = false;
    }
  }
  
  return status;
}

async function aplicarCorrecoes(account, status) {
  try {
    console.log(`🔧 Aplicando correções para ${account.email}:`);
    
    for (const fix of status.fixes) {
      console.log(`  - ${fix}`);
      
      // Implementar correções automáticas possíveis
      if (fix.includes('recvWindow')) {
        // Esta correção já foi aplicada no código principal
        console.log('    ✅ Correção aplicada no código principal');
      } else if (fix.includes('timeout')) {
        // Esta correção já foi aplicada no código principal  
        console.log('    ✅ Correção aplicada no código principal');
      } else {
        console.log('    ⚠️ Correção manual necessária');
      }
    }
    
  } catch (error) {
    console.error(`❌ Erro aplicando correções:`, error);
  }
}

// Executar diagnóstico
diagnosticarECorrigir().catch(console.error);
