import axios from 'axios';

// Teste direto simples
async function testDirectWebhook() {
    console.log('🔍 TESTE DIRETO DO WEBHOOK');
    
    const testData = {
        token: 'coinbitclub_webhook_secret_2024',
        strategy: 'TEST_SIGNAL_DIRECT',
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 45000,
        timestamp: new Date().toISOString()
    };
    
    try {
        const response = await axios.post('http://localhost:3001/api/webhooks/tradingview', testData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        
        console.log('✅ SUCCESS - Status:', response.status);
        console.log('📋 Response:', response.data);
        
    } catch (error) {
        console.log('❌ ERROR');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
            console.log('Headers:', error.response.headers);
        } else if (error.request) {
            console.log('Request made but no response:', error.request);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testDirectWebhook();
