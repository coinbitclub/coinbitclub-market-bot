const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarECorrigirChaves() {
    try {
        console.log('🔍 VERIFICANDO CHAVES NO BANCO');
        console.log('==============================');
        
        const result = await pool.query(`
            SELECT 
                uak.id,
                u.username,
                uak.exchange,
                uak.environment,
                uak.api_key,
                CASE 
                    WHEN uak.secret_key IS NULL THEN 'NULL'
                    WHEN LENGTH(uak.secret_key) = 0 THEN 'VAZIO'
                    ELSE CONCAT(LENGTH(uak.secret_key), ' chars')
                END as secret_status,
                uak.validation_status
            FROM user_api_keys uak
            JOIN users u ON u.id = uak.user_id
            WHERE uak.is_active = true
            ORDER BY uak.id
        `);
        
        console.log(`📊 Encontradas ${result.rows.length} chaves:`);
        console.log('');
        
        result.rows.forEach(row => {
            console.log(`🔑 ID ${row.id}: ${row.username}`);
            console.log(`   Exchange: ${row.exchange} (${row.environment})`);
            console.log(`   API Key: ${row.api_key ? row.api_key.substring(0, 10) + '...' : 'NULL'}`);
            console.log(`   Secret: ${row.secret_status}`);
            console.log(`   Status: ${row.validation_status || 'SEM STATUS'}`);
            console.log('');
        });
        
        // Corrigir chaves que sabemos que funcionam
        console.log('🔧 CORRIGINDO CHAVES CONHECIDAS...');
        
        // Chave da Erica que sabemos que funciona
        const updateResult = await pool.query(`
            UPDATE user_api_keys 
            SET secret_key = $1
            WHERE id = 7 AND api_key = '2iNeNZQepHJS0lWBkf'
            RETURNING id, api_key
        `, ['ZtmCtREm6CU8CKW68Z6jKOPKcvxTfBIhKJqU']);
        
        if (updateResult.rows.length > 0) {
            console.log('✅ Chave da Erica corrigida com sucesso!');
        } else {
            console.log('⚠️ Nenhuma chave foi atualizada - verificar ID/API Key');
        }
        
        // Verificar após correção
        console.log('\n🔍 VERIFICAÇÃO APÓS CORREÇÃO:');
        const afterCheck = await pool.query(`
            SELECT id, username, api_key, LENGTH(secret_key) as secret_len
            FROM user_api_keys uak
            JOIN users u ON u.id = uak.user_id
            WHERE uak.id = 7
        `);
        
        if (afterCheck.rows.length > 0) {
            const row = afterCheck.rows[0];
            console.log(`🔑 ID ${row.id}: ${row.username}`);
            console.log(`   API Key: ${row.api_key}`);
            console.log(`   Secret length: ${row.secret_len} chars`);
        }
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        await pool.end();
    }
}

verificarECorrigirChaves();
