/**
 * TESTE COMPLETO DE TODOS OS ENDPOINTS DO PROJETO
 * ==============================================
 * Este script testa todos os endpoints críticos e não críticos do CoinBitClub Market Bot
 */

const http = require('http');
const fs = require('fs');

// Configuração do teste
const BASE_URL = 'localhost';
const PORT = 3000;
const TIMEOUT = 10000;

// Lista completa de endpoints para testar
const ALL_ENDPOINTS = [
    // ========== ENDPOINTS CRÍTICOS (que estavam com 404) ==========
    { 
        method: 'GET', 
        path: '/health', 
        description: 'Health Check - CRÍTICO',
        critical: true,
        expectedStatus: 200,
        expectedFields: ['status', 'timestamp', 'uptime']
    },
    { 
        method: 'GET', 
        path: '/status', 
        description: 'Status Principal - CRÍTICO',
        critical: true,
        expectedStatus: 200,
        expectedFields: ['status', 'timestamp']
    },
    { 
        method: 'GET', 
        path: '/api/system/status', 
        description: 'API System Status - CRÍTICO',
        critical: true,
        expectedStatus: 200,
        expectedFields: ['status', 'timestamp', 'uptime']
    },
    { 
        method: 'GET', 
        path: '/api/dashboard/summary', 
        description: 'Dashboard Summary - CRÍTICO',
        critical: true,
        expectedStatus: 200,
        expectedFields: ['success', 'summary', 'timestamp']
    },

    // ========== WEBHOOKS TRADINGVIEW (que estavam falhando) ==========
    { 
        method: 'POST', 
        path: '/api/webhooks/signal', 
        description: 'Webhook Signal POST - TRADINGVIEW',
        critical: true,
        expectedStatus: 200,
        body: { symbol: 'BTCUSDT', action: 'BUY', price: 50000, test: true },
        expectedFields: ['status', 'timestamp']
    },
    { 
        method: 'GET', 
        path: '/api/webhooks/signal', 
        description: 'Webhook Signal GET - TRADINGVIEW',
        critical: true,
        expectedStatus: 200,
        expectedFields: ['status', 'method', 'acceptsMethods']
    },
    { 
        method: 'POST', 
        path: '/webhook', 
        description: 'Webhook Geral POST',
        critical: true,
        expectedStatus: 200,
        body: { test: 'webhook-data', timestamp: Date.now() },
        expectedFields: ['status', 'timestamp']
    },
    { 
        method: 'GET', 
        path: '/webhook', 
        description: 'Webhook Geral GET',
        critical: true,
        expectedStatus: 200,
        expectedFields: ['status', 'method']
    },
    { 
        method: 'POST', 
        path: '/api/webhooks/trading', 
        description: 'Trading Webhook POST',
        critical: true,
        expectedStatus: 200,
        body: { pair: 'BTCUSDT', side: 'buy', amount: 0.001 },
        expectedFields: ['status', 'timestamp']
    },
    { 
        method: 'GET', 
        path: '/api/webhooks/trading', 
        description: 'Trading Webhook GET',
        critical: true,
        expectedStatus: 200,
        expectedFields: ['status', 'method']
    },

    // ========== DASHBOARD E INTERFACE ==========
    { 
        method: 'GET', 
        path: '/', 
        description: 'Dashboard Principal',
        critical: false,
        expectedStatus: 200,
        isHTML: true
    },
    { 
        method: 'GET', 
        path: '/api/test', 
        description: 'API Test Endpoint',
        critical: false,
        expectedStatus: 200,
        expectedFields: ['success', 'message']
    },

    // ========== PAINEL DE CONTROLE ==========
    { 
        method: 'GET', 
        path: '/painel', 
        description: 'Painel Principal',
        critical: false,
        expectedStatus: 200,
        isHTML: true
    },
    { 
        method: 'GET', 
        path: '/painel/executivo', 
        description: 'Dashboard Executivo',
        critical: false,
        expectedStatus: 200,
        isHTML: true
    },
    { 
        method: 'GET', 
        path: '/painel/fluxo', 
        description: 'Fluxo Operacional',
        critical: false,
        expectedStatus: 200,
        isHTML: true
    },
    { 
        method: 'GET', 
        path: '/painel/decisoes', 
        description: 'Análise de Decisões',
        critical: false,
        expectedStatus: 200,
        isHTML: true
    },
    { 
        method: 'GET', 
        path: '/painel/usuarios', 
        description: 'Monitoramento de Usuários',
        critical: false,
        expectedStatus: 200,
        isHTML: true
    },
    { 
        method: 'GET', 
        path: '/painel/alertas', 
        description: 'Sistema de Alertas',
        critical: false,
        expectedStatus: 200,
        isHTML: true
    },
    { 
        method: 'GET', 
        path: '/painel/diagnosticos', 
        description: 'Diagnósticos Técnicos',
        critical: false,
        expectedStatus: 200,
        isHTML: true
    },

    // ========== APIs DO PAINEL ==========
    { 
        method: 'GET', 
        path: '/api/painel/executivo', 
        description: 'API Painel Executivo',
        critical: false,
        expectedStatus: 200,
        expectedFields: ['success']
    },
    { 
        method: 'GET', 
        path: '/api/painel/fluxo', 
        description: 'API Painel Fluxo',
        critical: false,
        expectedStatus: 200,
        expectedFields: ['success', 'data']
    },
    { 
        method: 'GET', 
        path: '/api/painel/decisoes', 
        description: 'API Painel Decisões',
        critical: false,
        expectedStatus: 200,
        expectedFields: ['success', 'data']
    },
    { 
        method: 'GET', 
        path: '/api/painel/usuarios', 
        description: 'API Painel Usuários',
        critical: false,
        expectedStatus: 200,
        expectedFields: ['success', 'data']
    },
    { 
        method: 'GET', 
        path: '/api/painel/alertas', 
        description: 'API Painel Alertas',
        critical: false,
        expectedStatus: 200,
        expectedFields: ['success', 'data']
    },
    { 
        method: 'GET', 
        path: '/api/painel/diagnosticos', 
        description: 'API Painel Diagnósticos',
        critical: false,
        expectedStatus: 200,
        expectedFields: ['success', 'data']
    },

    // ========== TESTE DE ENDPOINTS INEXISTENTES (devem retornar 404) ==========
    { 
        method: 'GET', 
        path: '/endpoint-inexistente', 
        description: 'Teste 404 - Endpoint Inexistente',
        critical: false,
        expectedStatus: 404,
        shouldFail: true
    },
    { 
        method: 'POST', 
        path: '/api/inexistente', 
        description: 'Teste 404 - API Inexistente',
        critical: false,
        expectedStatus: 404,
        shouldFail: true,
        body: { test: 'data' }
    }
];

