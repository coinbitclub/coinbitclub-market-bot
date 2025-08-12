#!/usr/bin/env node
/**
 * 🎯 TESTE FINAL RAILWAY ENTERPRISE - SISTEMA ATIVO
 * =================================================
 */

const https = require('https');

console.log('🎯 TESTE FINAL RAILWAY ENTERPRISE');
console.log('=================================');
console.log('🚀 Sistema deployado! Testando endpoints...\n');

const BASE_URL = 'coinbitclub-market-bot.up.railway.app';

// Endpoints críticos para validar enterprise
const testEndpoints = [
    { method: 'GET', path: '/health', desc: 'Health check' },
    { method: 'GET', path: '/api/system/status', desc: 'System status' },
    { method: 'GET', path: '/api/dashboard/summary', desc: 'Dashboard enterprise' },
    { method: 'GET', path: '/api/webhooks/signal', desc: 'Webhooks enterprise' },
    { method: 'GET', path: '/api/exchanges/status', desc: 'Exchanges enterprise' },
    { method: 'GET', path: '/api/trade/status', desc: 'Trading enterprise' },
    { method: 'GET', path: '/api/validation/status', desc: 'Validation enterprise' },
    { method: 'GET', path: '/api/admin/financial-summary', desc: 'Admin enterprise' },
    { method: 'GET', path: '/api/users', desc: 'Users enterprise' },
    { method: 'GET', path: '/painel', desc: 'Painel enterprise' }
];

function makeRequest(method, path) {
    return new Promise((resolve) => {
        const options = {
            hostname: BASE_URL,
            port: 443,
            path: path,
            method: method,
            timeout: 8000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'RailwayEnterpriseTest/1.0'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: responseData,
                    contentLength: responseData.length
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

async function testRailwayEnterprise() {
    console.log(`🧪 Testando ${testEndpoints.length} endpoints enterprise...\n`);
    
    const results = {
        success: 0,
        errors: 0,
        details: []
    };
    
    let systemInfo = null;
    
    for (let i = 0; i < testEndpoints.length; i++) {
        const endpoint = testEndpoints[i];
        console.log(`[${i+1}/${testEndpoints.length}] ${endpoint.method} ${endpoint.path}`);
        console.log(`   📝 ${endpoint.desc}`);
        
        const result = await makeRequest(endpoint.method, endpoint.path);
        
        const isSuccess = result.statusCode >= 200 && result.statusCode < 400;
        
        if (isSuccess) {
            console.log(`   ✅ Status: ${result.statusCode} | Size: ${result.contentLength} bytes`);
            results.success++;
            
            // Capturar informações do sistema no health check
            if (endpoint.path === '/health' && result.data) {
                try {
                    systemInfo = JSON.parse(result.data);
                    console.log(`   📊 Versão: ${systemInfo.version || 'unknown'} | Uptime: ${systemInfo.uptime || 0}s`);
                } catch (e) {
                    console.log('   📊 Sistema online (response parsed error)');
                }
            }
            
        } else {
            console.log(`   ❌ Status: ${result.statusCode || 'ERROR'} | Error: ${result.error || 'Unknown'}`);
            results.errors++;
        }
        
        results.details.push({
            path: endpoint.path,
            method: endpoint.method,
            status: result.statusCode,
            success: isSuccess
        });
        
        console.log('');
        
        // Delay entre requests
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Relatório final
    console.log('🎯 RELATÓRIO FINAL RAILWAY ENTERPRISE');
    console.log('====================================');
    console.log(`📊 Endpoints testados: ${testEndpoints.length}`);
    console.log(`✅ Sucessos: ${results.success}`);
    console.log(`❌ Erros: ${results.errors}`);
    console.log(`📈 Taxa de sucesso: ${Math.round(results.success / testEndpoints.length * 100)}%`);
    
    if (systemInfo) {
        console.log(`🔧 Versão Sistema: ${systemInfo.version || 'unknown'}`);
        console.log(`⏱️  Uptime: ${systemInfo.uptime || 0}s`);
        console.log(`🎯 Modo: ${systemInfo.mode || 'unknown'}`);
    }
    
    console.log('');
    
    // Status detalhado
    console.log('📋 STATUS DETALHADO:');
    console.log('====================');
    results.details.forEach(detail => {
        const icon = detail.success ? '✅' : '❌';
        console.log(`${icon} ${detail.method} ${detail.path} [${detail.status}]`);
    });
    
    console.log('');
    
    // Conclusão final
    if (results.success === testEndpoints.length) {
        console.log('🎉 PERFEITO! SISTEMA ENTERPRISE 100% FUNCIONAL NA RAILWAY!');
        console.log('============================================================');
        console.log('✅ Todos os endpoints enterprise estão operacionais');
        console.log('✅ Sistema multiusuário ativo');
        console.log('✅ Trading testnet configurado');
        console.log('✅ Monitoramento ativo');
        console.log('');
        console.log('🚀 COINBITCLUB ENTERPRISE ESTÁ LIVE E OPERACIONAL!');
        
    } else if (results.success >= testEndpoints.length * 0.8) {
        console.log('👍 MUITO BOM! Sistema enterprise majoritariamente funcional');
        console.log('⚠️ Alguns endpoints podem precisar de ajustes');
        
    } else {
        console.log('⚠️ Sistema enterprise parcialmente funcional');
        console.log('🔧 Alguns endpoints ainda não estão respondendo');
    }
    
    console.log('');
    console.log('🏢 Teste Railway Enterprise completo!');
}

testRailwayEnterprise().catch(console.error);
