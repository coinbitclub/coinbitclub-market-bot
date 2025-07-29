/**
 * 🔍 VERIFICAR ESTRUTURA EXATA USER_BALANCES
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarUserBalances() {
    try {
        console.log('🔍 VERIFICANDO ESTRUTURA USER_BALANCES');
        console.log('='.repeat(50));
        
        // Estrutura da tabela
        const estruturaQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'user_balances'
            ORDER BY ordinal_position;
        `;
        
        const estrutura = await pool.query(estruturaQuery);
        console.log('📊 COLUNAS DISPONÍVEIS:');
        estrutura.rows.forEach(col => {
            console.log(`   • ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        console.log('\n🔍 DADOS ATUAIS DA PALOMA:');
        const palomaQuery = `
            SELECT * FROM user_balances 
            WHERE user_id = (
                SELECT id FROM users WHERE email = 'pamaral15@hotmail.com'
            );
        `;
        
        const palomaSaldos = await pool.query(palomaQuery);
        if (palomaSaldos.rows.length > 0) {
            console.log('💰 SALDOS ENCONTRADOS:');
            palomaSaldos.rows.forEach(saldo => {
                console.log(`   Currency: ${saldo.currency}`);
                console.log(`   Available: ${saldo.available_balance}`);
                console.log(`   Locked: ${saldo.locked_balance}`);
                console.log(`   Total Deposits: ${saldo.total_deposits}`);
                console.log(`   Total Profit: ${saldo.total_profit}`);
                console.log(`   Total Loss: ${saldo.total_loss}`);
                console.log(`   ---`);
            });
        } else {
            console.log('❌ Nenhum saldo encontrado para Paloma');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarUserBalances();
