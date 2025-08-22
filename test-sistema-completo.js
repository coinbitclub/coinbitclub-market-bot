// TESTE COMPLETO SISTEMA MARKETBOT v10.0.0
console.log('🚀 TESTANDO SISTEMA MARKETBOT ENTERPRISE v10.0.0...\n');

// URLs de teste
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://coinbitclub-market-bot.up.railway.app'
  : 'http://localhost:3000';

const endpoints = [
  '/api/overview',
  '/api/market/intelligence', 
  '/api/performance',
  '/api/users/stats',
  '/api/positions',
  '/api/system/status'
];

async function testSystem() {
  console.log(`🌐 URL Base: ${baseUrl}\n`);
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testando: ${endpoint}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint}: OK`);
        
        // Mostrar dados key se disponível
        if (endpoint === '/api/overview') {
          console.log(`   📊 Posições Abertas: ${data.openPositions}`);
          console.log(`   👥 Usuários Ativos: ${data.activeUsers}`);
        }
        
        if (endpoint === '/api/market/intelligence') {
          console.log(`   🧠 Confiança: ${data.confidence}%`);
          console.log(`   😱 Fear & Greed: ${data.fearGreed}`);
          console.log(`   📈 Market Pulse: ${data.marketPulse}%`);
        }
        
      } else {
        console.log(`❌ ${endpoint}: Erro ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
    
    console.log(''); // linha em branco
  }
  
  console.log('🎯 TESTE COMPLETO!\n');
  console.log('📊 Dashboard disponível em: ' + baseUrl + '/dashboard');
  console.log('📡 Webhook endpoint: ' + baseUrl + '/api/webhooks/signal?token=210406');
}

// Se rodando diretamente
if (require.main === module) {
  testSystem().catch(console.error);
}

module.exports = { testSystem };
