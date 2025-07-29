#!/usr/bin/env node

/**
 * 🎯 VALIDAÇÃO FINAL DO SISTEMA V3
 * Confirma se todas as correções foram aplicadas
 */

const fs = require('fs');
const https = require('https');

console.log('🎯 VALIDAÇÃO FINAL DO SISTEMA V3');
console.log('===============================\n');

// 1. Verificar package.json
console.log('📋 VERIFICANDO PACKAGE.JSON:');
try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (pkg.main === 'main.js' && pkg.scripts.start.includes('main.js')) {
        console.log('✅ Package.json configurado corretamente para Sistema V3');
        console.log(`   Main: ${pkg.main}`);
        console.log(`   Start: ${pkg.scripts.start}`);
    } else {
        console.log('❌ Package.json ainda não está correto');
        console.log(`   Main atual: ${pkg.main}`);
        console.log(`   Start atual: ${pkg.scripts.start}`);
    }
} catch (e) {
    console.log(`❌ Erro ao verificar package.json: ${e.message}`);
}

// 2. Verificar arquivos principais
console.log('\n📁 VERIFICANDO ARQUIVOS CRÍTICOS:');
const files = ['main.js', 'railway.toml', 'Dockerfile'];
files.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} - OK`);
    } else {
        console.log(`❌ ${file} - NÃO ENCONTRADO`);
    }
});

// 3. Verificar se não há arquivos conflitantes
console.log('\n🗑️ VERIFICANDO ARQUIVOS CONFLITANTES:');
const conflictFiles = ['server-clean.cjs', 'server-multiservice-complete.cjs'];
let hasConflicts = false;

conflictFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`⚠️ ${file} - AINDA PRESENTE (pode causar conflito)`);
        hasConflicts = true;
    } else {
        console.log(`✅ ${file} - REMOVIDO`);
    }
});

if (!hasConflicts) {
    console.log('✅ Nenhum arquivo conflitante encontrado');
}

// 4. Testar sistema remoto
console.log('\n🌐 TESTANDO SISTEMA RAILWAY:');
const BASE_URL = 'https://coinbitclub-market-bot.up.railway.app';

https.get(BASE_URL + '/health', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(`📊 Status: ${res.statusCode}`);
            console.log(`🏷️ Versão: ${json.version || 'N/A'}`);
            
            if (json.version && json.version.includes('integrated-final')) {
                console.log('✅ SISTEMA V3 ATIVO!');
                console.log('\n🎉 SUCESSO! O sistema está funcionando!');
                console.log('🔗 Acesse: https://coinbitclub-market-bot.up.railway.app/control');
                console.log('🎯 Para ativar o trading real!');
            } else if (json.version && json.version.includes('multiservice-hybrid')) {
                console.log('❌ Sistema antigo ainda ativo');
                console.log('\n🔧 AÇÕES NECESSÁRIAS:');
                console.log('1. Fazer commit das mudanças para GitHub');
                console.log('2. Acessar Railway Dashboard');
                console.log('3. Forçar redeploy ou adicionar FORCE_REBUILD=true');
                console.log('4. Aguardar 2-3 minutos');
            } else {
                console.log('⚠️ Sistema em estado desconhecido');
            }
        } catch (e) {
            console.log(`❌ Erro ao parsear resposta: ${e.message}`);
        }
    });
}).on('error', (error) => {
    console.log(`🚫 Erro de conexão: ${error.message}`);
});

console.log('\n🎯 PRÓXIMOS PASSOS SE RAILWAY AINDA MOSTRA SISTEMA ANTIGO:');
console.log('1. git add .');
console.log('2. git commit -m "Fix: Configure System V3 for Railway deployment"');
console.log('3. git push origin main');
console.log('4. Aguardar redeploy automático do Railway');
console.log('5. Testar novamente em 2-3 minutos');
