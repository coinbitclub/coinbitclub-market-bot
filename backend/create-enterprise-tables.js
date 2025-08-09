#!/usr/bin/env node

/**
 * 🗄️ CRIADOR DE TABELAS ENTERPRISE
 * ===============================
 * 
 * Script para criar todas as tabelas necessárias para o sistema enterprise
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

async function createEnterpriseTables() {
    console.log('🗄️ CRIANDO TABELAS ENTERPRISE');
    console.log('=============================');

    try {
        // 1. Criar tabela de conexões de exchange
        console.log('📋 Criando tabela user_exchange_connections...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_exchange_connections (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                exchange VARCHAR(20) NOT NULL,
                environment VARCHAR(20) NOT NULL,
                exchange_name VARCHAR(100),
                api_key_preview VARCHAR(20),
                account_info JSONB,
                connection_config JSONB,
                is_active BOOLEAN DEFAULT true,
                last_validated TIMESTAMPTZ,
                connection_attempts INTEGER DEFAULT 0,
                last_error TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, exchange, environment)
            )
        `);
        console.log('✅ Tabela user_exchange_connections criada');

        // 2. Criar tabela de monitoramento de saldos
        console.log('📋 Criando tabela user_balance_monitoring...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_balance_monitoring (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                exchange VARCHAR(20) NOT NULL,
                environment VARCHAR(20) NOT NULL,
                balance_data JSONB,
                total_balance_usd DECIMAL(15,8),
                last_updated TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, exchange, environment)
            )
        `);
        console.log('✅ Tabela user_balance_monitoring criada');

        // 3. Criar tabela de health das exchanges
        console.log('📋 Criando tabela exchange_health_monitoring...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS exchange_health_monitoring (
                id SERIAL PRIMARY KEY,
                exchange VARCHAR(20) NOT NULL,
                environment VARCHAR(20) NOT NULL,
                status VARCHAR(20) NOT NULL,
                response_time_ms INTEGER,
                error_message TEXT,
                last_check TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(exchange, environment)
            )
        `);
        console.log('✅ Tabela exchange_health_monitoring criada');

        // 4. Criar índices para performance
        console.log('📋 Criando índices...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_user_exchange_connections_active 
            ON user_exchange_connections(user_id, is_active);
            
            CREATE INDEX IF NOT EXISTS idx_user_exchange_connections_exchange 
            ON user_exchange_connections(exchange, environment);
            
            CREATE INDEX IF NOT EXISTS idx_user_balance_monitoring_user 
            ON user_balance_monitoring(user_id);
            
            CREATE INDEX IF NOT EXISTS idx_user_balance_monitoring_exchange 
            ON user_balance_monitoring(exchange, environment);
            
            CREATE INDEX IF NOT EXISTS idx_exchange_health_status 
            ON exchange_health_monitoring(exchange, environment, status);
            
            CREATE INDEX IF NOT EXISTS idx_exchange_health_last_check 
            ON exchange_health_monitoring(last_check);
        `);
        console.log('✅ Índices criados');

        // 5. Criar tabela de logs de operações enterprise
        console.log('📋 Criando tabela enterprise_operation_logs...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS enterprise_operation_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                exchange VARCHAR(20),
                environment VARCHAR(20),
                operation_type VARCHAR(50) NOT NULL,
                operation_data JSONB,
                success BOOLEAN NOT NULL,
                error_message TEXT,
                execution_time_ms INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✅ Tabela enterprise_operation_logs criada');

        // 6. Criar views úteis
        console.log('📋 Criando views...');
        await pool.query(`
            CREATE OR REPLACE VIEW v_user_exchange_summary AS
            SELECT 
                u.id as user_id,
                u.username,
                u.email,
                u.plan_type,
                COUNT(uec.id) as total_connections,
                COUNT(CASE WHEN uec.is_active = true THEN 1 END) as active_connections,
                STRING_AGG(DISTINCT uec.exchange || '_' || uec.environment, ', ') as exchanges,
                MAX(uec.last_validated) as last_validation,
                COALESCE(SUM(ubm.total_balance_usd), 0) as total_balance_usd
            FROM users u
            LEFT JOIN user_exchange_connections uec ON u.id = uec.user_id
            LEFT JOIN user_balance_monitoring ubm ON u.id = ubm.user_id
            WHERE u.is_active = true
            GROUP BY u.id, u.username, u.email, u.plan_type
        `);
        console.log('✅ View v_user_exchange_summary criada');

        await pool.query(`
            CREATE OR REPLACE VIEW v_exchange_health_summary AS
            SELECT 
                exchange,
                environment,
                status,
                response_time_ms,
                error_message,
                last_check,
                CASE 
                    WHEN last_check > NOW() - INTERVAL '5 minutes' THEN 'FRESH'
                    WHEN last_check > NOW() - INTERVAL '30 minutes' THEN 'STALE'
                    ELSE 'OUTDATED'
                END as data_freshness
            FROM exchange_health_monitoring
            ORDER BY exchange, environment
        `);
        console.log('✅ View v_exchange_health_summary criada');

        // 7. Criar trigger para atualizar updated_at automaticamente
        console.log('📋 Criando triggers...');
        await pool.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        await pool.query(`
            DROP TRIGGER IF EXISTS update_user_exchange_connections_updated_at ON user_exchange_connections;
            CREATE TRIGGER update_user_exchange_connections_updated_at 
                BEFORE UPDATE ON user_exchange_connections 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);
        console.log('✅ Triggers criados');

        // 8. Inserir dados iniciais de health
        console.log('📋 Inserindo dados iniciais...');
        await pool.query(`
            INSERT INTO exchange_health_monitoring (exchange, environment, status, last_check)
            VALUES 
                ('BINANCE', 'MAINNET', 'unknown', NOW()),
                ('BINANCE', 'TESTNET', 'unknown', NOW()),
                ('BYBIT', 'MAINNET', 'unknown', NOW()),
                ('BYBIT', 'TESTNET', 'unknown', NOW())
            ON CONFLICT (exchange, environment) DO NOTHING
        `);
        console.log('✅ Dados iniciais inseridos');

        // 9. Verificar estrutura criada
        console.log('\n📊 VERIFICANDO ESTRUTURA CRIADA');
        console.log('==============================');

        const tables = await pool.query(`
            SELECT 
                table_name,
                (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public' 
            AND table_name LIKE '%exchange%' OR table_name LIKE '%balance%' OR table_name LIKE '%enterprise%'
            ORDER BY table_name
        `);

        console.log('📋 Tabelas criadas:');
        for (const table of tables.rows) {
            console.log(`  ✅ ${table.table_name} (${table.column_count} colunas)`);
        }

        const views = await pool.query(`
            SELECT table_name as view_name
            FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name LIKE 'v_%'
            ORDER BY table_name
        `);

        console.log('\n📋 Views criadas:');
        for (const view of views.rows) {
            console.log(`  ✅ ${view.view_name}`);
        }

        const indexes = await pool.query(`
            SELECT indexname
            FROM pg_indexes
            WHERE tablename IN ('user_exchange_connections', 'user_balance_monitoring', 'exchange_health_monitoring')
            ORDER BY indexname
        `);

        console.log('\n📋 Índices criados:');
        for (const index of indexes.rows) {
            console.log(`  ✅ ${index.indexname}`);
        }

        console.log('\n🎉 ESTRUTURA ENTERPRISE CRIADA COM SUCESSO!');
        console.log('✅ Sistema pronto para operações enterprise');

    } catch (error) {
        console.error('❌ Erro ao criar estrutura:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    createEnterpriseTables()
        .then(() => {
            console.log('\n✅ CRIAÇÃO DE TABELAS CONCLUÍDA!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 ERRO:', error.message);
            process.exit(1);
        });
}

module.exports = { createEnterpriseTables };
