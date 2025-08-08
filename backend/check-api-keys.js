#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

async function checkAPIKeys() {
    try {
        console.log('🔍 Verificando chaves API na tabela user_api_keys...');
        
        const result = await pool.query(`
            SELECT u.id, u.username, uak.exchange, 
                   LEFT(uak.api_key, 15) as api_key_preview,
                   LEFT(uak.api_secret, 15) as secret_preview,
                   uak.is_active, uak.environment, uak.validation_status
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.id IN (14, 15, 16)
            ORDER BY u.id, uak.exchange
        `);
        
        console.log('📋 Chaves encontradas:');
        result.rows.forEach(row => {
            console.log(`   👤 Usuário ${row.id} (${row.username}) - ${row.exchange}:`);
            console.log(`      🔑 API Key: ${row.api_key_preview}...`);
            console.log(`      🔐 Secret: ${row.secret_preview}...`);
            console.log(`      ✅ Ativa: ${row.is_active}`);
            console.log(`      🌐 Ambiente: ${row.environment}`);
            console.log(`      📊 Status: ${row.validation_status}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

checkAPIKeys().catch(console.error);
