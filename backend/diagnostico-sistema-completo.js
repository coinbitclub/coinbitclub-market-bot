#!/usr/bin/env node

/**
 * 🔧 Diagnóstico Completo do Sistema V3
 * Verifica e corrige problemas de deployment no Railway
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA V3');
console.log('===================================');
console.log(`⏰ Iniciado em: ${new Date().toLocaleTimeString()}\n`);

// 1. Verificar arquivos locais
console.log('📁 VERIFICANDO ARQUIVOS LOCAIS:');
console.log('-------------------------------');

const criticalFiles = [
    'main.js',
    'servidor-integrado-completo.js',
    'package.json',
    'railway.toml',
    'Dockerfile'
];

criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`✅ ${file} - ${(stats.size / 1024).toFixed(1)}KB`);
    } else {
        console.log(`❌ ${file} - NÃO ENCONTRADO`);
    }
});

// 2. Verificar conteúdo do package.json
console.log('\n📋 VERIFICANDO PACKAGE.JSON:');
console.log('-----------------------------');

try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`📦 Nome: ${packageJson.name}`);
    console.log(`🏷️ Versão: ${packageJson.version}`);
    console.log(`🚀 Main: ${packageJson.main}`);
    console.log(`⚙️ Start Script: ${packageJson.scripts?.start || 'N/A'}`);
    
    if (packageJson.main === 'main.js' || packageJson.scripts?.start?.includes('main.js')) {
        console.log('✅ Package.json configurado para Sistema V3');
    } else {
        console.log('⚠️ Package.json pode estar apontando para sistema antigo');
        console.log(`   Main atual: ${packageJson.main}`);
        console.log(`   Start atual: ${packageJson.scripts?.start}`);
    }
} catch (e) {
    console.log(`❌ Erro ao ler package.json: ${e.message}`);
}

// 3. Verificar railway.toml
console.log('\n🚂 VERIFICANDO RAILWAY.TOML:');
console.log('-----------------------------');

try {
    const railwayToml = fs.readFileSync('railway.toml', 'utf8');
    console.log('✅ railway.toml encontrado');
    
    if (railwayToml.includes('main.js')) {
        console.log('✅ railway.toml configurado para main.js');
    } else {
        console.log('⚠️ railway.toml pode não estar configurado para main.js');
    }
    
    console.log('\nConteúdo railway.toml:');
    console.log(railwayToml);
} catch (e) {
    console.log(`❌ Erro ao ler railway.toml: ${e.message}`);
}

// 4. Testar sistema remoto
console.log('\n🌐 TESTANDO SISTEMA REMOTO:');
console.log('---------------------------');

const BASE_URL = 'https://coinbitclub-market-bot.up.railway.app';

function testEndpoint(endpoint, description) {
    return new Promise((resolve) => {
        console.log(`🔍 Testando ${endpoint}...`);
        
        const req = https.get(BASE_URL + endpoint, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`   📊 Status: ${res.statusCode}`);
                    console.log(`   🏷️ Versão: ${json.version || 'N/A'}`);
                    console.log(`   🔧 Serviço: ${json.service || 'N/A'}`);
                    
                    if (json.version && json.version.includes('multiservice-hybrid')) {
                        console.log('   ❌ SISTEMA ANTIGO DETECTADO!');
                    } else if (json.version && json.version.includes('integrated-final')) {
                        console.log('   ✅ SISTEMA V3 DETECTADO!');
                    }
                    
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    console.log(`   ❌ Erro ao parsear resposta: ${e.message}`);
                    resolve({ status: res.statusCode, error: e.message });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`   🚫 Erro de conexão: ${error.message}`);
            resolve({ error: error.message });
        });
        
        req.setTimeout(10000, () => {
            console.log(`   ⏰ Timeout na requisição`);
            req.destroy();
            resolve({ error: 'timeout' });
        });
    });
}

async function runTests() {
    const healthResult = await testEndpoint('/health', 'Health Check');
    console.log('');
    
    const controlResult = await testEndpoint('/control', 'Painel de Controle');
    console.log('');
    
    // 5. Diagnóstico final
    console.log('🎯 DIAGNÓSTICO FINAL:');
    console.log('---------------------');
    
    if (healthResult.data && healthResult.data.version && healthResult.data.version.includes('integrated-final')) {
        console.log('✅ SISTEMA V3 ATIVO - PRONTO PARA OPERAÇÃO!');
        console.log('🔗 Acesse: https://coinbitclub-market-bot.up.railway.app/control');
        console.log('🎯 Para ativar o sistema de trading!');
    } else if (healthResult.data && healthResult.data.version && healthResult.data.version.includes('multiservice-hybrid')) {
        console.log('❌ SISTEMA ANTIGO AINDA ATIVO');
        console.log('');
        console.log('🔧 SOLUÇÕES RECOMENDADAS:');
        console.log('1. Execute: ./fix-railway-deployment.ps1');
        console.log('2. Ou acesse Railway Dashboard e force redeploy');
        console.log('3. Ou adicione variável FORCE_REBUILD=true no Railway');
    } else {
        console.log('⚠️ SISTEMA EM ESTADO DESCONHECIDO');
        console.log('💡 Verifique logs do Railway para mais detalhes');
    }
}

runTests();
