/**
 * 🔍 VERIFICAR E AJUSTAR ESTRUTURA DO BANCO EXISTENTE
 * Script para verificar tabelas existentes e adicionar colunas necessárias
 */

const { Pool } = require('pg');

console.log('🔍 VERIFICAÇÃO E AJUSTE DA ESTRUTURA DO BANCO');
console.log('=============================================');

async function verificarEAjustarEstrutura() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
        console.log('🔗 Conectado ao PostgreSQL Railway');
        console.log('');
        
        // ========================================
        // 1. VERIFICAR TABELAS EXISTENTES
        // ========================================
        console.log('🔍 Verificando tabelas existentes...');
        
        const tabelasExistentes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        console.log('📊 Tabelas encontradas:');
        tabelasExistentes.rows.forEach(row => {
            console.log(`   📋 ${row.table_name}`);
        });
        console.log('');
        
        // ========================================
        // 2. VERIFICAR ESTRUTURA DA TABELA USERS
        // ========================================
        console.log('👥 Verificando estrutura da tabela USERS...');
        
        const colunasUsers = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'users' AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        if (colunasUsers.rows.length > 0) {
            console.log('✅ Tabela USERS existe com colunas:');
            colunasUsers.rows.forEach(col => {
                console.log(`   📝 ${col.column_name} (${col.data_type})`);
            });
            
            // Verificar se precisa adicionar colunas
            const colunasExistentes = colunasUsers.rows.map(row => row.column_name);
            const colunasNecessarias = ['username', 'email', 'role', 'status'];
            
            for (const coluna of colunasNecessarias) {
                if (!colunasExistentes.includes(coluna)) {
                    console.log(`⚙️ Adicionando coluna ${coluna}...`);
                    
                    switch (coluna) {
                        case 'username':
                            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);');
                            break;
                        case 'email':
                            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);');
                            break;
                        case 'role':
                            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT \'trader\';');
                            break;
                        case 'status':
                            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'active\';');
                            break;
                    }
                    console.log(`✅ Coluna ${coluna} adicionada`);
                }
            }
        } else {
            console.log('❌ Tabela USERS não existe, criando...');
            await client.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100),
                    email VARCHAR(255),
                    role VARCHAR(50) DEFAULT 'trader',
                    status VARCHAR(20) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Tabela USERS criada');
        }
        
        console.log('');
        
        // ========================================
        // 3. CRIAR/VERIFICAR TABELA USER_API_KEYS
        // ========================================
        console.log('🔐 Verificando tabela USER_API_KEYS...');
        
        const tabelaApiKeys = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'user_api_keys' AND table_schema = 'public';
        `);
        
        if (tabelaApiKeys.rows.length === 0) {
            console.log('❌ Tabela USER_API_KEYS não existe, criando...');
            await client.query(`
                CREATE TABLE user_api_keys (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
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
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Tabela USER_API_KEYS criada');
        } else {
            console.log('✅ Tabela USER_API_KEYS já existe');
        }
        
        // ========================================
        // 4. CRIAR/VERIFICAR OUTRAS TABELAS
        // ========================================
        console.log('⚙️ Verificando outras tabelas necessárias...');
        
        // Tabela USER_TRADING_PARAMS
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_trading_params (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                parameters JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Tabela USER_BALANCES
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_balances (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                exchange_name VARCHAR(50) NOT NULL,
                asset VARCHAR(20) NOT NULL,
                free_balance DECIMAL(20,8) DEFAULT 0,
                locked_balance DECIMAL(20,8) DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Tabela ROBOT_OPERATIONS
        await client.query(`
            CREATE TABLE IF NOT EXISTS robot_operations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
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
                closed_at TIMESTAMP
            );
        `);
        
        console.log('✅ Todas as tabelas verificadas/criadas');
        
        // ========================================
        // 5. INSERIR USUÁRIOS DE TESTE
        // ========================================
        console.log('👤 Inserindo/atualizando usuários de teste...');
        
        // Verificar se users tem dados
        const usersExistentes = await client.query('SELECT COUNT(*) as total FROM users;');
        console.log(`📊 Usuários existentes: ${usersExistentes.rows[0].total}`);
        
        // Inserir usuários básicos
        await client.query(`
            INSERT INTO users (id, username, email, role, status) VALUES
            (1, 'paloma', 'paloma@coinbitclub.com', 'admin', 'active'),
            (2, 'luiza', 'luiza@coinbitclub.com', 'trader', 'active'),
            (3, 'teste', 'teste@coinbitclub.com', 'trader', 'active')
            ON CONFLICT (id) DO UPDATE SET 
                username = EXCLUDED.username,
                email = EXCLUDED.email,
                role = EXCLUDED.role,
                status = EXCLUDED.status;
        `);
        
        console.log('✅ Usuários de teste inseridos/atualizados');
        
        // ========================================
        // 6. VERIFICAÇÃO FINAL
        // ========================================
        console.log('');
        console.log('🔍 Verificação final da estrutura...');
        
        const verificacaoFinal = await client.query(`
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
                'robot_operations' as tabela, COUNT(*) as registros FROM robot_operations;
        `);
        
        console.log('📊 ESTADO FINAL DAS TABELAS:');
        console.table(verificacaoFinal.rows);
        
        // Verificar usuários criados
        const usuariosCriados = await client.query('SELECT id, username, email, role, status FROM users ORDER BY id;');
        console.log('👥 USUÁRIOS DISPONÍVEIS:');
        console.table(usuariosCriados.rows);
        
        console.log('');
        console.log('🎉 ESTRUTURA DO BANCO AJUSTADA COM SUCESSO!');
        console.log('==========================================');
        console.log('✅ Tabelas verificadas e ajustadas');
        console.log('✅ Usuários de teste disponíveis');
        console.log('✅ Sistema pronto para adicionar chaves API');
        
    } catch (error) {
        console.error('❌ Erro ao ajustar estrutura:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// ========================================
// 🚀 EXECUTAR VERIFICAÇÃO
// ========================================
if (require.main === module) {
    verificarEAjustarEstrutura()
        .then(() => {
            console.log('\n✅ Verificação executada com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Erro na execução:', error.message);
            process.exit(1);
        });
}

module.exports = { verificarEAjustarEstrutura };
