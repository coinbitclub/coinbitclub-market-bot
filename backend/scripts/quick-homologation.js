#!/usr/bin/env node

/**
 * 🎯 EXECUTOR DE HOMOLOGAÇÃO RÁPIDA - COINBITCLUB
 * Script para executar homologação básica imediatamente
 */

const axios = require('axios');

class QuickHomologation {
    constructor() {
        // URLs possíveis para teste (em ordem de prioridade)
        this.possibleURLs = [
            'https://coinbitclub-market-bot-production.up.railway.app',
            'https://coinbitclub-api-v2-production.up.railway.app',
            'http://localhost:8080',
            'http://localhost:3000'
        ];
        this.baseURL = null;
        this.results = [];
    }

    async findWorkingURL() {
        this.log('🔍 Procurando URL do backend ativa...');
        
        for (const url of this.possibleURLs) {
            try {
                this.log(`Testando: ${url}`);
                const response = await axios.get(`${url}/health`, { timeout: 5000 });
                if (response.status === 200) {
                    this.baseURL = url;
                    this.log(`✅ Backend encontrado: ${url}`, 'SUCCESS');
                    return url;
                }
            } catch (error) {
                this.log(`❌ ${url} - não responde`, 'ERROR');
            }
        }
        
        throw new Error('Nenhuma URL do backend está respondendo');
    }

    log(message, type = 'INFO') {
        const emoji = {
            'INFO': 'ℹ️',
            'SUCCESS': '✅',
            'ERROR': '❌',
            'WARNING': '⚠️'
        };
        console.log(`${emoji[type]} ${message}`);
    }

    async test(name, testFn) {
        const start = Date.now();
        try {
            const result = await testFn();
            const duration = Date.now() - start;
            this.log(`${name} - OK (${duration}ms)`, 'SUCCESS');
            this.results.push({ name, status: 'PASS', duration, result });
            return true;
        } catch (error) {
            const duration = Date.now() - start;
            this.log(`${name} - FALHOU (${duration}ms): ${error.message}`, 'ERROR');
            this.results.push({ name, status: 'FAIL', duration, error: error.message });
            return false;
        }
    }

    async run() {
        this.log('🚀 INICIANDO HOMOLOGAÇÃO RÁPIDA COINBITCLUB MARKETBOT');
        this.log(`🔗 Testing: ${this.baseURL}`);
        console.log('');

        // Teste 1: Conectividade básica
        await this.test('Backend Health Check', async () => {
            const response = await axios.get(`${this.baseURL}/health`, { timeout: 10000 });
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            return response.data;
        });

        // Teste 2: API Health
        await this.test('API Health Check', async () => {
            const response = await axios.get(`${this.baseURL}/api/health`, { timeout: 10000 });
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            return response.data;
        });

        // Teste 3: Status geral
        await this.test('System Status', async () => {
            const response = await axios.get(`${this.baseURL}/api/status`, { timeout: 10000 });
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            return response.data;
        });

        // Teste 4: Lista de endpoints
        await this.test('Endpoints List', async () => {
            const response = await axios.get(`${this.baseURL}/api/test/endpoints`, { timeout: 10000 });
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            return response.data;
        });

        // Teste 5: Webhook Signal
        await this.test('Webhook Signal Endpoint', async () => {
            const payload = {
                token: 'coinbitclub_webhook_secret_2024',
                symbol: 'BTCUSDT',
                action: 'SINAL_LONG',
                price: 67850.50,
                test_mode: true
            };
            const response = await axios.post(`${this.baseURL}/api/webhooks/signal`, payload, { timeout: 10000 });
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.success) throw new Error('Webhook returned success: false');
            return response.data;
        });

        // Teste 6: Webhook TradingView  
        await this.test('Webhook TradingView Endpoint', async () => {
            const payload = {
                token: 'coinbitclub_webhook_secret_2024',
                symbol: 'ETHUSDT',
                action: 'SINAL_SHORT',
                price: 3245.75,
                test_mode: true
            };
            const response = await axios.post(`${this.baseURL}/api/webhooks/tradingview`, payload, { timeout: 10000 });
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            return response.data;
        });

        // Teste 7: Login endpoint (deve falhar com credenciais inválidas)
        await this.test('Auth Login Validation', async () => {
            try {
                await axios.post(`${this.baseURL}/api/auth/login`, {
                    email: 'invalid@test.com',
                    password: 'invalidpass'
                }, { timeout: 10000 });
                throw new Error('Login should have failed with invalid credentials');
            } catch (error) {
                if (error.response?.status === 401) {
                    return { message: 'Correctly rejected invalid credentials' };
                }
                throw error;
            }
        });

        // Resultados finais
        console.log('\n📊 RESULTADOS DA HOMOLOGAÇÃO:');
        console.log('================================');
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;
        const successRate = ((passed / total) * 100).toFixed(1);

        console.log(`Total de testes: ${total}`);
        console.log(`✅ Aprovados: ${passed}`);
        console.log(`❌ Falharam: ${failed}`);
        console.log(`📈 Taxa de sucesso: ${successRate}%`);

        if (failed === 0) {
            this.log('\n🎉 HOMOLOGAÇÃO BÁSICA APROVADA!', 'SUCCESS');
            this.log('✅ Sistema está respondendo corretamente', 'SUCCESS');
            this.log('✅ Endpoints principais funcionando', 'SUCCESS');
            this.log('✅ Webhooks processando sinais', 'SUCCESS');
            this.log('✅ Autenticação validando corretamente', 'SUCCESS');
        } else {
            this.log('\n⚠️ HOMOLOGAÇÃO COM FALHAS!', 'WARNING');
            this.log(`❌ ${failed} teste(s) falharam`, 'ERROR');
            this.log('🔧 Verifique os logs acima para detalhes', 'WARNING');
        }

        console.log('\n📋 Para homologação completa, execute:');
        console.log('node scripts/homologation-runner.js');

        return { passed, failed, total, successRate };
    }
}

// Executar
if (require.main === module) {
    const homologation = new QuickHomologation();
    
    homologation.run()
        .then(results => {
            process.exit(results.failed === 0 ? 0 : 1);
        })
        .catch(error => {
            console.error('\n💥 ERRO FATAL:', error.message);
            process.exit(1);
        });
}

module.exports = QuickHomologation;
