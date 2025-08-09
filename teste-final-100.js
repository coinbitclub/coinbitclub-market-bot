const https = require('https');

console.log('🎯 TESTE FINAL: SISTEMA 100% FUNCIONAL\n');

const baseUrl = 'https://coinbitclub-market-bot.up.railway.app';

// Teste 1: Health Check
console.log('1️⃣ Health Check...');
testGet(baseUrl + '/health')
    .then(result => {
        console.log('✅ Health OK:', result.status);
        
        // Teste 2: Dominância BTC 
        console.log('\n2️⃣ Dominância BTC...');
        const dominanceData = {
            ticker: "BTC.D",
            time: "2025-01-30 17:30:00",
            btc_dominance: 59.456,
            ema_7: 58.123,
            diff_pct: 2.241,
            sinal: "SHORT"
        };
        
        return testPost(baseUrl + '/api/webhooks/dominance', dominanceData);
    })
    .then(result => {
        console.log('✅ Dominância BTC OK - ID:', result.data.dominance_signal_id);
        
        // Teste 3: CoinBitClub (endpoint correto)
        console.log('\n3️⃣ CoinBitClub...');
        const coinbitData = {
            ticker: "ETHUSDT",
            symbol: "ETHUSDT", 
            signal: "COMPRAR",
            diff_btc_ema7: 1.5,
            ema7_btc: 2400.50,
            entrada: 2450,
            stop: 2350,
            alvo1: 2550,
            alvo2: 2650
        };
        
        return testPost(baseUrl + '/api/webhooks/signal', coinbitData);
    })
    .then(result => {
        console.log('✅ CoinBitClub OK - Processado:', result.success);
        
        // Teste 4: Sinal Simples (verificação)
        console.log('\n4️⃣ Sinal Simples...');
        const simpleData = {
            ticker: "BNBUSDT",
            signal: "BUY",
            price: 320.45,
            timestamp: new Date().toISOString()
        };
        
        return testPost(baseUrl + '/api/webhooks/signal', simpleData);
    })
    .then(result => {
        console.log('✅ Sinal Simples OK - Processado:', result.success);
        
        // Teste 5: Consultar sinais recentes
        console.log('\n5️⃣ Sinais Recentes...');
        return testGet(baseUrl + '/api/webhooks/signals/recent');
    })
    .then(result => {
        console.log('✅ Sinais Recentes - Total:', result.signals?.length || result.length || 'N/A');
        
        console.log('\n🏆 RESULTADO FINAL:');
        console.log('✅ Health Check: FUNCIONANDO');
        console.log('✅ Dominância BTC: FUNCIONANDO');
        console.log('✅ CoinBitClub: FUNCIONANDO');
        console.log('✅ Sinais Simples: FUNCIONANDO');
        console.log('✅ Consultas: FUNCIONANDO');
        
        console.log('\n🎯 SISTEMA 100% OPERACIONAL!');
        console.log('🚀 CoinBitClub Market Bot está COMPLETO!');
        
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
