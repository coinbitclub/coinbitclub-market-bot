#!/usr/bin/env node
/**
 * 🚀 SCRIPT DE ATIVAÇÃO FINAL - SISTEMA HÍBRIDO MULTIUSUÁRIO
 * CoinBitClub Market Bot V3 - Ambiente de Produção
 * Data: 29/07/2025
 */

const https = require('https');
const { Pool } = require('pg');

// Configurações
const RAILWAY_URL = 'https://coinbitclub-market-bot.up.railway.app';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:LukinhaCBB123@junction.proxy.rlwy.net:15433/railway';

console.log('🚀 ATIVAÇÃO FINAL - SISTEMA HÍBRIDO MULTIUSUÁRIO');
console.log('=================================================');
console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
console.log('🌐 URL:', RAILWAY_URL);
console.log('');

class FinalActivator {
    constructor() {
        this.pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        this.results = [];
    }

    /**
     * 🧪 Executar todos os testes
     */
    async executeTests() {
        console.log('🧪 EXECUTANDO TESTES FINAIS...');
        console.log('');

        // Teste 1: Health Check
        await this.testHealthCheck();
        
        // Teste 2: Webhook TradingView
        await this.testWebhook();
        
        // Teste 3: Database
        await this.testDatabase();
        
        // Teste 4: Usuários Reais
        await this.testRealUsers();
        
        // Teste 5: IA Guardian
        await this.testAI();
    }

    async testHealthCheck() {
        console.log('🏥 Health Check...');
        try {
            const response = await this.makeRequest('/health');
            if (response.status === 'healthy') {
                console.log(`✅ Sistema online - Versão: ${response.version}`);
                this.results.push('Health Check: ✅ PASS');
            } else {
                throw new Error('Sistema não saudável');
            }
        } catch (error) {
            console.log(`❌ Health Check falhou: ${error.message}`);
            this.results.push('Health Check: ❌ FAIL');
        }
    }

    async testWebhook() {
        console.log('📡 Webhook TradingView...');
        try {
            const testSignal = {
                ticker: 'BTCUSDT.P',
                signal: 'SINAL TEST FINAL',
                close: '45000.00'
            };
            
            const response = await this.makeRequest('/api/webhook/tradingview', 'POST', testSignal);
            if (response.success) {
                console.log(`✅ Webhook funcional - ID: ${response.signalId}`);
                this.results.push('TradingView Webhook: ✅ PASS');
            } else {
                throw new Error('Webhook não processou corretamente');
            }
        } catch (error) {
            console.log(`❌ Webhook falhou: ${error.message}`);
            this.results.push('TradingView Webhook: ❌ FAIL');
        }
    }

    async testDatabase() {
        console.log('🗄️ Database Connection...');
        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT COUNT(*) as total FROM users');
            const total = result.rows[0].total;
            
            console.log(`✅ Database conectado - ${total} usuários`);
            client.release();
            this.results.push('Database: ✅ PASS');
        } catch (error) {
            console.log(`❌ Database falhou: ${error.message}`);
            this.results.push('Database: ❌ FAIL');
        }
    }

    async testRealUsers() {
        console.log('👥 Usuários Reais...');
        try {
            const client = await this.pool.connect();
            const result = await client.query(`
                SELECT 
                    u.name,
                    up.account_type,
                    COUNT(uc.id) as credentials_count
                FROM users u
                LEFT JOIN user_profiles up ON up.user_id = u.id
                LEFT JOIN user_credentials uc ON uc.user_id = u.id
                WHERE u.name IN ('MAURO', 'PALOMA') OR u.name LIKE '%MAURO%' OR u.name LIKE '%PALOMA%'
                GROUP BY u.id, u.name, up.account_type
            `);
            
            if (result.rows.length > 0) {
                console.log(`✅ Usuários reais encontrados:`);
                result.rows.forEach(user => {
                    console.log(`   • ${user.name} (${user.account_type}) - ${user.credentials_count} credenciais`);
                });
                this.results.push('Usuários Reais: ✅ PASS');
            } else {
                console.log(`⚠️ Usuários reais não encontrados`);
                this.results.push('Usuários Reais: ⚠️ WARNING');
            }
            
            client.release();
        } catch (error) {
            console.log(`❌ Teste usuários falhou: ${error.message}`);
            this.results.push('Usuários Reais: ❌ FAIL');
        }
    }

    async testAI() {
        console.log('🤖 IA Guardian...');
        try {
            const client = await this.pool.connect();
            const result = await client.query(`
                SELECT COUNT(*) as ai_records 
                FROM ai_analysis 
                WHERE created_at > NOW() - INTERVAL '24 hours'
            `);
            
            const count = result.rows[0].ai_records;
            
            if (count > 0) {
                console.log(`✅ IA ativa - ${count} análises em 24h`);
                this.results.push('IA Guardian: ✅ PASS');
            } else {
                console.log(`⚠️ IA sem atividade recente`);
                this.results.push('IA Guardian: ⚠️ WARNING');
            }
            
            client.release();
        } catch (error) {
            console.log(`❌ IA teste falhou: ${error.message}`);
            this.results.push('IA Guardian: ❌ FAIL');
        }
    }

    async makeRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, RAILWAY_URL);
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(url, options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body));
                    } catch (error) {
                        reject(new Error(`Parse error: ${error.message}`));
                    }
                });
            });

            req.on('error', reject);
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    generateFinalReport() {
        console.log('');
        console.log('📋 RELATÓRIO FINAL DE ATIVAÇÃO');
        console.log('===============================');
        
        this.results.forEach(result => {
            console.log(`   ${result}`);
        });
        
        const failures = this.results.filter(r => r.includes('❌')).length;
        const warnings = this.results.filter(r => r.includes('⚠️')).length;
        const passes = this.results.filter(r => r.includes('✅')).length;
        
        console.log('');
        console.log(`✅ Aprovados: ${passes}`);
        console.log(`⚠️ Avisos: ${warnings}`);
        console.log(`❌ Falhas: ${failures}`);
        
        console.log('');
        
        if (failures === 0) {
            console.log('🎉 SISTEMA HÍBRIDO MULTIUSUÁRIO ATIVADO COM SUCESSO!');
            console.log('✅ Todos os testes críticos passaram');
            console.log('🚀 Sistema em operação para usuários reais');
            console.log('');
            console.log('🔗 URLs importantes:');
            console.log(`   🌐 Sistema: ${RAILWAY_URL}`);
            console.log(`   🏥 Health: ${RAILWAY_URL}/health`);
            console.log(`   📊 Status: ${RAILWAY_URL}/api/system/status`);
            console.log(`   📡 Webhook: ${RAILWAY_URL}/api/webhook/tradingview`);
        } else {
            console.log('⚠️ SISTEMA PRECISA DE AJUSTES ANTES DA ATIVAÇÃO COMPLETA');
            console.log(`❌ ${failures} teste(s) crítico(s) falharam`);
        }
        
        console.log('');
        console.log('📅 Ativação concluída em:', new Date().toLocaleString('pt-BR'));
    }

    async run() {
        try {
            await this.executeTests();
        } catch (error) {
            console.log(`💥 Erro durante ativação: ${error.message}`);
        } finally {
            this.generateFinalReport();
            await this.pool.end();
        }
    }
}

// Executar
const activator = new FinalActivator();
activator.run().catch(console.error);
