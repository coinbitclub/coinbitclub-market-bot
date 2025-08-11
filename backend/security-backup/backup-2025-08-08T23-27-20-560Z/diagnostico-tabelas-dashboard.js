const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarTabelas() {
    try {
        console.log('🔍 Verificando tabelas existentes...\n');

        const tabelas = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('📋 Tabelas encontradas:');
        tabelas.rows.forEach(row => {
            console.log(`  • ${row.table_name}`);
        });

        // Verificar tabelas específicas
        console.log('\n🔍 Verificando tabelas específicas para dashboard...');
        
        const tabelasNecessarias = ['processed_signals', 'user_orders', 'users', 'signal_history', 'webhook_signals'];
        
        for (const tabela of tabelasNecessarias) {
            const existe = tabelas.rows.some(row => row.table_name === tabela);
            console.log(`${existe ? '✅' : '❌'} ${tabela}`);
        }

        // Verificar alternativas
        console.log('\n🔄 Procurando tabelas similares...');
        const similares = tabelas.rows.filter(row => 
            row.table_name.includes('signal') || 
            row.table_name.includes('order') || 
            row.table_name.includes('webhook')
        );
        
        if (similares.length > 0) {
            console.log('📊 Tabelas relacionadas encontradas:');
            similares.forEach(row => {
                console.log(`  🔍 ${row.table_name}`);
            });
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarTabelas();
