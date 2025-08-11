const { Client } = require('pg');

async function checkUserApiKeys() {
    console.log('🔍 Verificando chaves API dos usuários...');
    
    const connectionString = 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway';
    
    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        // Verificar usuários com chaves Bybit (que sabemos que existem)
        console.log('📋 Usuários com chaves Bybit:');
        const bybitUsers = await client.query(`
            SELECT id, username, 
                   bybit_api_key IS NOT NULL as has_bybit_key,
                   LENGTH(bybit_api_key) as bybit_key_length
            FROM users 
            WHERE bybit_api_key IS NOT NULL 
            LIMIT 5
        `);
        
        bybitUsers.rows.forEach(user => {
            console.log(`   - ID: ${user.id}, User: ${user.username}, Key Length: ${user.bybit_key_length}`);
        });
        
        // Verificar tabela user_api_keys
        console.log('\n📋 Registros em user_api_keys:');
        const apiKeys = await client.query(`
            SELECT user_id, exchange, 
                   api_key IS NOT NULL as has_key,
                   api_secret IS NOT NULL as has_secret,
                   validation_status,
                   is_active,
                   LENGTH(api_key) as key_length
            FROM user_api_keys 
            ORDER BY user_id, exchange
            LIMIT 10
        `);
        
        if (apiKeys.rows.length > 0) {
            apiKeys.rows.forEach(key => {
                console.log(`   - User: ${key.user_id}, Exchange: ${key.exchange}, Status: ${key.validation_status}, Active: ${key.is_active}, Key Length: ${key.key_length}`);
            });
        } else {
            console.log('   ⚠️ Tabela user_api_keys está vazia!');
        }
        
        // Verificar se existe dados para os usuários específicos (14, 15, 16)
        console.log('\n📋 Verificando usuários específicos (14, 15, 16):');
        const specificUsers = await client.query(`
            SELECT u.id, u.username, u.is_active,
                   u.bybit_api_key IS NOT NULL as has_bybit_in_users
            FROM users u 
            WHERE u.id IN (14, 15, 16)
            ORDER BY u.id
        `);
        
        specificUsers.rows.forEach(user => {
            console.log(`   - ID: ${user.id}, User: ${user.username}, Active: ${user.is_active}, Has Bybit: ${user.has_bybit_in_users}`);
        });
        
        // Verificar se há chaves API para esses usuários
        console.log('\n📋 Chaves API para usuários 14, 15, 16:');
        const specificApiKeys = await client.query(`
            SELECT user_id, exchange, validation_status, is_active
            FROM user_api_keys 
            WHERE user_id IN (14, 15, 16)
            ORDER BY user_id, exchange
        `);
        
        if (specificApiKeys.rows.length > 0) {
            specificApiKeys.rows.forEach(key => {
                console.log(`   - User: ${key.user_id}, Exchange: ${key.exchange}, Status: ${key.validation_status}, Active: ${key.is_active}`);
            });
        } else {
            console.log('   ⚠️ Nenhuma chave API encontrada para usuários 14, 15, 16 na tabela user_api_keys');
            console.log('   🔧 Possível problema: dados estão na tabela users, mas não em user_api_keys');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await client.end();
    }
}

checkUserApiKeys();
