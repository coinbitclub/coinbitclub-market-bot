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
        // Verificar constraints
        const constraints = await pool.query(`
            SELECT constraint_name, check_clause 
            FROM information_schema.check_constraints 
            WHERE constraint_schema = 'public';
        `);
        
        console.log('📋 Constraints encontradas:');
        constraints.rows.forEach(row => {
            console.log(`   ${row.constraint_name}: ${row.check_clause}`);
        });
        
        // Tentar inserir com 100% (máximo possível para percentage)
        console.log('\n🧪 Testando inserção com discount_percentage = 100...');
        const testCoupon = await pool.query(`
            INSERT INTO coupons (
                code, 
                description,
                discount_percentage,
                max_uses,
                valid_from,
                valid_until,
                is_active,
                created_by
            ) VALUES (
                'TEST100',
                'Teste 100%',
                100,
                1,
                NOW(),
                '2025-12-31 23:59:59',
                true,
                1
            ) RETURNING *;
        `);
        
        console.log('✅ Teste bem-sucedido com 100%');
        
        // Remover o cupom de teste
        await pool.query("DELETE FROM coupons WHERE code = 'TEST100'");
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.log('\n💡 Vou tentar com valores de percentage válidos (0-100)');
    } finally {
        await pool.end();
    }
})();
