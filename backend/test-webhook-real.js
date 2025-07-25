// 🧪 TESTE WEBHOOK TRADINGVIEW - AMBIENTE REAL
// Testa se os sinais estão chegando com código 200

import axios from 'axios';

// Configurações do teste
const RAILWAY_URL = 'https://coinbitclub-market-bot-production.up.railway.app';
const LOCAL_URL = 'http://localhost:3000';
const WEBHOOK_ENDPOINT = '/api/webhooks/tradingview';
const WEBHOOK_SECRET = 'coinbitclub_webhook_secret_2024';

// Função para detectar URL ativa
async function detectActiveUrl() {
    const urls = [RAILWAY_URL, LOCAL_URL];
    
    for (const url of urls) {
        try {
            console.log(`🔍 Testando conectividade: ${url}`);
            const response = await axios.get(url, { 
                timeout: 3000,
                validateStatus: () => true
            });
            
            if (response.status < 500) {
                console.log(`✅ URL ativa encontrada: ${url} (Status: ${response.status})`);
                return url;
            }
        } catch (error) {
            console.log(`❌ ${url} não responde: ${error.message}`);
        }
    }
    
    return null;
}

// Dados de teste simulando sinal TradingView real
const testSignals = [
    {
        name: 'TEST_SIGNAL_BUY_BTCUSDT',
        payload: {
            token: WEBHOOK_SECRET,
            strategy: 'TradingView_Strategy_Real_Test',
            symbol: 'BTCUSDT',
            action: 'BUY',
            price: 67850.75,
            timestamp: new Date().toISOString(),
            indicators: {
                ema9_30: 67750.25,
                rsi_4h: 65.8,
                rsi_15: 42.3,
                momentum_15: 1.95,
                atr_30: 1250.40,
                atr_pct_30: 1.84,
                vol_30: 2150000,
                vol_ma_30: 1850000,
                diff_btc_ema7: 325.60,
                cruzou_acima_ema9: true,
                cruzou_abaixo_ema9: false
            },
            test_mode: true,
            test_timestamp: Date.now()
        }
    },
    {
        name: 'TEST_SIGNAL_SELL_ETHUSDT',
        payload: {
            token: WEBHOOK_SECRET,
            strategy: 'TradingView_Strategy_Real_Test',
            symbol: 'ETHUSDT',
            action: 'SELL',
            price: 3245.80,
            timestamp: new Date().toISOString(),
            indicators: {
                ema9_30: 3255.40,
                rsi_4h: 75.2,
                rsi_15: 68.5,
                momentum_15: -1.35,
                atr_30: 95.50,
                atr_pct_30: 2.94,
                vol_30: 1850000,
                vol_ma_30: 1650000,
                diff_btc_ema7: -15.80,
                cruzou_acima_ema9: false,
                cruzou_abaixo_ema9: true
            },
            test_mode: true,
            test_timestamp: Date.now()
        }
    },
    {
        name: 'TEST_SIGNAL_INVALID_TOKEN',
        payload: {
            token: 'invalid_token_test',
            strategy: 'Test_Invalid_Token',
            symbol: 'BTCUSDT',
            action: 'BUY',
            price: 67000.00,
            timestamp: new Date().toISOString(),
            test_mode: true,
            test_timestamp: Date.now()
        }
    }
];

// Função para testar um sinal específico
async function testWebhookSignal(signal, baseUrl) {
    console.log(`\n🧪 TESTANDO: ${signal.name}`);
    console.log('━'.repeat(60));
    
    try {
        const startTime = Date.now();
        
        const response = await axios.post(
            `${baseUrl}${WEBHOOK_ENDPOINT}`,
            signal.payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'TradingView-Webhook-Test',
                    'X-Test-Signal': 'true'
                },
                timeout: 10000 // 10 segundos timeout
            }
        );
        
        const responseTime = Date.now() - startTime;
        
        console.log(`✅ SUCESSO - Status: ${response.status}`);
        console.log(`⏱️  Tempo de resposta: ${responseTime}ms`);
        console.log(`📊 Response data:`, JSON.stringify(response.data, null, 2));
        
        return {
            success: true,
            status: response.status,
            responseTime,
            data: response.data
        };
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        if (error.response) {
            console.log(`❌ ERRO - Status: ${error.response.status}`);
            console.log(`⏱️  Tempo de resposta: ${responseTime}ms`);
            console.log(`📋 Error data:`, JSON.stringify(error.response.data, null, 2));
            
            return {
                success: false,
                status: error.response.status,
                responseTime,
                error: error.response.data
            };
        } else {
            console.log(`💥 ERRO DE CONEXÃO:`, error.message);
            
            return {
                success: false,
                status: 0,
                responseTime,
                error: error.message
            };
        }
    }
}

