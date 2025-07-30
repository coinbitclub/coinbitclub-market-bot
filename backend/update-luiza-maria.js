const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function updateLuizaMaria() {
    try {
        console.log('🔍 BUSCANDO USUÁRIO LUIZA MARIA');
        console.log('===============================');
        
        // Buscar Luiza Maria
        const searchResult = await pool.query(`
            SELECT id, name, email, balance_usd 
            FROM users 
            WHERE name ILIKE '%luiza%' OR email ILIKE '%luiza%'
        `);
        
        if (searchResult.rows.length === 0) {
            console.log('❌ Usuário Luiza Maria não encontrado');
            return;
        }
        
        const luiza = searchResult.rows[0];
        console.log('👤 Usuário encontrado:');
        console.log(`   ID: ${luiza.id}`);
        console.log(`   Nome: ${luiza.name}`);
        console.log(`   Email: ${luiza.email}`);
        console.log(`   Saldo atual: $${luiza.balance_usd} USDT`);
        
        console.log('\n💰 ATUALIZANDO SALDO PARA $1.000');
        console.log('=================================');
        
        // Atualizar saldo para $1.000
        await pool.query(`
            UPDATE users 
            SET balance_usd = 1000.00 
            WHERE id = $1
        `, [luiza.id]);
        
        console.log('✅ Saldo atualizado para $1.000 USDT');
        
        console.log('\n🔑 CONFIGURANDO CHAVES API BYBIT');
        console.log('================================');
        
        // Chaves API da Bybit do attachment
        const bybitApiKey = '9HSZqEUJW9kDxHOA';
        const bybitApiSecret = 'OjJxNmsLOqajkTUcTFFtlsKzjqFNBKabOCU';
        
        // Verificar se já existem chaves para este usuário
        const existingKeys = await pool.query(`
            SELECT id FROM user_api_keys 
            WHERE user_id = $1 AND exchange = 'bybit'
        `, [luiza.id]);
        
        if (existingKeys.rows.length > 0) {
            // Atualizar chaves existentes
            await pool.query(`
                UPDATE user_api_keys 
                SET 
                    api_key = $1,
                    secret_key = $2,
                    is_active = true,
                    environment = 'mainnet',
                    validation_status = 'updated_by_admin',
                    updated_at = NOW()
                WHERE user_id = $3 AND exchange = 'bybit'
            `, [bybitApiKey, bybitApiSecret, luiza.id]);
            
            console.log('✅ Chaves API Bybit atualizadas');
        } else {
            // Inserir novas chaves
            await pool.query(`
                INSERT INTO user_api_keys (
                    user_id, exchange, api_key, secret_key, 
                    is_active, environment, validation_status, created_at
                ) VALUES ($1, 'bybit', $2, $3, true, 'mainnet', 'updated_by_admin', NOW())
            `, [luiza.id, bybitApiKey, bybitApiSecret]);
            
            console.log('✅ Chaves API Bybit adicionadas');
        }
        
        console.log('\n📊 VERIFICANDO CONFIGURAÇÃO FINAL');
        console.log('==================================');
        
        // Verificar configuração final
        const finalCheck = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.balance_usd,
                COUNT(k.id) as api_keys_count
            FROM users u
            LEFT JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.id = $1
            GROUP BY u.id, u.name, u.email, u.balance_usd
        `, [luiza.id]);
        
        const final = finalCheck.rows[0];
        console.log('✅ CONFIGURAÇÃO FINAL:');
        console.log(`   👤 Nome: ${final.name}`);
        console.log(`   📧 Email: ${final.email}`);
        console.log(`   💰 Saldo: $${final.balance_usd} USDT`);
        console.log(`   🔑 Chaves API: ${final.api_keys_count}`);
        
        // Mostrar chaves configuradas
        const keysResult = await pool.query(`
            SELECT exchange, api_key, is_active, environment
            FROM user_api_keys 
            WHERE user_id = $1
        `, [luiza.id]);
        
        console.log('\n🔑 CHAVES API CONFIGURADAS:');
        keysResult.rows.forEach(key => {
            console.log(`   📡 ${key.exchange.toUpperCase()}: ${key.api_key}`);
            console.log(`      Status: ${key.is_active ? 'ATIVA' : 'INATIVA'}`);
            console.log(`      Ambiente: ${key.environment || 'NÃO DEFINIDO'}`);
        });
        
        console.log('\n🎉 LUIZA MARIA CONFIGURADA COM SUCESSO!');
        console.log('======================================');
        console.log('✅ Saldo: $1.000 USDT');
        console.log('✅ Chaves API Bybit: Configuradas');
        console.log('✅ Status: Pronta para operar');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

updateLuizaMaria();
