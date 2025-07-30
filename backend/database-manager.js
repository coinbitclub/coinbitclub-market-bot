#!/usr/bin/env node

/**
 * 🗄️ GERENCIADOR DE BANCO DE DADOS - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Gerenciador principal do banco de dados Railway PostgreSQL
 * Responsável por conexões, migrações, backups e monitoramento
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class DatabaseManager {
    constructor() {
        this.id = 'database-manager';
        this.nome = 'Gerenciador de Banco de Dados';
        this.tipo = 'core';
        this.status = 'inicializando';
        this.dependencias = [];
        
        // Pool principal Railway
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false },
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.metricas = {
            inicializado_em: null,
            conexoes_ativas: 0,
            total_queries: 0,
            erros_conexao: 0,
            ultima_verificacao: null,
            backup_status: 'pendente'
        };

        this.tabelasEssenciais = [
            'users', 'user_api_keys', 'trading_operations', 'signals',
            'commissions', 'payments', 'ai_analysis', 'system_logs'
        ];
    }

    async inicializar() {
        console.log(`🚀 Inicializando ${this.nome}...`);
        
        try {
            // Testar conexão
            await this.verificarConexao();
            
            // Verificar estrutura essencial
            await this.verificarEstruturaBanco();
            
            // Configurar monitoramento
            await this.configurarMonitoramento();
            
            // Inicializar rotinas de manutenção
            await this.inicializarManutencao();
            
            this.status = 'ativo';
            this.metricas.inicializado_em = new Date();
            
            console.log(`✅ ${this.nome} inicializado com sucesso`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao inicializar ${this.nome}:`, error.message);
            this.status = 'erro';
            this.metricas.erros_conexao++;
            return false;
        }
    }

    async verificarConexao() {
        try {
            const result = await this.pool.query('SELECT NOW() as timestamp, version() as pg_version');
            console.log(`✅ Conexão Railway estabelecida`);
            console.log(`   📅 Timestamp: ${result.rows[0].timestamp}`);
            console.log(`   🗄️ PostgreSQL: ${result.rows[0].pg_version.split(' ')[1]}`);
            return true;
        } catch (error) {
            console.error(`❌ Erro de conexão Railway:`, error.message);
            throw error;
        }
    }

    async verificarEstruturaBanco() {
        console.log('🔍 Verificando estrutura do banco...');
        
        const estruturaFaltante = [];
        
        for (const tabela of this.tabelasEssenciais) {
            try {
                const result = await this.pool.query(`
                    SELECT COUNT(*) as count 
                    FROM information_schema.tables 
                    WHERE table_name = $1 AND table_schema = 'public'
                `, [tabela]);
                
                if (parseInt(result.rows[0].count) === 0) {
                    estruturaFaltante.push(tabela);
                    console.log(`⚠️ Tabela faltante: ${tabela}`);
                } else {
                    console.log(`✅ Tabela encontrada: ${tabela}`);
                }
            } catch (error) {
                console.error(`❌ Erro ao verificar tabela ${tabela}:`, error.message);
                estruturaFaltante.push(tabela);
            }
        }

        if (estruturaFaltante.length > 0) {
            console.log(`⚠️ ${estruturaFaltante.length} tabelas essenciais faltando`);
            await this.criarTabelasFaltantes(estruturaFaltante);
        } else {
            console.log(`✅ Todas as ${this.tabelasEssenciais.length} tabelas essenciais encontradas`);
        }
    }

    async criarTabelasFaltantes(tabelasFaltantes) {
        console.log('🔧 Criando tabelas faltantes...');
        
        const schemas = {
            system_logs: `
                CREATE TABLE IF NOT EXISTS system_logs (
                    id SERIAL PRIMARY KEY,
                    component VARCHAR(100) NOT NULL,
                    level VARCHAR(20) NOT NULL,
                    message TEXT NOT NULL,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT NOW(),
                    user_id INTEGER REFERENCES users(id)
                );
                CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);
                CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
            `
        };

        for (const tabela of tabelasFaltantes) {
            if (schemas[tabela]) {
                try {
                    await this.pool.query(schemas[tabela]);
                    console.log(`✅ Tabela criada: ${tabela}`);
                } catch (error) {
                    console.error(`❌ Erro ao criar tabela ${tabela}:`, error.message);
                }
            } else {
                console.log(`⚠️ Schema não definido para: ${tabela}`);
            }
        }
    }

    async configurarMonitoramento() {
        console.log('📊 Configurando monitoramento de performance...');
        
        // Monitorar conexões ativas
        setInterval(async () => {
            try {
                const result = await this.pool.query(`
                    SELECT count(*) as active_connections 
                    FROM pg_stat_activity 
                    WHERE state = 'active'
                `);
                
                this.metricas.conexoes_ativas = parseInt(result.rows[0].active_connections);
                this.metricas.ultima_verificacao = new Date();
                
            } catch (error) {
                console.error('❌ Erro no monitoramento:', error.message);
                this.metricas.erros_conexao++;
            }
        }, 60000); // A cada 1 minuto
    }

    async inicializarManutencao() {
        console.log('🔧 Inicializando rotinas de manutenção...');
        
        // Backup automático diário
        setInterval(async () => {
            await this.executarBackupAutomatico();
        }, 24 * 60 * 60 * 1000); // A cada 24 horas
        
        // Limpeza de logs antigos semanalmente
        setInterval(async () => {
            await this.limparLogsAntigos();
        }, 7 * 24 * 60 * 60 * 1000); // A cada 7 dias
    }

    async executarQuery(query, params = []) {
        try {
            this.metricas.total_queries++;
            const result = await this.pool.query(query, params);
            return result;
        } catch (error) {
            console.error('❌ Erro na query:', error.message);
            this.metricas.erros_conexao++;
            throw error;
        }
    }

    async criarTabelasEssenciais() {
        console.log('🏗️ Criando/verificando tabelas essenciais...');
        
        const schemas = {
            users: `
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    whatsapp VARCHAR(20),
                    plan_type VARCHAR(50) DEFAULT 'standard',
                    vip_status BOOLEAN DEFAULT false,
                    balance_usd DECIMAL(20,8) DEFAULT 0,
                    commission_rate DECIMAL(5,4) DEFAULT 0.001,
                    affiliate_level VARCHAR(20) DEFAULT 'basic',
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    last_login TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
            `,
            user_api_keys: `
                CREATE TABLE IF NOT EXISTS user_api_keys (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    exchange VARCHAR(50) NOT NULL DEFAULT 'bybit',
                    api_key VARCHAR(255) NOT NULL,
                    api_secret VARCHAR(255) NOT NULL,
                    is_active BOOLEAN DEFAULT true,
                    is_testnet BOOLEAN DEFAULT true,
                    permissions JSONB,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    last_used TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
                CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON user_api_keys(is_active);
            `,
            trading_operations: `
                CREATE TABLE IF NOT EXISTS trading_operations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    symbol VARCHAR(20) NOT NULL,
                    side VARCHAR(10) NOT NULL,
                    quantity DECIMAL(20,8) NOT NULL,
                    price DECIMAL(20,8) NOT NULL,
                    entry_price DECIMAL(20,8),
                    exit_price DECIMAL(20,8),
                    stop_loss DECIMAL(20,8),
                    take_profit DECIMAL(20,8),
                    leverage INTEGER DEFAULT 1,
                    pnl DECIMAL(20,8) DEFAULT 0,
                    current_pnl DECIMAL(20,8) DEFAULT 0,
                    pnl_percentage DECIMAL(8,4) DEFAULT 0,
                    pnl_value DECIMAL(20,8) DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'pending',
                    exchange VARCHAR(50) DEFAULT 'bybit',
                    current_price DECIMAL(20,8),
                    closing_price DECIMAL(20,8),
                    opened_at TIMESTAMP DEFAULT NOW(),
                    closed_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_trading_operations_user_id ON trading_operations(user_id);
                CREATE INDEX IF NOT EXISTS idx_trading_operations_symbol ON trading_operations(symbol);
                CREATE INDEX IF NOT EXISTS idx_trading_operations_status ON trading_operations(status);
            `,
            signals: `
                CREATE TABLE IF NOT EXISTS signals (
                    id SERIAL PRIMARY KEY,
                    symbol VARCHAR(20) NOT NULL,
                    signal_type VARCHAR(20) NOT NULL,
                    entry_price DECIMAL(20,8),
                    stop_loss DECIMAL(20,8),
                    take_profit DECIMAL(20,8),
                    leverage INTEGER DEFAULT 1,
                    confidence_score DECIMAL(5,4),
                    source VARCHAR(100),
                    reasoning TEXT,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT NOW(),
                    processed_at TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);
                CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
            `,
            commissions: `
                CREATE TABLE IF NOT EXISTS commissions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    trade_id INTEGER REFERENCES trading_operations(id),
                    commission_type VARCHAR(50) NOT NULL,
                    amount_usd DECIMAL(20,8) NOT NULL,
                    rate DECIMAL(5,4) NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT NOW(),
                    paid_at TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
                CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
            `,
            payments: `
                CREATE TABLE IF NOT EXISTS payments (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    amount_usd DECIMAL(20,8) NOT NULL,
                    payment_method VARCHAR(50),
                    transaction_id VARCHAR(255),
                    status VARCHAR(20) DEFAULT 'pending',
                    payment_type VARCHAR(50) NOT NULL,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT NOW(),
                    processed_at TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
                CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
            `,
            ai_analysis: `
                CREATE TABLE IF NOT EXISTS ai_analysis (
                    id SERIAL PRIMARY KEY,
                    symbol VARCHAR(20) NOT NULL,
                    analysis_type VARCHAR(50) NOT NULL,
                    input_data JSONB NOT NULL,
                    ai_response JSONB,
                    confidence_score DECIMAL(5,4),
                    recommendation VARCHAR(20),
                    reasoning TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    processed_at TIMESTAMP,
                    model_version VARCHAR(50),
                    execution_time_ms INTEGER
                );
                CREATE INDEX IF NOT EXISTS idx_ai_analysis_symbol ON ai_analysis(symbol);
                CREATE INDEX IF NOT EXISTS idx_ai_analysis_created_at ON ai_analysis(created_at);
            `,
            system_logs: `
                CREATE TABLE IF NOT EXISTS system_logs (
                    id SERIAL PRIMARY KEY,
                    component VARCHAR(100) NOT NULL,
                    level VARCHAR(20) NOT NULL,
                    message TEXT NOT NULL,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT NOW(),
                    user_id INTEGER REFERENCES users(id)
                );
                CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);
                CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
            `
        };

        let tabelasCriadas = 0;
        
        for (const [nomeTabela, schema] of Object.entries(schemas)) {
            try {
                await this.pool.query(schema);
                console.log(`✅ Tabela verificada/criada: ${nomeTabela}`);
                tabelasCriadas++;
            } catch (error) {
                console.error(`❌ Erro ao criar tabela ${nomeTabela}:`, error.message);
            }
        }

        console.log(`✅ ${tabelasCriadas}/${Object.keys(schemas).length} tabelas essenciais criadas/verificadas`);
        return tabelasCriadas === Object.keys(schemas).length;
    }

    async executarBackupAutomatico() {
        console.log('💾 Iniciando backup automático...');
        
        try {
            // Backup das tabelas críticas
            const tabelasCriticas = ['users', 'user_api_keys', 'trading_operations'];
            const backupData = {};
            
            for (const tabela of tabelasCriticas) {
                const result = await this.pool.query(`SELECT * FROM ${tabela}`);
                backupData[tabela] = result.rows;
            }
            
            // Salvar backup em arquivo
            const timestamp = new Date().toISOString().split('T')[0];
            const backupPath = path.join(process.cwd(), `backup_${timestamp}.json`);
            
            await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
            
            this.metricas.backup_status = 'concluído';
            console.log(`✅ Backup salvo: ${backupPath}`);
            
        } catch (error) {
            console.error('❌ Erro no backup:', error.message);
            this.metricas.backup_status = 'erro';
        }
    }

    async limparLogsAntigos() {
        console.log('🧹 Limpando logs antigos...');
        
        try {
            const result = await this.pool.query(`
                DELETE FROM system_logs 
                WHERE created_at < NOW() - INTERVAL '30 days'
            `);
            
            console.log(`✅ ${result.rowCount} logs antigos removidos`);
            
        } catch (error) {
            console.error('❌ Erro na limpeza de logs:', error.message);
        }
    }

    async logarEvento(component, level, message, metadata = {}, userId = null) {
        try {
            await this.pool.query(`
                INSERT INTO system_logs (component, level, message, metadata, user_id)
                VALUES ($1, $2, $3, $4, $5)
            `, [component, level, message, JSON.stringify(metadata), userId]);
            
        } catch (error) {
            console.error('❌ Erro ao logar evento:', error.message);
        }
    }

    obterMetricas() {
        return {
            ...this.metricas,
            pool_status: {
                total_count: this.pool.totalCount,
                idle_count: this.pool.idleCount,
                waiting_count: this.pool.waitingCount
            }
        };
    }

    obterStatus() {
        return {
            id: this.id,
            nome: this.nome,
            tipo: this.tipo,
            status: this.status,
            metricas: this.obterMetricas()
        };
    }

    async finalizar() {
        console.log(`🔄 Finalizando ${this.nome}`);
        this.status = 'finalizado';
        await this.pool.end();
    }
}

// Inicializar se executado diretamente
if (require.main === module) {
    const componente = new DatabaseManager();
    componente.inicializar().catch(console.error);
}

module.exports = DatabaseManager;