#!/usr/bin/env node

/**
 * 🏗️ COMPLETADOR DE TABELAS - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Criar todas as tabelas faltantes para completar o sistema
 */

const { Pool } = require('pg');

async function completarTabelasFaltantes() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🏗️ COMPLETANDO TODAS AS TABELAS FALTANTES');
        console.log('==========================================');
        
        // 1. Completar colunas faltantes nas tabelas existentes
        await completarColunasAIAnalysis(pool);
        await completarColunasRiskTables(pool);
        
        // 2. Criar tabelas de sistema adicionais
        await criarTabelaConfiguracoes(pool);
        await criarTabelaNotificacoes(pool);
        await criarTabelaAuditoria(pool);
        await criarTabelaBackups(pool);
        await criarTabelaMonitoramento(pool);
        await criarTabelaRelatorios(pool);
        
        // 3. Criar tabelas de trading avançadas
        await criarTabelaStrategies(pool);
        await criarTabelaMarketData(pool);
        await criarTabelaOrderHistory(pool);
        
        // 4. Criar tabelas de usuários avançadas
        await criarTabelaUserPreferences(pool);
        await criarTabelaUserNotifications(pool);
        
        // 5. Verificar e criar índices importantes
        await criarIndicesImportantes(pool);
        
        console.log('==========================================');
        console.log('✅ TODAS AS TABELAS FORAM COMPLETADAS!');
        console.log('🎉 Sistema agora está 100% completo!');

    } catch (error) {
        console.error('❌ Erro ao completar tabelas:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

async function completarColunasAIAnalysis(pool) {
    console.log('📝 Completando tabela ai_analysis...');
    
    await pool.query(`
        ALTER TABLE ai_analysis 
        ADD COLUMN IF NOT EXISTS ai_model VARCHAR(50) DEFAULT 'basic',
        ADD COLUMN IF NOT EXISTS market_conditions JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS user_context JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    `);
    
    console.log('✅ Tabela ai_analysis completada');
}

async function completarColunasRiskTables(pool) {
    console.log('📝 Completando tabelas de risco...');
    
    // Risk alerts
    await pool.query(`
        ALTER TABLE risk_alerts 
        ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS acknowledged_by INTEGER,
        ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS threshold_value DECIMAL(15,4),
        ADD COLUMN IF NOT EXISTS current_value DECIMAL(15,4)
    `);
    
    // User risk profiles - garantir que todas as colunas existam
    await pool.query(`
        ALTER TABLE user_risk_profiles 
        ADD COLUMN IF NOT EXISTS last_risk_assessment TIMESTAMP DEFAULT NOW()
    `);
    
    console.log('✅ Tabelas de risco completadas');
}

async function criarTabelaConfiguracoes(pool) {
    console.log('📝 Criando tabela de configurações...');
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS system_configurations (
            id SERIAL PRIMARY KEY,
            config_key VARCHAR(100) UNIQUE NOT NULL,
            config_value JSONB NOT NULL,
            config_type VARCHAR(50) DEFAULT 'general',
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_system_configurations_key ON system_configurations(config_key);
        CREATE INDEX IF NOT EXISTS idx_system_configurations_type ON system_configurations(config_type);
    `);
    
    // Inserir configurações padrão
    await pool.query(`
        INSERT INTO system_configurations (config_key, config_value, config_type, description) VALUES
        ('trading_enabled', 'true', 'trading', 'Trading system enabled/disabled'),
        ('max_concurrent_operations', '100', 'trading', 'Maximum concurrent trading operations'),
        ('default_leverage', '10', 'trading', 'Default leverage for new users'),
        ('maintenance_mode', 'false', 'system', 'System maintenance mode'),
        ('api_rate_limit', '1000', 'api', 'API requests per minute limit')
        ON CONFLICT (config_key) DO NOTHING
    `);
    
    console.log('✅ Tabela system_configurations criada');
}

async function criarTabelaNotificacoes(pool) {
    console.log('📝 Criando tabela de notificações...');
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            notification_type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            priority VARCHAR(20) DEFAULT 'normal',
            is_read BOOLEAN DEFAULT false,
            data JSONB DEFAULT '{}',
            expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            read_at TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
        CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
    `);
    
    console.log('✅ Tabela notifications criada');
}

async function criarTabelaAuditoria(pool) {
    console.log('📝 Criando tabela de auditoria...');
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(50) NOT NULL,
            resource_id VARCHAR(100),
            old_values JSONB,
            new_values JSONB,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    `);
    
    console.log('✅ Tabela audit_logs criada');
}

async function criarTabelaBackups(pool) {
    console.log('📝 Criando tabela de backups...');
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS system_backups (
            id SERIAL PRIMARY KEY,
            backup_type VARCHAR(50) NOT NULL,
            backup_name VARCHAR(255) NOT NULL,
            file_path TEXT,
            file_size BIGINT,
            tables_included TEXT[],
            status VARCHAR(20) DEFAULT 'pending',
            started_at TIMESTAMP DEFAULT NOW(),
            completed_at TIMESTAMP,
            error_message TEXT,
            created_by INTEGER REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_system_backups_type ON system_backups(backup_type);
        CREATE INDEX IF NOT EXISTS idx_system_backups_status ON system_backups(status);
    `);
    
    console.log('✅ Tabela system_backups criada');
}

async function criarTabelaMonitoramento(pool) {
    console.log('📝 Criando tabela de monitoramento...');
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS system_monitoring (
            id SERIAL PRIMARY KEY,
            metric_name VARCHAR(100) NOT NULL,
            metric_value DECIMAL(20,8) NOT NULL,
            metric_unit VARCHAR(20),
            component VARCHAR(50),
            tags JSONB DEFAULT '{}',
            timestamp TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_system_monitoring_metric ON system_monitoring(metric_name);
        CREATE INDEX IF NOT EXISTS idx_system_monitoring_component ON system_monitoring(component);
        CREATE INDEX IF NOT EXISTS idx_system_monitoring_timestamp ON system_monitoring(timestamp);
    `);
    
    console.log('✅ Tabela system_monitoring criada');
}

async function criarTabelaRelatorios(pool) {
    console.log('📝 Criando tabela de relatórios...');
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS reports (
            id SERIAL PRIMARY KEY,
            report_name VARCHAR(255) NOT NULL,
            report_type VARCHAR(50) NOT NULL,
            report_data JSONB NOT NULL,
            generated_by INTEGER REFERENCES users(id),
            generated_at TIMESTAMP DEFAULT NOW(),
            parameters JSONB DEFAULT '{}',
            file_path TEXT,
            is_scheduled BOOLEAN DEFAULT false,
            schedule_cron VARCHAR(100)
        );

        CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
        CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);
        CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at);
    `);
    
    console.log('✅ Tabela reports criada');
}

async function criarTabelaStrategies(pool) {
    console.log('📝 Criando tabela de estratégias...');
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS trading_strategies (
            id SERIAL PRIMARY KEY,
            strategy_name VARCHAR(255) NOT NULL,
            strategy_type VARCHAR(50) NOT NULL,
            parameters JSONB NOT NULL,
            is_active BOOLEAN DEFAULT true,
            success_rate DECIMAL(5,2) DEFAULT 0,
            total_trades INTEGER DEFAULT 0,
            total_pnl DECIMAL(20,8) DEFAULT 0,
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_trading_strategies_type ON trading_strategies(strategy_type);
        CREATE INDEX IF NOT EXISTS idx_trading_strategies_active ON trading_strategies(is_active);
    `);
    
    console.log('✅ Tabela trading_strategies criada');
}

async function criarTabelaMarketData(pool) {
    console.log('📝 Criando tabela de dados de mercado...');
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS market_data (
            id SERIAL PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            price DECIMAL(20,8) NOT NULL,
            volume DECIMAL(25,8),
            change_24h DECIMAL(10,4),
            high_24h DECIMAL(20,8),
            low_24h DECIMAL(20,8),
            market_cap DECIMAL(25,2),
            timestamp TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
        CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp);
        CREATE INDEX IF NOT EXISTS idx_market_data_symbol_time ON market_data(symbol, timestamp);
    `);
    
    console.log('✅ Tabela market_data criada');
}

async function criarTabelaOrderHistory(pool) {
    console.log('📝 Criando tabela de histórico de ordens...');
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS order_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            exchange_order_id VARCHAR(100),
            symbol VARCHAR(20) NOT NULL,
            side VARCHAR(10) NOT NULL,
            order_type VARCHAR(20) NOT NULL,
            quantity DECIMAL(25,8) NOT NULL,
            price DECIMAL(20,8),
            filled_quantity DECIMAL(25,8) DEFAULT 0,
            average_price DECIMAL(20,8),
            status VARCHAR(20) NOT NULL,
            fee DECIMAL(20,8) DEFAULT 0,
            fee_currency VARCHAR(10),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_order_history_user_id ON order_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_order_history_symbol ON order_history(symbol);
        CREATE INDEX IF NOT EXISTS idx_order_history_status ON order_history(status);
    `);
    
    console.log('✅ Tabela order_history criada');
}

async function criarTabelaUserPreferences(pool) {
    console.log('📝 Criando tabela de preferências do usuário...');
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS user_preferences (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) UNIQUE,
            notifications_enabled BOOLEAN DEFAULT true,
            email_notifications BOOLEAN DEFAULT true,
            sms_notifications BOOLEAN DEFAULT false,
            trading_notifications BOOLEAN DEFAULT true,
            risk_alerts BOOLEAN DEFAULT true,
            preferred_language VARCHAR(10) DEFAULT 'pt',
            timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
            theme VARCHAR(20) DEFAULT 'light',
            dashboard_layout JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
    `);
    
    console.log('✅ Tabela user_preferences criada');
}

