// ========================================
// TESTE RÁPIDO DE CONECTIVIDADE COM EXCHANGES
// Executar sem Jest para debug rápido
// ========================================

import { ExchangeService } from '../src/services/exchange.service.js';
import { ExchangeType } from '../src/types/trading.types.js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function testExchangeConnectivity() {
  console.log('🚀 TESTE DE CONECTIVIDADE COM EXCHANGES');
  console.log('=========================================');

  const exchangeService = ExchangeService.getInstance();

  // ========================================
  // 1. VALIDAR CONFIGURAÇÃO DE AMBIENTE
  // ========================================
  
  console.log('\n🔧 1. VALIDANDO CONFIGURAÇÃO DE AMBIENTE...');
  
  const ngrokIps = process.env.NGROK_IP_FIXO?.split(',') || [];
  console.log(`📋 IPs configurados para whitelist (${ngrokIps.length}):`);
  ngrokIps.forEach((ip, index) => {
    console.log(`   ${index + 1}. ${ip.trim()}`);
  });
  
  console.log(`🌐 NGROK domain: ${process.env.NGROK_DOMAIN_FIXO}`);
  console.log(`🔗 Webhook base URL: ${process.env.WEBHOOK_BASE_URL}`);
  
  const binanceApiKey = process.env.BINANCE_API_KEY;
  const binanceApiSecret = process.env.BINANCE_API_SECRET;
  
  console.log(`🔑 Binance API Key: ${binanceApiKey ? `${binanceApiKey.substring(0, 8)}...` : 'NOT SET'}`);
  console.log(`🔑 Binance API Secret: ${binanceApiSecret ? `${binanceApiSecret.substring(0, 8)}...` : 'NOT SET'}`);

  // ========================================
  // 2. TESTAR CONECTIVIDADE BINANCE
  // ========================================
  
  console.log('\n📊 2. TESTANDO CONECTIVIDADE BINANCE...');
  
  if (binanceApiKey && binanceApiSecret) {
    try {
      const testResult = await exchangeService.testConnection({
        apiKey: binanceApiKey,
        apiSecret: binanceApiSecret,
        passphrase: undefined
      }, ExchangeType.BINANCE);
      
      if (testResult.success) {
        console.log('✅ Binance: CONECTADO COM SUCESSO');
        console.log(`🔧 Testnet detectado: ${testResult.isTestnet}`);
        console.log(`🔑 Permissões - Read: ${testResult.permissions?.canRead}, Trade: ${testResult.permissions?.canTrade}, Withdraw: ${testResult.permissions?.canWithdraw}`);
      } else {
        console.log(`❌ Binance: FALHA NA CONEXÃO - ${testResult.error}`);
      }
    } catch (error) {
      console.log(`❌ Binance: ERRO DURANTE TESTE - ${(error as Error).message}`);
    }
  } else {
    console.log('⚠️ Binance: CREDENCIAIS NÃO CONFIGURADAS (pular teste)');
  }

  // ========================================
  // 3. TESTAR SALDO (se conectado)
  // ========================================
  
  console.log('\n💰 3. TESTANDO BUSCA DE SALDO...');
  
  try {
    // Tentar buscar saldo de uma conta de teste
    const accounts = await exchangeService.getUserExchangeAccounts('test-user-id');
    console.log(`✅ getUserExchangeAccounts: Retornou ${accounts.length} contas`);
  } catch (error) {
    console.log(`⚠️ Teste de saldo: ${(error as Error).message}`);
  }

  // ========================================
  // 4. VALIDAR WHITELISTING DE IP
  // ========================================
  
  console.log('\n🌐 4. VALIDANDO WHITELISTING DE IP...');
  
  if (ngrokIps.length > 0) {
    console.log('✅ IPs configurados para whitelist nas exchanges:');
    ngrokIps.forEach((ip, index) => {
      console.log(`   ${index + 1}. ${ip.trim()} ← ADICIONAR NA BINANCE/BYBIT`);
    });
    
    console.log('\n📋 INSTRUÇÕES PARA WHITELISTING:');
    console.log('🔹 BINANCE: Login → Account → API Management → Edit API Key → IP Access Restriction');
    console.log('🔹 BYBIT: Login → Account → API → API Management → Edit API Key → IP Restriction');
    console.log('🔹 ADICIONAR: Todos os IPs listados acima');
  } else {
    console.log('❌ Nenhum IP configurado para whitelist');
  }

  console.log('\n🎯 TESTE CONCLUÍDO');
  console.log('==================');
}

// Executar teste
testExchangeConnectivity()
  .then(() => {
    console.log('\n✅ Teste de conectividade finalizado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante teste de conectividade:', error);
    process.exit(1);
  });
