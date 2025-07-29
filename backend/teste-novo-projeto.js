#!/usr/bin/env node

/**
 * 🧪 TESTE DO NOVO PROJETO RAILWAY V3
 * Valida se o novo projeto está funcionando corretamente
 */

const https = require('https');
const fs = require('fs');

// Configuração - ALTERAR QUANDO NOVO PROJETO FOR CRIADO
const NEW_PROJECT_URL = process.argv[2] || 'https://coinbitclub-market-bot-v3-production.up.railway.app';

console.log('🧪 TESTE DO NOVO PROJETO RAILWAY V3');
console.log('==================================');
console.log(`🔗 URL: ${NEW_PROJECT_URL}`);
console.log(`⏰ Iniciado: ${new Date().toLocaleTimeString()}\n`);

let testResults = {
    health: false,
    control: false,
    database: false,
    version: null,
    system_type: null
};

function testEndpoint(endpoint, description) {
    return new Promise((resolve) => {
        console.log(`🔍 Testando ${endpoint}...`);
        
        const req = https.get(NEW_PROJECT_URL + endpoint, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`   📊 Status: ${res.statusCode}`);
                    console.log(`   🏷️ Versão: ${json.version || 'N/A'}`);
                    console.log(`   🔧 Serviço: ${json.service || 'N/A'}`);
                    
                    // Analisar resposta
                    if (endpoint === '/health') {
                        testResults.health = res.statusCode === 200;
                        testResults.database = json.database === 'connected';
                        testResults.version = json.version;
                        
                        if (json.version && json.version.includes('integrated-final')) {
                            testResults.system_type = 'v3';
                            console.log('   ✅ SISTEMA V3 DETECTADO!');
                        } else if (json.version && json.version.includes('multiservice-hybrid')) {
                            testResults.system_type = 'antigo';
                            console.log('   ❌ SISTEMA ANTIGO DETECTADO');
                        }
                        
                        if (json.database === 'connected') {
                            console.log('   ✅ BANCO DE DADOS CONECTADO');
                        } else {
                            console.log('   ❌ PROBLEMA COM BANCO DE DADOS');
                        }
                    }
                    
                    if (endpoint === '/control') {
                        testResults.control = res.statusCode === 200;
                        if (res.statusCode === 200) {
                            console.log('   ✅ PAINEL DE CONTROLE DISPONÍVEL');
                        }
                    }
                    
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    console.log(`   ❌ Erro ao parsear resposta: ${e.message}`);
                    if (endpoint === '/control' && res.statusCode === 200) {
                        // Control endpoint retorna HTML, não JSON
                        testResults.control = true;
                        console.log('   ✅ PAINEL DE CONTROLE DISPONÍVEL (HTML)');
                    }
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
    console.log('📋 EXECUTANDO TESTES...\n');
    
    // Teste 1: Health Check
    const healthResult = await testEndpoint('/health', 'Health Check');
    console.log('');
    
    // Teste 2: Painel de Controle
    const controlResult = await testEndpoint('/control', 'Painel de Controle');
    console.log('');
    
    // Teste 3: API Health
    const apiHealthResult = await testEndpoint('/api/health', 'API Health');
    console.log('');
    
    // Relatório Final
    console.log('📊 RELATÓRIO FINAL:');
    console.log('==================');
    
    if (testResults.system_type === 'v3' && testResults.health && testResults.control && testResults.database) {
        console.log('🎉 SUCESSO! NOVO PROJETO V3 FUNCIONANDO!');
        console.log('');
        console.log('✅ Sistema V3 ativo');
        console.log('✅ Health check OK');
        console.log('✅ Painel de controle disponível');
        console.log('✅ Banco de dados conectado');
        console.log('');
        console.log('🎯 PRÓXIMOS PASSOS:');
        console.log(`1. Acessar: ${NEW_PROJECT_URL}/control`);
        console.log('2. Clicar em "🟢 Ligar Sistema"');
        console.log('3. Sistema começará a operar!');
        console.log('');
        console.log('🔄 MIGRAÇÃO COMPLETA - PODE DELETAR PROJETO ANTIGO');
        
    } else if (testResults.system_type === 'antigo') {
        console.log('❌ PROBLEMA: Novo projeto ainda executa sistema antigo');
        console.log('');
        console.log('🔧 POSSÍVEIS CAUSAS:');
        console.log('- Railway não atualizou o código');
        console.log('- Configuração incorreta');
        console.log('- Cache do Railway');
        console.log('');
        console.log('💡 SOLUÇÕES:');
        console.log('1. Verificar configurações do projeto');
        console.log('2. Forçar redeploy');
        console.log('3. Verificar logs do Railway');
        
    } else {
        console.log('⚠️ TESTE INCOMPLETO');
        console.log('');
        console.log('📋 Status dos testes:');
        console.log(`Health Check: ${testResults.health ? '✅' : '❌'}`);
        console.log(`Painel Controle: ${testResults.control ? '✅' : '❌'}`);
        console.log(`Banco Dados: ${testResults.database ? '✅' : '❌'}`);
        console.log(`Tipo Sistema: ${testResults.system_type || '❓'}`);
        console.log('');
        console.log('💡 Aguarde alguns minutos e teste novamente');
    }
    
    // Salvar relatório
    const report = {
        timestamp: new Date().toISOString(),
        url: NEW_PROJECT_URL,
        results: testResults,
        success: testResults.system_type === 'v3' && testResults.health && testResults.control && testResults.database
    };
    
    fs.writeFileSync('teste-novo-projeto-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Relatório salvo em: teste-novo-projeto-report.json');
}

console.log('💡 USO: node teste-novo-projeto.js [URL_DO_NOVO_PROJETO]');
console.log('💡 Exemplo: node teste-novo-projeto.js https://coinbitclub-market-bot-v3-production.up.railway.app\n');

runTests();
