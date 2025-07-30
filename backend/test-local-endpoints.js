const http = require('http');

console.log('🧪 TESTANDO ENDPOINTS LOCAIS');
console.log('============================');

function testLocalEndpoint(path, data = {}) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                console.log(`\n${path}:`);
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response: ${responseData}`);
                resolve({ status: res.statusCode, data: responseData });
            });
        });
        
        req.on('error', (err) => {
            console.error(`Erro em ${path}:`, err.message);
            reject(err);
        });
        
        req.write(postData);
        req.end();
    });
}

async function testEndpoints() {
    // Teste 1: Signal endpoint com token correto
    await testLocalEndpoint('/api/webhooks/signal?token=210406', {
        ticker: 'BTCUSDT',
        time: '2025-07-30 15:30:00',
        close: '67850.50',
        ema9_30: '67800.25',
        source: 'test_local'
    });
    
    // Teste 2: Dominance endpoint com token correto
    await testLocalEndpoint('/api/webhooks/dominance?token=210406', {
        ticker: 'BTC.D',
        time: '2025-07-30 15:30:00',
        btc_dominance: '42.156',
        sinal: 'NEUTRO',
        source: 'test_local'
    });
    
    // Teste 3: Token inválido
    await testLocalEndpoint('/api/webhooks/signal?token=wrong', {
        ticker: 'BTCUSDT',
        source: 'test_wrong_token'
    });
    
    console.log('\n✅ Testes locais concluídos!');
}

testEndpoints().catch(console.error);
