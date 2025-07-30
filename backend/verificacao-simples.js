const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function simpleCheck() {
    try {
        console.log('🔍 VERIFICAÇÃO SIMPLES - ESTRUTURA DAS TABELAS');
        console.log('===========================================');
        
        // Verificar estrutura da tabela users
        const userColumns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Colunas da tabela users:');
        userColumns.rows.forEach(c => console.log(`   ${c.column_name}: ${c.data_type}`));
        
        // Verificar usuários
        const users = await pool.query('SELECT id, name, email, full_name FROM users LIMIT 5');
        console.log('\n👥 Usuários cadastrados:');
        users.rows.forEach(u => {
            console.log(`   ID: ${u.id} | Nome: ${u.name || u.full_name || 'N/A'} | Email: ${u.email || 'N/A'}`);
        });
        
        // Verificar chaves API
        const apiKeys = await pool.query(`
            SELECT ak.id, ak.user_id, ak.exchange, ak.environment, 
                   ak.validation_status, ak.is_active, 
                   LEFT(ak.api_key, 15) as api_key_preview,
                   u.name, u.email
            FROM user_api_keys ak
            LEFT JOIN users u ON ak.user_id = u.id
            ORDER BY ak.user_id, ak.id
        `);
        
        console.log('\n🔑 Chaves API cadastradas:');
        apiKeys.rows.forEach(k => {
            console.log(`   Chave ID: ${k.id} | User: ${k.user_id} (${k.name || 'N/A'}) | ${k.exchange}/${k.environment} | Status: ${k.validation_status} | Ativa: ${k.is_active}`);
            console.log(`      API Key: ${k.api_key_preview}...`);
        });
        
        console.log('\n📊 RESUMO DOS PROBLEMAS:');
        console.log('========================');
        
        // Contar problemas
        const errorKeys = await pool.query("SELECT COUNT(*) as count FROM user_api_keys WHERE validation_status = 'error'");
        const activeUsers = await pool.query("SELECT COUNT(*) as count FROM users WHERE name IS NOT NULL");
        const totalKeys = await pool.query("SELECT COUNT(*) as count FROM user_api_keys");
        
        console.log(`👥 Total usuários: ${activeUsers.rows[0].count}`);
        console.log(`🔑 Total chaves API: ${totalKeys.rows[0].count}`);
        console.log(`❌ Chaves com erro: ${errorKeys.rows[0].count}`);
        
        // Problemas específicos da Bybit
        const bybitProblems = await pool.query(`
            SELECT ak.id, ak.user_id, ak.validation_status, ak.error_message,
                   u.name, u.email
            FROM user_api_keys ak
            LEFT JOIN users u ON ak.user_id = u.id
            WHERE ak.exchange LIKE '%bybit%' AND ak.validation_status = 'error'
        `);
        
        console.log('\n🚨 PROBLEMAS ESPECÍFICOS DA BYBIT:');
        if (bybitProblems.rows.length > 0) {
            bybitProblems.rows.forEach(p => {
                console.log(`   ❌ ${p.name || 'N/A'} (ID: ${p.user_id}) - ${p.error_message || 'Erro não especificado'}`);
            });
        } else {
            console.log('   ✅ Nenhum problema específico da Bybit encontrado');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error(error.stack);
    } finally {
        pool.end();
    }
}

simpleCheck();
