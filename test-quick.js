/**
 * 🧪 TESTE RÁPIDO SINAL COINBITCLUB
 */

const https = require('https');

const payload = {
    ticker: "BTCUSDT",
    time: "2025-07-30 15:30:00",
    close: "45123.45",
    ema9_30: "44987.12",
    rsi_4h: "68.54",
    diff_btc_ema7: "0.67",
    cruzou_acima_ema9: "1",
    cruzou_abaixo_ema9: "0",
    golden_cross_30: "0",
    death_cross_30: "0",
    signal: "SINAL LONG"
};

console.log('🧪 TESTE RÁPIDO COINBITCLUB');
console.log('===========================');
console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));

const data = JSON.stringify(payload);

const options = {
    hostname: 'coinbitclub-market-bot.up.railway.app',
    port: 443,
    path: '/api/webhooks/signal',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
    
    let responseData = '';
    
    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        try {
            const jsonResponse = JSON.parse(responseData);
            console.log(`✅ Resposta:`, JSON.stringify(jsonResponse, null, 2));
        } catch (e) {
            console.log(`✅ Resposta (raw):`, responseData);
        }
    });
});

req.on('error', (error) => {
    console.error(`❌ Erro:`, error.message);
});

req.write(data);
req.end();
