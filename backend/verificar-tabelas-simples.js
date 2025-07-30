const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarTabelas() {
    try {
        console.log('🔍 ESTRUTURA DA TABELA USERS');
        console.log('=============================');
        
        // Verificar estrutura da tabela users
        const columns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Colunas da tabela users:');
        columns.rows.forEach(c => console.log(`   ${c.column_name}: ${c.data_type}`));
        
        // Verificar alguns registros
        console.log('\n📊 Primeiros registros da tabela users:');
        const users = await pool.query('SELECT * FROM users LIMIT 3');
        console.log(users.rows);
        
        console.log('\n🔍 ESTADO ATUAL DAS CHAVES API');
        console.log('==============================');
        
        // Verificar chaves API atuais
        const apiKeys = await pool.query(`
            SELECT 
                id, 
                user_id, 
                api_key, 
                secret_key, 
                exchange, 
                validation_status, 
                error_message
            FROM user_api_keys 
            WHERE is_active = true
            ORDER BY id
        `);
        
        console.log('📋 Chaves API ativas:');
        apiKeys.rows.forEach(key => {
            console.log(`\n• ID: ${key.id} | User: ${key.user_id}`);
            console.log(`  API: ${key.api_key}`);
            console.log(`  Exchange: ${key.exchange}`);
            console.log(`  Status: ${key.validation_status}`);
            if (key.error_message) {
                console.log(`  Erro: ${key.error_message}`);
            }
        });

        console.log('\n💡 ANÁLISE:');
        const placeholders = apiKeys.rows.filter(k => 
            k.api_key.includes('API_KEY_REAL_') || 
            k.secret_key.includes('SECRET_KEY_')
        );
        
        if (placeholders.length > 0) {
            console.log(`🚨 ${placeholders.length} chaves ainda são placeholders`);
            placeholders.forEach(p => {
                console.log(`   - User ${p.user_id}: ${p.api_key}`);
            });
        } else {
            console.log('✅ Todas as chaves são reais (não há placeholders)');
        }

        console.log('\n📊 RESUMO DO SERVIDOR:');
        console.log(`   • IP: 132.255.160.140 (Railway)`);
        console.log(`   • Chaves ativas: ${apiKeys.rows.length}`);
        console.log(`   • Placeholders: ${placeholders.length}`);
        console.log(`   • CoinTech2U: Funciona com as mesmas chaves`);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarTabelas();
