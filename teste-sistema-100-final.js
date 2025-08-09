const https = require('https');

console.log('🚀 TESTANDO SISTEMA COMPLETO APÓS DEPLOY...\n');

const baseUrl = 'https://coinbitclub-market-bot.up.railway.app';

// Teste 1: Health Check
console.log('1️⃣ Testando health check...');
testGet(baseUrl + '/health')
    .then(result => {
        console.log('✅ Health check OK:', result);
        
        // Teste 2: Dominância BTC (novo endpoint simplificado)
        console.log('\n2️⃣ Testando dominância BTC simplificada...');
        const dominanceData = {
            ticker: "BTC.D",
            time: "2025-01-30 17:30:00",
            btc_dominance: 59.123,
            ema_7: 58.456,
            diff_pct: 1.141,
            sinal: "LONG"
        };
        
        return testPost(baseUrl + '/api/webhooks/dominance', dominanceData);
    })
    .then(result => {
        console.log('✅ Dominância BTC OK:', result);
        
        // Teste 3: CoinBitClub (deve continuar funcionando)
        console.log('\n3️⃣ Testando CoinBitClub (confirmação)...');
        const coinbitData = {
            ticker: "BTCUSDT",
            sinal: "COMPRAR",
            confirmacao: "SIM",
            entrada: 95000,
            stop: 93000,
            alvo1: 98000,
            alvo2: 100000,
            timestamp: new Date().toISOString()
        };
        
        return testPost(baseUrl + '/api/webhooks/coinbitclub', coinbitData);
    })
    .then(result => {
        console.log('✅ CoinBitClub OK:', result);
        
        // Teste 4: Verificar últimos sinais
        console.log('\n4️⃣ Verificando últimos sinais...');
        return testGet(baseUrl + '/api/signals/latest');
    })
    .then(result => {
        console.log('✅ Últimos sinais:', result);
        
        console.log('\n🎯 SISTEMA 100% FUNCIONAL!');
        console.log('✨ CoinBitClub + Dominância BTC = COMPLETO');
        
    })
    .catch(error => {
        console.error('❌ Erro:', error.message);
    });

function testGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode === 200) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                } catch (e) {
                    reject(new Error(`Resposta inválida: ${data}`));
                }
            });
        }).on('error', reject);
    });
}

function testPost(url, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(url, options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (res.statusCode === 200) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                    }
                } catch (e) {
                    reject(new Error(`Resposta inválida: ${responseData}`));
                }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}