async function criarTabelaUserNotifications(pool) {
    console.log('📝 Criando tabela de configurações de notificação...');
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS user_notification_settings (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            notification_type VARCHAR(50) NOT NULL,
            channel VARCHAR(20) NOT NULL,
            is_enabled BOOLEAN DEFAULT true,
            settings JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, notification_type, channel)
        );

        CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id);
    `);
    
    console.log('✅ Tabela user_notification_settings criada');
}

async function criarIndicesImportantes(pool) {
    console.log('📝 Criando índices importantes...');
    
    // Índices para performance
    await pool.query(`
        -- Índices para users
        CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);
        CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);
        CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
        
        -- Índices para trading_operations
        CREATE INDEX IF NOT EXISTS idx_trading_operations_user_symbol ON trading_operations(user_id, symbol);
        CREATE INDEX IF NOT EXISTS idx_trading_operations_status ON trading_operations(status);
        CREATE INDEX IF NOT EXISTS idx_trading_operations_created_at ON trading_operations(created_at);
        
        -- Índices para signals
        CREATE INDEX IF NOT EXISTS idx_signals_symbol_created ON signals(symbol, created_at);
        CREATE INDEX IF NOT EXISTS idx_signals_confidence ON signals(confidence_score);
        
        -- Índices para user_api_keys
        CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON user_api_keys(user_id, is_active);
    `);
    
    console.log('✅ Índices importantes criados');
}

// Executar se chamado diretamente
if (require.main === module) {
    completarTabelasFaltantes()
        .then(() => {
            console.log('🎉 COMPLETAMENTO DE TABELAS CONCLUÍDO!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Falha no completamento:', error.message);
            process.exit(1);
        });
}

module.exports = { completarTabelasFaltantes };
