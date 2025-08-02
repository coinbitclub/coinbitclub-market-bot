/**
 * 🧹 LIMPEZA COMPLETA DE DADOS DE TESTE
 * Remove todos os dados mock/teste para trabalhar só com dados reais
 */

const { Client } = require('pg');

const DATABASE_CONFIG = {
    host: 'yamabiko.proxy.rlwy.net',
    port: 32866,
    database: 'railway',
    user: 'postgres',
    password: 'TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS',
    ssl: false,
    connectionTimeoutMillis: 30000
};

class LimpezaDadosTeste {
    constructor() {
        this.client = new Client(DATABASE_CONFIG);
    }

    async conectar() {
        try {
            await this.client.connect();
            console.log('🔗 Conectado ao banco para limpeza de dados');
        } catch (error) {
            console.error('❌ Erro na conexão:', error.message);
            throw error;
        }
    }

    async limparDadosTeste() {
        console.log('🧹 INICIANDO LIMPEZA COMPLETA DE DADOS DE TESTE');
        console.log('=' .repeat(60));

        try {
            await this.conectar();

            // 1. Limpar operações de teste
            console.log('📊 Limpando operações de teste...');
            await this.client.query(`
                DELETE FROM operations 
                WHERE 
                    symbol LIKE '%TEST%' OR 
                    symbol LIKE '%MOCK%' OR
                    amount < 1 OR
                    user_id IN (
                        SELECT id FROM users 
                        WHERE name ILIKE '%test%' OR name ILIKE '%mock%'
                    );
            `);

            // 2. Limpar usuários de teste
            console.log('👥 Limpando usuários de teste...');
            await this.client.query(`
                DELETE FROM users 
                WHERE 
                    name ILIKE '%test%' OR 
                    name ILIKE '%mock%' OR 
                    email ILIKE '%test%' OR
                    email ILIKE '%example%' OR
                    created_at < NOW() - INTERVAL '1 day';
            `);

            // 3. Limpar chaves API de teste
            console.log('🔑 Limpando chaves API de teste...');
            await this.client.query(`
                DELETE FROM api_keys 
                WHERE 
                    exchange_name ILIKE '%test%' OR
                    api_key ILIKE '%test%' OR
                    api_secret ILIKE '%test%' OR
                    created_at < NOW() - INTERVAL '1 day';
            `);

            // 4. Limpar sinais de teste
            console.log('📡 Limpando sinais de teste...');
            await this.client.query(`
                DELETE FROM trading_signals 
                WHERE 
                    symbol ILIKE '%test%' OR
                    created_at < NOW() - INTERVAL '1 day';
            `);

            // 5. Verificar dados restantes
            console.log('📋 Verificando dados após limpeza...');
            const verificacao = await this.verificarDadosLimpos();
            
            console.log('✅ LIMPEZA CONCLUÍDA COM SUCESSO!');
            console.log('=' .repeat(60));
            
            return verificacao;

        } catch (error) {
            console.error('❌ Erro durante a limpeza:', error.message);
            throw error;
        } finally {
            await this.client.end();
        }
    }

    async verificarDadosLimpos() {
        try {
            const queries = {
                users: `SELECT COUNT(*) as total FROM users WHERE is_active = true`,
                operations: `SELECT COUNT(*) as total FROM operations WHERE status IN ('OPEN', 'ACTIVE', 'PENDING')`,
                api_keys: `SELECT COUNT(*) as total FROM api_keys WHERE is_active = true`,
                signals: `SELECT COUNT(*) as total FROM trading_signals WHERE created_at > NOW() - INTERVAL '24 hours'`
            };

            const resultados = {};

            for (const [tabela, query] of Object.entries(queries)) {
                try {
                    const result = await this.client.query(query);
                    resultados[tabela] = parseInt(result.rows[0].total);
                    console.log(`   ${tabela}: ${resultados[tabela]} registros ativos`);
                } catch (error) {
                    console.log(`   ${tabela}: Tabela não existe ou erro - ${error.message}`);
                    resultados[tabela] = 0;
                }
            }

            return resultados;

        } catch (error) {
            console.error('❌ Erro na verificação:', error.message);
            return { error: error.message };
        }
    }

    async criarEstruturaNecessaria() {
        console.log('🏗️ Verificando e criando estrutura necessária...');

        try {
            // Criar tabelas essenciais se não existirem
            const createTables = [
                `CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE,
                    is_active BOOLEAN DEFAULT true,
                    last_login_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )`,
                
                `CREATE TABLE IF NOT EXISTS operations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    symbol VARCHAR(50) NOT NULL,
                    side VARCHAR(10) NOT NULL,
                    amount DECIMAL(20,8) NOT NULL,
                    entry_price DECIMAL(20,8),
                    current_price DECIMAL(20,8),
                    pnl DECIMAL(20,8) DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'OPEN',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )`,
                
                `CREATE TABLE IF NOT EXISTS trading_signals (
                    id SERIAL PRIMARY KEY,
                    symbol VARCHAR(50) NOT NULL,
                    direction VARCHAR(10) NOT NULL,
                    confidence DECIMAL(5,2),
                    price DECIMAL(20,8),
                    indicators JSONB,
                    status VARCHAR(20) DEFAULT 'ACTIVE',
                    created_at TIMESTAMP DEFAULT NOW()
                )`,
                
                `CREATE TABLE IF NOT EXISTS system_metrics (
                    id SERIAL PRIMARY KEY,
                    metric_name VARCHAR(100) NOT NULL,
                    metric_value DECIMAL(20,8),
                    metric_data JSONB,
                    timestamp TIMESTAMP DEFAULT NOW()
                )`
            ];

            for (const sql of createTables) {
                try {
                    await this.client.query(sql);
                    console.log('   ✅ Tabela verificada/criada');
                } catch (error) {
                    console.log(`   ⚠️ Erro na tabela: ${error.message}`);
                }
            }

            console.log('✅ Estrutura verificada!');

        } catch (error) {
            console.error('❌ Erro ao criar estrutura:', error.message);
        }
    }
}

// Executar limpeza
async function executarLimpeza() {
    const limpeza = new LimpezaDadosTeste();
    
    try {
        await limpeza.criarEstruturaNecessaria();
        const resultado = await limpeza.limparDadosTeste();
        
        console.log('🎯 RESULTADO DA LIMPEZA:');
        console.log(JSON.stringify(resultado, null, 2));
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executarLimpeza();
}

module.exports = { LimpezaDadosTeste };
