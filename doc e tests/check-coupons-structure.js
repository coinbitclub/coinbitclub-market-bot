const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'coupons' 
            ORDER BY ordinal_position;
        `);
        
        console.log('📋 Estrutura da tabela coupons:');
        result.rows.forEach(row => {
            console.log(`   ${row.column_name}: ${row.data_type}`);
        });
        
        // Também vou listar os cupons existentes
        const coupons = await pool.query('SELECT * FROM coupons LIMIT 5;');
        console.log('\n🎫 Cupons existentes:');
        coupons.rows.forEach(coupon => {
            console.log(`   ${coupon.code}: ${coupon.discount_percent || coupon.discount_value}%`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
})();
