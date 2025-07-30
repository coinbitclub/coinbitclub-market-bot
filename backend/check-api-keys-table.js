const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function checkApiKeysTable() {
    try {
        console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS');
        console.log('====================================');
        
        // Verificar se a tabela existe
        const tableExists = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%api%'
        `);
        
        console.log('📋 Tabelas relacionadas a API:');
        tableExists.rows.forEach(t => console.log(`   - ${t.table_name}`));
        
        // Verificar estrutura da tabela user_api_keys se existir
        if (tableExists.rows.some(t => t.table_name === 'user_api_keys')) {
            const columns = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'user_api_keys' 
                ORDER BY ordinal_position
            `);
            
            console.log('\n📋 Estrutura da tabela user_api_keys:');
            columns.rows.forEach(c => console.log(`   ${c.column_name}: ${c.data_type}`));
        }
        
        // Verificar conteúdo da tabela
        const content = await pool.query('SELECT * FROM user_api_keys LIMIT 5');
        console.log('\n📊 Conteúdo atual da tabela:');
        if (content.rows.length > 0) {
            console.log(content.rows);
        } else {
            console.log('   (tabela vazia)');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

checkApiKeysTable();
