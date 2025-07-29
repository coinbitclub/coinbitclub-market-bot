/**
 * 🎯 CADASTRO RÁPIDO - USUÁRIOS PARA TESTE REAL
 * 
 * Versão simplificada para cadastro rápido
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function cadastroRapido() {
    try {
        console.log('🚀 CADASTRO RÁPIDO - USUÁRIOS PARA TESTE REAL');
        console.log('='.repeat(50));
        
        // 1. MAURO ALVES (VIP)
        console.log('👤 Cadastrando MAURO ALVES...');
        
        const hashedPassword1 = await bcrypt.hash('M@urovilhoso', 10);
        
        const user1 = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
            ['MAURO ALVES', 'mauroalves150391@gmail.com', hashedPassword1]
        );
        
        const userId1 = user1.rows[0].id;
        console.log(`   ✅ Usuário criado - ID: ${userId1}`);
        
        // Chaves API Mauro
        await pool.query(
            'INSERT INTO user_api_keys (user_id, exchange, api_key, secret_key, environment, is_active) VALUES ($1, $2, $3, $4, $5, true)',
            [userId1, 'bybit-testnet', 'JQVNAD0aCqNqPLvo25', 'rQ1Qle81XBKeL5NrvSIOLqpT60rbZ7wA0dYk', 'testnet']
        );
        console.log('   🔑 Chaves API Bybit Testnet cadastradas');
        
        // Créditos Mauro
        await pool.query(
            'INSERT INTO user_balances (user_id, currency, balance, available_balance) VALUES ($1, $2, $3, $3)',
            [userId1, 'BRL', 4000.00]
        );
        console.log('   💰 R$4.000,00 em créditos adicionados');
        
        // 2. PALOMA AMARAL
        console.log('👤 Cadastrando PALOMA AMARAL...');
        
        const hashedPassword2 = await bcrypt.hash('Diogo1520', 10);
        
        const user2 = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
            ['PALOMA AMARAL', 'pamaral15@hotmail.com', hashedPassword2]
        );
        
        const userId2 = user2.rows[0].id;
        console.log(`   ✅ Usuário criado - ID: ${userId2}`);
        
        // Chaves API Paloma
        await pool.query(
            'INSERT INTO user_api_keys (user_id, exchange, api_key, secret_key, environment, is_active) VALUES ($1, $2, $3, $4, $5, true)',
            [userId2, 'bybit', 'AfFEGdxLuYPnSFaXEJ', 'kxCAy7yDenRFKKrHinGfysmP2wknmvRk16Wb', 'production']
        );
        console.log('   🔑 Chaves API Bybit Produção cadastradas');
        
        // Créditos Paloma
        await pool.query(
            'INSERT INTO user_balances (user_id, currency, balance, available_balance) VALUES ($1, $2, $3, $3)',
            [userId2, 'BRL', 500.00]
        );
        console.log('   💰 R$500,00 em créditos adicionados');
        
        console.log('');
        console.log('🎉 CADASTROS CONCLUÍDOS COM SUCESSO!');
        console.log('');
        console.log('📊 RESUMO:');
        console.log('├── 👤 MAURO ALVES (VIP)');
        console.log('│   ├── 🏪 Bybit Testnet');
        console.log('│   ├── 💰 R$4.000,00');
        console.log('│   └── 📱 +55 32 9139-9571');
        console.log('│');
        console.log('└── 👤 PALOMA AMARAL');
        console.log('    ├── 🏪 Bybit Produção');
        console.log('    ├── 💰 R$500,00');
        console.log('    └── 📱 +55 21 98221-8182');
        console.log('');
        console.log('🚀 SISTEMA PRONTO PARA TESTES DE TRADING REAL!');
        
    } catch (error) {
        if (error.code === '23505') {
            console.log('⚠️ Usuários já existem no sistema');
        } else {
            console.error('❌ Erro:', error.message);
        }
    } finally {
        await pool.end();
    }
}

cadastroRapido();
