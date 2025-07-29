#!/usr/bin/env node

/**
 * 🚀 VERIFICAÇÃO DE HOMOLOGAÇÃO - FRONTEND PREMIUM
 * 
 * Sistema para verificar todos os endpoints e calcular taxa de homologação
 * com o frontend premium operacional
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configurações dos serviços
const BACKEND_URL = 'http://localhost:8080';
const FRONTEND_PREMIUM_URL = 'http://localhost:3001';

/**
 * Realiza uma requisição HTTP
 */
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const lib = urlObj.protocol === 'https:' ? https : http;
        
        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'CoinbitClub-HomologationBot/1.0',
                ...options.headers
            },
            timeout: 10000
        };

        const req = lib.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data,
                    success: res.statusCode >= 200 && res.statusCode < 400
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.data) {
            req.write(JSON.stringify(options.data));
        }

        req.end();
    });
}

/**
 * Verifica se um serviço está rodando
 */
async function checkService(name, url) {
    try {
        const response = await makeRequest(url);
        return {
            name,
            url,
            status: response.success ? 'ONLINE' : 'ERROR',
            statusCode: response.statusCode,
            success: response.success
        };
    } catch (error) {
        return {
            name,
            url,
            status: 'OFFLINE',
            error: error.message,
            success: false
        };
    }
}

/**
 * Testa todos os endpoints do backend
 */
async function testBackendEndpoints() {
    const endpoints = [
        { name: 'Health Check', path: '/health' },
        { name: 'Status API', path: '/api/status' },
        { name: 'Test Endpoint', path: '/api/test' },
        { name: 'Admin Health', path: '/api/admin/railway/health' },
        { name: 'User Dashboard', path: '/api/user/dashboard' },
        { name: 'User Operations', path: '/api/user/operations' },
        { name: 'User Plans', path: '/api/user/plans' },
        { name: 'User Settings', path: '/api/user/settings' },
        { name: 'Affiliate Dashboard', path: '/api/affiliate/dashboard' },
        { name: 'Affiliate Commissions', path: '/api/affiliate/commissions' },
        { name: 'Admin Affiliates', path: '/api/admin/affiliates' },
        // IA Monitoring endpoints
        { name: 'IA Overview', path: '/api/admin/ia/overview' },
        { name: 'IA Services', path: '/api/admin/ia/services' },
        { name: 'IA Metrics', path: '/api/admin/ia/metrics' },
        { name: 'IA Security', path: '/api/admin/ia/security' },
        { name: 'IA Performance', path: '/api/admin/ia/performance' },
        { name: 'IA Charts', path: '/api/admin/ia/charts' },
        { name: 'IA Alerts', path: '/api/admin/ia/alerts' }
    ];

    const results = [];

    for (const endpoint of endpoints) {
        try {
            console.log(`🔍 Testando: ${endpoint.name}`);
            const response = await makeRequest(`${BACKEND_URL}${endpoint.path}`);
            results.push({
                ...endpoint,
                status: response.success ? 'PASS' : 'FAIL',
                statusCode: response.statusCode,
                success: response.success
            });
        } catch (error) {
            results.push({
                ...endpoint,
                status: 'ERROR',
                error: error.message,
                success: false
            });
        }
    }

    return results;
}

/**
 * Verifica páginas do frontend premium
 */
async function testFrontendPages() {
    // Verificar se o frontend está rodando
    const frontendCheck = await checkService('Frontend Premium', FRONTEND_PREMIUM_URL);
    
    if (!frontendCheck.success) {
        return [{
            name: 'Frontend Premium',
            status: 'OFFLINE',
            success: false
        }];
    }

    // Páginas principais do frontend premium
    const pages = [
        { name: 'Home Page', path: '/' },
        { name: 'Login Page', path: '/login' },
        { name: 'Register Page', path: '/signup' },
        { name: 'Dashboard Page', path: '/dashboard' },
        { name: 'Admin Page', path: '/admin' },
        { name: 'User Profile', path: '/user/profile' },
        { name: 'Trading Page', path: '/trading' },
        { name: 'Analytics Page', path: '/analytics' }
    ];

    const results = [];

    for (const page of pages) {
        try {
            console.log(`🔍 Testando página: ${page.name}`);
            const response = await makeRequest(`${FRONTEND_PREMIUM_URL}${page.path}`);
            results.push({
                ...page,
                status: response.success ? 'PASS' : 'FAIL',
                statusCode: response.statusCode,
                success: response.success
            });
        } catch (error) {
            results.push({
                ...page,
                status: 'ERROR',
                error: error.message,
                success: false
            });
        }
    }

    return results;
}

/**
 * Verifica estrutura de arquivos do frontend premium
 */
