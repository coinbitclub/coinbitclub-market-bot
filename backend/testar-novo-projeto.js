#!/usr/bin/env node

/**
 * 🧪 Teste do Novo Projeto Railway - Sistema V3
 * Valida se o novo projeto está funcionando corretamente
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🧪 TESTE DO NOVO PROJETO RAILWAY - SISTEMA V3');
console.log('===========================================\n');

function askForURL() {
    rl.question('🔗 Digite a nova URL do projeto Railway (ex: https://coinbitclub-market-bot-v3-production.up.railway.app): ', (url) => {
        if (!url.startsWith('http')) {
            console.log('❌ URL deve começar com https://');
            askForURL();
            return;
        }
        
        testNewProject(url.trim());
    });
}

function testNewProject(baseURL) {
    console.log(`\n🔍 Testando novo projeto: ${baseURL}`);
    console.log('=' .repeat(50));
    
    // Teste 1: Health Check
    testEndpoint(baseURL + '/health', 'Health Check')
        .then(result => {
            console.log('\n📊 RESULTADO HEALTH CHECK:');
            
            if (result.data && result.data.version) {
                console.log(`🏷️ Versão: ${result.data.version}`);
                
                if (result.data.version.includes('integrated-final')) {
                    console.log('✅ SISTEMA V3 DETECTADO! ');
                } else if (result.data.version.includes('multiservice-hybrid')) {
                    console.log('❌ AINDA SISTEMA ANTIGO!');
                    console.log('⚠️ Aguardar mais alguns minutos ou verificar deployment');
                } else {
                    console.log('🔍 Sistema desconhecido - verificar logs');
                }
                
                console.log(`🔧 Serviço: ${result.data.service || 'N/A'}`);
                console.log(`💾 Banco: ${result.data.database || 'N/A'}`);
            }
            
            // Teste 2: Painel de Controle
            return testEndpoint(baseURL + '/control', 'Painel de Controle');
        })
        .then(controlResult => {
            console.log('\n🎛️ RESULTADO PAINEL DE CONTROLE:');
            
            if (controlResult.status === 200) {
                console.log('✅ PAINEL DE CONTROLE DISPONÍVEL!');
                console.log('🎯 Sistema pronto para ativação!');
            } else {
                console.log('❌ Painel de controle não disponível');
                console.log('⚠️ Sistema ainda pode estar em deployment');
            }
            
            // Teste 3: Banco de Dados
            return testEndpoint(baseURL + '/api/health', 'API Health (Banco)');
        })
        .then(apiResult => {
            console.log('\n💾 RESULTADO TESTE BANCO:');
            
            if (apiResult.data && apiResult.data.database === 'connected') {
                console.log('✅ BANCO DE DADOS CONECTADO!');
                console.log(`📊 Tabelas: ${apiResult.data.database_tables || 'N/A'}`);
            } else {
                console.log('❌ Problema na conexão do banco');
                console.log('⚠️ Verificar DATABASE_URL');
            }
            
            // Resumo final
            showFinalSummary(baseURL, apiResult.data);
        })
        .catch(error => {
            console.log(`❌ Erro durante testes: ${error.message}`);
        })
        .finally(() => {
            rl.close();
        });
}

function testEndpoint(url, description) {
    return new Promise((resolve) => {
        console.log(`🔍 Testando ${description}...`);
        
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = res.headers['content-type']?.includes('application/json') 
                        ? JSON.parse(data) 
                        : { raw: data.substring(0, 100) };
                    
                    console.log(`   📊 Status: ${res.statusCode}`);
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

function showFinalSummary(baseURL, apiData) {
    console.log('\n🎯 RESUMO FINAL:');
    console.log('================');
    
    const isV3Active = apiData && apiData.version && apiData.version.includes('integrated-final');
    const isDatabaseConnected = apiData && apiData.database === 'connected';
    
    if (isV3Active && isDatabaseConnected) {
        console.log('🎉 SUCESSO COMPLETO!');
        console.log('✅ Sistema V3 ativo');
        console.log('✅ Banco de dados conectado');
        console.log('✅ Painel de controle disponível');
        console.log('');
        console.log('🚀 PRÓXIMOS PASSOS:');
        console.log(`1. Acessar: ${baseURL}/control`);
        console.log('2. Clicar em "🟢 Ligar Sistema"');
        console.log('3. Sistema começará operação real!');
        console.log('');
        console.log('🔗 URLs importantes:');
        console.log(`   Controle: ${baseURL}/control`);
        console.log(`   Status: ${baseURL}/api/system/status`);
    } else if (isV3Active && !isDatabaseConnected) {
        console.log('⚠️ SISTEMA V3 ATIVO MAS BANCO COM PROBLEMA');
        console.log('🔧 Verificar DATABASE_URL nas variáveis do Railway');
    } else if (!isV3Active) {
        console.log('❌ SISTEMA ANTIGO AINDA ATIVO');
        console.log('⏳ Aguardar mais alguns minutos');
        console.log('🔄 Ou verificar logs do deployment no Railway');
    } else {
        console.log('🔍 ESTADO INDEFINIDO');
        console.log('💡 Verificar logs do Railway para mais detalhes');
    }
}

// Iniciar teste
askForURL();
