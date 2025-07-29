#!/usr/bin/env node

/**
 * 🧪 TESTE DIRETO DO PROJETO RAILWAY
 * Testa o projeto https://coinbitclub-market-bot.up.railway.app
 */

const https = require('https');

const BASE_URL = 'https://coinbitclub-market-bot.up.railway.app';

console.log('🧪 TESTE DIRETO DO PROJETO RAILWAY');
console.log('=================================');
console.log(`🔗 URL: ${BASE_URL}\n`);

function testEndpoint(endpoint, description) {
    return new Promise((resolve) => {
        console.log(`🔍 Testando ${description}...`);
        
        const req = https.get(BASE_URL + endpoint, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = res.headers['content-type']?.includes('application/json') 
                        ? JSON.parse(data) 
                        : { raw: data.substring(0, 200) };
                    
                    console.log(`   📊 Status: ${res.statusCode}`);
                    if (json.version) {
                        console.log(`   🏷️ Versão: ${json.version}`);
                    }
                    if (json.service) {
                        console.log(`   🔧 Serviço: ${json.service}`);
                    }
                    
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    console.log(`   📊 Status: ${res.statusCode} (HTML/Text response)`);
                    resolve({ status: res.statusCode, data: null });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`   🚫 Erro: ${error.message}`);
            resolve({ error: error.message });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            console.log(`   ⏰ Timeout`);
            resolve({ error: 'timeout' });
        });
    });
}

async function runTests() {
    // Teste 1: Health Check
    const healthResult = await testEndpoint('/health', 'Health Check');
    console.log('');
    
    // Teste 2: Painel de Controle
    const controlResult = await testEndpoint('/control', 'Painel de Controle');
    console.log('');
    
    // Teste 3: API Health
    const apiResult = await testEndpoint('/api/health', 'API Health');
    console.log('');
    
    // Análise dos resultados
    console.log('🎯 ANÁLISE DOS RESULTADOS:');
    console.log('==========================');
    
    if (healthResult.data && healthResult.data.version) {
        if (healthResult.data.version.includes('integrated-final')) {
            console.log('✅ SISTEMA V3 DETECTADO!');
            console.log('🎉 Novo sistema está funcionando!');
        } else if (healthResult.data.version.includes('multiservice-hybrid')) {
            console.log('❌ SISTEMA ANTIGO AINDA ATIVO');
            console.log('⚠️ Precisa configurar BACKEND_URL corretamente');
        }
        
        console.log(`📊 Versão atual: ${healthResult.data.version}`);
    }
    
    if (controlResult.status === 200) {
        console.log('✅ Painel de controle disponível');
        console.log(`🔗 Acesse: ${BASE_URL}/control`);
    } else {
        console.log('❌ Painel de controle não disponível');
    }
    
    if (apiResult.data && apiResult.data.database === 'connected') {
        console.log('✅ Banco de dados conectado');
    } else {
        console.log('⚠️ Verificar conexão do banco');
    }
    
    // Próximos passos
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    if (healthResult.data && healthResult.data.version && healthResult.data.version.includes('integrated-final')) {
        console.log('1. ✅ Sistema V3 funcionando');
        console.log('2. 🔧 Configurar chaves de exchanges');
        console.log('3. 🎯 Ativar sistema via /control');
    } else {
        console.log('1. ⚙️ Atualizar BACKEND_URL para este projeto');
        console.log('2. 🔄 Aguardar redeploy');
        console.log('3. 🧪 Testar novamente');
    }
}

runTests();
