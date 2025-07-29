/**
 * 🗄️ CRIAR ESTRUTURA DO BANCO DE DADOS PARA SISTEMA MULTI-USUÁRIO
 * Script para criar todas as tabelas necessárias no PostgreSQL Railway
 */

const { Pool } = require('pg');

console.log('🗄️ CRIAÇÃO DA ESTRUTURA DO BANCO DE DADOS');
console.log('=========================================');

async function criarEstruturaBanco() {
    // Conexão com PostgreSQL Railway
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
        console.log('🔗 Conectado ao PostgreSQL Railway');
        console.log('🚀 Criando estrutura do banco de dados...');
        console.log('');

        // ========================================
        // 1. TABELA DE USUÁRIOS
        // ========================================
        console.log('👥 Criando tabela USERS...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255),
                role VARCHAR(50) DEFAULT 'trader',
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                preferences JSONB DEFAULT '{}',
                
                CONSTRAINT valid_role CHECK (role IN ('admin', 'trader', 'viewer')),
                CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended'))
            );
        `);
        
        console.log('✅ Tabela USERS criada');

        // ========================================
        // 2. TABELA DE CHAVES API
        // ========================================
        console.log('🔐 Criando tabela USER_API_KEYS...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_api_keys (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                exchange_name VARCHAR(50) NOT NULL,
                api_key_encrypted TEXT NOT NULL,
                api_secret_encrypted TEXT NOT NULL,
                passphrase_encrypted TEXT,
                testnet BOOLEAN DEFAULT false,
                status VARCHAR(20) DEFAULT 'active',
                permissions JSONB DEFAULT '[]',
                last_validated TIMESTAMP,
                balance_info JSONB DEFAULT '{}',
                exchange_info JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                UNIQUE(user_id, exchange_name),
                CONSTRAINT valid_exchange CHECK (exchange_name IN ('binance', 'bybit', 'okx', 'kraken', 'coinbase')),
                CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'expired', 'invalid'))
            );
        `);
        
        console.log('✅ Tabela USER_API_KEYS criada');

        // ========================================
        // 3. TABELA DE PARAMETRIZAÇÕES
        // ========================================
        console.log('⚙️ Criando tabela USER_TRADING_PARAMS...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_trading_params (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                parameters JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                UNIQUE(user_id)
            );
        `);
        
        console.log('✅ Tabela USER_TRADING_PARAMS criada');

        // ========================================
        // 4. TABELA DE SALDOS
        // ========================================
        console.log('💰 Criando tabela USER_BALANCES...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_balances (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                exchange_name VARCHAR(50) NOT NULL,
                asset VARCHAR(20) NOT NULL,
                free_balance DECIMAL(20,8) DEFAULT 0,
                locked_balance DECIMAL(20,8) DEFAULT 0,
                total_balance DECIMAL(20,8) GENERATED ALWAYS AS (free_balance + locked_balance) STORED,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                UNIQUE(user_id, exchange_name, asset),
                CONSTRAINT positive_balance CHECK (free_balance >= 0 AND locked_balance >= 0)
            );
        `);
        
        console.log('✅ Tabela USER_BALANCES criada');

        // ========================================
        // 5. TABELA DE OPERAÇÕES DO ROBÔ
        // ========================================
        console.log('🤖 Criando tabela ROBOT_OPERATIONS...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS robot_operations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                exchange_name VARCHAR(50) NOT NULL,
                symbol VARCHAR(20) NOT NULL,
                operation_type VARCHAR(20) NOT NULL,
                side VARCHAR(10) NOT NULL DEFAULT 'BUY',
                amount DECIMAL(20,8) NOT NULL,
                leverage INTEGER DEFAULT 1,
                entry_price DECIMAL(20,8),
                exit_price DECIMAL(20,8),
                take_profit DECIMAL(20,8),
                stop_loss DECIMAL(20,8),
                status VARCHAR(20) DEFAULT 'PENDING',
                pnl DECIMAL(20,8) DEFAULT 0,
                fees DECIMAL(20,8) DEFAULT 0,
                parameters_used JSONB DEFAULT '{}',
                api_source VARCHAR(50) DEFAULT 'USER_DATABASE',
                exchange_order_id VARCHAR(100),
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                closed_at TIMESTAMP,
                
                CONSTRAINT valid_operation_type CHECK (operation_type IN ('MARKET', 'LIMIT', 'STOP_MARKET', 'STOP_LIMIT')),
                CONSTRAINT valid_side CHECK (side IN ('BUY', 'SELL')),
                CONSTRAINT valid_status CHECK (status IN ('PENDING', 'OPEN', 'FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED')),
                CONSTRAINT valid_api_source CHECK (api_source IN ('USER_DATABASE', 'RAILWAY_SYSTEM')),
                CONSTRAINT positive_amount CHECK (amount > 0),
                CONSTRAINT valid_leverage CHECK (leverage >= 1 AND leverage <= 100)
            );
        `);
        
        console.log('✅ Tabela ROBOT_OPERATIONS criada');

        // ========================================
        // 6. TABELA DE LOGS DO SISTEMA
        // ========================================
        console.log('📋 Criando tabela SYSTEM_LOGS...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS system_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                level VARCHAR(10) NOT NULL DEFAULT 'INFO',
                category VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT valid_level CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'))
            );
        `);
        
        console.log('✅ Tabela SYSTEM_LOGS criada');

        // ========================================
        // 7. CRIAR ÍNDICES PARA PERFORMANCE
        // ========================================
        console.log('📊 Criando índices para performance...');
        
        // Criar índices individualmente para evitar problemas
        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_exchange ON user_api_keys(user_id, exchange_name);',
            'CREATE INDEX IF NOT EXISTS idx_user_api_keys_status ON user_api_keys(status);',
            'CREATE INDEX IF NOT EXISTS idx_user_balances_user_exchange ON user_balances(user_id, exchange_name);',
            'CREATE INDEX IF NOT EXISTS idx_user_balances_asset ON user_balances(asset);',
            'CREATE INDEX IF NOT EXISTS idx_robot_operations_user_id ON robot_operations(user_id);',
            'CREATE INDEX IF NOT EXISTS idx_robot_operations_status ON robot_operations(status);',
            'CREATE INDEX IF NOT EXISTS idx_robot_operations_created_at ON robot_operations(created_at);',
            'CREATE INDEX IF NOT EXISTS idx_robot_operations_symbol ON robot_operations(symbol);',
            'CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);',
            'CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);',
            'CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);'
        ];
        
        for (const indice of indices) {
            try {
                await client.query(indice);
            } catch (error) {
                console.log(`⚠️ Aviso ao criar índice: ${error.message}`);
            }
        }
        
        console.log('✅ Índices criados');

        // ========================================
        // 8. INSERIR USUÁRIOS DE TESTE
        // ========================================
        console.log('👤 Inserindo usuários de teste...');
        
        await client.query(`
            INSERT INTO users (username, email, role, status) VALUES
            ('paloma', 'paloma@coinbitclub.com', 'admin', 'active'),
            ('luiza', 'luiza@coinbitclub.com', 'trader', 'active'),
            ('teste', 'teste@coinbitclub.com', 'trader', 'active')
            ON CONFLICT (username) DO NOTHING;
        `);
        
        console.log('✅ Usuários de teste inseridos');

        // ========================================
        // 9. VERIFICAR ESTRUTURA CRIADA
        // ========================================
        console.log('🔍 Verificando estrutura criada...');
        
        const tabelas = await client.query(`
            SELECT table_name, column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name IN ('users', 'user_api_keys', 'user_trading_params', 'user_balances', 'robot_operations', 'system_logs')
            ORDER BY table_name, ordinal_position;
        `);
        
        console.log(`✅ ${tabelas.rows.length} colunas verificadas em 6 tabelas`);
        
        // Contar registros por tabela
        const contadores = await client.query(`
            SELECT 
                'users' as tabela, COUNT(*) as registros FROM users
            UNION ALL
            SELECT 
                'user_api_keys' as tabela, COUNT(*) as registros FROM user_api_keys
            UNION ALL
            SELECT 
                'user_trading_params' as tabela, COUNT(*) as registros FROM user_trading_params
            UNION ALL
            SELECT 
                'user_balances' as tabela, COUNT(*) as registros FROM user_balances
            UNION ALL
            SELECT 
                'robot_operations' as tabela, COUNT(*) as registros FROM robot_operations
            UNION ALL
            SELECT 
                'system_logs' as tabela, COUNT(*) as registros FROM system_logs;
        `);
        
        console.log('\n📊 REGISTROS POR TABELA:');
        console.table(contadores.rows);

        console.log('\n🎉 ESTRUTURA DO BANCO CRIADA COM SUCESSO!');
        console.log('=========================================');
        console.log('✅ 6 tabelas criadas (users, user_api_keys, user_trading_params, user_balances, robot_operations, system_logs)');
        console.log('✅ Índices de performance aplicados');
        console.log('✅ Usuários de teste inseridos (paloma, luiza, teste)');
        console.log('✅ Sistema multi-usuário pronto para uso');

    } catch (error) {
        console.error('❌ Erro ao criar estrutura do banco:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// ========================================
// 🚀 EXECUTAR CRIAÇÃO
// ========================================
if (require.main === module) {
    criarEstruturaBanco()
        .then(() => {
            console.log('\n✅ Script executado com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Erro na execução:', error.message);
            process.exit(1);
        });
}

module.exports = { criarEstruturaBanco };
