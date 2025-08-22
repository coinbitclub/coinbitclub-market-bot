// ========================================
// TESTE DE SINAL TRADINGVIEW SIMULADO
// Simular envio de sinal para testar o sistema
// ========================================

const axios = require('axios');

async function testarSinalTradingView() {
  try {
    console.log('🧪 TESTE DE SINAL TRADINGVIEW SIMULADO');
    console.log('======================================\n');

    // Simular diferentes tipos de sinais
    const sinais = [
      {
        nome: 'SINAL LONG LINK/USDT',
        data: {
          message: "SINAL LONG FORTE",
          symbol: "LINKUSDT", 
          action: "BUY",
          price: 25.0250,
          alert: "Long entry on LINK/USDT",
          timestamp: new Date().toISOString()
        }
      },
      {
        nome: 'SINAL SHORT BTC/USDT', 
        data: {
          message: "SINAL SHORT BTC",
          symbol: "BTCUSDT",
          action: "SELL", 
          price: 64500,
          alert: "Short entry on BTC/USDT",
          timestamp: new Date().toISOString()
        }
      },
      {
        nome: 'SINAL FECHAR POSIÇÕES',
        data: {
          message: "FECHE TODAS AS POSIÇÕES",
          action: "CLOSE",
          alert: "Close all positions",
          timestamp: new Date().toISOString()
        }
      }
    ];

    const url = 'http://localhost:3000/api/webhooks/signal?token=210406';

    for (let i = 0; i < sinais.length; i++) {
      const sinal = sinais[i];
      
      console.log(`📡 Enviando sinal ${i + 1}/3: ${sinal.nome}`);
      console.log('Dados:', JSON.stringify(sinal.data, null, 2));

      try {
        const response = await axios.post(url, sinal.data, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'TradingView-Webhook/1.0',
            'X-Webhook-ID': `test-${Date.now()}-${i}`
          },
          timeout: 30000
        });

        console.log('✅ Resposta do servidor:');
        console.log(JSON.stringify(response.data, null, 2));

      } catch (error) {
        console.log('❌ Erro no envio:');
        if (error.response) {
          console.log('Status:', error.response.status);
          console.log('Dados:', error.response.data);
        } else {
          console.log('Erro:', error.message);
        }
      }

      console.log('\n' + '='.repeat(50) + '\n');

      // Aguardar 3 segundos entre sinais
      if (i < sinais.length - 1) {
        console.log('⏳ Aguardando 3 segundos...\n');
        await sleep(3000);
      }
    }

    // Testar endpoint de saúde
    console.log('🏥 Testando endpoint de saúde...');
    try {
      const healthResponse = await axios.get('http://localhost:3000/health');
      console.log('✅ Health check:');
      console.log(JSON.stringify(healthResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Erro no health check:', error.message);
    }

    console.log('\n🎯 TESTE CONCLUÍDO!');
    console.log('Verifique os logs do servidor para ver o processamento dos sinais.');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Aguardar 2 segundos para o servidor estar pronto
setTimeout(() => {
  testarSinalTradingView().catch(console.error);
}, 2000);
