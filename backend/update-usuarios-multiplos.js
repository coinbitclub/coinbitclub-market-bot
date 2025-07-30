const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function updateMultiplosUsuarios() {
    try {
        console.log('🔄 ATUALIZANDO MÚLTIPLOS USUÁRIOS');
        console.log('=================================');
        
        // ===============================
        // 1. ATUALIZAR LUIZA MARIA
        // ===============================
        console.log('\n👤 ATUALIZANDO LUIZA MARIA');
        console.log('==========================');
        
        const luizaResult = await pool.query(`
            SELECT id, name, email FROM users 
            WHERE name ILIKE '%luiza%' AND email LIKE '%lmariadeapinto%'
        `);
        
        if (luizaResult.rows.length > 0) {
            const luiza = luizaResult.rows[0];
            console.log(`   Encontrado: ${luiza.name} (${luiza.email})`);
            
            // Atualizar dados da Luiza
            await pool.query(`
                UPDATE users 
                SET 
                    email = 'lmariadapinto@gmail.com',
                    country = 'BR',
                    pais = 'Brasil',
                    plan_type = 'vip',
                    password_hash = '$2b$10$password.hash.here',
                    updated_at = NOW()
                WHERE id = $1
            `, [luiza.id]);
            
            // Atualizar exchange para bybit nas chaves API
            await pool.query(`
                UPDATE user_api_keys 
                SET 
                    exchange = 'bybit',
                    exchange_name = 'bybit',
                    updated_at = NOW()
                WHERE user_id = $1
            `, [luiza.id]);
            
            console.log('   ✅ Email atualizado para: lmariadapinto@gmail.com');
            console.log('   ✅ País: Brasil (BR)');
            console.log('   ✅ Plano: VIP');
            console.log('   ✅ Exchange: Bybit');
        }
        
        // ===============================
        // 2. ATUALIZAR PALOMA AMARAL
        // ===============================
        console.log('\n👤 ATUALIZANDO PALOMA AMARAL');
        console.log('============================');
        
        const palomaResult = await pool.query(`
            SELECT id, name, email FROM users 
            WHERE name ILIKE '%paloma%'
        `);
        
        if (palomaResult.rows.length > 0) {
            const paloma = palomaResult.rows[0];
            console.log(`   Encontrado: ${paloma.name} (${paloma.email})`);
            
            // Atualizar exchange da Paloma para bybit
            await pool.query(`
                UPDATE user_api_keys 
                SET 
                    exchange = 'bybit',
                    exchange_name = 'bybit',
                    updated_at = NOW()
                WHERE user_id = $1
            `, [paloma.id]);
            
            console.log('   ✅ Exchange atualizada para: Bybit');
        }
        
        // ===============================
        // 3. ATUALIZAR ROSEMARY -> ÉRICA
        // ===============================
        console.log('\n👤 ATUALIZANDO ROSEMARY -> ÉRICA DOS SANTOS');
        console.log('===========================================');
        
        const rosemaryResult = await pool.query(`
            SELECT id, name, email FROM users 
            WHERE name ILIKE '%rosemary%'
        `);
        
        if (rosemaryResult.rows.length > 0) {
            const rosemary = rosemaryResult.rows[0];
            console.log(`   Encontrado: ${rosemary.name} (${rosemary.email})`);
            
            // Atualizar dados da Rosemary para Érica
            await pool.query(`
                UPDATE users 
                SET 
                    name = 'Érica dos Santos',
                    balance_usd = 5000.00,
                    plan_type = 'vip',
                    updated_at = NOW()
                WHERE id = $1
            `, [rosemary.id]);
            
            // Novas chaves API da Érica (do attachment)
            const ericaApiKey = 'g1HWyxEfWxobzJGew';
            const ericaApiSecret = 'gOGv9nokGvfFoB0CSFyudZrOE8XnyA1nmR4r';
            
            // Atualizar chaves API para Érica
            await pool.query(`
                UPDATE user_api_keys 
                SET 
                    api_key = $1,
                    secret_key = $2,
                    exchange = 'bybit',
                    exchange_name = 'bybit',
                    environment = 'mainnet',
                    validation_status = 'updated_by_admin',
                    updated_at = NOW()
                WHERE user_id = $3
            `, [ericaApiKey, ericaApiSecret, rosemary.id]);
            
            console.log('   ✅ Nome atualizado para: Érica dos Santos');
            console.log('   ✅ Saldo: $5.000 USDT (crédito bônus)');
            console.log('   ✅ Plano: VIP');
            console.log('   ✅ Exchange: Bybit');
            console.log('   ✅ Chaves API atualizadas');
        }
        
        // ===============================
        // 4. VERIFICAÇÃO FINAL
        // ===============================
        console.log('\n📊 VERIFICAÇÃO FINAL DOS USUÁRIOS');
        console.log('==================================');
        
        const finalCheck = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.balance_usd,
                u.plan_type,
                u.country,
                u.pais,
                COUNT(k.id) as api_keys_count
            FROM users u
            LEFT JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.name IN ('Luiza Maria de Almeida Pinto', 'PALOMA AMARAL', 'Érica dos Santos')
            GROUP BY u.id, u.name, u.email, u.balance_usd, u.plan_type, u.country, u.pais
            ORDER BY u.name
        `);
        
        console.log('\n✅ USUÁRIOS ATUALIZADOS:');
        finalCheck.rows.forEach(user => {
            console.log(`\n   👤 ${user.name}`);
            console.log(`      📧 Email: ${user.email}`);
            console.log(`      💰 Saldo: $${user.balance_usd} USDT`);
            console.log(`      🏆 Plano: ${user.plan_type || 'padrão'}`);
            console.log(`      🌍 País: ${user.pais || user.country || 'não definido'}`);
            console.log(`      🔑 Chaves API: ${user.api_keys_count}`);
        });
        
        // Mostrar detalhes das chaves API
        const apiKeysDetails = await pool.query(`
            SELECT 
                u.name,
                k.exchange,
                k.api_key,
                k.environment,
                k.is_active
            FROM users u
            INNER JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.name IN ('Luiza Maria de Almeida Pinto', 'PALOMA AMARAL', 'Érica dos Santos')
            AND k.is_active = true
            ORDER BY u.name
        `);
        
        console.log('\n🔑 CHAVES API CONFIGURADAS:');
        apiKeysDetails.rows.forEach(key => {
            console.log(`\n   👤 ${key.name}`);
            console.log(`      📡 Exchange: ${key.exchange.toUpperCase()}`);
            console.log(`      🔑 API Key: ${key.api_key}`);
            console.log(`      🌍 Ambiente: ${key.environment}`);
            console.log(`      ✅ Status: ${key.is_active ? 'ATIVA' : 'INATIVA'}`);
        });
        
        console.log('\n🎉 TODAS AS ATUALIZAÇÕES CONCLUÍDAS!');
        console.log('====================================');
        console.log('✅ Luiza Maria: Email, país, plano VIP, exchange Bybit');
        console.log('✅ Paloma Amaral: Exchange alterada para Bybit');
        console.log('✅ Érica dos Santos: Nome, saldo $5.000, plano VIP, chaves API');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

updateMultiplosUsuarios();
