const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function checkStructure() {
    try {
        const columns = await pool.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Estrutura da tabela users:');
        columns.rows.forEach(c => {
            console.log(`   ${c.column_name}: ${c.data_type}${c.character_maximum_length ? '(' + c.character_maximum_length + ')' : ''}`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

checkStructure();
