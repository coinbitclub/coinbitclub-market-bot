const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA...');
        
        const structure = await pool.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'user_api_keys' 
            AND column_name IN ('api_key', 'secret_key')
        `);
        
        console.log('\n📊 ESTRUTURA ATUAL:');
        structure.rows.forEach(col => {
            console.log(`${col.column_name}: ${col.data_type}(${col.character_maximum_length || 'unlimited'})`);
        });
        
        console.log('\n🔍 CHAVES ARMAZENADAS:');
        const keys = await pool.query(`
            SELECT 
                u.name,
                uak.exchange,
                LENGTH(uak.api_key) as api_len,
                LENGTH(uak.secret_key) as secret_len,
                uak.api_key
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.exchange IN ('bybit', 'binance')
        `);
        
        keys.rows.forEach(key => {
            console.log(`${key.name} (${key.exchange}): API=${key.api_len} chars, Secret=${key.secret_len} chars`);
            console.log(`  API Key: ${key.api_key}`);
        });
        
    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await pool.end();
    }
})();
