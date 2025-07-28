// Teste simples de conectividade API
// Execute: node test-api-connection.js

import https from 'https';

const API_BASE = 'https://coinbitclub-market-bot.up.railway.app';

const testEndpoints = [
  '/health',
  '/api/health', 
  '/api/status',
  '/api/test/database',
  '/api/test/auth'
];

async function testAPI() {
  console.log('🧪 TESTANDO CONECTIVIDADE API');
  console.log('==============================');
  console.log(`🌐 Backend: ${API_BASE}`);
  console.log('');

  for (const endpoint of testEndpoints) {
    const url = `${API_BASE}${endpoint}`;
    
    try {
      const startTime = Date.now();
      
      const response = await new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              data: data,
              headers: res.headers
            });
          });
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      
      const duration = Date.now() - startTime;
      
      if (response.statusCode === 200) {
        console.log(`✅ ${endpoint} - OK (${duration}ms)`);
        try {
          const parsed = JSON.parse(response.data);
          if (parsed.status) {
            console.log(`   Status: ${parsed.status}`);
          }
        } catch (e) {
          // Ignore parse errors
        }
      } else {
        console.log(`⚠️ ${endpoint} - Status ${response.statusCode} (${duration}ms)`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint} - ERROR: ${error.message}`);
    }
    
    console.log('');
  }
}

testAPI().catch(console.error);
