const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarTabelas() {
    try {
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%api%' OR table_name LIKE '%key%' OR table_name LIKE '%user%')
            ORDER BY table_name
        `);
        
        console.log('TABELAS RELACIONADAS A USUÁRIOS E CHAVES:');
        result.rows.forEach(table => {
            console.log(`  - ${table.table_name}`);
        });
        
    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarTabelas();
