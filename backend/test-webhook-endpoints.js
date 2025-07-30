/**
 * 🧪 TESTE DOS ENDPOINTS DE WEBHOOK CORRIGIDOS
 * Verifica se os endpoints /api/webhooks/signal e /api/webhooks/dominance estão funcionando
 */

const https = require('https');
const http = require('http');

console.log('🧪 TESTE DOS ENDPOINTS DE WEBHOOK CORRIGIDOS');
console.log('==============================================');

// Configuração
const BASE_URL = 'https://coinbitclub-market-bot.up.railway.app';
const LOCAL_URL = 'http://localhost:8080';
const WEBHOOK_TOKEN = '210406';

// Função para fazer requisições HTTP/HTTPS
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const requestModule = isHttps ? https : http;
        
        const requestOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'TradingView-Webhook-Test',
                ...options.headers
            }
        };
        
        const req = requestModule.request(url, requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    success: res.statusCode >= 200 && res.statusCode < 300,
                    data: data,
                    headers: res.headers
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

// Teste 1: Health Check
async function testHealthCheck() {
    console.log('\n🔍 TESTE 1: HEALTH CHECK');
    console.log('========================');
    
    try {
        const response = await makeRequest(`${BASE_URL}/health`);
        console.log(`Status: ${response.statusCode}`);
        console.log(`Sucesso: ${response.success ? 'SIM' : 'NÃO'}`);
        
        if (response.success) {
            const data = JSON.parse(response.data);
            console.log(`Versão: ${data.version || 'N/A'}`);
            console.log(`Database: ${data.database || 'N/A'}`);
        }
    } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
    }
}

// Teste 2: Webhook de Signal
async function testSignalWebhook() {
    console.log('\n🎯 TESTE 2: WEBHOOK DE SINAIS');
    console.log('=============================');
    
    const testSignal = {
        ticker: "BTCUSDT",
        time: "2024-01-30 15:30:00",
        close: "67850.50",
        ema9_30: "67800.25",
        rsi_4h: "65.4",
        rsi_15: "58.2",
        momentum_15: "125.6",
        atr_30: "850.25",
        atr_pct_30: "2.0",
        vol_30: "1250000",
        vol_ma_30: "980000",
        diff_btc_ema7: "0.635",
        cruzou_acima_ema9: "1",
        cruzou_abaixo_ema9: "0",
        golden_cross_30: "0",
        death_cross_30: "0",
        source: "webhook_test"
    };
    
    console.log(`URL: ${BASE_URL}/api/webhooks/signal?token=${WEBHOOK_TOKEN}`);
    console.log('Payload:', JSON.stringify(testSignal, null, 2));
    
    try {
        const response = await makeRequest(`${BASE_URL}/api/webhooks/signal?token=${WEBHOOK_TOKEN}`, {
            method: 'POST',
            body: testSignal
        });
        
        console.log(`Status: ${response.statusCode}`);
        console.log(`Sucesso: ${response.success ? 'SIM' : 'NÃO'}`);
        console.log('Resposta:', response.data);
        
        if (response.success) {
            console.log('✅ Webhook de sinais funcionando!');
        } else {
            console.log('❌ Problema no webhook de sinais');
        }
        
    } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
    }
}

// Teste 3: Webhook de Dominância
async function testDominanceWebhook() {
    console.log('\n📈 TESTE 3: WEBHOOK DE DOMINÂNCIA');
    console.log('=================================');
    
    const testDominance = {
        ticker: "BTC.D",
        time: "2024-01-30 15:30:00",
        btc_dominance: "42.156",
        ema_7: "41.890",
        diff_pct: "0.635",
        sinal: "NEUTRO",
        source: "webhook_test"
    };
    
    console.log(`URL: ${BASE_URL}/api/webhooks/dominance?token=${WEBHOOK_TOKEN}`);
    console.log('Payload:', JSON.stringify(testDominance, null, 2));
    
    try {
        const response = await makeRequest(`${BASE_URL}/api/webhooks/dominance?token=${WEBHOOK_TOKEN}`, {
            method: 'POST',
            body: testDominance
        });
        
        console.log(`Status: ${response.statusCode}`);
        console.log(`Sucesso: ${response.success ? 'SIM' : 'NÃO'}`);
        console.log('Resposta:', response.data);
        
        if (response.success) {
            console.log('✅ Webhook de dominância funcionando!');
        } else {
            console.log('❌ Problema no webhook de dominância');
        }
        
    } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
    }
}

// Teste 4: Token Inválido
async function testInvalidToken() {
    console.log('\n🔒 TESTE 4: TOKEN INVÁLIDO');
    console.log('===========================');
    
    const testSignal = { ticker: "BTCUSDT", test: true };
    
    try {
        const response = await makeRequest(`${BASE_URL}/api/webhooks/signal?token=invalid_token`, {
            method: 'POST',
            body: testSignal
        });
        
        console.log(`Status: ${response.statusCode}`);
        console.log('Resposta:', response.data);
        
        if (response.statusCode === 401) {
            console.log('✅ Autenticação funcionando corretamente (401 para token inválido)');
        } else {
            console.log('❌ Problema na autenticação');
        }
        
    } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
    }
}

// Teste 5: Consultar Sinais Recentes
async function testRecentSignals() {
    console.log('\n📊 TESTE 5: CONSULTAR SINAIS RECENTES');
    console.log('=====================================');
    
    try {
        const response = await makeRequest(`${BASE_URL}/api/webhooks/signals/recent?limit=5`);
        
        console.log(`Status: ${response.statusCode}`);
        console.log(`Sucesso: ${response.success ? 'SIM' : 'NÃO'}`);
        
        if (response.success) {
            const data = JSON.parse(response.data);
            console.log(`Sinais encontrados: ${data.count || 0}`);
            
            if (data.signals && data.signals.length > 0) {
                console.log('Últimos sinais:');
                data.signals.slice(0, 3).forEach((signal, index) => {
                    console.log(`  ${index + 1}. ${signal.symbol} - ${signal.received_at}`);
                });
            }
        }
        
    } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
    }
}

// Executar todos os testes
async function runAllTests() {
    console.log(`🌐 Testando servidor: ${BASE_URL}`);
    console.log(`🔑 Token de teste: ${WEBHOOK_TOKEN}`);
    
    await testHealthCheck();
    await testSignalWebhook();
    await testDominanceWebhook();
    await testInvalidToken();
    await testRecentSignals();
    
    console.log('\n🎉 TESTES CONCLUÍDOS!');
    console.log('====================');
    console.log('');
    console.log('📋 URLs PARA CONFIGURAR NO TRADINGVIEW:');
    console.log('');
    console.log('📊 Para o Pine Script de Sinais:');
    console.log(`   ${BASE_URL}/api/webhooks/signal?token=${WEBHOOK_TOKEN}`);
    console.log('');
    console.log('📈 Para o Pine Script de Dominância:');
    console.log(`   ${BASE_URL}/api/webhooks/dominance?token=${WEBHOOK_TOKEN}`);
    console.log('');
    console.log('✅ Sistema de webhooks configurado e testado!');
}

// Iniciar testes
runAllTests().catch(console.error);
