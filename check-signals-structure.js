const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function checkSignalsTable() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'signals' AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('📋 ESTRUTURA DA TABELA SIGNALS:');
        console.log('===============================');
        result.rows.forEach((col, index) => {
            console.log(`${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        // Verificar alguns registros
        const samples = await pool.query('SELECT * FROM signals ORDER BY created_at DESC LIMIT 3');
        console.log('\n📊 AMOSTRAS DE DADOS:');
        console.log('====================');
        samples.rows.forEach((signal, index) => {
            console.log(`${index + 1}. ID: ${signal.id} | Symbol: ${signal.symbol} | Action: ${signal.action} | Strategy: ${signal.strategy}`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

checkSignalsTable();
