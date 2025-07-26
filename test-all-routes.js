/**
 * TESTE FINAL DAS ROTAS - CoinBitClub Market Bot
 * Verificar se todas as rotas estão funcionando corretamente
 * Servidor local: http://localhost:3001
 */

import axios from 'axios';

const SERVER_URL = 'http://localhost:3002';
const ADMIN_TOKEN = 'admin-emergency-token';

console.log('🔥 TESTANDO TODAS AS ROTAS DO COINBITCLUB MARKET BOT');
console.log('🌐 Servidor:', SERVER_URL);
console.log('🔑 Token admin:', ADMIN_TOKEN);

async function testAllRoutes() {
  const tests = [
    {
      name: '🏥 Health Check',
      method: 'GET',
      url: `${SERVER_URL}/api/health`,
      expectedStatus: 200
    },
    {
      name: '📊 Status Geral',
      method: 'GET',
      url: `${SERVER_URL}/api/status`,
      expectedStatus: 200
    },
    {
      name: '📋 Lista de Endpoints',
      method: 'GET',
      url: `${SERVER_URL}/api/test/endpoints`,
      expectedStatus: 200
    },
    {
      name: '🚨 Status de Emergência (Admin)',
      method: 'GET',
      url: `${SERVER_URL}/api/admin/emergency/status`,
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      expectedStatus: 200
    },
    {
      name: '🔴 Pausar Trading (Admin)',
      method: 'POST',
      url: `${SERVER_URL}/api/admin/emergency/pause-trading`,
      headers: { 
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        exchange: 'binance',
        environment: 'testnet',
        reason: 'Teste automatizado'
      },
      expectedStatus: 200
    },
    {
      name: '🟢 Retomar Trading (Admin)',
      method: 'POST',
      url: `${SERVER_URL}/api/admin/emergency/resume-trading`,
      headers: { 
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        exchange: 'binance',
        environment: 'testnet'
      },
      expectedStatus: 200
    },
    {
      name: '🚨 Botão de Emergência (Admin)',
      method: 'POST',
      url: `${SERVER_URL}/api/admin/emergency/close-all-operations`,
      headers: { 
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        reason: 'Teste de funcionalidade'
      },
      expectedStatus: 200
    },
    {
      name: '📊 Gerar Relatório IA Águia (Admin)',
      method: 'POST',
      url: `${SERVER_URL}/api/ia-aguia/generate-daily-report`,
      headers: { 
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        date: new Date().toISOString().split('T')[0]
      },
      expectedStatus: 200
    },
    {
      name: '🚨 Gerar Alerta IA Águia (Admin)',
      method: 'POST',
      url: `${SERVER_URL}/api/ia-aguia/generate-market-alert`,
      headers: { 
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        symbols: ['BTC', 'ETH'],
        severity: 'high',
        custom_prompt: 'Teste automatizado de alerta'
      },
      expectedStatus: 200
    },
    {
      name: '📋 Listar Relatórios IA Águia',
      method: 'GET',
      url: `${SERVER_URL}/api/ia-aguia/reports`,
      expectedStatus: 200
    },
    {
      name: '💳 Webhook Stripe',
      method: 'POST',
      url: `${SERVER_URL}/api/webhooks/stripe`,
      headers: { 'Content-Type': 'application/json' },
      data: {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123456',
            amount: 4990,
            currency: 'usd'
          }
        }
      },
      expectedStatus: 200
    },
    {
      name: '📡 Webhook TradingView',
      method: 'POST',
      url: `${SERVER_URL}/api/webhooks/tradingview`,
      headers: { 'Content-Type': 'application/json' },
      data: {
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 45000,
        volume: 1000,
        timestamp: new Date().toISOString()
      },
      expectedStatus: 200
    }
  ];

  console.log(`\n🧪 Executando ${tests.length} testes de rotas...\n`);

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    try {
      console.log(`🧪 ${test.name}`);

      const config = {
        method: test.method,
        url: test.url,
        timeout: 10000,
        validateStatus: () => true // Aceitar qualquer status
      };

      if (test.headers) {
        config.headers = test.headers;
      }

      if (test.data) {
        config.data = test.data;
      }

      const response = await axios(config);
      
      if (response.status === test.expectedStatus) {
        console.log(`   ✅ Status: ${response.status} - PASSOU`);
        
        // Mostrar parte da resposta
        if (response.data && typeof response.data === 'object') {
          const preview = JSON.stringify(response.data, null, 2).substring(0, 150);
          console.log(`   📄 Resposta: ${preview}...`);
        }
        
        passedTests++;
      } else {
        console.log(`   ❌ Status: ${response.status} (esperado: ${test.expectedStatus}) - FALHOU`);
        failedTests++;
      }

    } catch (error) {
      console.log(`   💥 Erro: ${error.message} - FALHOU`);
      failedTests++;
    }

    console.log(''); // Linha em branco
  }

  // Relatório final
  console.log('📊 RELATÓRIO FINAL DE TESTES');
  console.log('='.repeat(50));
  console.log(`✅ Testes Aprovados: ${passedTests}`);
  console.log(`❌ Testes Falharam: ${failedTests}`);
  console.log(`📈 Taxa de Sucesso: ${Math.round((passedTests / tests.length) * 100)}%`);

  if (passedTests === tests.length) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ TODAS AS ROTAS ESTÃO FUNCIONANDO!');
    console.log('🚀 SISTEMA 100% OPERACIONAL!');
  } else {
    console.log(`\n⚠️ ${failedTests} teste(s) falharam`);
    console.log('🔧 Verificar logs para detalhes');
  }

  console.log(`\n📅 Teste executado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`🔗 Servidor testado: ${SERVER_URL}`);
}

testAllRoutes().catch(console.error);
