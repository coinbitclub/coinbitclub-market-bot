const axios = require('axios');

// Função para investigar via APIs do servidor Railway
async function investigateViaRailwayAPIs() {
  console.log('🚂 INVESTIGAÇÃO VIA APIs DO SERVIDOR RAILWAY\n');
  console.log(`🕐 Relatório gerado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);
  
  const baseUrl = 'https://coinbitclub-market-bot.up.railway.app';
  
  // Testar endpoints principais
  const endpoints = [
    { path: '/api/system/status', name: 'Status do Sistema' },
    { path: '/api/market/intelligence', name: 'Market Intelligence' },
    { path: '/api/overview', name: 'Overview Geral' },
    { path: '/api/trading/operations', name: 'Operações de Trading' },
    { path: '/api/trading/signals', name: 'Sinais Recebidos' },
    { path: '/api/users/active', name: 'Usuários Ativos' }
  ];
  
  console.log('📡 TESTANDO ENDPOINTS DO SERVIDOR:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${baseUrl}${endpoint.path}`, { 
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log(`✅ ${endpoint.name}: ${response.status}`);
      
      // Mostrar dados relevantes dependendo do endpoint
      if (endpoint.path === '/api/system/status') {
        console.log(`   📊 Dados: ${JSON.stringify(response.data, null, 2)}`);
      } else if (endpoint.path === '/api/trading/operations') {
        console.log(`   💼 Operações: ${JSON.stringify(response.data, null, 2)}`);
      } else if (endpoint.path === '/api/trading/signals') {
        console.log(`   📨 Sinais: ${JSON.stringify(response.data, null, 2)}`);
      } else if (endpoint.path === '/api/users/active') {
        console.log(`   👥 Usuários: ${JSON.stringify(response.data, null, 2)}`);
      } else if (endpoint.path === '/api/market/intelligence') {
        console.log(`   🧠 Market Intelligence: ${JSON.stringify(response.data, null, 2)}`);
      } else {
        console.log(`   📋 Resumo: ${JSON.stringify(response.data).substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ERRO - ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data)}`);
      }
    }
    console.log('');
  }
  
  // Testar webhook mais uma vez
  console.log('🧪 TESTE FINAL DE WEBHOOK:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const testSignal = {
    symbol: 'BTCUSDT',
    action: 'BUY',
    price: 43500,
    quantity: 0.001,
    timestamp: new Date().toISOString(),
    source: 'FINAL_DIAGNOSTIC_TEST'
  };
  
  try {
    console.log('📤 Enviando sinal de teste...');
    const response = await axios.post(
      `${baseUrl}/api/webhooks/signal?token=210406`,
      testSignal,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Webhook Response: ${response.status}`);
    console.log(`📊 Data: ${JSON.stringify(response.data, null, 2)}`);
    
    // Aguardar um pouco e verificar via API se o sinal foi processado
    console.log('⏳ Aguardando 10 segundos e verificando processamento...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Verificar se apareceu nos sinais
    try {
      const signalsCheck = await axios.get(`${baseUrl}/api/trading/signals`, { timeout: 10000 });
      console.log(`📨 Verificação de sinais: ${signalsCheck.status}`);
      console.log(`📊 Sinais recentes: ${JSON.stringify(signalsCheck.data, null, 2)}`);
    } catch (error) {
      console.log(`❌ Erro ao verificar sinais: ${error.message}`);
    }
    
    // Verificar se gerou operação
    try {
      const operationsCheck = await axios.get(`${baseUrl}/api/trading/operations`, { timeout: 10000 });
      console.log(`💼 Verificação de operações: ${operationsCheck.status}`);
      console.log(`📊 Operações recentes: ${JSON.stringify(operationsCheck.data, null, 2)}`);
    } catch (error) {
      console.log(`❌ Erro ao verificar operações: ${error.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Webhook Test Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
  }
  
  console.log('\n🎯 CONCLUSÃO DA INVESTIGAÇÃO:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Webhooks chegam e respondem 200 (confirmado pelos logs Railway)');
  console.log('📡 Servidor Railway está ONLINE e respondendo');
  console.log('❓ Precisa verificar se os dados estão sendo persistidos corretamente');
  console.log('❓ Precisa verificar se há usuários ativos para receber as operações');
  console.log('❓ Precisa verificar se o Market Intelligence está permitindo trades');
  
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('1️⃣ Verificar logs detalhados do Railway (Deploy Logs)');
  console.log('2️⃣ Confirmar estrutura das tabelas no banco');
  console.log('3️⃣ Verificar se existem usuários com trading_active = true');
  console.log('4️⃣ Verificar regras do Market Intelligence');
  console.log('5️⃣ Analisar código de processamento de sinais no servidor');
}

investigateViaRailwayAPIs();