// Função para testar status da aplicação
async function testApplicationHealth(baseUrl) {
    console.log('\n🏥 TESTANDO SAÚDE DA APLICAÇÃO');
    console.log('━'.repeat(60));
    
    const healthEndpoints = ['/api/status', '/api/health', '/api/test', '/health'];
    
    for (const endpoint of healthEndpoints) {
        try {
            console.log(`🔍 Testando: ${baseUrl}${endpoint}`);
            const response = await axios.get(`${baseUrl}${endpoint}`, {
                timeout: 5000,
                validateStatus: () => true
            });
            
            console.log(`📊 ${endpoint} - Status: ${response.status}`);
            if (response.status < 500) {
                console.log(`✅ Endpoint funcionando: ${endpoint}`);
                return true;
            }
            
        } catch (error) {
            console.log(`❌ ${endpoint} erro:`, error.message);
        }
    }
    
    return false;
}

// Função principal de teste
async function runWebhookTests() {
    console.log('🚀 INICIANDO TESTES WEBHOOK TRADINGVIEW');
    console.log('🕒 Timestamp:', new Date().toISOString());
    console.log('═'.repeat(80));
    
    // 1. Detectar URL ativa
    const activeUrl = await detectActiveUrl();
    
    if (!activeUrl) {
        console.log('\n❌ NENHUMA URL ESTÁ RESPONDENDO - ABORTANDO TESTES');
        console.log('URLs testadas:');
        console.log(`  - ${RAILWAY_URL}`);
        console.log(`  - ${LOCAL_URL}`);
        return;
    }
    
    console.log(`🎯 URL detectada: ${activeUrl}${WEBHOOK_ENDPOINT}`);
    
    // 2. Testar saúde da aplicação
    const isHealthy = await testApplicationHealth(activeUrl);
    
    if (!isHealthy) {
        console.log('\n⚠️  APLICAÇÃO COM PROBLEMAS - CONTINUANDO TESTES MESMO ASSIM');
    }
    
    // 3. Executar testes de webhook
    const results = [];
    
    for (const signal of testSignals) {
        const result = await testWebhookSignal(signal, activeUrl);
        results.push({
            signal: signal.name,
            ...result
        });
        
        // Aguardar 2 segundos entre testes
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 3. Relatório final
    console.log('\n📊 RELATÓRIO FINAL DOS TESTES');
    console.log('═'.repeat(80));
    
    const successfulTests = results.filter(r => r.success && r.status === 200);
    const failedTests = results.filter(r => !r.success || r.status !== 200);
    
    console.log(`✅ Testes bem-sucedidos: ${successfulTests.length}/${results.length}`);
    console.log(`❌ Testes falharam: ${failedTests.length}/${results.length}`);
    
    if (successfulTests.length > 0) {
        console.log('\n🎉 TESTES APROVADOS:');
        successfulTests.forEach(test => {
            console.log(`  ✅ ${test.signal} - Status ${test.status} (${test.responseTime}ms)`);
        });
    }
    
    if (failedTests.length > 0) {
        console.log('\n⚠️  TESTES COM PROBLEMAS:');
        failedTests.forEach(test => {
            console.log(`  ❌ ${test.signal} - Status ${test.status || 'N/A'} (${test.responseTime}ms)`);
        });
    }
    
    // 4. Análise de performance
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    
    console.log('\n⚡ ANÁLISE DE PERFORMANCE:');
    console.log(`📈 Tempo médio de resposta: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`🏃 Resposta mais rápida: ${Math.min(...results.map(r => r.responseTime))}ms`);
    console.log(`🐌 Resposta mais lenta: ${Math.max(...results.map(r => r.responseTime))}ms`);
    
    // 5. Verificação de código 200
    const code200Count = results.filter(r => r.status === 200).length;
    
    console.log('\n🎯 VERIFICAÇÃO CÓDIGO 200:');
    if (code200Count === testSignals.length - 1) { // -1 porque um teste tem token inválido
        console.log('✅ APROVADO: Sinais válidos retornam código 200');
    } else {
        console.log('❌ REPROVADO: Nem todos os sinais válidos retornam código 200');
    }
    
    console.log('\n🏆 TESTES CONCLUÍDOS!');
    console.log('═'.repeat(80));
}

// Executar testes
runWebhookTests().catch(console.error);

export {
    runWebhookTests,
    testWebhookSignal,
    testApplicationHealth,
    detectActiveUrl
};
