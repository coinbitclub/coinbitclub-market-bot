const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
    try {
        console.log('👥 VERIFICANDO USUÁRIOS NO SISTEMA');
        console.log('==================================');
        
        // Total de usuários
        const totalResult = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log(`📊 Total de usuários: ${totalResult.rows[0].count}`);
        
        // Usuários ativos (não teste)
        const activeResult = await pool.query(`
            SELECT name, email, balance_usd, created_at 
            FROM users 
            WHERE email NOT LIKE '%test%' 
              AND email NOT LIKE '%demo%' 
              AND email NOT LIKE '%exemplo%'
            ORDER BY name
        `);
        
        console.log(`\n✅ Usuários ativos (${activeResult.rows.length}):`);
        activeResult.rows.forEach(user => {
            console.log(`   👤 ${user.name} (${user.email})`);
            console.log(`      💰 Saldo: $${user.balance_usd || 0} USDT`);
            console.log(`      📅 Criado: ${user.created_at}`);
            console.log('');
        });
        
        // Verificar chaves API
        const keysResult = await pool.query(`
            SELECT u.name, COUNT(k.id) as keys_count 
            FROM users u 
            LEFT JOIN user_api_keys k ON u.id = k.user_id 
            WHERE u.email NOT LIKE '%test%' 
              AND u.email NOT LIKE '%demo%' 
              AND u.email NOT LIKE '%exemplo%'
            GROUP BY u.name
            ORDER BY u.name
        `);
        
        console.log('🔑 Chaves API configuradas:');
        keysResult.rows.forEach(user => {
            console.log(`   ${user.name}: ${user.keys_count} chaves`);
        });
        
        // Verificar operações recentes
        const opsResult = await pool.query(`
            SELECT u.name, COUNT(o.id) as operations 
            FROM users u 
            LEFT JOIN operations o ON u.id = o.user_id 
            WHERE u.email NOT LIKE '%test%' 
              AND u.email NOT LIKE '%demo%' 
              AND u.email NOT LIKE '%exemplo%'
            GROUP BY u.name
            ORDER BY u.name
        `);
        
        console.log('\n📈 Operações de trading:');
        opsResult.rows.forEach(user => {
            console.log(`   ${user.name}: ${user.operations} operações`);
        });
        
        pool.end();
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        pool.end();
    }
}

checkUsers();
