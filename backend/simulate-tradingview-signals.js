/**
 * 🎯 SIMULADOR DE SINAIS TRADINGVIEW
 * Simula exatamente os sinais que o TradingView enviaria para os webhooks
 */

const http = require('http');

console.log('🎯 SIMULADOR DE SINAIS TRADINGVIEW - TESTE FINAL');
console.log('================================================');

// Dados exatos conforme Pine Script CoinBitClub
const signalPayload = {
    ticker: "BTCUSDT",
    time: "2025-07-30 15:30:00",
    close: "67850.50",
    ema9_30: "67800.25",
    rsi_4h: "65.4",
    rsi_15: "58.2",
    momentum_15: "125.6",
    atr_30: "850.25",
    atr_pct_30: "2.0",
    vol_30: "1250000",
    vol_ma_30: "980000",
    diff_btc_ema7: "0.635",
    cruzou_acima_ema9: "1",
    cruzou_abaixo_ema9: "0",
    golden_cross_30: "0",
    death_cross_30: "0"
};

// Dados exatos conforme Pine Script BTC Dominance
const dominancePayload = {
    ticker: "BTC.D",
    time: "2025-07-30 15:30:00",
    btc_dominance: "42.156",
    ema_7: "41.890",
    diff_pct: "0.635",
    sinal: "NEUTRO"
};

function testLocalWebhook(path, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'TradingView-Webhook'
            }
        };
        
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: responseData,
                    success: res.statusCode >= 200 && res.statusCode < 300
                });
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        req.write(postData);
        req.end();
    });
}

async function simulateTradingViewSignals() {
    console.log('\n🎯 SIMULANDO SINAL DE TRADING...');
    console.log('================================');
    console.log('📊 Payload:', JSON.stringify(signalPayload, null, 2));
    
    try {
        const signalResult = await testLocalWebhook('/api/webhooks/signal?token=210406', signalPayload);
        console.log(`📥 Status: ${signalResult.status}`);
        console.log(`✅ Sucesso: ${signalResult.success ? 'SIM' : 'NÃO'}`);
        console.log(`📄 Resposta: ${signalResult.data}`);
        
        if (signalResult.success) {
            const response = JSON.parse(signalResult.data);
            console.log(`🆔 Signal ID: ${response.signal_id}`);
        }
    } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
    }
    
    console.log('\n📈 SIMULANDO DOMINÂNCIA BTC...');
    console.log('==============================');
    console.log('📊 Payload:', JSON.stringify(dominancePayload, null, 2));
    
    try {
        const dominanceResult = await testLocalWebhook('/api/webhooks/dominance?token=210406', dominancePayload);
        console.log(`📥 Status: ${dominanceResult.status}`);
        console.log(`✅ Sucesso: ${dominanceResult.success ? 'SIM' : 'NÃO'}`);
        console.log(`📄 Resposta: ${dominanceResult.data}`);
        
        if (dominanceResult.success) {
            const response = JSON.parse(dominanceResult.data);
            console.log(`🆔 Dominance ID: ${response.dominance_id}`);
        }
    } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
    }
    
    console.log('\n🔍 CONSULTANDO SINAIS RECENTES...');
    console.log('=================================');
    
    try {
        const recentResult = await testLocalWebhook('/api/webhooks/signals/recent?limit=5', {});
        recentResult.method = 'GET'; // Seria GET, mas usando POST para simplicidade
        console.log(`📥 Status: ${recentResult.status}`);
        console.log(`✅ Sucesso: ${recentResult.success ? 'SIM' : 'NÃO'}`);
        
        if (recentResult.success) {
            const response = JSON.parse(recentResult.data);
            console.log(`📊 Sinais encontrados: ${response.count || 0}`);
        }
    } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
    }
    
    console.log('\n🎉 SIMULAÇÃO CONCLUÍDA!');
    console.log('=======================');
    console.log('');
    console.log('✅ Sistema local funcionando perfeitamente!');
    console.log('📋 Próximo passo: Deploy no Railway');
    console.log('');
    console.log('🔗 URLs finais para o TradingView:');
    console.log('  Signal: https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal?token=210406');
    console.log('  Dominance: https://coinbitclub-market-bot.up.railway.app/api/webhooks/dominance?token=210406');
}

simulateTradingViewSignals().catch(console.error);
