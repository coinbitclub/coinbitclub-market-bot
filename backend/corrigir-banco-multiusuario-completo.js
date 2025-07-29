/**
 * 🛠️ CORREÇÃO COMPLETA DO BANCO DE DADOS MULTIUSUÁRIO
 * Análise e correção automática da estrutura do banco para suporte multiusuário
 */

const { Pool } = require('pg');

console.log('🛠️ SISTEMA DE CORREÇÃO AUTOMÁTICA DO BANCO DE DADOS');
console.log('=====================================================');

class CorretorBancoMultiusuario {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
        
        this.correcoes = [];
        this.erros = [];
    }

    async executarCorrecaoCompleta() {
        console.log('🔍 Iniciando análise completa do banco de dados...\n');
        
        const client = await this.pool.connect();
        try {
            // 1. Analisar estrutura atual
            await this.analisarEstruturaAtual(client);
            
            // 2. Corrigir tabela users
            await this.corrigirTabelaUsers(client);
            
            // 3. Corrigir tabela user_api_keys
            await this.corrigirTabelaUserApiKeys(client);
            
            // 4. Corrigir tabela user_trading_params
            await this.corrigirTabelaUserTradingParams(client);
            
            // 5. Corrigir tabela user_balances
            await this.corrigirTabelaUserBalances(client);
            
            // 6. Criar tabelas auxiliares se necessário
            await this.criarTabelasAuxiliares(client);
            
            // 7. Migrar dados existentes
            await this.migrarDadosExistentes(client);
            
            // 8. Criar índices de performance
            await this.criarIndicesPerformance(client);
            
            // 9. Validar integridade final
            await this.validarIntegridadeFinal(client);
            
            // 10. Relatório final
            this.gerarRelatorioFinal();
            
        } catch (error) {
            console.error('❌ Erro durante a correção:', error.message);
            this.erros.push(`Erro geral: ${error.message}`);
        } finally {
            client.release();
            await this.pool.end();
        }
    }

    async analisarEstruturaAtual(client) {
        console.log('📊 1. ANÁLISE DA ESTRUTURA ATUAL');
        console.log('================================');
        
        try {
            // Verificar tabelas existentes
            const tabelas = await client.query(`
                SELECT table_name, table_type 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            `);
            
            console.log('📋 Tabelas encontradas:');
            tabelas.rows.forEach(tabela => {
                console.log(`   • ${tabela.table_name} (${tabela.table_type})`);
            });
            
            // Analisar cada tabela importante
            const tabelasImportantes = ['users', 'user_api_keys', 'user_trading_params', 'user_balances'];
            
            for (const nomeTabela of tabelasImportantes) {
                await this.analisarTabela(client, nomeTabela);
            }
            
        } catch (error) {
            console.error(`❌ Erro na análise: ${error.message}`);
            this.erros.push(`Análise: ${error.message}`);
        }
        
        console.log('\n');
    }

    async analisarTabela(client, nomeTabela) {
        try {
            const colunas = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position;
            `, [nomeTabela]);
            
            if (colunas.rows.length > 0) {
                console.log(`\n🔍 Estrutura da tabela "${nomeTabela}":`);
                colunas.rows.forEach(col => {
                    const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                    const tamanho = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
                    console.log(`   • ${col.column_name}: ${col.data_type}${tamanho} ${nullable}`);
                });
            } else {
                console.log(`⚠️  Tabela "${nomeTabela}" não existe`);
            }
            
        } catch (error) {
            console.log(`❌ Erro ao analisar tabela ${nomeTabela}: ${error.message}`);
        }
    }

    async corrigirTabelaUsers(client) {
        console.log('👤 2. CORREÇÃO DA TABELA USERS');
        console.log('==============================');
        
        try {
            // Verificar se tabela existe
            const existeUsers = await this.verificarTabelaExiste(client, 'users');
            
            if (!existeUsers) {
                console.log('🆕 Criando tabela users...');
                await client.query(`
                    CREATE TABLE users (
                        id SERIAL PRIMARY KEY,
                        username VARCHAR(100) UNIQUE NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        full_name VARCHAR(255),
                        phone VARCHAR(20),
                        role VARCHAR(20) DEFAULT 'USER',
                        status VARCHAR(20) DEFAULT 'ACTIVE',
                        vip_status BOOLEAN DEFAULT FALSE,
                        balance_usd DECIMAL(15,2) DEFAULT 0.00,
                        last_login TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `);
                console.log('✅ Tabela users criada com sucesso');
                this.correcoes.push('Tabela users criada');
            } else {
                console.log('🔧 Atualizando estrutura da tabela users...');
                
                // Adicionar colunas que podem estar faltando
                const colunasEssenciais = [
                    { nome: 'full_name', tipo: 'VARCHAR(255)' },
                    { nome: 'phone', tipo: 'VARCHAR(20)' },
                    { nome: 'role', tipo: 'VARCHAR(20) DEFAULT \'USER\'' },
                    { nome: 'status', tipo: 'VARCHAR(20) DEFAULT \'ACTIVE\'' },
                    { nome: 'vip_status', tipo: 'BOOLEAN DEFAULT FALSE' },
                    { nome: 'balance_usd', tipo: 'DECIMAL(15,2) DEFAULT 0.00' },
                    { nome: 'last_login', tipo: 'TIMESTAMP' },
                    { nome: 'created_at', tipo: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
                    { nome: 'updated_at', tipo: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
                ];
                
                for (const coluna of colunasEssenciais) {
                    await this.adicionarColunaSeNaoExistir(client, 'users', coluna.nome, coluna.tipo);
                }
                
                console.log('✅ Tabela users atualizada');
            }
            
        } catch (error) {
            console.error(`❌ Erro ao corrigir tabela users: ${error.message}`);
            this.erros.push(`Users: ${error.message}`);
        }
        
        console.log('\n');
    }

    async corrigirTabelaUserApiKeys(client) {
        console.log('🔑 3. CORREÇÃO DA TABELA USER_API_KEYS');
        console.log('======================================');
        
        try {
            const existeApiKeys = await this.verificarTabelaExiste(client, 'user_api_keys');
            
            if (!existeApiKeys) {
                console.log('🆕 Criando tabela user_api_keys...');
                await client.query(`
                    CREATE TABLE user_api_keys (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        exchange VARCHAR(50) NOT NULL,
                        api_key VARCHAR(500) NOT NULL,
                        secret_key VARCHAR(500) NOT NULL,
                        passphrase VARCHAR(255),
                        environment VARCHAR(20) DEFAULT 'mainnet',
                        is_active BOOLEAN DEFAULT TRUE,
                        validation_status VARCHAR(20) DEFAULT 'pending',
                        permissions TEXT[],
                        last_validated_at TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, exchange)
                    );
                `);
                console.log('✅ Tabela user_api_keys criada com sucesso');
                this.correcoes.push('Tabela user_api_keys criada');
            } else {
                console.log('🔧 Verificando estrutura da tabela user_api_keys...');
                
                // Verificar e corrigir tipo da coluna user_id se necessário
                const tipoUserId = await this.obterTipoColuna(client, 'user_api_keys', 'user_id');
                if (tipoUserId === 'uuid') {
                    console.log('🔄 Convertendo user_id de UUID para INTEGER...');
                    await this.converterUserIdParaInteger(client, 'user_api_keys');
                }
                
                // Adicionar colunas essenciais
                const colunasEssenciais = [
                    { nome: 'environment', tipo: 'VARCHAR(20) DEFAULT \'mainnet\'' },
                    { nome: 'validation_status', tipo: 'VARCHAR(20) DEFAULT \'pending\'' },
                    { nome: 'permissions', tipo: 'TEXT[]' },
                    { nome: 'last_validated_at', tipo: 'TIMESTAMP' },
                    { nome: 'created_at', tipo: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
                    { nome: 'updated_at', tipo: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
                ];
                
                for (const coluna of colunasEssenciais) {
                    await this.adicionarColunaSeNaoExistir(client, 'user_api_keys', coluna.nome, coluna.tipo);
                }
                
                console.log('✅ Tabela user_api_keys atualizada');
            }
            
        } catch (error) {
            console.error(`❌ Erro ao corrigir tabela user_api_keys: ${error.message}`);
            this.erros.push(`API Keys: ${error.message}`);
        }
        
        console.log('\n');
    }

    async corrigirTabelaUserTradingParams(client) {
        console.log('⚙️ 4. CORREÇÃO DA TABELA USER_TRADING_PARAMS');
        console.log('=============================================');
        
        try {
            const existeParams = await this.verificarTabelaExiste(client, 'user_trading_params');
            
            if (!existeParams) {
                console.log('🆕 Criando tabela user_trading_params...');
                await client.query(`
                    CREATE TABLE user_trading_params (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        alavancagem INTEGER DEFAULT 5,
                        valor_minimo_trade DECIMAL(15,2) DEFAULT 10.00,
                        valor_maximo_trade DECIMAL(15,2) DEFAULT 5000.00,
                        percentual_saldo DECIMAL(5,2) DEFAULT 30.00,
                        take_profit_multiplier DECIMAL(5,2) DEFAULT 3.00,
                        stop_loss_multiplier DECIMAL(5,2) DEFAULT 2.00,
                        max_operacoes_diarias INTEGER DEFAULT 20,
                        exchanges_ativas JSONB DEFAULT '["binance", "bybit"]',
                        risk_level VARCHAR(20) DEFAULT 'MEDIUM',
                        auto_trading BOOLEAN DEFAULT FALSE,
                        notifications_enabled BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id)
                    );
                `);
                console.log('✅ Tabela user_trading_params criada com sucesso');
                this.correcoes.push('Tabela user_trading_params criada');
            } else {
                console.log('🔧 Verificando estrutura da tabela user_trading_params...');
                
                // Verificar e corrigir tipo da coluna user_id se necessário
                const tipoUserId = await this.obterTipoColuna(client, 'user_trading_params', 'user_id');
                if (tipoUserId === 'uuid') {
                    console.log('🔄 Convertendo user_id de UUID para INTEGER...');
                    await this.converterUserIdParaInteger(client, 'user_trading_params');
                }
                
                // Adicionar colunas essenciais
                const colunasEssenciais = [
                    { nome: 'alavancagem', tipo: 'INTEGER DEFAULT 5' },
                    { nome: 'valor_minimo_trade', tipo: 'DECIMAL(15,2) DEFAULT 10.00' },
                    { nome: 'valor_maximo_trade', tipo: 'DECIMAL(15,2) DEFAULT 5000.00' },
                    { nome: 'percentual_saldo', tipo: 'DECIMAL(5,2) DEFAULT 30.00' },
                    { nome: 'take_profit_multiplier', tipo: 'DECIMAL(5,2) DEFAULT 3.00' },
                    { nome: 'stop_loss_multiplier', tipo: 'DECIMAL(5,2) DEFAULT 2.00' },
                    { nome: 'max_operacoes_diarias', tipo: 'INTEGER DEFAULT 20' },
                    { nome: 'exchanges_ativas', tipo: 'JSONB DEFAULT \'["binance", "bybit"]\'' },
                    { nome: 'risk_level', tipo: 'VARCHAR(20) DEFAULT \'MEDIUM\'' },
                    { nome: 'auto_trading', tipo: 'BOOLEAN DEFAULT FALSE' },
                    { nome: 'notifications_enabled', tipo: 'BOOLEAN DEFAULT TRUE' },
                    { nome: 'created_at', tipo: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
                    { nome: 'updated_at', tipo: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
                ];
                
                for (const coluna of colunasEssenciais) {
                    await this.adicionarColunaSeNaoExistir(client, 'user_trading_params', coluna.nome, coluna.tipo);
                }
                
                console.log('✅ Tabela user_trading_params atualizada');
            }
            
        } catch (error) {
            console.error(`❌ Erro ao corrigir tabela user_trading_params: ${error.message}`);
            this.erros.push(`Trading Params: ${error.message}`);
        }
        
        console.log('\n');
    }

    async corrigirTabelaUserBalances(client) {
        console.log('💰 5. CORREÇÃO DA TABELA USER_BALANCES');
        console.log('======================================');
        
        try {
            const existeBalances = await this.verificarTabelaExiste(client, 'user_balances');
            
            if (!existeBalances) {
                console.log('🆕 Criando tabela user_balances...');
                await client.query(`
                    CREATE TABLE user_balances (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        exchange VARCHAR(50) NOT NULL,
                        currency VARCHAR(20) NOT NULL,
                        available_balance DECIMAL(20,8) DEFAULT 0.00000000,
                        locked_balance DECIMAL(20,8) DEFAULT 0.00000000,
                        total_balance DECIMAL(20,8) GENERATED ALWAYS AS (available_balance + locked_balance) STORED,
                        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, exchange, currency)
                    );
                `);
                console.log('✅ Tabela user_balances criada com sucesso');
                this.correcoes.push('Tabela user_balances criada');
            } else {
                console.log('🔧 Verificando estrutura da tabela user_balances...');
                
                // Verificar e corrigir tipo da coluna user_id se necessário
                const tipoUserId = await this.obterTipoColuna(client, 'user_balances', 'user_id');
                if (tipoUserId === 'uuid') {
                    console.log('🔄 Convertendo user_id de UUID para INTEGER...');
                    await this.converterUserIdParaInteger(client, 'user_balances');
                }
                
                // Verificar se existe coluna 'asset' e renomear para 'currency'
                const temAsset = await this.verificarColunaExiste(client, 'user_balances', 'asset');
                const temCurrency = await this.verificarColunaExiste(client, 'user_balances', 'currency');
                
                if (temAsset && !temCurrency) {
                    console.log('🔄 Renomeando coluna "asset" para "currency"...');
                    await client.query(`ALTER TABLE user_balances RENAME COLUMN asset TO currency;`);
                    this.correcoes.push('Coluna asset renomeada para currency');
                }
                
                // Adicionar colunas essenciais
                const colunasEssenciais = [
                    { nome: 'exchange', tipo: 'VARCHAR(50) NOT NULL' },
                    { nome: 'currency', tipo: 'VARCHAR(20) NOT NULL' },
                    { nome: 'available_balance', tipo: 'DECIMAL(20,8) DEFAULT 0.00000000' },
                    { nome: 'locked_balance', tipo: 'DECIMAL(20,8) DEFAULT 0.00000000' },
                    { nome: 'last_updated', tipo: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
                    { nome: 'created_at', tipo: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
                ];
                
                for (const coluna of colunasEssenciais) {
                    await this.adicionarColunaSeNaoExistir(client, 'user_balances', coluna.nome, coluna.tipo);
                }
                
                console.log('✅ Tabela user_balances atualizada');
            }
            
        } catch (error) {
            console.error(`❌ Erro ao corrigir tabela user_balances: ${error.message}`);
            this.erros.push(`User Balances: ${error.message}`);
        }
        
        console.log('\n');
    }

    async criarTabelasAuxiliares(client) {
        console.log('🔧 6. CRIAÇÃO DE TABELAS AUXILIARES');
        console.log('===================================');
        
        try {
            // Tabela de histórico de operações
            const existeOperations = await this.verificarTabelaExiste(client, 'user_operations');
            if (!existeOperations) {
                console.log('📊 Criando tabela user_operations...');
                await client.query(`
                    CREATE TABLE user_operations (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        exchange VARCHAR(50) NOT NULL,
                        symbol VARCHAR(20) NOT NULL,
                        operation_type VARCHAR(20) NOT NULL, -- BUY, SELL
                        quantity DECIMAL(20,8) NOT NULL,
                        price DECIMAL(20,8) NOT NULL,
                        total_amount DECIMAL(20,8) NOT NULL,
                        leverage INTEGER DEFAULT 1,
                        status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, EXECUTED, CANCELLED, FAILED
                        order_id VARCHAR(255),
                        executed_at TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `);
                console.log('✅ Tabela user_operations criada');
                this.correcoes.push('Tabela user_operations criada');
            }
            
            // Tabela de logs do sistema
            const existeLogs = await this.verificarTabelaExiste(client, 'system_logs');
            if (!existeLogs) {
                console.log('📝 Criando tabela system_logs...');
                await client.query(`
                    CREATE TABLE system_logs (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                        log_level VARCHAR(20) NOT NULL, -- INFO, WARNING, ERROR, DEBUG
                        module VARCHAR(100) NOT NULL,
                        message TEXT NOT NULL,
                        metadata JSONB,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `);
                console.log('✅ Tabela system_logs criada');
                this.correcoes.push('Tabela system_logs criada');
            }
            
            // Tabela de sessões de usuário
            const existeSessions = await this.verificarTabelaExiste(client, 'user_sessions');
            if (!existeSessions) {
                console.log('🔐 Criando tabela user_sessions...');
                await client.query(`
                    CREATE TABLE user_sessions (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        session_token VARCHAR(255) UNIQUE NOT NULL,
                        ip_address INET,
                        user_agent TEXT,
                        expires_at TIMESTAMP NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `);
                console.log('✅ Tabela user_sessions criada');
                this.correcoes.push('Tabela user_sessions criada');
            }
            
        } catch (error) {
            console.error(`❌ Erro ao criar tabelas auxiliares: ${error.message}`);
            this.erros.push(`Tabelas auxiliares: ${error.message}`);
        }
        
        console.log('\n');
    }

    async migrarDadosExistentes(client) {
        console.log('🔄 7. MIGRAÇÃO DE DADOS EXISTENTES');
        console.log('==================================');
        
        try {
            // Verificar se existem usuários
            const usuarios = await client.query('SELECT COUNT(*) as count FROM users;');
            console.log(`👤 Usuários existentes: ${usuarios.rows[0].count}`);
            
            if (usuarios.rows[0].count === 0) {
                console.log('🆕 Criando usuário administrador padrão...');
                await client.query(`
                    INSERT INTO users (username, email, password_hash, full_name, role, status, vip_status, balance_usd)
                    VALUES ('admin', 'admin@coinbitclub.com', '$2b$10$defaulthash', 'Administrador', 'ADMIN', 'ACTIVE', true, 10000.00)
                    ON CONFLICT (username) DO NOTHING;
                `);
                
                await client.query(`
                    INSERT INTO users (username, email, password_hash, full_name, role, status, vip_status, balance_usd)
                    VALUES ('erica', 'erica.andrade.santos@hotmail.com', '$2b$10$defaulthash', 'Érica dos Santos Andrade', 'VIP', 'ACTIVE', true, 5000.00)
                    ON CONFLICT (username) DO NOTHING;
                `);
                
                console.log('✅ Usuários padrão criados');
                this.correcoes.push('Usuários padrão criados');
            }
            
            // Criar parâmetros padrão para usuários sem configuração
            const usuariosSemParams = await client.query(`
                SELECT u.id, u.username 
                FROM users u 
                LEFT JOIN user_trading_params utp ON u.id = utp.user_id 
                WHERE utp.user_id IS NULL;
            `);
            
            if (usuariosSemParams.rows.length > 0) {
                console.log(`⚙️ Aplicando parâmetros padrão para ${usuariosSemParams.rows.length} usuários...`);
                
                for (const usuario of usuariosSemParams.rows) {
                    await client.query(`
                        INSERT INTO user_trading_params (
                            user_id, alavancagem, valor_minimo_trade, valor_maximo_trade,
                            percentual_saldo, take_profit_multiplier, stop_loss_multiplier,
                            max_operacoes_diarias, exchanges_ativas
                        ) VALUES ($1, 5, 10.00, 5000.00, 30.00, 3.00, 2.00, 20, '["binance", "bybit"]')
                        ON CONFLICT (user_id) DO NOTHING;
                    `, [usuario.id]);
                }
                
                console.log('✅ Parâmetros padrão aplicados');
                this.correcoes.push('Parâmetros padrão aplicados para usuários');
            }
            
        } catch (error) {
            console.error(`❌ Erro na migração de dados: ${error.message}`);
            this.erros.push(`Migração: ${error.message}`);
        }
        
        console.log('\n');
    }

    async criarIndicesPerformance(client) {
        console.log('🚀 8. CRIAÇÃO DE ÍNDICES DE PERFORMANCE');
        console.log('=======================================');
        
        try {
            const indices = [
                { tabela: 'users', coluna: 'email', nome: 'idx_users_email' },
                { tabela: 'users', coluna: 'username', nome: 'idx_users_username' },
                { tabela: 'users', coluna: 'status', nome: 'idx_users_status' },
                { tabela: 'user_api_keys', coluna: 'user_id', nome: 'idx_api_keys_user_id' },
                { tabela: 'user_api_keys', coluna: 'exchange', nome: 'idx_api_keys_exchange' },
                { tabela: 'user_trading_params', coluna: 'user_id', nome: 'idx_trading_params_user_id' },
                { tabela: 'user_balances', coluna: 'user_id', nome: 'idx_balances_user_id' },
                { tabela: 'user_balances', coluna: 'exchange', nome: 'idx_balances_exchange' },
                { tabela: 'user_balances', coluna: 'currency', nome: 'idx_balances_currency' },
                { tabela: 'user_operations', coluna: 'user_id', nome: 'idx_operations_user_id' },
                { tabela: 'user_operations', coluna: 'exchange', nome: 'idx_operations_exchange' },
                { tabela: 'user_operations', coluna: 'symbol', nome: 'idx_operations_symbol' },
                { tabela: 'system_logs', coluna: 'user_id', nome: 'idx_logs_user_id' },
                { tabela: 'system_logs', coluna: 'log_level', nome: 'idx_logs_level' },
                { tabela: 'user_sessions', coluna: 'user_id', nome: 'idx_sessions_user_id' },
                { tabela: 'user_sessions', coluna: 'session_token', nome: 'idx_sessions_token' }
            ];
            
            for (const indice of indices) {
                try {
                    await client.query(`
                        CREATE INDEX IF NOT EXISTS ${indice.nome} 
                        ON ${indice.tabela} (${indice.coluna});
                    `);
                    console.log(`✅ Índice criado: ${indice.nome}`);
                } catch (error) {
                    console.log(`⚠️  Índice ${indice.nome} já existe ou erro: ${error.message}`);
                }
            }
            
            this.correcoes.push('Índices de performance criados');
            
        } catch (error) {
            console.error(`❌ Erro ao criar índices: ${error.message}`);
            this.erros.push(`Índices: ${error.message}`);
        }
        
        console.log('\n');
    }

    async validarIntegridadeFinal(client) {
        console.log('✅ 9. VALIDAÇÃO DE INTEGRIDADE FINAL');
        console.log('====================================');
        
        try {
            // Verificar foreign keys
            const fks = await client.query(`
                SELECT 
                    tc.table_name, 
                    kcu.column_name, 
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name 
                FROM information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_schema = 'public';
            `);
            
            console.log('🔗 Foreign Keys configuradas:');
            fks.rows.forEach(fk => {
                console.log(`   • ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
            });
            
            // Validar contagem de registros
            const contagens = await client.query(`
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
                    'user_balances' as tabela, COUNT(*) as registros FROM user_balances;
            `);
            
            console.log('\n📊 Contagem de registros:');
            contagens.rows.forEach(count => {
                console.log(`   • ${count.tabela}: ${count.registros} registros`);
            });
            
            console.log('\n✅ Validação de integridade concluída');
            
        } catch (error) {
            console.error(`❌ Erro na validação: ${error.message}`);
            this.erros.push(`Validação: ${error.message}`);
        }
        
        console.log('\n');
    }

    gerarRelatorioFinal() {
        console.log('📋 10. RELATÓRIO FINAL DA CORREÇÃO');
        console.log('==================================');
        
        console.log(`\n✅ CORREÇÕES APLICADAS (${this.correcoes.length}):`);
        this.correcoes.forEach((correcao, index) => {
            console.log(`   ${index + 1}. ${correcao}`);
        });
        
        if (this.erros.length > 0) {
            console.log(`\n❌ ERROS ENCONTRADOS (${this.erros.length}):`);
            this.erros.forEach((erro, index) => {
                console.log(`   ${index + 1}. ${erro}`);
            });
        } else {
            console.log('\n🎉 NENHUM ERRO ENCONTRADO!');
        }
        
        console.log('\n🏁 CORREÇÃO COMPLETA FINALIZADA');
        console.log('O banco de dados está agora configurado para suporte multiusuário!');
        console.log('\n📝 PRÓXIMOS PASSOS RECOMENDADOS:');
        console.log('   1. Testar conexões com o sistema atualizado');
        console.log('   2. Verificar funcionalidades de usuários');
        console.log('   3. Configurar chaves API para usuários');
        console.log('   4. Executar testes de trading');
    }

    // ===============================
    // MÉTODOS AUXILIARES
    // ===============================

    async verificarTabelaExiste(client, nomeTabela) {
        const resultado = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = $1
            );
        `, [nomeTabela]);
        
        return resultado.rows[0].exists;
    }

    async verificarColunaExiste(client, nomeTabela, nomeColuna) {
        const resultado = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = $1 
                AND column_name = $2
            );
        `, [nomeTabela, nomeColuna]);
        
        return resultado.rows[0].exists;
    }

    async obterTipoColuna(client, nomeTabela, nomeColuna) {
        const resultado = await client.query(`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1 
            AND column_name = $2;
        `, [nomeTabela, nomeColuna]);
        
        return resultado.rows[0]?.data_type || null;
    }

    async adicionarColunaSeNaoExistir(client, nomeTabela, nomeColuna, tipoColuna) {
        const existe = await this.verificarColunaExiste(client, nomeTabela, nomeColuna);
        
        if (!existe) {
            try {
                await client.query(`ALTER TABLE ${nomeTabela} ADD COLUMN ${nomeColuna} ${tipoColuna};`);
                console.log(`   ✅ Coluna ${nomeColuna} adicionada à tabela ${nomeTabela}`);
                this.correcoes.push(`Coluna ${nomeColuna} adicionada à ${nomeTabela}`);
            } catch (error) {
                console.log(`   ⚠️  Erro ao adicionar coluna ${nomeColuna}: ${error.message}`);
            }
        } else {
            console.log(`   ℹ️  Coluna ${nomeColuna} já existe em ${nomeTabela}`);
        }
    }

    async converterUserIdParaInteger(client, nomeTabela) {
        try {
            // Primeiro, criar uma nova coluna temporária
            await client.query(`ALTER TABLE ${nomeTabela} ADD COLUMN user_id_temp INTEGER;`);
            
            // Tentar converter os valores existentes
            await client.query(`
                UPDATE ${nomeTabela} 
                SET user_id_temp = CASE 
                    WHEN user_id::text ~ '^[0-9]+$' THEN user_id::text::integer 
                    ELSE NULL 
                END;
            `);
            
            // Remover a coluna antiga
            await client.query(`ALTER TABLE ${nomeTabela} DROP COLUMN user_id;`);
            
            // Renomear a nova coluna
            await client.query(`ALTER TABLE ${nomeTabela} RENAME COLUMN user_id_temp TO user_id;`);
            
            // Adicionar constraint NOT NULL se necessário
            await client.query(`ALTER TABLE ${nomeTabela} ALTER COLUMN user_id SET NOT NULL;`);
            
            // Adicionar foreign key se for para users
            await client.query(`
                ALTER TABLE ${nomeTabela} 
                ADD CONSTRAINT fk_${nomeTabela}_user_id 
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
            `);
            
            console.log(`   ✅ Coluna user_id convertida de UUID para INTEGER na tabela ${nomeTabela}`);
            this.correcoes.push(`user_id convertido para INTEGER na ${nomeTabela}`);
            
        } catch (error) {
            console.log(`   ❌ Erro ao converter user_id na ${nomeTabela}: ${error.message}`);
            this.erros.push(`Conversão ${nomeTabela}: ${error.message}`);
        }
    }
}

// Executar correção se for chamado diretamente
if (require.main === module) {
    const corretor = new CorretorBancoMultiusuario();
    corretor.executarCorrecaoCompleta()
        .then(() => {
            console.log('\n🎯 PROCESSO DE CORREÇÃO FINALIZADO!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 ERRO CRÍTICO:', error.message);
            process.exit(1);
        });
}

module.exports = CorretorBancoMultiusuario;
