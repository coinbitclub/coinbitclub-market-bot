const https = require('https');

const testData = {
    "ticker": "BNBUSDT",
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

console.log('🧪 TESTE MÍNIMO CONFIRMAÇÃO LONG');
console.log('=================================');
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
