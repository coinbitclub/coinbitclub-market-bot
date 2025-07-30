const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function checkTableStructure() {
    try {
        // Verificar colunas da tabela trading_signals
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'trading_signals' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 ESTRUTURA DA TABELA trading_signals:');
        if (result.rows.length > 0) {
            result.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type}`);
            });
        } else {
            console.log('  ❌ Tabela não existe');
        }
        
        // Verificar se a coluna signal_data existe
        const signalDataExists = result.rows.some(col => col.column_name === 'signal_data');
        
        if (!signalDataExists && result.rows.length > 0) {
            console.log('\n🔧 ADICIONANDO COLUNA signal_data...');
            await pool.query(`
                ALTER TABLE trading_signals 
                ADD COLUMN signal_data JSONB
            `);
            console.log('✅ Coluna signal_data adicionada com sucesso');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

checkTableStructure();
