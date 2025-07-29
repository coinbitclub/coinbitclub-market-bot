/**
 * 🎯 CADASTRO NOVOS USUÁRIOS PARA TESTES EM AMBIENTE REAL
 * 
 * Sistema CoinbitClub MarketBot - Cadastros para Produção
 * Data: 29 de Julho de 2025
 * 
 * USUÁRIOS:
 * 1. MAURO ALVES (VIP) - Bybit Testnet - R$4.000
 * 2. PALOMA AMARAL (Comum) - Bybit Produção - R$500
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

// Dados dos novos usuários
const NOVOS_USUARIOS = {
    mauro: {
        name: 'MAURO ALVES',
        email: 'mauroalves150391@gmail.com',
        phone: '+55 32 9139-9571',
        password: 'M@urovilhoso',
        user_type: 'vip',
        country: 'Brasil',
        initial_credits: 4000.00,
        api_credentials: {
            exchange: 'bybit-testnet',
            api_key: 'JQVNAD0aCqNqPLvo25',
            secret_key: 'rQ1Qle81XBKeL5NrvSIOLqpT60rbZ7wA0dYk',
            environment: 'testnet'
        }
    },
    paloma: {
        name: 'PALOMA AMARAL',
        email: 'pamaral15@hotmail.com',
        phone: '+55 21 98221-8182',
        password: 'Diogo1520',
        user_type: 'comum',
        country: 'Brasil',
        initial_credits: 500.00,
        api_credentials: {
            exchange: 'bybit',
            api_key: 'AfFEGdxLuYPnSFaXEJ',
            secret_key: 'kxCAy7yDenRFKKrHinGfysmP2wknmvRk16Wb',
            environment: 'production'
        }
    }
};

/**
 * Verificar se usuário já existe
 */
async function verificarUsuarioExistente(email) {
    const query = 'SELECT id, email FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
}

/**
 * Cadastrar novo usuário
 */
async function cadastrarUsuario(userData) {
    try {
        console.log(`👤 CADASTRANDO: ${userData.name}`);
        
        // Verificar se já existe
        const usuarioExistente = await verificarUsuarioExistente(userData.email);
        if (usuarioExistente) {
            console.log(`   ⚠️ Usuário já existe: ${userData.email}`);
            return usuarioExistente.id;
        }
        
        // Hash da senha
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Inserir usuário
        const userQuery = `
            INSERT INTO users (
                name, email, password_hash, created_at
            ) VALUES ($1, $2, $3, NOW())
            RETURNING id, name, email;
        `;
        
        const userResult = await pool.query(userQuery, [
            userData.name,
            userData.email,
            hashedPassword
        ]);
        
        const userId = userResult.rows[0].id;
        console.log(`   ✅ Usuário criado - ID: ${userId}`);
        
        return userId;
        
    } catch (error) {
        console.error(`   ❌ Erro ao cadastrar ${userData.name}:`, error.message);
        throw error;
    }
}

/**
 * Cadastrar chaves API
 */
async function cadastrarChavesAPI(userId, userData) {
    try {
        console.log(`🔑 CADASTRANDO CHAVES API: ${userData.name}`);
        
        // Verificar se já existe
        const existingKeyQuery = `
            SELECT id FROM user_api_keys 
            WHERE user_id = $1 AND exchange = $2 AND api_key = $3;
        `;
        
        const existingKey = await pool.query(existingKeyQuery, [
            userId, 
            userData.api_credentials.exchange, 
            userData.api_credentials.api_key
        ]);
        
        if (existingKey.rows.length > 0) {
            console.log(`   ⚠️ Chave API já existe para ${userData.name}`);
            return existingKey.rows[0].id;
        }
        
        // Inserir chave API
        const keyQuery = `
            INSERT INTO user_api_keys (
                user_id, exchange, api_key, secret_key, 
                environment, is_active, created_at
            ) VALUES ($1, $2, $3, $4, $5, true, NOW())
            RETURNING id;
        `;
        
        const keyResult = await pool.query(keyQuery, [
            userId,
            userData.api_credentials.exchange,
            userData.api_credentials.api_key,
            userData.api_credentials.secret_key,
            userData.api_credentials.environment
        ]);
        
        console.log(`   ✅ Chave API criada - Exchange: ${userData.api_credentials.exchange}`);
        console.log(`   📍 Ambiente: ${userData.api_credentials.environment}`);
        console.log(`   🔑 API Key: ${userData.api_credentials.api_key}`);
        
        return keyResult.rows[0].id;
        
    } catch (error) {
        console.error(`   ❌ Erro ao cadastrar chaves API ${userData.name}:`, error.message);
        throw error;
    }
}

