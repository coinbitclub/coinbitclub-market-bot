/**
 * 🔍 VERIFICAR ESTRUTURA DAS TABELAS
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarTabelas() {
    try {
        console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS...');
        
        // Verificar user_balances
        const userBalances = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_balances'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📊 TABELA user_balances:');
        userBalances.rows.forEach(row => {
            console.log(`   ${row.column_name}: ${row.data_type}`);
        });
        
        // Verificar users
        const users = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        
        console.log('\n👥 TABELA users:');
        users.rows.forEach(row => {
            console.log(`   ${row.column_name}: ${row.data_type}`);
        });
        
        // Verificar dados da Paloma
        const palomaData = await pool.query(`
            SELECT * FROM users WHERE id = 3 OR name ILIKE '%paloma%' LIMIT 3
        `);
        
        console.log('\n👤 DADOS DA PALOMA:');
        console.log(palomaData.rows);
        
        // Verificar balances
        const balanceData = await pool.query(`
            SELECT * FROM user_balances LIMIT 3
        `);
        
        console.log('\n💰 DADOS DE BALANCES:');
        console.log(balanceData.rows);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarTabelas();
