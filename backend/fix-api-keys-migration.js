const { Client } = require('pg');

async function fixApiKeysTable() {
    const connectionString = 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway';
    
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Conectado ao banco');
        
        // 1. Verificar estrutura da tabela user_api_keys
        console.log('\n📋 Verificando estrutura da tabela user_api_keys...');
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_api_keys'
            );
        `);
        
        if (!tableExists.rows[0].exists) {
            console.log('❌ Tabela user_api_keys não existe. Criando...');
            await client.query(`
                CREATE TABLE user_api_keys (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    exchange VARCHAR(20) NOT NULL,
                    api_key TEXT,
                    api_secret TEXT,
                    validation_status VARCHAR(20) DEFAULT 'pending',
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `);
            console.log('✅ Tabela user_api_keys criada');
        }
        
        // 2. Migrar dados da tabela users para user_api_keys
        console.log('\n🔄 Migrando chaves Bybit da tabela users...');
        
        const usersWithBybit = await client.query(`
            SELECT id, username, bybit_api_key, bybit_api_secret 
            FROM users 
            WHERE bybit_api_key IS NOT NULL 
            AND bybit_api_secret IS NOT NULL
        `);
        
        console.log(`📊 Encontrados ${usersWithBybit.rows.length} usuários com chaves Bybit`);
        
        for (const user of usersWithBybit.rows) {
            // Verificar se já existe
            const exists = await client.query(`
                SELECT id FROM user_api_keys 
                WHERE user_id = $1 AND exchange = 'bybit'
            `, [user.id]);
            
            if (exists.rows.length === 0) {
                await client.query(`
                    INSERT INTO user_api_keys (user_id, exchange, api_key, api_secret, validation_status, is_active)
                    VALUES ($1, 'bybit', $2, $3, 'valid', true)
                `, [user.id, user.bybit_api_key, user.bybit_api_secret]);
                
                console.log(`✅ Migrado usuário ${user.id} (${user.username}) - Bybit`);
            } else {
                console.log(`ℹ️ Usuário ${user.id} já tem chave Bybit em user_api_keys`);
            }
        }
        
        // 3. Fazer o mesmo para Binance
        console.log('\n🔄 Migrando chaves Binance da tabela users...');
        
        const usersWithBinance = await client.query(`
            SELECT id, username, binance_api_key, binance_api_secret 
            FROM users 
            WHERE binance_api_key IS NOT NULL 
            AND binance_api_secret IS NOT NULL
        `);
        
        console.log(`📊 Encontrados ${usersWithBinance.rows.length} usuários com chaves Binance`);
        
        for (const user of usersWithBinance.rows) {
            const exists = await client.query(`
                SELECT id FROM user_api_keys 
                WHERE user_id = $1 AND exchange = 'binance'
            `, [user.id]);
            
            if (exists.rows.length === 0) {
                await client.query(`
                    INSERT INTO user_api_keys (user_id, exchange, api_key, api_secret, validation_status, is_active)
                    VALUES ($1, 'binance', $2, $3, 'valid', true)
                `, [user.id, user.binance_api_key, user.binance_api_secret]);
                
                console.log(`✅ Migrado usuário ${user.id} (${user.username}) - Binance`);
            } else {
                console.log(`ℹ️ Usuário ${user.id} já tem chave Binance em user_api_keys`);
            }
        }
        
        // 4. Verificar resultado final
        console.log('\n📋 Resultado final da migração:');
        const finalCheck = await client.query(`
            SELECT u.id, u.username, uak.exchange, uak.validation_status, uak.is_active
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.id IN (14, 15, 16, 18, 19, 20)
            ORDER BY u.id, uak.exchange
        `);
        
        finalCheck.rows.forEach(row => {
            console.log(`   - User ${row.id} (${row.username}): ${row.exchange} - Status: ${row.validation_status}, Active: ${row.is_active}`);
        });
        
        console.log('\n🎉 Migração concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await client.end();
    }
}

fixApiKeysTable();