function checkFrontendStructure() {
    const frontendPath = path.join(__dirname, '..', 'coinbitclub-frontend-premium');
    
    if (!fs.existsSync(frontendPath)) {
        return {
            exists: false,
            pages: 0,
            components: 0,
            success: false
        };
    }

    // Contar arquivos
    let pageCount = 0;
    let componentCount = 0;

    try {
        // Contar páginas
        const pagesPath = path.join(frontendPath, 'pages');
        if (fs.existsSync(pagesPath)) {
            const countPages = (dir) => {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);
                    if (stat.isDirectory()) {
                        countPages(filePath);
                    } else if (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
                        pageCount++;
                    }
                }
            };
            countPages(pagesPath);
        }

        // Contar componentes
        const componentsPath = path.join(frontendPath, 'components');
        if (fs.existsSync(componentsPath)) {
            const countComponents = (dir) => {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);
                    if (stat.isDirectory()) {
                        countComponents(filePath);
                    } else if (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
                        componentCount++;
                    }
                }
            };
            countComponents(componentsPath);
        }

        return {
            exists: true,
            pages: pageCount,
            components: componentCount,
            success: true
        };

    } catch (error) {
        return {
            exists: true,
            error: error.message,
            success: false
        };
    }
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 INICIANDO VERIFICAÇÃO DE HOMOLOGAÇÃO - FRONTEND PREMIUM');
    console.log('============================================================');
    console.log(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}`);
    console.log(`⏰ Hora: ${new Date().toLocaleTimeString('pt-BR')}`);
    console.log('');

    // 1. Verificar serviços básicos
    console.log('🔍 1. VERIFICANDO SERVIÇOS BÁSICOS:');
    console.log('-----------------------------------');
    
    const backendCheck = await checkService('Backend API', `${BACKEND_URL}/health`);
    const frontendCheck = await checkService('Frontend Premium', FRONTEND_PREMIUM_URL);
    
    console.log(`Backend API: ${backendCheck.status} (${backendCheck.statusCode || 'N/A'})`);
    console.log(`Frontend Premium: ${frontendCheck.status} (${frontendCheck.statusCode || 'N/A'})`);
    console.log('');

    // 2. Verificar estrutura do frontend
    console.log('🔍 2. VERIFICANDO ESTRUTURA DO FRONTEND:');
    console.log('---------------------------------------');
    
    const frontendStructure = checkFrontendStructure();
    console.log(`Frontend existe: ${frontendStructure.exists ? 'SIM' : 'NÃO'}`);
    console.log(`Páginas encontradas: ${frontendStructure.pages}`);
    console.log(`Componentes encontrados: ${frontendStructure.components}`);
    console.log('');

    // 3. Testar endpoints do backend
    console.log('🔍 3. TESTANDO ENDPOINTS DO BACKEND:');
    console.log('-----------------------------------');
    
    const backendResults = await testBackendEndpoints();
    const backendSuccess = backendResults.filter(r => r.success).length;
    const backendTotal = backendResults.length;
    
    console.log(`✅ Endpoints funcionando: ${backendSuccess}/${backendTotal}`);
    console.log('');

    // 4. Testar páginas do frontend
    console.log('🔍 4. TESTANDO PÁGINAS DO FRONTEND:');
    console.log('----------------------------------');
    
    const frontendResults = await testFrontendPages();
    const frontendSuccess = frontendResults.filter(r => r.success).length;
    const frontendTotal = frontendResults.length;
    
    console.log(`✅ Páginas funcionando: ${frontendSuccess}/${frontendTotal}`);
    console.log('');

    // 5. Calcular taxa de homologação
    console.log('📊 CALCULANDO TAXA DE HOMOLOGAÇÃO:');
    console.log('==================================');
    
    const totalTests = backendTotal + frontendTotal + 2; // +2 para os checks básicos
    const totalSuccess = backendSuccess + frontendSuccess + 
                        (backendCheck.success ? 1 : 0) + 
                        (frontendCheck.success ? 1 : 0);
    
    const homologationRate = (totalSuccess / totalTests) * 100;
    
    console.log(`Total de testes: ${totalTests}`);
    console.log(`Testes aprovados: ${totalSuccess}`);
    console.log(`Taxa de homologação: ${homologationRate.toFixed(1)}%`);
    console.log('');

    // 6. Status final
    console.log('🎯 STATUS FINAL:');
    console.log('================');
    
    let status = 'FALHOU';
    let emoji = '❌';
    
    if (homologationRate >= 95) {
        status = 'EXCELENTE';
        emoji = '🟢';
    } else if (homologationRate >= 85) {
        status = 'BOM';
        emoji = '🟡';
    } else if (homologationRate >= 70) {
        status = 'REGULAR';
        emoji = '🟠';
    }
    
    console.log(`${emoji} Status: ${status}`);
    console.log(`📈 Taxa: ${homologationRate.toFixed(1)}%`);
    console.log(`🎯 Meta: 95.0%`);
    
    if (homologationRate >= 95) {
        console.log('🎉 META ATINGIDA! Sistema aprovado para operações reais!');
    } else {
        console.log(`⚠️  Necessário mais ${(95 - homologationRate).toFixed(1)}% para atingir a meta`);
    }
    
    console.log('');
    console.log('============================================================');
    console.log('🏁 VERIFICAÇÃO DE HOMOLOGAÇÃO CONCLUÍDA');
    console.log('============================================================');

    // Salvar relatório
    const report = {
        timestamp: new Date().toISOString(),
        homologationRate: homologationRate,
        status: status,
        totalTests: totalTests,
        totalSuccess: totalSuccess,
        services: {
            backend: backendCheck,
            frontend: frontendCheck
        },
        backendEndpoints: backendResults,
        frontendPages: frontendResults,
        frontendStructure: frontendStructure
    };

    fs.writeFileSync('relatorio-homologacao-premium.json', JSON.stringify(report, null, 2));
    console.log('📄 Relatório salvo em: relatorio-homologacao-premium.json');
}

// Executar
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, checkService, testBackendEndpoints, testFrontendPages };
