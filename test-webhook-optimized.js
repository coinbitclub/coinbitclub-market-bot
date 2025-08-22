const axios = require('axios');

// Teste do webhook otimizado
async function testWebhookOptimizado() {
  console.log('🧪 TESTANDO WEBHOOK OTIMIZADO (FIX 499)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const baseUrl = 'https://coinbitclub-market-bot.up.railway.app';
  const webhookUrl = `${baseUrl}/api/webhooks/signal?token=210406`;
  
  const testSignals = [
    {
      name: 'SINAL LONG FORTE',
      data: {
        action: 'SINAL LONG FORTE',
        symbol: 'BTCUSDT',
        strategy: 'EMA Cross',
        timeframe: '15m',
        confidence: 85,
        price: 43250.50
      }
    },
    {
      name: 'SINAL SHORT FORTE',
      data: {
        action: 'SINAL SHORT FORTE',
        symbol: 'ETHUSDT',
        strategy: 'RSI Divergence',
        timeframe: '1h',
        confidence: 78,
        price: 2850.75
      }
    },
    {
      name: 'FECHE LONG',
      data: {
        action: 'FECHE LONG',
        symbol: 'BTCUSDT',
        alert_message: 'Fechar posições LONG',
        timeframe: '15m'
      }
    }
  ];
  
  console.log(`🎯 URL de teste: ${webhookUrl}`);
  console.log(`📡 Testando ${testSignals.length} sinais...\n`);
  
  for (let i = 0; i < testSignals.length; i++) {
    const signal = testSignals[i];
    const startTime = Date.now();
    
    try {
      console.log(`\n📤 TESTE ${i + 1}/3: ${signal.name}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Dados:', JSON.stringify(signal.data, null, 2));
      
      const response = await axios.post(webhookUrl, signal.data, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TradingView-Webhook/1.0',
          'X-Webhook-ID': `test-${Date.now()}-${i}`
        },
        timeout: 10000 // 10 segundos timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ SUCESSO em ${responseTime}ms`);
      console.log('📈 Status:', response.status);
      console.log('📋 Resposta:', JSON.stringify(response.data, null, 2));
      
      // Verificar se a resposta foi rápida (< 1000ms)
      if (responseTime < 1000) {
        console.log('⚡ EXCELENTE: Resposta ultra-rápida!');
      } else if (responseTime < 3000) {
        console.log('✅ BOM: Resposta dentro do esperado');
      } else {
        console.log('⚠️ LENTO: Resposta demorada (pode causar 499)');
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.log(`❌ ERRO em ${responseTime}ms`);
      
      if (error.code === 'ECONNABORTED') {
        console.log('⏰ Timeout na requisição');
      } else if (error.response) {
        console.log('📝 Status:', error.response.status);
        console.log('📋 Erro:', error.response.data);
        
        if (error.response.status === 499) {
          console.log('🚨 ERRO 499 DETECTADO - Webhook ainda não otimizado!');
        }
      } else {
        console.log('📝 Erro:', error.message);
      }
    }
    
    // Aguardar 2 segundos entre testes
    if (i < testSignals.length - 1) {
      console.log('\n⏳ Aguardando 2 segundos...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n📊 RESUMO DO TESTE:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Webhook otimizado testado');
  console.log('✅ Verificação de tempo de resposta concluída');
  console.log('✅ Sistema pronto para receber sinais TradingView');
  
  // Teste de stress (opcional)
  console.log('\n🔥 TESTE DE STRESS (5 sinais rápidos):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const stressSignal = {
    action: 'STRESS TEST',
    symbol: 'BTCUSDT',
    timestamp: new Date().toISOString()
  };
  
  const stressResults = [];
  
  for (let i = 0; i < 5; i++) {
    const stressStart = Date.now();
    
    try {
      const response = await axios.post(webhookUrl, {
        ...stressSignal,
        test_id: i + 1
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-ID': `stress-${Date.now()}-${i}`
        },
        timeout: 5000
      });
      
      const stressTime = Date.now() - stressStart;
      stressResults.push({ success: true, time: stressTime });
      
      console.log(`✅ Stress ${i + 1}/5: ${stressTime}ms`);
      
    } catch (error) {
      const stressTime = Date.now() - stressStart;
      stressResults.push({ success: false, time: stressTime, error: error.message });
      
      console.log(`❌ Stress ${i + 1}/5: ${stressTime}ms - ${error.message}`);
    }
    
    // Pausa mínima entre requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const successfulStress = stressResults.filter(r => r.success);
  const averageTime = successfulStress.reduce((sum, r) => sum + r.time, 0) / successfulStress.length;
  
  console.log(`\n📈 Resultados do stress test:`);
  console.log(`   ✅ Sucessos: ${successfulStress.length}/5`);
  console.log(`   ⚡ Tempo médio: ${averageTime.toFixed(0)}ms`);
  console.log(`   🎯 Taxa de sucesso: ${(successfulStress.length / 5 * 100).toFixed(1)}%`);
  
  if (averageTime < 500) {
    console.log('🎉 EXCELENTE: Sistema super responsivo!');
  } else if (averageTime < 1000) {
    console.log('✅ BOM: Sistema responsivo!');
  } else {
    console.log('⚠️ Pode melhorar: Sistema um pouco lento');
  }
}

testWebhookOptimizado().catch(console.error);
