/**
 * ➕ CADASTRADOR DE CHAVES API - TESTE REAL
 * ========================================
 * 
 * Script para cadastrar chaves API para testes reais
 * IPs autorizados: 131.0.31.147 (Railway) + 132.255.160.131 (atual)
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

class APIKeyManager {
    constructor() {
        this.authorizedIPs = [
            '131.0.31.147',     // Railway
            '132.255.160.131'   // IP atual
        ];
    }

    /**
     * 🏗️ CRIAR ESTRUTURA DE TABELAS SE NÃO EXISTIR
     */
    async createTablesIfNotExists() {
        console.log('🏗️ VERIFICANDO/CRIANDO ESTRUTURA DE TABELAS...');
        console.log('==============================================');

        try {
            // Criar tabela users
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Tabela users verificada/criada');

            // Criar tabela user_api_keys
            await pool.query(`
                CREATE TABLE IF NOT EXISTS user_api_keys (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    exchange VARCHAR(20) NOT NULL,
                    environment VARCHAR(20) NOT NULL,
                    api_key TEXT NOT NULL,
                    secret_key TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT true,
                    validation_status VARCHAR(20) DEFAULT 'PENDING',
                    validation_error TEXT,
                    last_validated_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, exchange, environment)
                )
            `);
            console.log('✅ Tabela user_api_keys verificada/criada');

            // Criar tabela trading_executions
            await pool.query(`
                CREATE TABLE IF NOT EXISTS trading_executions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    exchange VARCHAR(50),
                    order_id VARCHAR(100),
                    symbol VARCHAR(20),
                    side VARCHAR(10),
                    amount DECIMAL(20,8),
                    price DECIMAL(20,8),
                    status VARCHAR(20),
                    error_message TEXT,
                    signal_data JSONB,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Tabela trading_executions verificada/criada');

        } catch (error) {
            console.error('❌ Erro ao criar estrutura:', error.message);
            throw error;
        }
    }

    /**
     * 👤 CRIAR OU BUSCAR USUÁRIO
     */
    async createOrGetUser(username, email) {
        try {
            // Tentar buscar usuário existente
            let user = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
            
            if (user.rows.length > 0) {
                console.log(`👤 Usuário existente encontrado: ${user.rows[0].username}`);
                return user.rows[0];
            }

            // Criar novo usuário
            user = await pool.query(`
                INSERT INTO users (username, email, is_active)
                VALUES ($1, $2, true)
                RETURNING *
            `, [username, email]);

            console.log(`✅ Novo usuário criado: ${username}`);
            return user.rows[0];

        } catch (error) {
            console.error('❌ Erro ao criar/buscar usuário:', error.message);
            throw error;
        }
    }

    /**
     * 🔑 ADICIONAR CHAVE API
     */
    async addAPIKey(userId, exchange, environment, apiKey, secretKey) {
        try {
            // Verificar se já existe
            const existing = await pool.query(`
                SELECT * FROM user_api_keys 
                WHERE user_id = $1 AND exchange = $2 AND environment = $3
            `, [userId, exchange, environment]);

            if (existing.rows.length > 0) {
                // Atualizar existente
                await pool.query(`
                    UPDATE user_api_keys 
                    SET api_key = $1, secret_key = $2, is_active = true, 
                        validation_status = 'PENDING', updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = $3 AND exchange = $4 AND environment = $5
                `, [apiKey, secretKey, userId, exchange, environment]);
                
                console.log(`🔄 Chave atualizada: ${exchange} ${environment}`);
            } else {
                // Criar nova
                await pool.query(`
                    INSERT INTO user_api_keys (user_id, exchange, environment, api_key, secret_key, is_active)
                    VALUES ($1, $2, $3, $4, $5, true)
                `, [userId, exchange, environment, apiKey, secretKey]);
                
                console.log(`✅ Nova chave adicionada: ${exchange} ${environment}`);
            }

        } catch (error) {
            console.error(`❌ Erro ao adicionar chave ${exchange} ${environment}:`, error.message);
            throw error;
        }
    }

    /**
     * 📋 EXEMPLO DE CADASTRO INTERATIVO
     */
    async promptForKeys() {
        console.log('\n📋 CADASTRO INTERATIVO DE CHAVES API');
        console.log('===================================');
        console.log('ℹ️ Este é um exemplo de como cadastrar chaves.');
        console.log('📝 Modifique este script com suas chaves reais.');
        console.log('🔒 IPs autorizados:', this.authorizedIPs.join(', '));

        // Exemplo de usuário
        const username = 'trader01';
        const email = 'trader01@coinbitclub.com';

        console.log(`\n👤 Cadastrando usuário de exemplo: ${username}`);
        const user = await this.createOrGetUser(username, email);

        // Exemplo de chaves (SUBSTITUA PELAS SUAS CHAVES REAIS)
        const exampleKeys = {
            bybit_testnet: {
                api_key: 'SUA_CHAVE_BYBIT_TESTNET_AQUI',
                secret_key: 'SUA_SECRET_BYBIT_TESTNET_AQUI'
            },
            bybit_mainnet: {
                api_key: 'SUA_CHAVE_BYBIT_MAINNET_AQUI',
                secret_key: 'SUA_SECRET_BYBIT_MAINNET_AQUI'
            },
            binance_testnet: {
                api_key: 'SUA_CHAVE_BINANCE_TESTNET_AQUI',
                secret_key: 'SUA_SECRET_BINANCE_TESTNET_AQUI'
            }
        };

        console.log('\n🔑 CHAVES DE EXEMPLO (SUBSTITUA PELAS SUAS):');
        console.log('===========================================');

        for (const [keyType, credentials] of Object.entries(exampleKeys)) {
            const [exchange, environment] = keyType.split('_');
            
            if (credentials.api_key.includes('SUA_CHAVE')) {
                console.log(`⚠️ ${exchange.toUpperCase()} ${environment}: SUBSTITUA PELA SUA CHAVE REAL`);
            } else {
                console.log(`📝 Adicionando ${exchange.toUpperCase()} ${environment}...`);
                await this.addAPIKey(user.id, exchange, environment, credentials.api_key, credentials.secret_key);
            }
        }

        console.log('\n💡 PRÓXIMOS PASSOS:');
        console.log('===================');
        console.log('1. Edite este script com suas chaves reais');
        console.log('2. Configure os IPs nas exchanges:');
        console.log(`   ✅ 131.0.31.147 (Railway - manter)`);
        console.log(`   ➕ 132.255.160.131 (IP atual - adicionar)`);
        console.log('3. Execute o teste: node test-real-connections.js');
    }

    /**
     * 🚀 EXECUTAR SETUP COMPLETO
     */
    async runSetup() {
        try {
            console.log('🚀 INICIANDO SETUP DE CHAVES API...');
            console.log('===================================');

            await this.createTablesIfNotExists();
            await this.promptForKeys();

            console.log('\n✅ SETUP CONCLUÍDO!');
            console.log('==================');

        } catch (error) {
            console.error('❌ Erro no setup:', error.message);
        } finally {
            await pool.end();
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const manager = new APIKeyManager();
    manager.runSetup();
}

module.exports = APIKeyManager;
