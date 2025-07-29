const { Pool } = require('pg');

async function verificarDados() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        
        // Verificar usuários existentes
        const usuarios = await client.query('SELECT id, username, email FROM users LIMIT 5;');
        console.log('👤 Usuários existentes:');
        usuarios.rows.forEach(u => {
            console.log(`  ${u.id} - ${u.username} (${u.email})`);
        });
        
        // Verificar saldos existentes
        const saldos = await client.query('SELECT user_id, currency, available_balance FROM user_balances LIMIT 5;');
        console.log('\n💰 Saldos existentes:');
        saldos.rows.forEach(s => {
            console.log(`  ${s.user_id} - ${s.currency}: ${s.available_balance}`);
        });
        
        // Verificar chaves API existentes
        const chaves = await client.query('SELECT user_id, exchange FROM user_api_keys LIMIT 5;');
        console.log('\n🔐 Chaves API existentes:');
        chaves.rows.forEach(c => {
            console.log(`  ${c.user_id} - ${c.exchange}`);
        });
        
        client.release();
        await pool.end();
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

verificarDados().catch(console.error);
