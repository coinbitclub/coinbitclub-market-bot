const https = require('https');

const testData = {
    "ticker": "BTCUSDT",
    "signal": "SINAL LONG"
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

console.log('🧪 TESTE BÁSICO COINBITCLUB');
console.log('===========================');
console.log('📦 Payload:', JSON.stringify(testData, null, 2));
console.log('🌐 Enviando para:', `https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            console.log('✅ Resposta:', JSON.stringify(jsonData, null, 2));
        } catch (e) {
            console.log('📝 Resposta (texto):', data);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Erro:', e.message);
});

req.write(JSON.stringify(testData));
req.end();
