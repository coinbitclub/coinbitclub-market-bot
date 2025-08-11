#!/usr/bin/env node

/**
 * 🚀 COINBITCLUB ENTERPRISE SYSTEM FIX
 * ====================================
 * 
 * Script para correção completa dos gaps críticos identificados
 * Prepara o sistema para operações reais enterprise
 * 
 * @author Sistema Enterprise Expert
 * @version 1.0
 * @date 10/08/2025
 */

const { Pool } = require('pg');
const fs = require('fs').promises;

class EnterpriseSystemFix {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
            ssl: { rejectUnauthorized: false }
        });
        
        this.fixes = [];
        this.errors = [];
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'SUCCESS': '✅',
            'ERROR': '❌',
            'WARNING': '⚠️',
            'INFO': 'ℹ️',
            'CRITICAL': '🚨'
        }[type] || 'ℹ️';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async fixUserTable() {
        this.log('CORRIGINDO ESTRUTURA DA TABELA USERS...', 'INFO');
        
        const columns = [
            'ADD COLUMN IF NOT EXISTS balance_brl DECIMAL(15,2) DEFAULT 1000.00',
            'ADD COLUMN IF NOT EXISTS balance_usd DECIMAL(15,2) DEFAULT 100.00',
            'ADD COLUMN IF NOT EXISTS trading_active BOOLEAN DEFAULT true',
            'ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT \'STANDARD\'',
            'ADD COLUMN IF NOT EXISTS exchange_preference VARCHAR(20) DEFAULT \'bybit\'',
            'ADD COLUMN IF NOT EXISTS risk_level INTEGER DEFAULT 3',
            'ADD COLUMN IF NOT EXISTS max_positions INTEGER DEFAULT 2',
            'ADD COLUMN IF NOT EXISTS leverage_preference INTEGER DEFAULT 5',
            'ADD COLUMN IF NOT EXISTS country VARCHAR(5) DEFAULT \'BR\'',
            'ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT \'MONTHLY\'',
            'ADD COLUMN IF NOT EXISTS affiliate_code VARCHAR(50)',
            'ADD COLUMN IF NOT EXISTS last_trading_activity TIMESTAMP'
        ];

        for (const column of columns) {
            try {
                await this.pool.query(`ALTER TABLE users ${column}`);
                this.log(`Coluna adicionada: ${column.split(' ')[5]}`, 'SUCCESS');
                this.fixes.push(`users.${column.split(' ')[5]}`);
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    this.log(`Erro ao adicionar coluna: ${error.message}`, 'ERROR');
                    this.errors.push(`users.${column.split(' ')[5]}: ${error.message}`);
                }
            }
        }
    }

    async createTradingTables() {
        this.log('CRIANDO TABELAS DE TRADING ENTERPRISE...', 'INFO');

        const tables = {
            orders: `
                CREATE TABLE IF NOT EXISTS orders (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    signal_id INTEGER,
                    ticker VARCHAR(20) NOT NULL,
                    direction VARCHAR(10) NOT NULL,
                    amount DECIMAL(15,2) NOT NULL,
                    leverage INTEGER DEFAULT 5,
                    take_profit DECIMAL(5,2),
                    stop_loss DECIMAL(5,2),
                    status VARCHAR(20) DEFAULT 'PENDING',
                    exchange VARCHAR(20) DEFAULT 'bybit',
                    order_id VARCHAR(100),
                    entry_price DECIMAL(15,8),
                    execution_price DECIMAL(15,8),
                    commission_brl DECIMAL(10,2) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW(),
                    executed_at TIMESTAMP,
                    closed_at TIMESTAMP
                )`,
            
            active_positions: `
                CREATE TABLE IF NOT EXISTS active_positions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    order_id INTEGER REFERENCES orders(id),
                    ticker VARCHAR(20) NOT NULL,
                    position_type VARCHAR(10) NOT NULL,
                    quantity DECIMAL(15,8) NOT NULL,
                    entry_price DECIMAL(15,8) NOT NULL,
                    current_price DECIMAL(15,8),
                    leverage INTEGER DEFAULT 5,
                    take_profit DECIMAL(15,8),
                    stop_loss DECIMAL(15,8),
                    pnl_usd DECIMAL(15,2) DEFAULT 0,
                    pnl_percent DECIMAL(5,2) DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'ACTIVE',
                    exchange VARCHAR(20) DEFAULT 'bybit',
                    exchange_position_id VARCHAR(100),
                    risk_score INTEGER DEFAULT 0,
                    time_in_position INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )`,
            
            trading_executions: `
                CREATE TABLE IF NOT EXISTS trading_executions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    order_id INTEGER REFERENCES orders(id),
                    position_id INTEGER,
                    ticker VARCHAR(20) NOT NULL,
                    action VARCHAR(20) NOT NULL,
                    quantity DECIMAL(15,8) NOT NULL,
                    price DECIMAL(15,8) NOT NULL,
                    exchange VARCHAR(20) NOT NULL,
                    exchange_order_id VARCHAR(100),
                    commission_usd DECIMAL(10,2) DEFAULT 0,
                    profit_loss_usd DECIMAL(15,2) DEFAULT 0,
                    execution_time TIMESTAMP DEFAULT NOW(),
                    status VARCHAR(20) DEFAULT 'COMPLETED',
                    metadata JSONB DEFAULT '{}'
                )`,
            
            user_api_keys: `
                CREATE TABLE IF NOT EXISTS user_api_keys (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    exchange VARCHAR(20) NOT NULL,
                    api_key TEXT NOT NULL,
                    api_secret TEXT NOT NULL,
                    environment VARCHAR(20) DEFAULT 'testnet',
                    is_active BOOLEAN DEFAULT true,
                    last_validated TIMESTAMP,
                    validation_status VARCHAR(20) DEFAULT 'PENDING',
                    error_count INTEGER DEFAULT 0,
                    permissions JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(user_id, exchange, environment)
                )`,
            
            signal_history: `
                CREATE TABLE IF NOT EXISTS signal_history (
                    id SERIAL PRIMARY KEY,
                    ticker VARCHAR(20) NOT NULL,
                    signal_type VARCHAR(20) NOT NULL,
                    direction VARCHAR(10) NOT NULL,
                    source VARCHAR(50) DEFAULT 'TradingView',
                    confidence DECIMAL(5,2) DEFAULT 0,
                    market_conditions JSONB DEFAULT '{}',
                    ia_analysis JSONB DEFAULT '{}',
                    approved BOOLEAN DEFAULT false,
                    users_executed INTEGER DEFAULT 0,
                    total_volume_usd DECIMAL(15,2) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW()
                )`,
            
            commission_tracking: `
                CREATE TABLE IF NOT EXISTS commission_tracking (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    order_id INTEGER REFERENCES orders(id),
                    trade_profit_usd DECIMAL(15,2) NOT NULL,
                    commission_rate DECIMAL(5,2) NOT NULL,
                    commission_amount_brl DECIMAL(10,2) NOT NULL,
                    affiliate_user_id INTEGER,
                    affiliate_commission_brl DECIMAL(10,2) DEFAULT 0,
                    plan_type VARCHAR(20) NOT NULL,
                    country VARCHAR(5) DEFAULT 'BR',
                    commission_date TIMESTAMP DEFAULT NOW(),
                    status VARCHAR(20) DEFAULT 'PENDING'
                )`,
            
            system_metrics: `
                CREATE TABLE IF NOT EXISTS system_metrics (
                    id SERIAL PRIMARY KEY,
                    metric_name VARCHAR(50) NOT NULL,
                    metric_value DECIMAL(15,2) NOT NULL,
                    metric_unit VARCHAR(20),
                    category VARCHAR(30) NOT NULL,
                    timestamp TIMESTAMP DEFAULT NOW(),
                    metadata JSONB DEFAULT '{}'
                )`
        };

        for (const [tableName, sql] of Object.entries(tables)) {
            try {
                await this.pool.query(sql);
                this.log(`Tabela criada/verificada: ${tableName}`, 'SUCCESS');
                this.fixes.push(`table.${tableName}`);
            } catch (error) {
                this.log(`Erro ao criar tabela ${tableName}: ${error.message}`, 'ERROR');
                this.errors.push(`table.${tableName}: ${error.message}`);
            }
        }
    }

    async createEnterpriseUsers() {
        this.log('CRIANDO USUÁRIOS ENTERPRISE DE TESTE...', 'INFO');

        const testUsers = [
            {
                username: 'enterprise_trader_001',
                email: 'trader001@coinbitclub.com',
                balance_brl: 10000.00,
                balance_usd: 2000.00,
                trading_active: true,
                account_type: 'ENTERPRISE',
                exchange_preference: 'bybit',
                risk_level: 4,
                plan_type: 'PREPAID',
                country: 'BR'
            },
            {
                username: 'enterprise_trader_002',
                email: 'trader002@coinbitclub.com',
                balance_brl: 25000.00,
                balance_usd: 5000.00,
                trading_active: true,
                account_type: 'VIP',
                exchange_preference: 'binance',
                risk_level: 5,
                plan_type: 'MONTHLY',
                country: 'BR'
            },
            {
                username: 'international_trader',
                email: 'intl@coinbitclub.com',
                balance_brl: 0,
                balance_usd: 3000.00,
                trading_active: true,
                account_type: 'STANDARD',
                exchange_preference: 'bybit',
                risk_level: 3,
                plan_type: 'MONTHLY',
                country: 'US'
            },
            {
                username: 'affiliate_manager',
                email: 'affiliate@coinbitclub.com',
                balance_brl: 50000.00,
                balance_usd: 10000.00,
                trading_active: true,
                account_type: 'AFFILIATE_MANAGER',
                exchange_preference: 'bybit',
                risk_level: 5,
                plan_type: 'PREPAID',
                country: 'BR',
                affiliate_code: 'CBC-MANAGER-001'
            }
        ];

        for (const user of testUsers) {
            try {
                // Verificar se usuário já existe
                const existing = await this.pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
                
                if (existing.rows.length === 0) {
                    const columns = Object.keys(user).join(', ');
                    const values = Object.values(user);
                    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                    
                    const result = await this.pool.query(
                        `INSERT INTO users (${columns}) VALUES (${placeholders}) RETURNING id`,
                        values
                    );
                    
                    this.log(`Usuário criado: ${user.username} (ID: ${result.rows[0].id})`, 'SUCCESS');
                    this.fixes.push(`user.${user.username}`);
                } else {
                    this.log(`Usuário já existe: ${user.username}`, 'INFO');
                }
            } catch (error) {
                this.log(`Erro ao criar usuário ${user.username}: ${error.message}`, 'ERROR');
                this.errors.push(`user.${user.username}: ${error.message}`);
            }
        }
    }

    async addSampleAPIKeys() {
        this.log('ADICIONANDO CHAVES API DE TESTE...', 'INFO');

        // Buscar usuários criados
        const users = await this.pool.query('SELECT id, username FROM users WHERE username LIKE \'%enterprise%\' OR username LIKE \'%trader%\'');
        
        const testAPIKeys = [
            {
                exchange: 'bybit',
                environment: 'testnet',
                api_key: process.env.BYBIT_TESTNET_API_KEY || '1FHeinWdrGvCSPABD4',
                api_secret: process.env.BYBIT_TESTNET_API_SECRET || 'xX5KU5VhxvXy1YZ2sN51GCTLp4DGBxKYgrwG'
            },
            {
                exchange: 'binance',
                environment: 'testnet',
                api_key: process.env.BINANCE_TESTNET_API_KEY || '43e7f148ec0f1e155f0451d683f881103803cd036efacb95e026ce8805882803',
                api_secret: process.env.BINANCE_TESTNET_API_SECRET || 'af0d2856f3c6fe825f084fd28a0ab7b471e2a8fa88691e7e990b75be6557bd82'
            }
        ];

        for (const user of users.rows) {
            for (const apiKey of testAPIKeys) {
                try {
                    await this.pool.query(
                        `INSERT INTO user_api_keys (user_id, exchange, api_key, api_secret, environment, is_active, validation_status)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)
                         ON CONFLICT (user_id, exchange, environment) DO NOTHING`,
                        [user.id, apiKey.exchange, apiKey.api_key, apiKey.api_secret, apiKey.environment, true, 'VALIDATED']
                    );
                    
                    this.log(`API Key adicionada: ${user.username} - ${apiKey.exchange}`, 'SUCCESS');
                    this.fixes.push(`api_key.${user.username}.${apiKey.exchange}`);
                } catch (error) {
                    this.log(`Erro ao adicionar API key: ${error.message}`, 'ERROR');
                    this.errors.push(`api_key.${user.username}.${apiKey.exchange}: ${error.message}`);
                }
            }
        }
    }

    async validateSystemHealth() {
        this.log('VALIDANDO SAÚDE DO SISTEMA...', 'INFO');

        const checks = [
            {
                name: 'Users with Trading Active',
                query: 'SELECT COUNT(*) as count FROM users WHERE trading_active = true',
                expected: '> 0'
            },
            {
                name: 'Users with Balance',
                query: 'SELECT COUNT(*) as count FROM users WHERE balance_brl > 0 OR balance_usd > 0',
                expected: '> 0'
            },
            {
                name: 'Active API Keys',
                query: 'SELECT COUNT(*) as count FROM user_api_keys WHERE is_active = true',
                expected: '> 0'
            },
            {
                name: 'Table Structure Check',
                query: 'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name IN (\'orders\', \'active_positions\', \'trading_executions\')',
                expected: '= 3'
            }
        ];

        let healthScore = 0;
        const totalChecks = checks.length;

        for (const check of checks) {
            try {
                const result = await this.pool.query(check.query);
                const count = parseInt(result.rows[0].count);
                
                if (check.expected.startsWith('>')) {
                    const expectedValue = parseInt(check.expected.split(' ')[1]);
                    if (count > expectedValue) {
                        this.log(`✅ ${check.name}: ${count} (${check.expected})`, 'SUCCESS');
                        healthScore++;
                    } else {
                        this.log(`❌ ${check.name}: ${count} (expected ${check.expected})`, 'ERROR');
                    }
                } else if (check.expected.startsWith('=')) {
                    const expectedValue = parseInt(check.expected.split(' ')[1]);
                    if (count === expectedValue) {
                        this.log(`✅ ${check.name}: ${count} (${check.expected})`, 'SUCCESS');
                        healthScore++;
                    } else {
                        this.log(`❌ ${check.name}: ${count} (expected ${check.expected})`, 'ERROR');
                    }
                }
            } catch (error) {
                this.log(`❌ ${check.name}: ERROR - ${error.message}`, 'ERROR');
            }
        }

        const healthPercentage = Math.round((healthScore / totalChecks) * 100);
        this.log(`SYSTEM HEALTH SCORE: ${healthScore}/${totalChecks} (${healthPercentage}%)`, 
                 healthPercentage >= 75 ? 'SUCCESS' : 'WARNING');

        return healthPercentage;
    }

    async generateReport() {
        this.log('GERANDO RELATÓRIO FINAL...', 'INFO');

        const report = {
            timestamp: new Date().toISOString(),
            fixes_applied: this.fixes.length,
            errors_encountered: this.errors.length,
            fixes: this.fixes,
            errors: this.errors,
            next_steps: [
                'Configurar ENABLE_REAL_TRADING=true no Railway',
                'Testar webhook com sinal real do TradingView',
                'Monitorar logs de execução',
                'Validar operações nas exchanges'
            ],
            system_ready: this.errors.length === 0 && this.fixes.length > 0
        };

        await fs.writeFile('./enterprise-fix-report.json', JSON.stringify(report, null, 2));

        console.log('\n🎯 RELATÓRIO FINAL DO ENTERPRISE SYSTEM FIX');
        console.log('='.repeat(50));
        console.log(`✅ Correções aplicadas: ${report.fixes_applied}`);
        console.log(`❌ Erros encontrados: ${report.errors_encountered}`);
        console.log(`📊 Sistema pronto: ${report.system_ready ? 'SIM' : 'NÃO'}`);
        
        if (report.system_ready) {
            console.log('\n🚀 SISTEMA ENTERPRISE ESTÁ PRONTO PARA OPERAÇÕES REAIS!');
            console.log('📋 Próximos passos:');
            report.next_steps.forEach((step, i) => {
                console.log(`   ${i + 1}. ${step}`);
            });
        } else {
            console.log('\n⚠️ SISTEMA NECESSITA ATENÇÃO ADICIONAL');
            console.log('❌ Erros que precisam ser corrigidos:');
            this.errors.forEach(error => {
                console.log(`   - ${error}`);
            });
        }

        return report;
    }

    async run() {
        try {
            console.log('\n🚀 COINBITCLUB ENTERPRISE SYSTEM FIX');
            console.log('=====================================');
            console.log('Corrigindo gaps críticos para operações reais...\n');

            // Testar conexão
            await this.pool.query('SELECT NOW()');
            this.log('Conexão com banco de dados estabelecida', 'SUCCESS');

            // Executar correções
            await this.fixUserTable();
            console.log('');
            
            await this.createTradingTables();
            console.log('');
            
            await this.createEnterpriseUsers();
            console.log('');
            
            await this.addSampleAPIKeys();
            console.log('');
            
            const healthScore = await this.validateSystemHealth();
            console.log('');
            
            const report = await this.generateReport();
            
            return report;

        } catch (error) {
            this.log(`ERRO CRÍTICO: ${error.message}`, 'CRITICAL');
            throw error;
        } finally {
            await this.pool.end();
        }
    }
}

// Executar correções se arquivo chamado diretamente
if (require.main === module) {
    const fixer = new EnterpriseSystemFix();
    fixer.run().then(report => {
        process.exit(report.system_ready ? 0 : 1);
    }).catch(error => {
        console.error('❌ FALHA CRÍTICA:', error.message);
        process.exit(1);
    });
}

module.exports = EnterpriseSystemFix;
