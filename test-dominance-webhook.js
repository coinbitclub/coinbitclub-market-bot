/**
 * 🧪 TESTE DO WEBHOOK DE DOMINÂNCIA
 * 
 * Script para testar se o sistema pode receber sinais
 * de dominância do Bitcoin do TradingView
 */

const https = require('https');

const BASE_URL = 'https://coinbitclub-market-bot.up.railway.app';

console.log('🧪 TESTE DO WEBHOOK DE DOMINÂNCIA');
console.log('=================================');
console.log(`🎯 URL de teste: ${BASE_URL}`);
console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);

async function testarWebhookDominancia() {
    console.log('\n🔥 TESTE 1: Dominância do Bitcoin');
    console.log('================================');
    
    const payload1 = {
        btc_dominance: 52.45,
        eth_dominance: 17.23,
        total_market_cap: 1250000000000,
        timestamp: new Date().toISOString(),
        source: 'tradingview',
        timeframe: '1h',
        alert_message: 'Bitcoin dominance update from TradingView'
    };

    await testarEndpoint('/api/webhooks/dominance', payload1);

    console.log('\n🔥 TESTE 2: Formato Alternativo');
    console.log('==============================');
    
    const payload2 = {
        dominance_percent: 54.12,
        symbol: 'BTC.D',
        timeframe: '4h',
        timestamp: new Date().toISOString()
    };

    await testarEndpoint('/api/webhooks/dominance', payload2);

    console.log('\n🔥 TESTE 3: Dados Inválidos');
    console.log('===========================');
    
    const payload3 = {
        invalid_field: 'test',
        no_dominance: true
    };

    await testarEndpoint('/api/webhooks/dominance', payload3);

    console.log('\n🔥 TESTE 4: Consultar Última Dominância');
    console.log('======================================');
    
    await consultarUltimaDominancia();
}

function testarEndpoint(endpoint, payload) {
    return new Promise((resolve) => {
        console.log(`🔄 Testando ${endpoint}...`);
        console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));

        const data = JSON.stringify(payload);
        
        const options = {
            hostname: 'coinbitclub-market-bot.up.railway.app',
            port: 443,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
            console.log(`📝 Headers:`, JSON.stringify(res.headers, null, 2));

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
                resolve();
            });
        });

        req.on('error', (error) => {
            console.error(`❌ Erro na requisição:`, error.message);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

function consultarUltimaDominancia() {
    return new Promise((resolve) => {
        console.log(`🔄 Consultando /api/dominance/latest...`);

        const options = {
            hostname: 'coinbitclub-market-bot.up.railway.app',
            port: 443,
            path: '/api/dominance/latest',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
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
                    console.log(`✅ Última dominância:`, JSON.stringify(jsonResponse, null, 2));
                } catch (e) {
                    console.log(`✅ Resposta (raw):`, responseData);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.error(`❌ Erro na consulta:`, error.message);
            resolve();
        });

        req.end();
    });
}

// Executar os testes
testarWebhookDominancia()
    .then(() => {
        console.log('\n📊 RELATÓRIO FINAL DOS TESTES');
        console.log('=============================');
        console.log('🔗 CONFIGURAÇÃO PARA TRADINGVIEW:');
        console.log('URL Dominância: https://coinbitclub-market-bot.up.railway.app/api/webhooks/dominance');
        console.log('Method: POST');
        console.log('Content-Type: application/json');
        console.log('\n📦 EXEMPLO DE PAYLOAD PARA TRADINGVIEW:');
        console.log(JSON.stringify({
            btc_dominance: '{{btc_dominance}}',
            timeframe: '{{interval}}',
            timestamp: '{{time}}',
            alert_message: 'Bitcoin dominance: {{btc_dominance}}%'
        }, null, 2));
        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('1. Configure alert no TradingView para BTC.D');
        console.log('2. Use a URL acima como webhook');
        console.log('3. Monitore logs no Railway');
        console.log('4. Consulte dados em /api/dominance/latest');
    })
    .catch(console.error);
