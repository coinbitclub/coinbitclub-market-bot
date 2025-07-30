const https = require('https');

const options = {
    hostname: 'coinbitclub-market-bot.up.railway.app',
    port: 443,
    path: '/',
    method: 'GET'
};

console.log('🧪 TESTE DE SAÚDE DA API');
console.log('=========================');

const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('✅ Resposta:', data);
    });
});

req.on('error', (e) => {
    console.error('❌ Erro:', e.message);
});

req.end();
