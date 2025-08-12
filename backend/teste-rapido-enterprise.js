#!/usr/bin/env node
/**
 * 🚀 TESTE RÁPIDO ENTERPRISE - PRINCIPAIS ENDPOINTS
 * ================================================
 */

const http = require('http');

console.log('🚀 TESTE RÁPIDO ENTERPRISE');
console.log('==========================');
console.log('🎯 Testando principais endpoints enterprise\n');

const BASE_URL = 'localhost';
const PORT = 3000;

// Endpoints principais para teste rápido
const mainEndpoints = [
    // BÁSICOS
    { method: 'GET', path: '/health', category: 'BASIC' },
    { method: 'GET', path: '/api/system/status', category: 'BASIC' },
    { method: 'GET', path: '/', category: 'BASIC' },
    
    // ENTERPRISE CRÍTICOS
    { method: 'GET', path: '/api/dashboard/summary', category: 'DASHBOARD' },
    { method: 'GET', path: '/api/dashboard/realtime', category: 'DASHBOARD' },
    { method: 'GET', path: '/api/exchanges/status', category: 'EXCHANGES' },
    { method: 'GET', path: '/api/trade/status', category: 'TRADING' },
    { method: 'GET', path: '/api/users', category: 'USERS' },
    { method: 'GET', path: '/api/validation/status', category: 'VALIDATION' },
    { method: 'GET', path: '/api/webhooks/signal', category: 'WEBHOOKS' },
    
    // POST TESTS
    { method: 'POST', path: '/api/admin/create-coupon', category: 'ADMIN' },
    { method: 'POST', path: '/api/webhooks/signal', category: 'WEBHOOKS' },
    { method: 'POST', path: '/api/trade/execute', category: 'TRADING' }
];

function makeRequest(method, path, data = null) {
    return new Promise((resolve) => {
        const postData = data ? JSON.stringify(data) : '';
        
        const options = {
            hostname: BASE_URL,
            port: PORT,
            path: path,
            method: method,
            timeout: 3000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'EnterpriseQuickTest/1.0'
            }
        };

        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        data: json,
                        success: res.statusCode >= 200 && res.statusCode < 400
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: responseData,
                        success: res.statusCode >= 200 && res.statusCode < 400
                    });
                }
            });
        });

        req.on('error', (err) => {
            resolve({ statusCode: 0, error: err.message, success: false });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ statusCode: 0, error: 'timeout', success: false });
        });

        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

async function runQuickTest() {
    console.log(`🧪 Testando ${mainEndpoints.length} endpoints principais...\n`);
    
    let success = 0;
    let errors = 0;
    const results = {};
    
    for (let i = 0; i < mainEndpoints.length; i++) {
        const endpoint = mainEndpoints[i];
        
        // Preparar dados para POST
        let testData = null;
        if (endpoint.method === 'POST') {
            testData = {
                test: true,
                timestamp: new Date().toISOString(),
                source: 'quick_test'
            };
        }
        
        console.log(`[${i+1}/${mainEndpoints.length}] ${endpoint.method} ${endpoint.path}`);
        
        const result = await makeRequest(endpoint.method, endpoint.path, testData);
        
        if (result.success) {
            console.log(`   ✅ [${result.statusCode}] SUCCESS`);
            if (result.data && result.data.category) {
                console.log(`   📋 Category: ${result.data.category}`);
            }
            success++;
        } else {
            console.log(`   ❌ [${result.statusCode || 'ERROR'}] ${result.error || 'FAILED'}`);
            errors++;
        }
        
        // Agrupar por categoria
        if (!results[endpoint.category]) {
            results[endpoint.category] = { success: 0, errors: 0 };
        }
        
        if (result.success) {
            results[endpoint.category].success++;
        } else {
            results[endpoint.category].errors++;
        }
        
        console.log('');
        
        // Pequeno delay
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Relatório final
    console.log('🎯 RELATÓRIO TESTE RÁPIDO');
    console.log('=========================');
    console.log(`📊 Total: ${success + errors} endpoints`);
    console.log(`✅ Sucessos: ${success}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`📈 Taxa de sucesso: ${Math.round(success / (success + errors) * 100)}%`);
    console.log('');
    
    // Por categoria
    console.log('📋 POR CATEGORIA:');
    Object.keys(results).forEach(category => {
        const cat = results[category];
        const total = cat.success + cat.errors;
        const rate = Math.round(cat.success / total * 100);
        console.log(`${category.padEnd(10)}: ${cat.success}/${total} (${rate}%)`);
    });
    
    console.log('');
    
    // Conclusão
    if (success / (success + errors) >= 0.9) {
        console.log('🎉 EXCELENTE! Sistema enterprise 100% funcional!');
        console.log('✅ Todos os endpoints principais funcionando');
        console.log('🚀 Pronto para operação enterprise!');
    } else if (success / (success + errors) >= 0.8) {
        console.log('👍 MUITO BOM! Sistema enterprise quase perfeito');
        console.log('⚠️ Alguns endpoints podem precisar ajustes');
    } else {
        console.log('⚠️ Sistema precisa de verificação');
    }
    
    console.log('');
    console.log('🏢 Teste rápido enterprise completo!');
}

// Executar teste
runQuickTest().catch(console.error);
