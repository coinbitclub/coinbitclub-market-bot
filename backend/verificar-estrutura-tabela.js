const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://coinbitclub_user:W0lvxNw7OQCNRGiUPh9S@coinbitclub-db.railway.app:5432/coinbitclub_db',
    ssl: { rejectUnauthorized: false }
});

async function verificarEstrutura() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'stripe_products' 
            ORDER BY ordinal_position
        `);
        
        console.log('Colunas da tabela stripe_products:');
        res.rows.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type}`);
        });
        
    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarEstrutura();
