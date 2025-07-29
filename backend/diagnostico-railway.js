/**
 * 🔍 DIAGNÓSTICO COMPLETO DO RAILWAY
 * Identifica problemas no deploy
 */

console.log('🔍 DIAGNÓSTICO COMPLETO DO RAILWAY');
console.log('='.repeat(50));
console.log('');

console.log('📋 VERIFICAÇÃO DE ARQUIVOS CRÍTICOS:');
console.log('');

const fs = require('fs');
const path = require('path');

// Lista de arquivos críticos
const criticalFiles = [
    'Dockerfile',
    'railway.toml', 
    'package-clean.json',
    'servidor-integrado-completo.js',
    'sistema-orquestrador-completo.js',
    'controlador-sistema-web.js',
    'dashboard-live-data.js'
];

criticalFiles.forEach(file => {
    const exists = fs.existsSync(file);
    const size = exists ? fs.statSync(file).size : 0;
    console.log(`${exists ? '✅' : '❌'} ${file} ${exists ? `(${size} bytes)` : '(NÃO ENCONTRADO)'}`);
});

console.log('');
console.log('🔧 CONTEÚDO DO railway.toml:');
console.log('-'.repeat(30));
try {
    const railwayContent = fs.readFileSync('railway.toml', 'utf8');
    console.log(railwayContent);
} catch (error) {
    console.log('❌ Erro ao ler railway.toml:', error.message);
}

console.log('');
console.log('🐳 VERIFICAÇÃO DO DOCKERFILE:');
console.log('-'.repeat(30));
try {
    const dockerContent = fs.readFileSync('Dockerfile', 'utf8');
    const lines = dockerContent.split('\n');
    
    // Verificar linhas importantes
    const cmdLine = lines.find(line => line.trim().startsWith('CMD'));
    const copyLines = lines.filter(line => line.trim().startsWith('COPY'));
    
    console.log('📄 CMD:', cmdLine || 'NÃO ENCONTRADO');
    console.log('📄 COPY lines:');
    copyLines.forEach(line => console.log(`   ${line.trim()}`));
    
} catch (error) {
    console.log('❌ Erro ao ler Dockerfile:', error.message);
}

console.log('');
console.log('📦 VERIFICAÇÃO DO PACKAGE.JSON:');
console.log('-'.repeat(30));
try {
    const packageContent = fs.readFileSync('package-clean.json', 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    console.log('📄 Main:', packageJson.main);
    console.log('📄 Start script:', packageJson.scripts?.start);
    console.log('📄 Dependencies:');
    Object.keys(packageJson.dependencies || {}).forEach(dep => {
        console.log(`   ${dep}: ${packageJson.dependencies[dep]}`);
    });
    
} catch (error) {
    console.log('❌ Erro ao ler package-clean.json:', error.message);
}

console.log('');
console.log('🎯 PROBLEMAS POSSÍVEIS E SOLUÇÕES:');
console.log('-'.repeat(40));
console.log('');

console.log('1. 🐳 DOCKERFILE ISSUE:');
console.log('   - Verificar se COPY está correto');
console.log('   - Verificar se CMD aponta para arquivo correto');
console.log('   - Testar build local: docker build -t test .');
console.log('');

console.log('2. 📁 ARQUIVOS FALTANDO:');
console.log('   - Verificar se todos os arquivos foram commitados');
console.log('   - Git status e git add . antes do push');
console.log('');

console.log('3. 🚢 RAILWAY CONFIG:');
console.log('   - railway.toml deve apontar para Dockerfile correto');
console.log('   - startCommand deve ser o comando correto');
console.log('');

console.log('4. ⏰ TEMPO DE BUILD:');
console.log('   - Deploy pode levar 5-10 minutos');
console.log('   - Verificar logs no Railway Dashboard');
console.log('');

console.log('5. 📦 DEPENDÊNCIAS:');
console.log('   - Verificar se todas as deps estão no package.json');
console.log('   - npm install local para testar');
console.log('');

console.log('💡 PRÓXIMOS PASSOS RECOMENDADOS:');
console.log('1. Testar servidor localmente: node servidor-integrado-completo.js');
console.log('2. Verificar logs no Railway Dashboard');
console.log('3. Se necessário, fazer novo push com correções');
console.log('');

console.log('🌐 URLs PARA VERIFICAR:');
console.log('- Railway Dashboard: https://railway.app/project/[seu-projeto]');
console.log('- App URL: https://coinbitclub-market-bot-production.up.railway.app');
console.log('- Health: https://coinbitclub-market-bot-production.up.railway.app/health');
