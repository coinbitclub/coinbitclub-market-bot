const { Pool } = require('pg');

async function verificarEstrutura() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        
        // Listar tabelas
        const tabelas = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        console.log('📋 Tabelas disponíveis:');
        tabelas.rows.forEach(row => {
            console.log(` - ${row.table_name}`);
        });
        
        // Verificar se user_balances existe
        const existeBalances = tabelas.rows.find(t => t.table_name === 'user_balances');
        if (existeBalances) {
            const balancesCols = await client.query('SELECT * FROM user_balances LIMIT 0;');
            console.log('\n💰 Colunas da tabela user_balances:');
            balancesCols.fields.forEach(field => {
                console.log(` - ${field.name}`);
            });
        } else {
            console.log('\n❌ Tabela user_balances não existe');
        }
        
        // Verificar se user_api_keys existe
        const existeApiKeys = tabelas.rows.find(t => t.table_name === 'user_api_keys');
        if (existeApiKeys) {
            const apiKeysCols = await client.query('SELECT * FROM user_api_keys LIMIT 0;');
            console.log('\n🔐 Colunas da tabela user_api_keys:');
            apiKeysCols.fields.forEach(field => {
                console.log(` - ${field.name}`);
            });
        } else {
            console.log('\n❌ Tabela user_api_keys não existe');
        }
        
        // Verificar tipos dos campos VIP
        const tiposVIP = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name LIKE '%vip%'
            ORDER BY column_name;
        `);
        
        console.log('\n👑 Campos VIP na tabela users:');
        tiposVIP.rows.forEach(row => {
            console.log(` - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // Verificar tipos das chaves
        const tiposID = await client.query(`
            SELECT 
                'users' as tabela, 'id' as campo, data_type
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'id'
            UNION ALL
            SELECT 
                'user_balances' as tabela, 'user_id' as campo, data_type
            FROM information_schema.columns 
            WHERE table_name = 'user_balances' AND column_name = 'user_id'
            UNION ALL
            SELECT 
                'user_api_keys' as tabela, 'user_id' as campo, data_type
            FROM information_schema.columns 
            WHERE table_name = 'user_api_keys' AND column_name = 'user_id';
        `);
        
        console.log('\n🔑 Tipos de ID:');
        tiposID.rows.forEach(row => {
            console.log(` - ${row.tabela}.${row.campo}: ${row.data_type}`);
        });
        
        client.release();
        await pool.end();
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

verificarEstrutura().catch(console.error);
