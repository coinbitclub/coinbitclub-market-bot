const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarEstrutura() {
    try {
        // Estrutura da tabela user_api_keys
        const apiKeysStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'user_api_keys' 
            ORDER BY ordinal_position
        `);
        
        console.log('ESTRUTURA DA TABELA user_api_keys:');
        apiKeysStructure.rows.forEach(col => {
            console.log(`  ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // Contar registros
        const apiKeysCount = await pool.query('SELECT COUNT(*) as total FROM user_api_keys');
        console.log(`\nTOTAL DE REGISTROS: ${apiKeysCount.rows[0].total}`);

        if (apiKeysCount.rows[0].total > 0) {
            const sampleKeys = await pool.query('SELECT * FROM user_api_keys LIMIT 3');
            console.log('\nEXEMPLOS DE REGISTROS:');
            sampleKeys.rows.forEach((key, i) => {
                console.log(`${i+1}. User ID: ${key.user_id} | Ativo: ${key.is_active || key.active || 'N/A'}`);
            });
        }
        
    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarEstrutura();
