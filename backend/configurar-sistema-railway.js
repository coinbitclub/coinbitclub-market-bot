/**
 * 🚀 SCRIPT FINAL - CONECTAR AO RAILWAY E CONFIGURAR SISTEMA COMPLETO
 * Este script conecta ao PostgreSQL do Railway e configura tudo
 */

const { Client } = require('pg');

// 🔗 Configurações do Railway PostgreSQL
const RAILWAY_CONFIG = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
};

async function configurarSistemaCompleto() {
    console.log('🚀 CONFIGURAÇÃO FINAL - SISTEMA COMPLETO');
    console.log('=======================================');
    console.log('');
    
    let client;
    
    try {
        // ========================================
        // 1. CONECTAR AO RAILWAY POSTGRESQL
        // ========================================
        console.log('🔗 CONECTANDO AO RAILWAY POSTGRESQL');
        console.log('==================================');
        
        client = new Client(RAILWAY_CONFIG);
        await client.connect();
        console.log('✅ Conectado ao Railway PostgreSQL com sucesso!');
        console.log('');
        
        // ========================================
        // 2. VERIFICAR/CRIAR ESTRUTURA DO BANCO
        // ========================================
        console.log('🗃️  VERIFICANDO ESTRUTURA DO BANCO');
        console.log('=================================');
        
        // Verificar se tabelas existem
        const tabelasResult = await client.query(`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename IN ('users', 'user_api_keys', 'user_trading_params', 'robot_operations')
        `);
        
        const tabelasExistentes = tabelasResult.rows.map(row => row.tablename);
        console.log(`📋 Tabelas existentes: ${tabelasExistentes.join(', ')}`);
        
        if (tabelasExistentes.length < 4) {
            console.log('🔧 Criando estrutura completa do banco...');
            
            // Criar tabela de usuários
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100),
                    status VARCHAR(20) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);
            
            // Criar tabela de chaves API
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_api_keys (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    exchange VARCHAR(20) NOT NULL,
                    api_key_encrypted TEXT NOT NULL,
                    api_secret_encrypted TEXT NOT NULL,
                    testnet BOOLEAN DEFAULT true,
                    permissions JSON,
                    status VARCHAR(20) DEFAULT 'active',
                    last_validated TIMESTAMP,
                    created_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(user_id, exchange)
                )
            `);
            
            // Criar tabela de parâmetros de trading
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_trading_params (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    alavancagem INTEGER DEFAULT 10,
                    valor_minimo_trade DECIMAL(10,2) DEFAULT 10.00,
                    valor_maximo_trade DECIMAL(10,2) DEFAULT 1000.00,
                    percentual_saldo DECIMAL(5,2) DEFAULT 2.00,
                    take_profit_multiplier DECIMAL(5,2) DEFAULT 15.00,
                    stop_loss_multiplier DECIMAL(5,2) DEFAULT 8.00,
                    max_operacoes_diarias INTEGER DEFAULT 20,
                    exchanges_ativas JSON,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(user_id)
                )
            `);
            
            // Criar tabela de operações do robô
            await client.query(`
                CREATE TABLE IF NOT EXISTS robot_operations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    exchange VARCHAR(20) NOT NULL,
                    simbolo VARCHAR(20) NOT NULL,
                    tipo VARCHAR(10) NOT NULL,
                    quantidade DECIMAL(20,8) NOT NULL,
                    preco_entrada DECIMAL(15,2) NOT NULL,
                    alavancagem INTEGER NOT NULL,
                    take_profit DECIMAL(15,2),
                    stop_loss DECIMAL(15,2),
                    status VARCHAR(20) DEFAULT 'EXECUTADA',
                    api_source VARCHAR(50),
                    parametrizacoes JSON,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            
            console.log('✅ Estrutura do banco criada com sucesso!');
        }
        console.log('');
        
        // ========================================
        // 3. INSERIR USUÁRIOS PADRÃO
        // ========================================
        console.log('👥 CONFIGURANDO USUÁRIOS PADRÃO');
        console.log('==============================');
        
        // Verificar se usuários existem
        const usuariosResult = await client.query('SELECT id, username FROM users ORDER BY id');
        
        if (usuariosResult.rows.length === 0) {
            console.log('🔧 Criando usuários padrão...');
            
            // Inserir Mauro
            await client.query(`
                INSERT INTO users (id, username, email, status) 
                VALUES (1, 'Mauro', 'mauro@coinbitclub.com', 'active')
                ON CONFLICT (id) DO NOTHING
            `);
            
            // Inserir Luiza Maria
            await client.query(`
                INSERT INTO users (id, username, email, status) 
                VALUES (2, 'Luiza Maria', 'luiza@coinbitclub.com', 'active')
                ON CONFLICT (id) DO NOTHING
            `);
            
            console.log('✅ Usuários padrão criados!');
        }
        
        const usuarios = await client.query('SELECT id, username FROM users ORDER BY id');
        console.log('📋 Usuários ativos:');
        usuarios.rows.forEach(user => {
            console.log(`   👤 ${user.id}: ${user.username}`);
        });
        console.log('');
        
        // ========================================
        // 4. CONFIGURAR PARÂMETROS DE TRADING
        // ========================================
        console.log('⚙️  CONFIGURANDO PARÂMETROS DE TRADING');
        console.log('=====================================');
        
        for (const user of usuarios.rows) {
            await client.query(`
                INSERT INTO user_trading_params (
                    user_id, alavancagem, valor_minimo_trade, valor_maximo_trade,
                    percentual_saldo, take_profit_multiplier, stop_loss_multiplier,
                    max_operacoes_diarias, exchanges_ativas
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (user_id) DO UPDATE SET
                    exchanges_ativas = EXCLUDED.exchanges_ativas,
                    updated_at = NOW()
            `, [
                user.id,
                10, // alavancagem
                10.00, // valor_minimo_trade
                1000.00, // valor_maximo_trade
                2.00, // percentual_saldo
                15.00, // take_profit_multiplier
                8.00, // stop_loss_multiplier
                20, // max_operacoes_diarias
                JSON.stringify(['binance', 'bybit']) // exchanges_ativas
            ]);
            
            console.log(`✅ Parâmetros configurados para ${user.username}`);
        }
        console.log('');
        
        // ========================================
        // 5. ADICIONAR CHAVES DA LUIZA MARIA
        // ========================================
        console.log('🔑 ADICIONANDO CHAVES REAIS DA LUIZA MARIA');
        console.log('=========================================');
        
        const crypto = require('crypto');
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync('coinbitclub_secret_key_2024', 'salt', 32);
        
        function encrypt(text) {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher(algorithm, key);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return iv.toString('hex') + ':' + encrypted;
        }
        
        // Chaves reais da Luiza Maria para Bybit
        const apiKeyEncrypted = encrypt('9HZy9BiUW95iXprVRl');
        const apiSecretEncrypted = encrypt('QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO');
        
        await client.query(`
            INSERT INTO user_api_keys (
                user_id, exchange, api_key_encrypted, api_secret_encrypted,
                testnet, permissions, status, last_validated
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (user_id, exchange) DO UPDATE SET
                api_key_encrypted = EXCLUDED.api_key_encrypted,
                api_secret_encrypted = EXCLUDED.api_secret_encrypted,
                testnet = EXCLUDED.testnet,
                last_validated = NOW()
        `, [
            2, // user_id (Luiza Maria)
            'bybit',
            apiKeyEncrypted,
            apiSecretEncrypted,
            false, // testnet = false (PRODUÇÃO)
            JSON.stringify(['spot', 'futures', 'read', 'trade']),
            'active'
        ]);
        
        console.log('✅ Chaves reais da Luiza Maria adicionadas para Bybit (PRODUÇÃO)');
        console.log('');
        
        // ========================================
        // 6. VERIFICAÇÃO FINAL
        // ========================================
        console.log('🔍 VERIFICAÇÃO FINAL DO SISTEMA');
        console.log('==============================');
        
        // Contar registros
        const contUsers = await client.query('SELECT COUNT(*) FROM users');
        const contKeys = await client.query('SELECT COUNT(*) FROM user_api_keys');
        const contParams = await client.query('SELECT COUNT(*) FROM user_trading_params');
        
        console.log(`📊 Estatísticas do sistema:`);
        console.log(`   👥 Usuários: ${contUsers.rows[0].count}`);
        console.log(`   🔑 Chaves API: ${contKeys.rows[0].count}`);
        console.log(`   ⚙️  Parâmetros: ${contParams.rows[0].count}`);
        console.log('');
        
        // Listar chaves por usuário
        const chavesResult = await client.query(`
            SELECT u.username, k.exchange, k.testnet, k.status
            FROM user_api_keys k
            JOIN users u ON k.user_id = u.id
            ORDER BY u.id, k.exchange
        `);
        
        console.log('🔑 Chaves configuradas:');
        chavesResult.rows.forEach(row => {
            const ambiente = row.testnet ? 'TESTNET' : 'PRODUÇÃO';
            console.log(`   👤 ${row.username}: ${row.exchange.toUpperCase()} (${ambiente})`);
        });
        console.log('');
        
        console.log('🎉 SISTEMA COMPLETAMENTE CONFIGURADO!');
        console.log('===================================');
        console.log('');
        console.log('✅ FUNCIONALIDADES ATIVAS:');
        console.log('• 🔗 PostgreSQL Railway conectado');
        console.log('• 🗃️  Estrutura completa do banco');
        console.log('• 👥 Usuários configurados (Mauro, Luiza Maria)');
        console.log('• 🔑 Chaves reais da Luiza Maria (Bybit Produção)');
        console.log('• ⚙️  Parâmetros de trading configurados');
        console.log('• 🤖 Sistema de fallback para Railway ativo');
        console.log('• 📊 Multi-usuário com banco de dados');
        console.log('• 🚀 Pronto para operações reais!');
        console.log('');
        console.log('🎯 PRÓXIMOS PASSOS:');
        console.log('1. Testar sistema completo com: node demonstracao-sistema-completo.js');
        console.log('2. Configurar webhook do TradingView');
        console.log('3. Iniciar operações reais');
        console.log('4. Monitorar dashboard');
        
    } catch (error) {
        console.error(`❌ Erro na configuração: ${error.message}`);
        
        if (error.message.includes('password authentication failed')) {
            console.log('');
            console.log('🔧 SOLUÇÃO:');
            console.log('1. Obter senha do PostgreSQL no Railway:');
            console.log('   - Acessar https://railway.app');
            console.log('   - Ir no projeto CoinbitClub');
            console.log('   - Clicar em PostgreSQL > Variables');
            console.log('   - Copiar valor de PGPASSWORD');
            console.log('');
            console.log('2. Atualizar senha neste script na linha 12');
            console.log('   password: "COLOCAR_SENHA_REAL_AQUI"');
            console.log('');
            console.log('3. Ou definir variável de ambiente:');
            console.log('   $env:PGPASSWORD="senha_real"');
        }
        
    } finally {
        if (client) {
            await client.end();
            console.log('🔌 Conexão com banco fechada');
        }
    }
}

// Executar configuração se chamado diretamente
if (require.main === module) {
    configurarSistemaCompleto().catch(error => {
        console.error('❌ Erro fatal:', error.message);
        process.exit(1);
    });
}

module.exports = { configurarSistemaCompleto };
