const { Pool } = require('pg');

async function verificarPaloma() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔍 Verificando usuária Paloma...');
        
        const result = await pool.query('SELECT id, name, email, role FROM users WHERE name ILIKE $1', ['%paloma%']);
        
        if (result.rows.length === 0) {
            console.log('❌ Usuária Paloma não encontrada');
        } else {
            const user = result.rows[0];
            console.log(`👤 Encontrada: ${user.name} - Role: ${user.role}`);
            
            if (user.role === 'admin') {
                console.log('🔧 Corrigindo role para USER...');
                await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['user', user.id]);
                console.log('✅ Role corrigida para USER');
            } else {
                console.log('✅ Role já está correta');
            }
        }
        
        // Mostrar todos os usuários e roles
        const allUsers = await pool.query('SELECT name, role FROM users ORDER BY name');
        console.log('\n📋 Todos os usuários:');
        allUsers.rows.forEach(u => {
            console.log(`   ${u.name}: ${u.role}`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarPaloma();
