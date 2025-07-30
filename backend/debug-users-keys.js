const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function debugUsersAndKeys() {
    try {
        console.log('🔍 DIAGNÓSTICO COMPLETO - USUÁRIOS E CHAVES API');
        console.log('===============================================');
        
        // 1. Verificar estrutura das tabelas primeiro
        console.log('\n📋 VERIFICANDO ESTRUTURA DAS TABELAS:');
        const userColumns = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' ORDER BY ordinal_position
        `);
        console.log('   Colunas da tabela users:', userColumns.rows.map(c => c.column_name));
        
        const keyColumns = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'user_api_keys' ORDER BY ordinal_position
        `);
        console.log('   Colunas da tabela user_api_keys:', keyColumns.rows.map(c => c.column_name));
        
        // 2. Verificar usuários (usando colunas que existem)
        const users = await pool.query('SELECT * FROM users ORDER BY id LIMIT 10');
        console.log('\n📋 USUÁRIOS CADASTRADOS:');
        users.rows.forEach(u => {
            console.log(`   ID: ${u.id} | Nome: ${u.name || 'N/A'} | Email: ${u.email || 'N/A'} | VIP: ${u.is_vip} | Ativo: ${u.is_active}`);
        });
        
        // 2. Verificar chaves API
        const apiKeys = await pool.query('SELECT * FROM user_api_keys ORDER BY user_id, id');
        console.log('\n🔑 CHAVES API CADASTRADAS:');
        apiKeys.rows.forEach(k => {
            const keyPreview = k.api_key?.includes('API_KEY_') ? 'VARIÁVEL_AMBIENTE' : 
                             k.api_key?.substring(0, 10) + '...' || 'N/A';
            console.log(`   ID: ${k.id} | User: ${k.user_id} | Exchange: ${k.exchange} | Env: ${k.environment} | Status: ${k.validation_status} | Ativo: ${k.is_active} | Chave: ${keyPreview}`);
        });
        
        // 3. Mapeamento completo
        console.log('\n🔄 MAPEAMENTO USUÁRIO → CHAVES:');
        const mapping = await pool.query(`
            SELECT u.id as user_id, u.name, u.email, u.is_vip,
                   COUNT(ak.id) as total_keys,
                   COUNT(CASE WHEN ak.is_active = true THEN 1 END) as active_keys,
                   COUNT(CASE WHEN ak.validation_status = 'valid' THEN 1 END) as valid_keys,
                   COUNT(CASE WHEN ak.validation_status = 'error' THEN 1 END) as error_keys,
                   STRING_AGG(ak.exchange || '/' || ak.environment, ', ') as exchanges
            FROM users u 
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id 
            GROUP BY u.id, u.name, u.email, u.is_vip
            ORDER BY u.id
        `);
        
        mapping.rows.forEach(m => {
            console.log(`   👤 ${m.name || 'N/A'} (ID: ${m.user_id}) | VIP: ${m.is_vip}`);
            console.log(`      📊 Chaves: ${m.total_keys} total | ${m.active_keys} ativas | ${m.valid_keys} válidas | ${m.error_keys} com erro`);
            console.log(`      🏢 Exchanges: ${m.exchanges || 'NENHUMA'}`);
            console.log('');
        });
        
        // 4. Problemas identificados
        console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
        
        // Usuários sem chaves
        const usersWithoutKeys = await pool.query(`
            SELECT u.id, u.name, u.email FROM users u 
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id 
            WHERE ak.id IS NULL AND u.is_active = true
        `);
        
        if (usersWithoutKeys.rows.length > 0) {
            console.log('   ❌ Usuários ativos sem chaves API:');
            usersWithoutKeys.rows.forEach(u => console.log(`      - ${u.name} (ID: ${u.id})`));
        }
        
        // Chaves com erro
        const errorKeys = await pool.query(`
            SELECT ak.*, u.name FROM user_api_keys ak 
            JOIN users u ON ak.user_id = u.id 
            WHERE ak.validation_status = 'error'
        `);
        
        if (errorKeys.rows.length > 0) {
            console.log('   ❌ Chaves com erro de validação:');
            errorKeys.rows.forEach(k => {
                console.log(`      - ${k.name} (${k.exchange}): ${k.error_message}`);
            });
        }
        
        // Chaves usando variáveis de ambiente
        const envKeys = await pool.query(`
            SELECT ak.*, u.name FROM user_api_keys ak 
            JOIN users u ON ak.user_id = u.id 
            WHERE ak.api_key LIKE '%API_KEY_%' OR ak.secret_key LIKE '%SECRET_KEY_%'
        `);
        
        if (envKeys.rows.length > 0) {
            console.log('   ⚠️  Chaves usando variáveis de ambiente (podem não estar definidas):');
            envKeys.rows.forEach(k => {
                console.log(`      - ${k.name} (${k.exchange}): ${k.api_key} / ${k.secret_key}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error(error.stack);
    } finally {
        pool.end();
    }
}

debugUsersAndKeys();
