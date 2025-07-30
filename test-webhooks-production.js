#!/usr/bin/env node
/**
 * 🧪 TESTE DOS WEBHOOKS TRADINGVIEW EM PRODUÇÃO
 * 
 * Script para testar se os webhooks estão funcionando
 */

const https = require('https');

console.log('🧪 TESTE DOS WEBHOOKS TRADINGVIEW EM PRODUÇÃO');
console.log('==============================================');

const BACKEND_URL = 'https://coinbitclub-market-bot.up.railway.app';

async function testWebhook(endpoint, payload) {
    return new Promise((resolve) => {
        const data = JSON.stringify(payload);
        
        const options = {
            hostname: 'coinbitclub-market-bot.up.railway.app',
            port: 443,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'User-Agent': 'TradingView-Webhook-Test'
            }
        };

        console.log(`\n🔄 Testando ${endpoint}...`);
        console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
                console.log(`📝 Headers:`, res.headers);
                
                try {
                    const jsonResponse = JSON.parse(responseData);
                    console.log(`✅ Resposta:`, JSON.stringify(jsonResponse, null, 2));
                    resolve({
                        endpoint,
                        status: res.statusCode,
                        success: res.statusCode >= 200 && res.statusCode < 300,
                        response: jsonResponse
                    });
                } catch (error) {
                    console.log(`📄 Resposta (text):`, responseData);
                    resolve({
                        endpoint,
                        status: res.statusCode,
                        success: res.statusCode >= 200 && res.statusCode < 300,
                        response: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ Erro na requisição:`, error.message);
            resolve({
                endpoint,
                status: 0,
                success: false,
                error: error.message
            });
        });

        req.setTimeout(10000, () => {
            console.log(`⏱️ Timeout na requisição`);
            req.destroy();
            resolve({
                endpoint,
                status: 0,
                success: false,
                error: 'Timeout'
            });
        });

        req.write(data);
        req.end();
    });
}

async function runTests() {
    try {
        console.log(`🎯 URL de teste: ${BACKEND_URL}`);
        console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);

        // Payload de teste simples
        const testPayload1 = {
            symbol: 'BTCUSDT',
            action: 'BUY',
            price: 45000.50,
            quantity: 0.001,
            strategy: 'test-webhook',
            timeframe: '1h',
            alert_message: 'Teste de webhook TradingView'
        };

        // Payload de teste mínimo
        const testPayload2 = {
            symbol: 'ETHUSDT',
            action: 'SELL'
        };

        // Payload de teste com dados extras
        const testPayload3 = {
            symbol: 'ADAUSDT',
            action: 'BUY',
            price: 0.45,
            quantity: 1000,
            strategy: 'scalping',
            timeframe: '5m',
            alert_message: 'Signal from TradingView - ADA breaking resistance',
            exchange: 'binance',
            timestamp: new Date().toISOString()
        };

        const results = [];

        // Teste 1: Endpoint principal /api/webhooks/signal
        console.log('\n🔥 TESTE 1: Endpoint Principal');
        console.log('=============================');
        const result1 = await testWebhook('/api/webhooks/signal', testPayload1);
        results.push(result1);

        // Aguardar um pouco entre testes
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Teste 2: Endpoint alternativo /api/webhooks/tradingview
        console.log('\n🔥 TESTE 2: Endpoint Alternativo');
        console.log('===============================');
        const result2 = await testWebhook('/api/webhooks/tradingview', testPayload2);
        results.push(result2);

        // Aguardar um pouco entre testes
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Teste 3: Payload completo
        console.log('\n🔥 TESTE 3: Payload Completo');
        console.log('============================');
        const result3 = await testWebhook('/api/webhooks/signal', testPayload3);
        results.push(result3);

        // Aguardar um pouco entre testes
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Teste 4: Payload inválido (sem dados obrigatórios)
        console.log('\n🔥 TESTE 4: Payload Inválido');
        console.log('============================');
        const result4 = await testWebhook('/api/webhooks/signal', { invalid: 'data' });
        results.push(result4);

        // Relatório final
        console.log('\n📊 RELATÓRIO FINAL DOS TESTES');
        console.log('=============================');

        let sucessos = 0;
        let falhas = 0;

        results.forEach((result, index) => {
            const emoji = result.success ? '✅' : '❌';
            const status = result.error ? `ERRO: ${result.error}` : `HTTP ${result.status}`;
            
            console.log(`${emoji} Teste ${index + 1} (${result.endpoint}): ${status}`);
            
            if (result.success) {
                sucessos++;
            } else {
                falhas++;
            }
        });

        console.log(`\n📈 ESTATÍSTICAS:`);
        console.log(`   ✅ Sucessos: ${sucessos}`);
        console.log(`   ❌ Falhas: ${falhas}`);
        console.log(`   📊 Total: ${results.length}`);
        console.log(`   📈 Taxa de sucesso: ${((sucessos/results.length)*100).toFixed(1)}%`);

        if (sucessos >= 3) {
            console.log('\n🎉 WEBHOOKS FUNCIONANDO CORRETAMENTE!');
            console.log('✅ Sistema pronto para receber sinais do TradingView');
        } else if (sucessos >= 1) {
            console.log('\n⚠️ WEBHOOKS PARCIALMENTE FUNCIONAIS');
            console.log('🔧 Alguns endpoints podem precisar de ajustes');
        } else {
            console.log('\n🚨 PROBLEMAS NOS WEBHOOKS');
            console.log('❌ Verificar configuração e logs do servidor');
        }

        console.log('\n🔗 CONFIGURAÇÃO PARA TRADINGVIEW:');
        console.log(`URL: ${BACKEND_URL}/api/webhooks/signal`);
        console.log('Method: POST');
        console.log('Content-Type: application/json');
        console.log('\nExemplo de payload:');
        console.log(JSON.stringify(testPayload1, null, 2));

    } catch (error) {
        console.error('❌ Erro nos testes:', error.message);
        console.error(error.stack);
    }
}

// Executar testes
runTests().catch(console.error);