// Função para fazer uma requisição HTTP
function makeRequest(endpoint) {
    return new Promise((resolve) => {
        const options = {
            hostname: BASE_URL,
            port: PORT,
            path: endpoint.path,
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'CoinBitClub-Complete-Test-Suite/1.0',
                'Accept': endpoint.isHTML ? 'text/html,application/xhtml+xml' : 'application/json'
            },
            timeout: TIMEOUT
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', chunk => {
                data += chunk;
            });
            
            res.on('end', () => {
                let parsedData = null;
                let parseError = null;
                
                try {
                    if (!endpoint.isHTML && data.trim()) {
                        parsedData = JSON.parse(data);
                    } else {
                        parsedData = data;
                    }
                } catch (e) {
                    parseError = e.message;
                    parsedData = data.substring(0, 200) + (data.length > 200 ? '...' : '');
                }
                
                resolve({
                    success: true,
                    status: res.statusCode,
                    data: parsedData,
                    headers: res.headers,
                    parseError,
                    dataSize: data.length
                });
            });
        });

        req.on('error', (err) => {
            resolve({
                success: false,
                error: err.message,
                status: 'ERROR'
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                success: false,
                error: 'Request timeout',
                status: 'TIMEOUT'
            });
        });

        // Enviar body se for POST
        if (endpoint.body && (endpoint.method === 'POST' || endpoint.method === 'PUT')) {
            req.write(JSON.stringify(endpoint.body));
        }

        req.end();
    });
}

// Função para verificar se servidor está rodando
async function checkServer() {
    console.log('🔍 Verificando se servidor está rodando...');
    
    try {
        const result = await makeRequest({ method: 'GET', path: '/health' });
        if (result.success && result.status === 200) {
            console.log('✅ Servidor está rodando e respondendo!');
            return true;
        } else {
            console.log('❌ Servidor não está respondendo adequadamente');
            return false;
        }
    } catch (error) {
        console.log('❌ Erro ao conectar com servidor:', error.message);
        return false;
    }
}

