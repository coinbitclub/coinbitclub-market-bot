/**
 * Verificar estrutura da tabela trading_signals e corrigir endpoint
 */

const { Pool } = require('pg');

async function verificarSchema() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway'
    });
    
    try {
        console.log('🔍 Verificando estrutura da tabela trading_signals...\n');
        
        // Verificar se a tabela existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'trading_signals'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.log('❌ Tabela trading_signals não existe');
            
            // Verificar outras tabelas relacionadas
            const tables = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE '%signal%'
                ORDER BY table_name;
            `);
            
            console.log('📊 Tabelas relacionadas a sinais encontradas:');
            tables.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
            
            return;
        }
        
        console.log('✅ Tabela trading_signals existe');
        
        // Verificar estrutura da tabela
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'trading_signals'
            ORDER BY ordinal_position;
        `);
        
        console.log('\n📊 Estrutura da tabela trading_signals:');
        console.log('========================================');
        columns.rows.forEach(col => {
            console.log(`${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });
        
        // Verificar se há dados na tabela
        const count = await pool.query('SELECT COUNT(*) FROM trading_signals');
        console.log(`\n📈 Total de registros: ${count.rows[0].count}`);
        
        // Mostrar alguns registros de exemplo
        if (parseInt(count.rows[0].count) > 0) {
            const sample = await pool.query(`
                SELECT * FROM trading_signals 
                ORDER BY created_at DESC 
                LIMIT 3
            `);
            
            console.log('\n📝 Registros de exemplo:');
            console.log('========================');
            sample.rows.forEach((row, index) => {
                console.log(`${index + 1}. ID: ${row.id}, Symbol: ${row.symbol}, Action: ${row.action}`);
                console.log(`   Created At: ${row.created_at}`);
                if (row.processed_at) {
                    console.log(`   Processed At: ${row.processed_at}`);
                }
                console.log('');
            });
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarSchema();
