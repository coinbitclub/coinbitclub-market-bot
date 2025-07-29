#!/usr/bin/env node

/**
 * Verificador de URLs do Railway
 * Testa múltiplas possibilidades de URL do projeto
 */

const https = require('https');

const URLS = [
    'https://coinbitclub-market-bot.up.railway.app',
    'https://coinbitclub-market-bot-production.up.railway.app',
    'https://coinbitclub-market-bot-backend.up.railway.app',
    'https://market-bot.up.railway.app'
];

console.log('🔍 TESTE DE MÚLTIPLAS URLs DO RAILWAY');
console.log('====================================');
console.log(`⏰ ${new Date().toLocaleTimeString()}\n`);

function testURL(url) {
    return new Promise((resolve) => {
        const req = https.get(url, (res) => {
            console.log(`✅ ${url}`);
            console.log(`   📊 Status: ${res.statusCode} ${res.statusMessage}`);
            
            if (res.statusCode === 200) {
                console.log(`   🎉 FUNCIONANDO! Esta é a URL correta!`);
            }
            
            resolve({ url, status: res.statusCode, working: res.statusCode === 200 });
        });
        
        req.on('error', (error) => {
            console.log(`❌ ${url}`);
            console.log(`   🚫 Erro: ${error.message}`);
            resolve({ url, status: 'error', working: false });
        });
        
        req.setTimeout(5000, () => {
            console.log(`⏰ ${url}`);
            console.log(`   ⏱️ Timeout (5s)`);
            req.destroy();
            resolve({ url, status: 'timeout', working: false });
        });
    });
}

async function testAllURLs() {
    console.log('🚀 Testando todas as URLs possíveis...\n');
    
    for (const url of URLS) {
        await testURL(url);
        console.log('');
    }
    
    console.log('🎯 RESULTADO FINAL:');
    console.log('==================');
    console.log('Se alguma URL mostrou status 200, use ela!');
    console.log('Se todas deram 404, o deploy ainda está em andamento.');
    console.log('Se todas deram erro de conexão, verifique o nome do projeto no Railway.');
}

testAllURLs();
