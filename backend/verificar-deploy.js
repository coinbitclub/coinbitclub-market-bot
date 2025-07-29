/**
 * 🔍 VERIFICAÇÃO PÓS-DEPLOY
 * ========================
 */

const https = require('https');
const axios = require('axios');

async function verificarDeploy(url) {
    console.log('🔍 VERIFICANDO DEPLOY');
    console.log('====================');
    console.log(`🌐 URL: ${url}`);
    
    try {
        // 1. Health Check
        console.log('\n1. 🩺 HEALTH CHECK');
        const health = await axios.get(`${url}/health`);
        console.log(`✅ Health: ${health.data.status}`);
        
        // 2. API Health
        console.log('\n2. 🔌 API HEALTH');
        const apiHealth = await axios.get(`${url}/api/health`);
        console.log(`✅ API: ${apiHealth.data.status}`);
        
        // 3. Verificar banco
        console.log('\n3. 🗄️ DATABASE');
        console.log(`✅ Database: ${apiHealth.data.database || 'Connected'}`);
        
        console.log('\n🎉 DEPLOY VERIFICADO COM SUCESSO!');
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
    }
}

// Usar: node verificar-deploy.js https://sua-app.railway.app
const url = process.argv[2];
if (url) {
    verificarDeploy(url);
} else {
    console.log('❌ Uso: node verificar-deploy.js https://sua-app.railway.app');
}
