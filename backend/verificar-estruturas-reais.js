const { Pool } = require('pg');

async function verificarEstruturasReais() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        console.log('🔍 VERIFICANDO ESTRUTURAS REAIS DO BANCO');
        console.log('=====================================');
        
        // Verificar estrutura da tabela users
        const usersStruct = await pool.query(`
            SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_name = 'users' AND table_schema = 'public'
            ORDER BY ordinal_position
        `);
        console.log('\n👤 TABELA USERS:');
        usersStruct.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
        
        // Verificar estrutura da tabela user_balances
        const balancesStruct = await pool.query(`
            SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_name = 'user_balances' AND table_schema = 'public'
            ORDER BY ordinal_position
        `);
        console.log('\n💰 TABELA USER_BALANCES:');
        balancesStruct.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
        
        // Verificar estrutura da tabela user_api_keys
        const keysStruct = await pool.query(`
            SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_name = 'user_api_keys' AND table_schema = 'public'
            ORDER BY ordinal_position
        `);
        console.log('\n🔑 TABELA USER_API_KEYS:');
        keysStruct.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
        
        // Verificar estrutura da tabela user_trading_params
        const paramsStruct = await pool.query(`
            SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_name = 'user_trading_params' AND table_schema = 'public'
            ORDER BY ordinal_position
        `);
        console.log('\n⚙️ TABELA USER_TRADING_PARAMS:');
        paramsStruct.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
        
        // Verificar estrutura da tabela trading_operations
        const operationsStruct = await pool.query(`
            SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_name = 'trading_operations' AND table_schema = 'public'
            ORDER BY ordinal_position
        `);
        console.log('\n📈 TABELA TRADING_OPERATIONS:');
        operationsStruct.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarEstruturasReais();
