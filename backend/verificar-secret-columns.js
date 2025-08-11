const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSecretColumns() {
    const client = await pool.connect();
    
    try {
        // Verificar colunas de secret
        const secretColumns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name LIKE '%secret%'
            ORDER BY column_name
        `);

        console.log('🔑 COLUNAS DE SECRET NA TABELA USERS:');
        secretColumns.rows.forEach(row => {
            console.log(`  ${row.column_name}`);
        });

        // Testar se as colunas existem
        const testQuery = await client.query(`
            SELECT 
                id, username,
                bybit_api_key IS NOT NULL as has_bybit_key,
                bybit_api_secret IS NOT NULL as has_bybit_secret,
                binance_api_key IS NOT NULL as has_binance_key,
                binance_api_secret IS NOT NULL as has_binance_secret
            FROM users 
            WHERE (bybit_api_key IS NOT NULL OR binance_api_key IS NOT NULL)
            AND (ativo = true OR is_active = true)
            LIMIT 5
        `);

        console.log('\n🧪 TESTE DE DISPONIBILIDADE DAS CHAVES:');
        testQuery.rows.forEach(user => {
            console.log(`ID ${user.id} (${user.username}):`);
            console.log(`  Bybit: Key=${user.has_bybit_key}, Secret=${user.has_bybit_secret}`);
            console.log(`  Binance: Key=${user.has_binance_key}, Secret=${user.has_binance_secret}`);
        });

        // Verificar query correta
        console.log('\n🔧 QUERY CORRIGIDA PARA O COLETOR:');
        console.log(`
SELECT id, username, 
       CASE 
           WHEN bybit_api_key IS NOT NULL THEN 'bybit'
           WHEN binance_api_key IS NOT NULL THEN 'binance'
       END as exchange,
       CASE 
           WHEN bybit_api_key IS NOT NULL THEN bybit_api_key
           WHEN binance_api_key IS NOT NULL THEN binance_api_key
       END as api_key,
       CASE 
           WHEN bybit_api_secret IS NOT NULL THEN bybit_api_secret
           WHEN binance_api_secret IS NOT NULL THEN binance_api_secret
       END as api_secret,
       account_type,
       testnet_mode
FROM users 
WHERE (bybit_api_key IS NOT NULL OR binance_api_key IS NOT NULL)
AND (ativo = true OR is_active = true)
ORDER BY id
        `);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

checkSecretColumns();
