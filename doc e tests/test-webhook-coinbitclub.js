// ========================================
// TESTE WEBHOOK COINBITCLUB
// Simulação de sinais do TradingView
// ========================================

const testWebhook = async (signalType) => {
  const baseUrl = 'http://localhost:3000';
  
  // Dados de exemplo conforme o formato do Pine Script
  const webhookData = {
    ticker: "XRPUSDT",
    time: "2025-08-20 21:58:00",
    close: "2.9495",
    ema9_30: "2.9200",
    rsi_4h: "45.07222",
    rsi_15: "62.958961799",
    momentum_15: "-1.53561729",
    atr_30: "0.02200096", 
    atr_pct_30: "0.7460936",
    vol_30: "1547392",
    vol_ma_30: "5918656.214857",
    diff_btc_ema7: "-0.09949054",
    cruzou_acima_ema9: "0",
    cruzou_abaixo_ema9: "0", 
    golden_cross_30: "0",
    death_cross_30: "0",
    signal: signalType
  };

  try {
    console.log(`🧪 Testando sinal: ${signalType}`);
    console.log('📊 Dados do webhook:', webhookData);
    
    const response = await fetch(`${baseUrl}/api/webhooks/signal?token=210406`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });

    const result = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log('📨 Resposta:', JSON.stringify(result, null, 2));
    console.log('─'.repeat(80));
    
    return result;
    
  } catch (error) {
    console.error(`❌ Erro ao testar sinal ${signalType}:`, error);
    console.log('─'.repeat(80));
  }
};

// Executar testes
const runTests = async () => {
  console.log('🎯 INICIANDO TESTES DO WEBHOOK COINBITCLUB');
  console.log('═'.repeat(80));
  
  // Teste 1: Health Check
  console.log('🔍 Teste 1: Health Check');
  try {
    const healthResponse = await fetch('http://localhost:3000/api/webhooks/signal');
    const healthResult = await healthResponse.json();
    console.log('✅ Health Check:', JSON.stringify(healthResult, null, 2));
  } catch (error) {
    console.error('❌ Erro no Health Check:', error);
  }
  console.log('─'.repeat(80));
  
  // Teste 2: Sinal LONG
  await testWebhook("SINAL LONG");
  
  // Teste 3: Sinal LONG FORTE  
  await testWebhook("SINAL LONG FORTE");
  
  // Teste 4: Sinal SHORT
  await testWebhook("SINAL SHORT");
  
  // Teste 5: Sinal SHORT FORTE
  await testWebhook("SINAL SHORT FORTE");
  
  // Teste 6: Feche LONG
  await testWebhook("FECHE LONG");
  
  // Teste 7: Feche SHORT
  await testWebhook("FECHE SHORT");
  
  // Teste 8: Confirmação LONG
  await testWebhook("CONFIRMAÇÃO LONG");
  
  // Teste 9: Sinal inválido
  await testWebhook("SINAL INVALIDO");
  
  // Teste 10: Token inválido
  console.log('🧪 Testando token inválido');
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/signal?token=INVALIDO', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ticker: "BTCUSDT",
        signal: "SINAL LONG"
      })
    });
    
    const result = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log('📨 Resposta:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Erro no teste de token inválido:', error);
  }
  
  console.log('═'.repeat(80));
  console.log('🎉 TESTES DO WEBHOOK CONCLUÍDOS!');
};

// Executar os testes
runTests();
