const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

async function configureAPIKeyStatus() {
    try {
        console.log('🔧 CONFIGURANDO STATUS DAS CHAVES API...\n');
        
        // 1. Verificar todas as chaves
        console.log('1️⃣ Status atual das chaves:');
        const allKeys = await pool.query(`
            SELECT u.id, u.username, uak.exchange, uak.environment, uak.is_valid
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            ORDER BY u.id, uak.exchange
        `);
        
        allKeys.rows.forEach(row => {
            console.log(`  User ${row.id} (${row.username}): ${row.exchange} (${row.environment}) - Valid: ${row.is_valid || 'NULL'}`);
        });
        
        // 2. Atualizar status baseado nos testes
        console.log('\n2️⃣ Atualizando status baseado nos testes:');
        
        // Bybit User 15 e 16 - Funcionando
        await pool.query(`
            UPDATE user_api_keys 
            SET is_valid = true, validation_status = 'working', validation_error = NULL
            WHERE user_id IN (15, 16) AND exchange = 'bybit'
        `);
        console.log(`  ✅ Bybit Users 15, 16: Marcadas como válidas`);
        
        // Bybit User 14 - Restrição IP
        await pool.query(`
            UPDATE user_api_keys 
            SET is_valid = false, validation_status = 'ip_restricted', validation_error = 'Unmatched IP, please check API key bound IP addresses'
            WHERE user_id = 14 AND exchange = 'bybit'
        `);
        console.log(`  ⚠️ Bybit User 14: Marcada como restrita por IP`);
        
        // Binance - Chave inválida
        await pool.query(`
            UPDATE user_api_keys 
            SET is_valid = false, validation_status = 'invalid_key', validation_error = 'Invalid API-key, IP, or permissions for action'
            WHERE exchange = 'binance'
        `);
        console.log(`  ❌ Binance: Marcada como chave inválida`);
        
        // 3. Verificar resultado final
        console.log('\n3️⃣ Status final das chaves:');
        const finalStatus = await pool.query(`
            SELECT u.id, u.username, uak.exchange, uak.environment, 
                   uak.is_valid, uak.validation_status, uak.validation_error
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            ORDER BY u.id, uak.exchange
        `);
        
        finalStatus.rows.forEach(row => {
            const status = row.is_valid ? '✅' : '❌';
            console.log(`  ${status} User ${row.id} (${row.username}): ${row.exchange} (${row.environment})`);
            console.log(`     Status: ${row.validation_status || 'unknown'}`);
            if (row.validation_error) {
                console.log(`     Erro: ${row.validation_error}`);
            }
            console.log('');
        });
        
        // 4. Resumo operacional
        console.log('📊 RESUMO OPERACIONAL:');
        const workingKeys = finalStatus.rows.filter(row => row.is_valid);
        const restrictedKeys = finalStatus.rows.filter(row => !row.is_valid && row.validation_status === 'ip_restricted');
        const invalidKeys = finalStatus.rows.filter(row => !row.is_valid && row.validation_status === 'invalid_key');
        
        console.log(`✅ Chaves funcionais: ${workingKeys.length}`);
        console.log(`⚠️ Chaves com restrição IP: ${restrictedKeys.length}`);
        console.log(`❌ Chaves inválidas: ${invalidKeys.length}`);
        
        console.log('\n💡 RECOMENDAÇÕES:');
        console.log('1. Chaves Bybit Users 15,16: ✅ FUNCIONANDO - Coletando saldos reais');
        console.log('2. Chave Bybit User 14: ⚠️ Configurar IP permitido no painel Bybit');
        console.log('3. Chave Binance: ❌ Criar nova chave válida no Binance Testnet');
        
        await pool.end();
        console.log('\n✅ Configuração concluída!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        await pool.end();
    }
}

configureAPIKeyStatus();
