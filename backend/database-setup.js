/**
 * 🗄️ CONFIGURADOR DE BANCO DE DADOS - POSTGRESQL
 * Script para criar tabelas e configurar o banco corretamente
 */

const { Pool } = require('pg');

class DatabaseSetup {
    constructor() {
        // Configuração de conexão com SSL
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: {
                rejectUnauthorized: false
            }
        });
    }

    async conectar() {
        try {
            console.log('🔌 Testando conexão com PostgreSQL...');
            const client = await this.pool.connect();
            console.log('✅ Conexão estabelecida com sucesso!');
            client.release();
            return true;
        } catch (error) {
            console.error('❌ Erro ao conectar:', error.message);
            return false;
        }
    }

    async criarTabelasCompletas() {
        console.log('\n📋 CRIANDO ESTRUTURA COMPLETA DO BANCO DE DADOS');
        console.log('================================================');

        try {
            // 1. Tabela de usuários
            console.log('👥 Criando/atualizando tabela users...');
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    telegram_chat_id VARCHAR(50),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Adicionar coluna subscription_type se não existir
            try {
                await this.pool.query(`
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50) DEFAULT 'basic'
                `);
            } catch (error) {
                console.log('   ⚠️ Coluna subscription_type já existe ou não pode ser adicionada');
            }

            // 2. Tabela de configurações de usuário
            console.log('⚙️ Criando tabela user_settings...');
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS user_settings (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    trading_enabled BOOLEAN DEFAULT true,
                    risk_level VARCHAR(20) DEFAULT 'medium',
                    max_operations INTEGER DEFAULT 5,
                    bybit_api_key VARCHAR(255),
                    bybit_api_secret VARCHAR(255),
                    telegram_notifications BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 3. Tabela de sinais TradingView
            console.log('📡 Criando tabela signals...');
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS signals (
                    id SERIAL PRIMARY KEY,
                    symbol VARCHAR(20) NOT NULL,
                    action VARCHAR(10) NOT NULL,
                    price DECIMAL(18,8),
                    quantity DECIMAL(18,8),
                    message TEXT,
                    strategy VARCHAR(100),
                    timeframe VARCHAR(10),
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed BOOLEAN DEFAULT false,
                    source VARCHAR(50) DEFAULT 'tradingview'
                )
            `);

            // 4. Tabela de operações em tempo real
            console.log('📊 Criando tabela live_operations...');
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS live_operations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    signal_id INTEGER,
                    symbol VARCHAR(20) NOT NULL,
                    tipo VARCHAR(10) NOT NULL,
                    quantidade DECIMAL(18,8) NOT NULL,
                    preco_entrada DECIMAL(18,8) NOT NULL,
                    preco_saida DECIMAL(18,8),
                    aberta_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    fechada_em TIMESTAMP,
                    status VARCHAR(20) DEFAULT 'ABERTA',
                    pnl DECIMAL(18,8) DEFAULT 0,
                    pnl_atual DECIMAL(18,8) DEFAULT 0,
                    taxa_fees DECIMAL(10,4) DEFAULT 0,
                    exchange VARCHAR(50) DEFAULT 'bybit',
                    order_id VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 5. Tabela de métricas de performance
            console.log('📈 Criando tabela performance_metrics...');
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS performance_metrics (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    data_referencia DATE DEFAULT CURRENT_DATE,
                    operacoes_abertas INTEGER DEFAULT 0,
                    operacoes_fechadas INTEGER DEFAULT 0,
                    operacoes_lucrativas INTEGER DEFAULT 0,
                    operacoes_prejuizo INTEGER DEFAULT 0,
                    taxa_sucesso DECIMAL(5,2) DEFAULT 0,
                    pnl_total DECIMAL(18,8) DEFAULT 0,
                    volume_total DECIMAL(18,8) DEFAULT 0,
                    maior_lucro DECIMAL(18,8) DEFAULT 0,
                    maior_prejuizo DECIMAL(18,8) DEFAULT 0,
                    tempo_medio_operacao INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 6. Tabela de alertas e notificações
            console.log('🔔 Criando tabela alerts...');
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS alerts (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    tipo VARCHAR(50) NOT NULL,
                    titulo VARCHAR(255) NOT NULL,
                    mensagem TEXT NOT NULL,
                    lido BOOLEAN DEFAULT false,
                    enviado_telegram BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 7. Tabela de logs do sistema
            console.log('📝 Criando tabela system_logs...');
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS system_logs (
                    id SERIAL PRIMARY KEY,
                    level VARCHAR(20) NOT NULL,
                    message TEXT NOT NULL,
                    context JSONB,
                    user_id INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            console.log('✅ Todas as tabelas criadas com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao criar tabelas:', error.message);
            throw error;
        }
    }

    async inserirDadosIniciais() {
        console.log('\n🌱 INSERINDO DADOS INICIAIS');
        console.log('============================');

        try {
            // Inserir usuário padrão
            console.log('👤 Criando usuário padrão...');
            await this.pool.query(`
                INSERT INTO users (email, password_hash, name) 
                VALUES ('admin@coinbitclub.com', '$2b$10$example', 'Admin')
                ON CONFLICT (email) DO NOTHING
            `);

            // Atualizar subscription_type se a coluna existir
            try {
                await this.pool.query(`
                    UPDATE users SET subscription_type = 'premium' 
                    WHERE email = 'admin@coinbitclub.com'
                `);
            } catch (error) {
                console.log('   ⚠️ Não foi possível atualizar subscription_type');
            }

            // Inserir configurações padrão
            console.log('⚙️ Configurando settings padrão...');
            try {
                await this.pool.query(`
                    INSERT INTO user_settings (user_id)
                    SELECT id FROM users WHERE email = 'admin@coinbitclub.com'
                    ON CONFLICT DO NOTHING
                `);
            } catch (error) {
                console.log('   ⚠️ Configurações não puderam ser inseridas');
            }

            // Inserir dados de exemplo para demonstração
            console.log('📊 Inserindo operações de exemplo...');
            
            // Algumas operações fechadas para histórico
            const operacoesExemplo = [
                ['BTCUSDT', 'LONG', 0.1, 45000, 46500, 'FECHADA', 150],
                ['ETHUSDT', 'SHORT', 1.0, 3200, 3150, 'FECHADA', 50],
                ['ADAUSDT', 'LONG', 1000, 0.45, 0.48, 'FECHADA', 30],
                ['SOLUSDT', 'SHORT', 10, 85, 82, 'FECHADA', 30],
                ['DOTUSDT', 'LONG', 50, 18, 19.5, 'FECHADA', 75]
            ];

            for (const [symbol, tipo, quantidade, entrada, saida, status, pnl] of operacoesExemplo) {
                await this.pool.query(`
                    INSERT INTO live_operations 
                    (user_id, symbol, tipo, quantidade, preco_entrada, preco_saida, 
                     aberta_em, fechada_em, status, pnl)
                    VALUES 
                    (1, $1, $2, $3, $4, $5, 
                     NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', $6, $7)
                `, [symbol, tipo, quantidade, entrada, saida, status, pnl]);
            }

            // Algumas operações abertas
            const operacoesAbertas = [
                ['BTCUSDT', 'LONG', 0.05, 47000],
                ['ETHUSDT', 'SHORT', 0.5, 3300],
                ['LINKUSDT', 'LONG', 20, 14.5]
            ];

            for (const [symbol, tipo, quantidade, entrada] of operacoesAbertas) {
                await this.pool.query(`
                    INSERT INTO live_operations 
                    (user_id, symbol, tipo, quantidade, preco_entrada, aberta_em, status, pnl_atual)
                    VALUES 
                    (1, $1, $2, $3, $4, NOW() - INTERVAL '30 minutes', 'ABERTA', 
                     (RANDOM() - 0.5) * 100)
                `, [symbol, tipo, quantidade, entrada]);
            }

            console.log('✅ Dados iniciais inseridos com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao inserir dados iniciais:', error.message);
            throw error;
        }
    }

    async criarIndices() {
        console.log('\n🔍 CRIANDO ÍNDICES PARA PERFORMANCE');
        console.log('===================================');

        try {
            // Índices importantes para consultas rápidas
            const indices = [
                'CREATE INDEX IF NOT EXISTS idx_live_operations_user_id ON live_operations(user_id)',
                'CREATE INDEX IF NOT EXISTS idx_live_operations_status ON live_operations(status)',
                'CREATE INDEX IF NOT EXISTS idx_live_operations_symbol ON live_operations(symbol)',
                'CREATE INDEX IF NOT EXISTS idx_live_operations_created_at ON live_operations(created_at)',
                'CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id)',
                'CREATE INDEX IF NOT EXISTS idx_performance_metrics_data ON performance_metrics(data_referencia)',
                'CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id)',
                'CREATE INDEX IF NOT EXISTS idx_alerts_lido ON alerts(lido)'
            ];

            for (const index of indices) {
                try {
                    await this.pool.query(index);
                } catch (error) {
                    console.log(`   ⚠️ Aviso ao criar índice: ${error.message.substring(0, 50)}...`);
                }
            }

            // Tentar criar índices específicos da tabela signals se ela tiver as colunas
            try {
                await this.pool.query('CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON signals(timestamp)');
                await this.pool.query('CREATE INDEX IF NOT EXISTS idx_signals_processed ON signals(processed)');
            } catch (error) {
                console.log('   ⚠️ Alguns índices da tabela signals não puderam ser criados');
            }

            console.log('✅ Índices criados com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao criar índices:', error.message);
            throw error;
        }
    }

    async verificarEstrutura() {
        console.log('\n🔍 VERIFICANDO ESTRUTURA DO BANCO');
        console.log('=================================');

        try {
            // Listar todas as tabelas
            const result = await this.pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            `);

            console.log('📋 Tabelas encontradas:');
            result.rows.forEach(row => {
                console.log(`   ✓ ${row.table_name}`);
            });

            // Contar registros em tabelas principais
            const contagens = [
                ['users', 'SELECT COUNT(*) FROM users'],
                ['live_operations', 'SELECT COUNT(*) FROM live_operations'],
                ['signals', 'SELECT COUNT(*) FROM signals'],
                ['performance_metrics', 'SELECT COUNT(*) FROM performance_metrics']
            ];

            console.log('\n📊 Registros por tabela:');
            for (const [nome, query] of contagens) {
                try {
                    const result = await this.pool.query(query);
                    console.log(`   ${nome}: ${result.rows[0].count} registros`);
                } catch (error) {
                    console.log(`   ${nome}: Tabela não encontrada`);
                }
            }

        } catch (error) {
            console.error('❌ Erro ao verificar estrutura:', error.message);
        }
    }

    async executarSetupCompleto() {
        console.log('🚀 INICIANDO CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS');
        console.log('====================================================');

        try {
            // 1. Testar conexão
            const conectado = await this.conectar();
            if (!conectado) {
                throw new Error('Não foi possível conectar ao banco');
            }

            // 2. Criar tabelas
            await this.criarTabelasCompletas();

            // 3. Criar índices
            await this.criarIndices();

            // 4. Inserir dados iniciais
            await this.inserirDadosIniciais();

            // 5. Verificar estrutura
            await this.verificarEstrutura();

            console.log('\n🎉 CONFIGURAÇÃO DO BANCO CONCLUÍDA COM SUCESSO!');
            console.log('================================================');
            console.log('✅ Estrutura criada');
            console.log('✅ Índices otimizados');
            console.log('✅ Dados de exemplo inseridos');
            console.log('✅ Sistema pronto para uso');

        } catch (error) {
            console.error('\n❌ ERRO NA CONFIGURAÇÃO:', error.message);
            throw error;
        } finally {
            await this.pool.end();
        }
    }
}

// Executar setup se chamado diretamente
if (require.main === module) {
    const setup = new DatabaseSetup();
    setup.executarSetupCompleto()
        .then(() => {
            console.log('\n✅ Setup finalizado com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Setup falhou:', error.message);
            process.exit(1);
        });
}

module.exports = DatabaseSetup;