// Função para validar resposta
function validateResponse(endpoint, result) {
    const validations = {
        statusOk: false,
        hasExpectedFields: false,
        parseOk: false,
        details: []
    };

    // Verificar status HTTP
    if (endpoint.shouldFail) {
        validations.statusOk = result.status === endpoint.expectedStatus;
        if (!validations.statusOk) {
            validations.details.push(`Expected ${endpoint.expectedStatus}, got ${result.status}`);
        }
    } else {
        validations.statusOk = result.status === endpoint.expectedStatus;
        if (!validations.statusOk) {
            validations.details.push(`Expected ${endpoint.expectedStatus}, got ${result.status}`);
        }
    }

    // Verificar parsing (se não for HTML)
    if (!endpoint.isHTML && !result.parseError) {
        validations.parseOk = true;
    } else if (endpoint.isHTML) {
        validations.parseOk = true; // HTML não precisa parsing JSON
    } else {
        validations.details.push(`Parse error: ${result.parseError}`);
    }

    // Verificar campos esperados (só para JSON)
    if (endpoint.expectedFields && !endpoint.isHTML && typeof result.data === 'object') {
        const missingFields = endpoint.expectedFields.filter(field => !(field in result.data));
        validations.hasExpectedFields = missingFields.length === 0;
        if (!validations.hasExpectedFields) {
            validations.details.push(`Missing fields: ${missingFields.join(', ')}`);
        }
    } else if (!endpoint.expectedFields) {
        validations.hasExpectedFields = true; // Não há campos obrigatórios
    } else {
        validations.hasExpectedFields = true; // HTML ou outras situações
    }

    return validations;
}

