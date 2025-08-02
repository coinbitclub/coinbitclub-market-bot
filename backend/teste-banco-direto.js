const { Pool } = require('pg');

console.log('🔄 Testando conexão com banco de dados...');

const pool = new Pool({
    host: 'maglev.proxy.rlwy.net',
    port: 42095,
    database: 'railway',
    user: 'postgres',
    password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv',
    ssl: { rejectUnauthorized: false }
});

async function testConnection() {
    try {
        console.log('📡 Conectando ao Railway...');
        const client = await pool.connect();
        console.log('✅ Conexão estabelecida!');
        
        // Verificar usuários
        const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
        const usersCount = usersResult.rows[0].count;
        console.log(`👥 Usuários: ${usersCount}`);
        
        // Verificar saldos
        const balancesResult = await client.query('SELECT COUNT(*) as count FROM user_balances');
        const balancesCount = balancesResult.rows[0].count;
        console.log(`💰 Saldos: ${balancesCount}`);
        
        // Verificar operações
        const operationsResult = await client.query('SELECT COUNT(*) as count FROM operations');
        const operationsCount = operationsResult.rows[0].count;
        console.log(`📈 Operações: ${operationsCount}`);
        
        // Verificar sinais
        const signalsResult = await client.query('SELECT COUNT(*) as count FROM signals');
        const signalsCount = signalsResult.rows[0].count;
        console.log(`📡 Sinais: ${signalsCount}`);
        
        // Verificar dados dos usuários ativos
        const activeUsersResult = await client.query(`
            SELECT u.username, u.email, u.status, ub.currency, ub.balance
            FROM users u 
            LEFT JOIN user_balances ub ON u.id = ub.user_id 
            WHERE u.status = 'active'
            ORDER BY u.username
        `);
        
        console.log('\n👥 USUÁRIOS ATIVOS:');
        console.log('═══════════════════════════════════════');
        activeUsersResult.rows.forEach(user => {
            console.log(`📊 ${user.username} (${user.email})`);
            console.log(`   💰 ${user.currency}: ${user.balance || '0.00'}`);
        });
        
        // Verificar operações recentes
        const recentOpsResult = await client.query(`
            SELECT o.*, u.username 
            FROM operations o 
            JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC 
            LIMIT 5
        `);
        
        console.log('\n📈 OPERAÇÕES RECENTES:');
        console.log('═══════════════════════════════════════');
        recentOpsResult.rows.forEach(op => {
            console.log(`🎯 ${op.username}: ${op.side} ${op.symbol} @ $${op.entry_price}`);
            console.log(`   💰 Lucro: $${op.profit || '0.00'} | Status: ${op.status}`);
        });
        
        client.release();
        console.log('\n✅ BANCO DE DADOS FUNCIONANDO PERFEITAMENTE!');
        
    } catch (error) {
        console.log('❌ Erro na conexão:', error.message);
        console.log('🔧 Detalhes:', error);
    } finally {
        await pool.end();
    }
}

testConnection();
