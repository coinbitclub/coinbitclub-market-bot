#!/usr/bin/env node

/**
 * 🔍 VERIFICADOR DE CHAVES DOS USUÁRIOS
 * =====================================
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarChaves() {
    try {
        console.log('🔍 VERIFICANDO CHAVES DOS USUÁRIOS');
        console.log('==================================');

        const chaves = await pool.query(`
            SELECT 
                id, 
                user_id, 
                exchange, 
                environment,
                api_key_encrypted,
                secret_key_encrypted,
                api_key,
                secret_key,
                is_active,
                last_validated
            FROM user_api_keys 
            WHERE is_active = true
            ORDER BY user_id, exchange
        `);

        console.log(`✅ Encontradas ${chaves.rows.length} chaves ativas:`);
        console.log('');

        for (const chave of chaves.rows) {
            console.log(`🔑 ID ${chave.id}: User ${chave.user_id}`);
            console.log(`   📊 Exchange: ${chave.exchange} ${chave.environment}`);
            console.log(`   🔐 API Key: ${chave.api_key_encrypted ? 'CRIPTOGRAFADA' : (chave.api_key ? 'PRESENTE' : 'AUSENTE')}`);
            console.log(`   🗝️ Secret: ${chave.secret_key_encrypted ? 'CRIPTOGRAFADA' : (chave.secret_key ? 'PRESENTE' : 'AUSENTE')}`);
            console.log(`   🕐 Última validação: ${chave.last_validated || 'Nunca'}`);
            console.log('');
        }

        // Verificar usuários
        const usuarios = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.email,
                COUNT(uak.id) as total_chaves
            FROM users u
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id AND uak.is_active = true
            WHERE u.is_active = true
            GROUP BY u.id, u.username, u.email
            HAVING COUNT(uak.id) > 0
            ORDER BY u.id
        `);

        console.log('👥 USUÁRIOS COM CHAVES:');
        console.log('======================');

        for (const user of usuarios.rows) {
            console.log(`👤 ID ${user.id}: ${user.username}`);
            console.log(`   📧 ${user.email}`);
            console.log(`   🔑 ${user.total_chaves} chaves ativas`);
            console.log('');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarChaves();
