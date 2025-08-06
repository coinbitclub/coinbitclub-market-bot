const https = require('https');

const testData = {
    "ticker": "BNBUSDT",
    "time": "2025-07-30 16:10:00",
    "close": "312.45",
    "ema9_30": "309.87", 
    "rsi_4h": "65.43",
    "rsi_15": "69.87",
    "momentum_15": "12.34",
    "atr_30": "8.76",
    "atr_pct_30": "2.80",
    "vol_30": "3456.78",
    "vol_ma_30": "2987.65",
    "diff_btc_ema7": "0.58",
    "cruzou_acima_ema9": "0",
    "cruzou_abaixo_ema9": "0", 
    "golden_cross_30": "0",
    "death_cross_30": "0",
    "signal": "CONFIRMAÇÃO LONG"
};

const options = {
    hostname: 'coinbitclub-market-bot.up.railway.app',
    port: 443,
    path: '/api/webhooks/signal',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify(testData).length
    }
};

console.log('🧪 TESTE DEBUG CONFIRMAÇÃO LONG');
console.log('================================');
console.log('📦 Payload:', JSON.stringify(testData, null, 2));

const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            console.log('✅ Resposta JSON:', JSON.stringify(jsonData, null, 2));
        } catch (e) {
            console.log('📝 Resposta raw:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Erro:', e.message);
});

req.write(JSON.stringify(testData));
req.end();
