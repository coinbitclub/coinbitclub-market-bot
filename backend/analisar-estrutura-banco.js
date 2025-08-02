const { Pool } = require('pg');

console.log('🔄 Verificando estrutura real das tabelas...');

const pool = new Pool({
    host: 'maglev.proxy.rlwy.net',
    port: 42095,
    database: 'railway',
    user: 'postgres',
    password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv',
    ssl: { rejectUnauthorized: false }
});

async function analyzeDatabase() {
    try {
        console.log('📡 Conectando ao Railway...');
        const client = await pool.connect();
        console.log('✅ Conexão estabelecida!');
        
        // Verificar estrutura da tabela user_balances
        console.log('\n🔍 ESTRUTURA DA TABELA user_balances:');
        const balancesStructure = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'user_balances'
            ORDER BY ordinal_position
        `);
        
        balancesStructure.rows.forEach(col => {
            console.log(`   📊 ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
            if (col.column_default) {
                console.log(`      Default: ${col.column_default}`);
            }
        });
        
        // Verificar dados dos saldos
        console.log('\n💰 DADOS DOS SALDOS:');
        const balancesData = await client.query(`
            SELECT ub.*, u.username 
            FROM user_balances ub 
            JOIN users u ON ub.user_id = u.id 
            ORDER BY u.username
        `);
        
        balancesData.rows.forEach(balance => {
            console.log(`👤 ${balance.username}:`);
            console.log(`   💱 Moeda: ${balance.currency}`);
            console.log(`   💰 Valor: ${balance.available_balance || balance.total_balance || 'N/A'}`);
            console.log(`   📊 Total: ${balance.total_balance || 'N/A'}`);
        });
        
        // Verificar usuários ativos
        console.log('\n👥 USUÁRIOS ATIVOS:');
        const activeUsers = await client.query(`
            SELECT username, email, status, created_at
            FROM users 
            WHERE status = 'active'
            ORDER BY username
        `);
        
        activeUsers.rows.forEach(user => {
            console.log(`✅ ${user.username} (${user.email})`);
            console.log(`   📅 Criado: ${new Date(user.created_at).toLocaleDateString()}`);
        });
        
        // Verificar operações
        console.log('\n📈 OPERAÇÕES RECENTES:');
        const recentOps = await client.query(`
            SELECT o.*, u.username 
            FROM operations o 
            JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC 
            LIMIT 5
        `);
        
        recentOps.rows.forEach(op => {
            console.log(`🎯 ${op.username}: ${op.side} ${op.symbol}`);
            console.log(`   💰 Entrada: $${op.entry_price} | Saída: $${op.exit_price || 'Aberta'}`);
            console.log(`   📊 Lucro: $${op.profit || '0.00'} | Status: ${op.status}`);
        });
        
        // Verificar sinais
        console.log('\n📡 SINAIS RECENTES:');
        const recentSignals = await client.query(`
            SELECT * FROM signals 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        recentSignals.rows.forEach(signal => {
            console.log(`📊 ${signal.symbol}: ${signal.action || signal.type}`);
            console.log(`   💰 Preço: $${signal.price} | Estratégia: ${signal.strategy || 'N/A'}`);
        });
        
        client.release();
        console.log('\n✅ ANÁLISE COMPLETA FINALIZADA!');
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

analyzeDatabase();
