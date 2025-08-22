/**
 * TEST FINANCIAL SYSTEM - MarketBot Backend
 * Testador completo do sistema financeiro
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

class FinancialSystemTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            info: '\x1b[34m',
            cyan: '\x1b[36m',
            yellow: '\x1b[33m',
            green: '\x1b[32m',
            red: '\x1b[31m',
            blue: '\x1b[34m',
            gray: '\x1b[90m',
            reset: '\x1b[0m'
        };
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️ ',
            info: 'ℹ️ '
        };
        
        const color = colors[type] || colors.info;
        console.log(`${color}[${timestamp}] ${icons[type] || ''} ${message}${colors.reset}`);
    }

    async testEndpoint(name, method, url, expectedStatus = 200, data = null) {
        try {
            this.log(`Testing ${name}...`);
            
            const config = {
                method,
                url: `${API_BASE}${url}`,
                timeout: 10000,
                validateStatus: () => true // Accept any status code
            };

            if (data) {
                config.data = data;
                config.headers = { 'Content-Type': 'application/json' };
            }

            const response = await axios(config);
            
            const passed = response.status === expectedStatus;
            
            if (passed) {
                this.results.passed++;
                this.log(`${name}: PASSED (${response.status})`, 'success');
                
                // Log response data if it exists
                if (response.data) {
                    console.log('   Response:', JSON.stringify(response.data, null, 2).substring(0, 200));
                }
            } else {
                this.results.failed++;
                this.log(`${name}: FAILED (Expected: ${expectedStatus}, Got: ${response.status})`, 'error');
                
                if (response.data) {
                    console.log('   Error:', JSON.stringify(response.data, null, 2).substring(0, 200));
                }
            }

            this.results.tests.push({
                name,
                passed,
                status: response.status,
                expectedStatus,
                response: response.data
            });

            return response;

        } catch (error) {
            this.results.failed++;
            this.log(`${name}: ERROR - ${error.message}`, 'error');
            
            this.results.tests.push({
                name,
                passed: false,
                error: error.message
            });
            
            return null;
        }
    }

    async runAllTests() {
        console.log('\n' + '='.repeat(80));
        console.log('🧪 INICIANDO TESTE COMPLETO DO SISTEMA FINANCEIRO');
        console.log('='.repeat(80) + '\n');

        // 1. Test Health Check first
        this.log('📊 Testando Health Check...');
        await this.testEndpoint('Health Check', 'GET', '/../../health', 200);

        // 2. Test Coupon System
        this.log('\n💳 Testando Sistema de Cupons...');
        await this.testEndpoint('Validate Coupon - WELCOME10', 'GET', '/coupons-affiliates/validate-coupon/WELCOME10', 200);
        await this.testEndpoint('Validate Coupon - INVALID', 'GET', '/coupons-affiliates/validate-coupon/INVALID', 200);
        await this.testEndpoint('Generate Coupon', 'POST', '/coupons-affiliates/coupon/generate', 200, {
            code: 'TEST2025',
            discount_percent: 15,
            max_uses: 100
        });

        // 3. Test Affiliate System
        this.log('\n👥 Testando Sistema de Afiliados...');
        await this.testEndpoint('Generate Affiliate', 'POST', '/coupons-affiliates/affiliate/generate', 200, {
            user_id: 'test-user-123',
            commission_rate: 5.0
        });
        await this.testEndpoint('Validate Affiliate', 'POST', '/coupons-affiliates/affiliate/validate', 200, {
            user_id: 'test-user-123'
        });

        // 4. Test Payment System
        this.log('\n� Testando Sistema de Pagamentos...');
        await this.testEndpoint('Get Recharge Links - Brasil', 'GET', '/payment/recharge-links/brasil', 200);
        await this.testEndpoint('Get Recharge Links - Global', 'GET', '/payment/recharge-links/global', 200);
        await this.testEndpoint('Get Stripe Products', 'GET', '/payment/stripe-products', 200);

        // 5. Test original payment routes if available
        this.log('\n💳 Testando Rotas de Pagamento Originais...');
        await this.testEndpoint('Validate Coupon (Original)', 'GET', '/payment/validate-coupon/WELCOME10', 200);

        this.printResults();
    }

    printResults() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 RESULTADOS DOS TESTES FINANCEIROS');
        console.log('='.repeat(80));

        this.log(`Testes Aprovados: ${this.results.passed}`, 'success');
        this.log(`Testes Falharam: ${this.results.failed}`, 'error');
        this.log(`Total de Testes: ${this.results.tests.length}`, 'info');

        const successRate = (this.results.passed / this.results.tests.length * 100).toFixed(1);
        this.log(`Taxa de Sucesso: ${successRate}%`, 'warning');

        // Detailed results
        console.log('\n� DETALHES DOS TESTES:');
        this.results.tests.forEach((test, index) => {
            const status = test.passed ? '✅' : '❌';
            const statusText = test.passed ? 'PASSED' : 'FAILED';
            console.log(`${index + 1}. ${status} ${test.name} - ${statusText}`);
            
            if (!test.passed && test.error) {
                console.log(`   Error: ${test.error}`);
            } else if (test.status) {
                console.log(`   Status: ${test.status}`);
            }
        });

        console.log('\n' + '='.repeat(80));
        
        if (this.results.failed === 0) {
            console.log('🎉 TODOS OS TESTES PASSARAM! Sistema Financeiro Funcional! 🎉');
        } else {
            console.log('⚠️  ALGUNS TESTES FALHARAM - Verifique os logs acima');
        }
        console.log('='.repeat(80) + '\n');
    }
}

// Execute tests
(async () => {
    const tester = new FinancialSystemTester();
    
    try {
        // Wait a moment for server to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await tester.runAllTests();
        
        // Exit with appropriate code
        process.exit(tester.results.failed === 0 ? 0 : 1);
        
    } catch (error) {
        console.error('� ERRO CRÍTICO NO TESTE:', error.message);
        process.exit(1);
    }
})();
