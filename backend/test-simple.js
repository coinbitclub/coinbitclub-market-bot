import axios from 'axios';

async function testSimple() {
    console.log('🔍 TESTANDO CONECTIVIDADE BÁSICA');
    
    try {
        // Teste básico de conectividade
        const response = await axios.get('http://localhost:3001/api/status', {
            timeout: 5000
        });
        
        console.log('✅ Status endpoint OK - Status:', response.status);
        console.log('📋 Response:', response.data);
        
        // Agora teste o webhook
        console.log('\n🔍 TESTANDO WEBHOOK');
        const webhookData = {
            token: 'coinbitclub_webhook_secret_2024',
            strategy: 'TEST_DIRECT',
            symbol: 'BTCUSDT',
            action: 'BUY',
            price: 45000,
            timestamp: new Date().toISOString()
        };
        
        const webhookResponse = await axios.post('http://localhost:3001/api/webhooks/tradingview', webhookData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
        });
        
        console.log('✅ Webhook OK - Status:', webhookResponse.status);
        console.log('📋 Response:', webhookResponse.data);
        
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
    }
}

testSimple();