/**
 * Adicionar créditos iniciais
 */
async function adicionarCreditos(userId, userData) {
    try {
        console.log(`💰 ADICIONANDO CRÉDITOS: ${userData.name}`);
        
        // Verificar se já tem créditos
        const existingCreditsQuery = `
            SELECT balance FROM user_balances 
            WHERE user_id = $1 AND currency = 'BRL';
        `;
        
        const existingCredits = await pool.query(existingCreditsQuery, [userId]);
        
        if (existingCredits.rows.length > 0) {
            console.log(`   ⚠️ Usuário já possui créditos: R$${existingCredits.rows[0].balance}`);
            return;
        }
        
        // Inserir créditos
        const creditsQuery = `
            INSERT INTO user_balances (
                user_id, currency, balance, available_balance, 
                created_at, updated_at
            ) VALUES ($1, 'BRL', $2, $2, NOW(), NOW());
        `;
        
        await pool.query(creditsQuery, [userId, userData.initial_credits]);
        
        console.log(`   ✅ Créditos adicionados: R$${userData.initial_credits.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
        
    } catch (error) {
        console.error(`   ❌ Erro ao adicionar créditos ${userData.name}:`, error.message);
        throw error;
    }
}

/**
 * Processar todos os cadastros
 */
async function processarCadastros() {
    try {
        console.log('🚀 INICIANDO CADASTROS PARA TESTES EM AMBIENTE REAL');
        console.log('='.repeat(70));
        console.log('📋 Sistema: CoinbitClub MarketBot Multiusuário');
        console.log('📅 Data: 29 de Julho de 2025');
        console.log('🎯 Objetivo: Preparar usuários para testes de produção');
        console.log('');
        
        for (const [key, userData] of Object.entries(NOVOS_USUARIOS)) {
            console.log(`👥 PROCESSANDO USUÁRIO ${key.toUpperCase()}`);
            console.log('-'.repeat(50));
            
            // 1. Cadastrar usuário
            const userId = await cadastrarUsuario(userData);
            
            // 2. Cadastrar chaves API
            await cadastrarChavesAPI(userId, userData);
            
            // 3. Adicionar créditos
            await adicionarCreditos(userId, userData);
            
            console.log(`✅ ${userData.name} - CADASTRO COMPLETO`);
            console.log('');
        }
        
        console.log('🎉 TODOS OS CADASTROS CONCLUÍDOS COM SUCESSO!');
        console.log('');
        console.log('📊 RESUMO DOS CADASTROS:');
        console.log('├── 👤 MAURO ALVES (VIP)');
        console.log('│   ├── 🏪 Exchange: Bybit Testnet');
        console.log('│   ├── 💰 Créditos: R$4.000,00');
        console.log('│   └── 📱 Telefone: +55 32 9139-9571');
        console.log('│');
        console.log('└── 👤 PALOMA AMARAL (Comum)');
        console.log('    ├── 🏪 Exchange: Bybit Produção');
        console.log('    ├── 💰 Créditos: R$500,00');
        console.log('    └── 📱 Telefone: +55 21 98221-8182');
        console.log('');
        console.log('🚀 SISTEMA PRONTO PARA TESTES DE TRADING REAL!');
        
    } catch (error) {
        console.error('❌ ERRO NO PROCESSO DE CADASTROS:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar cadastros
if (require.main === module) {
    processarCadastros()
        .then(() => {
            console.log('✅ Processo finalizado com sucesso');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Processo falhou:', error);
            process.exit(1);
        });
}

module.exports = { processarCadastros, NOVOS_USUARIOS };