// Função principal de teste
async function runAllTests() {
    console.log('🧪 TESTE COMPLETO DE TODOS OS ENDPOINTS');
    console.log('========================================');
    console.log(`📍 Servidor: ${BASE_URL}:${PORT}`);
    console.log(`🕐 Timeout: ${TIMEOUT}ms`);
    console.log(`📊 Total de endpoints: ${ALL_ENDPOINTS.length}`);
    console.log('');

    // Verificar se servidor está rodando
    const serverRunning = await checkServer();
    if (!serverRunning) {
        console.log('❌ TESTE ABORTADO: Servidor não está rodando');
        console.log('💡 Execute: node hybrid-server.js em outro terminal');
        return;
    }

    console.log('🚀 Iniciando testes...');
    console.log('');

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let criticalPassed = 0;
    let criticalFailed = 0;
    const results = [];

    for (const endpoint of ALL_ENDPOINTS) {
        totalTests++;
        const criticalIcon = endpoint.critical ? '🔥' : '📌';
        const shouldFailIcon = endpoint.shouldFail ? '🔍' : '';
        
        console.log(`${criticalIcon}${shouldFailIcon} Testando: ${endpoint.method} ${endpoint.path}`);
        console.log(`   📋 ${endpoint.description}`);

        const startTime = Date.now();
        const result = await makeRequest(endpoint);
        const duration = Date.now() - startTime;

        if (result.success) {
            const validation = validateResponse(endpoint, result);
            const allValid = validation.statusOk && validation.hasExpectedFields && validation.parseOk;
            
            if (allValid) {
                console.log(`   ✅ SUCESSO (${result.status}) - ${duration}ms`);
                passedTests++;
                if (endpoint.critical) criticalPassed++;
                
                // Mostrar dados importantes para endpoints críticos
                if (endpoint.critical && !endpoint.isHTML && typeof result.data === 'object') {
                    if (result.data.status) console.log(`      Status: ${result.data.status}`);
                    if (result.data.mode) console.log(`      Mode: ${result.data.mode}`);
                    if (result.data.summary) console.log(`      Summary: ✓`);
                }
                
                results.push({ 
                    endpoint, 
                    status: 'PASS', 
                    httpStatus: result.status, 
                    duration,
                    dataSize: result.dataSize 
                });
            } else {
                console.log(`   ⚠️  PARCIAL (${result.status}) - ${duration}ms`);
                validation.details.forEach(detail => console.log(`      ⚠️ ${detail}`));
                failedTests++;
                if (endpoint.critical) criticalFailed++;
                
                results.push({ 
                    endpoint, 
                    status: 'PARTIAL', 
                    httpStatus: result.status, 
                    duration,
                    validation,
                    dataSize: result.dataSize
                });
            }
        } else {
            console.log(`   ❌ FALHA: ${result.error}`);
            failedTests++;
            if (endpoint.critical) criticalFailed++;
            
            results.push({ 
                endpoint, 
                status: 'FAIL', 
                error: result.error, 
                duration 
            });
        }
        
        console.log('');
        
        // Pequena pausa entre requests para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Relatório final detalhado
    console.log('📊 RELATÓRIO FINAL COMPLETO');
    console.log('===========================');
    console.log(`📈 Total de testes: ${totalTests}`);
    console.log(`✅ Sucessos: ${passedTests}`);
    console.log(`❌ Falhas: ${failedTests}`);
    console.log(`📊 Taxa de sucesso geral: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log('');
    console.log(`🔥 Endpoints críticos: ${criticalPassed + criticalFailed}`);
    console.log(`🔥✅ Críticos ok: ${criticalPassed}`);
    console.log(`🔥❌ Críticos falha: ${criticalFailed}`);
    console.log(`🔥📊 Taxa crítica: ${Math.round((criticalPassed / (criticalPassed + criticalFailed)) * 100)}%`);
    console.log('');

    // Análise específica dos problemas que foram corrigidos
    console.log('🎯 ANÁLISE DOS PROBLEMAS ORIGINAIS:');
    console.log('===================================');
    
    const originalProblems = [
        '/status',
        '/api/dashboard/summary', 
        '/api/webhooks/signal'
    ];
    
    let originalProblemsFixed = 0;
    originalProblems.forEach(problemPath => {
        const relatedResults = results.filter(r => r.endpoint.path === problemPath);
        const allFixed = relatedResults.every(r => r.status === 'PASS');
        const icon = allFixed ? '✅' : '❌';
        console.log(`${icon} ${problemPath} - ${allFixed ? 'CORRIGIDO' : 'AINDA COM PROBLEMAS'}`);
        if (allFixed) originalProblemsFixed++;
    });
    
    console.log('');
    
    // Análise de webhooks
    console.log('📡 ANÁLISE DOS WEBHOOKS TRADINGVIEW:');
    console.log('====================================');
    
    const webhookResults = results.filter(r => r.endpoint.path.includes('webhook'));
    const webhooksOk = webhookResults.filter(r => r.status === 'PASS').length;
    console.log(`✅ Webhooks funcionando: ${webhooksOk}/${webhookResults.length}`);
    
    webhookResults.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} ${result.endpoint.method} ${result.endpoint.path}`);
    });
    
    console.log('');
    
    // Conclusão final
    const allCriticalFixed = criticalFailed === 0;
    const originalFixed = originalProblemsFixed === originalProblems.length;
    const webhooksWorking = webhooksOk === webhookResults.length;
    
    if (allCriticalFixed && originalFixed && webhooksWorking) {
        console.log('🎉 TESTE COMPLETO: TODOS OS PROBLEMAS RESOLVIDOS!');
        console.log('================================================');
        console.log('✅ Todos os endpoints críticos funcionando');
        console.log('✅ Problemas originais 404 corrigidos');
        console.log('✅ Webhooks TradingView operacionais');
        console.log('✅ Dashboard e APIs acessíveis');
        console.log('');
        console.log('🚀 SISTEMA PRONTO PARA DEPLOY NA RAILWAY!');
        console.log('');
        console.log('💻 Comandos para deploy:');
        console.log('  git add .');
        console.log('  git commit -m "🎯 FIX: All 404 endpoints resolved + webhooks functional"');
        console.log('  git push origin main');
    } else {
        console.log('⚠️ PROBLEMAS AINDA EXISTEM:');
        console.log('===========================');
        if (!allCriticalFixed) console.log(`❌ ${criticalFailed} endpoints críticos com problemas`);
        if (!originalFixed) console.log(`❌ ${originalProblems.length - originalProblemsFixed} problemas originais não resolvidos`);
        if (!webhooksWorking) console.log(`❌ ${webhookResults.length - webhooksOk} webhooks com problemas`);
        console.log('');
        console.log('🔧 Revise os endpoints com falha antes do deploy');
    }
    
    // Salvar relatório detalhado
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTests,
            passedTests,
            failedTests,
            successRate: Math.round((passedTests / totalTests) * 100),
            criticalPassed,
            criticalFailed,
            criticalRate: Math.round((criticalPassed / (criticalPassed + criticalFailed)) * 100)
        },
        originalProblems: {
            total: originalProblems.length,
            fixed: originalProblemsFixed,
            allFixed: originalFixed
        },
        webhooks: {
            total: webhookResults.length,
            working: webhooksOk,
            allWorking: webhooksWorking
        },
        readyForDeploy: allCriticalFixed && originalFixed && webhooksWorking,
        results
    };
    
    fs.writeFileSync('complete-test-report.json', JSON.stringify(report, null, 2));
    console.log('📝 Relatório completo salvo em: complete-test-report.json');
    
    return report;
}

// Executar se chamado diretamente
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { runAllTests, makeRequest, checkServer };
