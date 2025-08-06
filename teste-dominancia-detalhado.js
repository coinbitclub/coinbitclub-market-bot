/**
 * 🔧 TESTE DIRETO DO ENDPOINT DE DOMINÂNCIA
 */

const https = require('https');

async function testarDominanciaDetalhado() {
    const payload = {
        ticker: 'BTC.D',
        time: '2025-07-30 17:35:00',
        btc_dominance: '59.125',
        ema_7: '58.200',
        diff_pct: '1.589',
        sinal: 'LONG'
    };

    const data = JSON.stringify(payload);

    const options = {
        hostname: 'coinbitclub-market-bot.up.railway.app',
        port: 443,
        path: '/api/webhooks/dominance',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    console.log('🧪 TESTE DETALHADO DOMINÂNCIA BTC');
    console.log('=================================');
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    console.log('🌐 URL:', `https://${options.hostname}${options.path}`);

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
            console.log('📝 Headers:', res.headers);
            
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                console.log('📄 Resposta Raw:', responseData);
                
                try {
                    const jsonData = JSON.parse(responseData);
                    console.log('✅ Resposta JSON:', JSON.stringify(jsonData, null, 2));
                } catch (e) {
                    console.log('❌ Erro ao fazer parse do JSON:', e.message);
                }
                
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error('❌ Erro na requisição:', e.message);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

testarDominanciaDetalhado();
