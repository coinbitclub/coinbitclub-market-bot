const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificar() {
    try {
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%operation%'
            ORDER BY table_name
        `);
        
        console.log('📋 TABELAS COM OPERATION:');
        result.rows.forEach(row => {
            console.log(`   ${row.table_name}`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificar();
