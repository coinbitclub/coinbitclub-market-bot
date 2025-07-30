const https = require('https');

console.log('🧪 TESTANDO ENDPOINT DE DOMINÂNCIA SIMPLIFICADO...\n');

// Configurar teste
const testData = {
    ticker: "BTC.D",
    time: "2025-01-30 17:30:00",
    btc_dominance: 59.123,
    ema_7: 58.456,
    diff_pct: 1.141,
    sinal: "LONG"
};

// Configuração do servidor local (se estiver rodando)
const localUrl = 'http://localhost:3000';
const productionUrl = 'https://coinbitclub-market-bot.up.railway.app';

// Testar localmente primeiro
console.log('🏠 Testando servidor local...');
testEndpoint(localUrl + '/api/webhooks/dominance', testData)
    .then(result => {
        console.log('✅ Teste local bem-sucedido:', result);
        
        // Se local funcionar, testar produção
        console.log('\n🌐 Testando servidor de produção...');
        return testEndpoint(productionUrl + '/api/webhooks/dominance', testData);
    })
    .then(result => {
        console.log('✅ Teste de produção bem-sucedido:', result);
        console.log('\n🎯 TODOS OS TESTES PASSARAM!');
    })
    .catch(error => {
        console.error('❌ Erro no teste:', error.message);
        
        // Se der erro local, significa que servidor não está rodando
        if (error.message.includes('ECONNREFUSED')) {
            console.log('💡 Servidor local não está rodando, testando apenas produção...');
            
            return testEndpoint(productionUrl + '/api/webhooks/dominance', testData)
                .then(result => {
                    console.log('✅ Teste de produção bem-sucedido:', result);
                    console.log('\n🎯 TESTE DE PRODUÇÃO PASSOU!');
                })
                .catch(prodError => {
                    console.error('❌ Erro na produção:', prodError.message);
                });
        }
    });

function testEndpoint(url, data) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : require('http');
        
        const postData = JSON.stringify(data);
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = client.request(url, options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
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
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}
