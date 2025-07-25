// 🧪 TESTE DIRETO DO WEBHOOK
// Teste direto para verificar se o endpoint está funcionando

import axios from 'axios';

async function testDirectWebhook() {
    console.log('🧪 TESTE DIRETO DO ENDPOINT WEBHOOK');
    console.log('═'.repeat(50));
    
    const url = 'http://localhost:3001';
    
    // Primeiro testar se o servidor responde
    try {
        console.log('🔍 Testando servidor básico...');
        const basicResponse = await axios.get(url, { 
            timeout: 3000,
            validateStatus: () => true
        });
        console.log(`📊 Resposta básica: ${basicResponse.status}`);
        console.log(`📄 Dados:`, basicResponse.data);
    } catch (error) {
        console.log(`❌ Erro básico:`, error.message);
    }
    
    // Testar endpoint de teste
    try {
        console.log('\n🔍 Testando /api/test...');
        const testResponse = await axios.get(`${url}/api/test`, { 
            timeout: 3000,
            validateStatus: () => true
        });
        console.log(`📊 Resposta /api/test: ${testResponse.status}`);
        console.log(`📄 Dados:`, testResponse.data);
    } catch (error) {
        console.log(`❌ Erro /api/test:`, error.message);
    }
    
    // Testar webhook
    try {
        console.log('\n🧪 Testando webhook POST...');
        const webhookData = {
            token: 'coinbitclub_webhook_secret_2024',
            symbol: 'BTCUSDT',
            action: 'BUY',
            price: 67000.00,
            test_mode: true
        };
        
        const webhookResponse = await axios.post(
            `${url}/api/webhooks/tradingview`,
            webhookData,
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000,
                validateStatus: () => true
            }
        );
        
        console.log(`📊 Resposta webhook: ${webhookResponse.status}`);
        console.log(`📄 Dados:`, JSON.stringify(webhookResponse.data, null, 2));
        
        if (webhookResponse.status === 200) {
            console.log('✅ WEBHOOK FUNCIONANDO CORRETAMENTE!');
        } else {
            console.log('❌ WEBHOOK COM PROBLEMA');
        }
        
    } catch (error) {
        console.log(`❌ Erro webhook:`, error.message);
        if (error.response) {
            console.log(`📋 Error response:`, error.response.data);
        }
    }
}

testDirectWebhook().catch(console.error);
