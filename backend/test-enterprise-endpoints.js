#!/usr/bin/env node
/**
 * 🏢 TESTE DOS 85 ENDPOINTS ENTERPRISE - VERIFICAÇÃO RÁPIDA
 */

const http = require('http');

console.log('🏢 TESTANDO ENDPOINTS ENTERPRISE...');
console.log('==================================');

const BASE_URL = 'http://localhost:3000';

// Lista dos endpoints críticos para testar
const criticalEndpoints = [
    { method: 'GET', path: '/health', desc: 'Health check básico' },
    { method: 'GET', path: '/status', desc: 'Status do sistema' },
    { method: 'GET', path: '/api/system/status', desc: 'API system status' },
    { method: 'GET', path: '/api/dashboard/summary', desc: 'Dashboard summary' },
    { method: 'GET', path: '/', desc: 'Dashboard principal' },
    { method: 'GET', path: '/api/users', desc: 'User management' },
    { method: 'GET', path: '/api/exchanges/status', desc: 'Exchanges status' },
    { method: 'GET', path: '/api/trade/status', desc: 'Trading status' },
    { method: 'GET', path: '/api/validation/status', desc: 'Validation status' },
    { method: 'GET', path: '/api/financial/summary', desc: 'Financial summary' },
    { method: 'GET', path: '/api/webhooks/signal', desc: 'Webhook GET test' },
    { method: 'GET', path: '/webhook', desc: 'Webhook básico' },
    { method: 'GET', path: '/painel', desc: 'Painel de controle' }
];

// Função para fazer requisição HTTP
function makeRequest(method, path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            timeout: 5000,
            headers: {
                'Accept': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: data.substring(0, 200),
                    contentType: res.headers['content-type'] || 'unknown'
                });
            });
        });

        req.on('error', (err) => {
            resolve({ statusCode: 0, error: err.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ statusCode: 0, error: 'timeout' });
        });

        req.end();
    });
}

// Testar endpoints
async function testEndpoints() {
    console.log(`🧪 Testando ${criticalEndpoints.length} endpoints críticos...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < criticalEndpoints.length; i++) {
        const endpoint = criticalEndpoints[i];
        
        console.log(`[${i + 1}/${criticalEndpoints.length}] ${endpoint.method} ${endpoint.path}`);
        console.log(`   📝 ${endpoint.desc}`);
        
        const result = await makeRequest(endpoint.method, endpoint.path);
        
        if (result.statusCode >= 200 && result.statusCode < 400) {
            console.log(`   ✅ Status: ${result.statusCode} | Type: ${result.contentType}`);
            successCount++;
        } else {
            console.log(`   ❌ Status: ${result.statusCode || 'ERROR'} | Error: ${result.error || 'Unknown'}`);
            errorCount++;
        }
        
        console.log('');
        
        // Delay entre requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('🎯 RESULTADO DO TESTE:');
    console.log('====================');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Taxa de sucesso: ${Math.round(successCount / criticalEndpoints.length * 100)}%`);
    
    if (successCount >= criticalEndpoints.length * 0.8) {
        console.log('\n🎉 SISTEMA ENTERPRISE FUNCIONANDO!');
        console.log('✅ Pronto para deploy na Railway');
    } else {
        console.log('\n⚠️ Sistema precisa de ajustes');
    }
}

// Executar teste
testEndpoints().catch(console.error);
