// 🔍 VERIFICADOR DE STATUS RAILWAY
// Testa diferentes endpoints para encontrar o serviço ativo

import axios from 'axios';

const possibleUrls = [
    'https://coinbitclub-market-bot-production.up.railway.app',
    'https://coinbitclub-market-bot-production-up.railway.app',
    'https://web-production-8f84d0d8.up.railway.app',
    'https://production-8f84d0d8.up.railway.app'
];

async function checkAllUrls() {
    console.log('🔍 VERIFICANDO URLS DISPONÍVEIS');
    console.log('═'.repeat(50));
    
    for (const url of possibleUrls) {
        console.log(`\n🌐 Testando: ${url}`);
        
        try {
            const response = await axios.get(url, { 
                timeout: 5000,
                validateStatus: () => true // Accept any status code
            });
            
            console.log(`✅ Status: ${response.status}`);
            if (response.data) {
                console.log(`📄 Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
            }
            
            // Test health endpoint
            try {
                const healthResponse = await axios.get(`${url}/api/status`, { 
                    timeout: 3000,
                    validateStatus: () => true
                });
                console.log(`🏥 Health Status: ${healthResponse.status}`);
            } catch (healthError) {
                console.log(`❌ Health check failed: ${healthError.message}`);
            }
            
        } catch (error) {
            console.log(`❌ Erro: ${error.message}`);
        }
    }
}

checkAllUrls().catch(console.error);
