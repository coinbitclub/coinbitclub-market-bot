/**
 * 🔍 VERIFICAÇÃO REAL DAS CHAVES NO BANCO
 * ======================================
 * 
 * Vamos buscar as chaves reais que estão funcionando
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔍 VERIFICAÇÃO DAS CHAVES REAIS NO BANCO');
console.log('======================================');

async function verificarChavesReais() {
    try {
        // Buscar chaves que foram validadas como 'valid'
        console.log('\n📊 1. CHAVES MARCADAS COMO VÁLIDAS:');
        const validKeys = await pool.query(`
            SELECT u.id, u.name, u.username, u.email,
                   uak.exchange, uak.environment, 
                   uak.api_key, uak.api_secret,
                   uak.validation_status, uak.last_validated, uak.error_message
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE uak.validation_status = 'valid'
            ORDER BY u.id, uak.exchange
        `);
        
        console.log(`🔑 Encontradas ${validKeys.rows.length} chaves válidas:`);
        for (const key of validKeys.rows) {
            console.log(`👤 ID ${key.id} - ${key.name} (${key.exchange})`);
            console.log(`   🔑 API: ${key.api_key}`);
            console.log(`   🔐 Secret: ${key.api_secret ? key.api_secret.substring(0, 20) + '...' : 'N/A'}`);
            console.log(`   🌐 Env: ${key.environment}`);
            console.log(`   ✅ Validado em: ${key.last_validated}`);
            console.log('');
        }

        // Buscar histórico de saldos coletados com sucesso
        console.log('\n📊 2. ÚLTIMOS SALDOS COLETADOS COM SUCESSO:');
        const successBalances = await pool.query(`
            SELECT b.user_id, u.name, b.exchange, b.asset, b.balance, b.collected_at,
                   uak.api_key, uak.validation_status
            FROM balances b
            INNER JOIN users u ON b.user_id = u.id
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id AND b.exchange = uak.exchange
            WHERE b.balance > 0
            ORDER BY b.collected_at DESC
            LIMIT 10
        `);
        
        console.log(`💰 Encontrados ${successBalances.rows.length} saldos com valor > 0:`);
        for (const balance of successBalances.rows) {
            console.log(`👤 ID ${balance.user_id} - ${balance.name} (${balance.exchange})`);
            console.log(`   💰 ${balance.asset}: ${balance.balance}`);
            console.log(`   📅 Coletado: ${balance.collected_at}`);
            console.log(`   🔑 API: ${balance.api_key || 'N/A'}`);
            console.log(`   ✅ Status: ${balance.validation_status || 'N/A'}`);
            console.log('');
        }

        // Buscar todas as chaves de usuários específicos
        console.log('\n📊 3. TODAS AS CHAVES DOS USUÁRIOS 14, 15, 16:');
        const allKeys = await pool.query(`
            SELECT u.id, u.name, u.username, u.email,
                   uak.exchange, uak.environment, 
                   uak.api_key, uak.api_secret,
                   uak.validation_status, uak.last_validated, uak.error_message
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.id IN (14, 15, 16)
            ORDER BY u.id, uak.exchange
        `);
        
        console.log(`🔍 Encontradas ${allKeys.rows.length} chaves para usuários 14-16:`);
        for (const key of allKeys.rows) {
            console.log(`👤 ID ${key.id} - ${key.name} (${key.exchange})`);
            console.log(`   📧 Email: ${key.email}`);
            console.log(`   🔑 API: ${key.api_key}`);
            console.log(`   🔐 Secret: ${key.api_secret ? key.api_secret.substring(0, 20) + '...' : 'N/A'}`);
            console.log(`   🌐 Env: ${key.environment}`);
            console.log(`   ✅ Status: ${key.validation_status || 'pending'}`);
            console.log(`   ❌ Erro: ${key.error_message || 'N/A'}`);
            console.log(`   📅 Validado: ${key.last_validated || 'N/A'}`);
            console.log('');
        }

        // Identificar qual foi a última chave que coletou com sucesso
        console.log('\n🎯 4. IDENTIFICANDO CHAVES QUE REALMENTE FUNCIONAM:');
        
        // Filtrar chaves com saldos recentes
        const workingKeys = allKeys.rows.filter(key => {
            // Procurar saldos recentes para esta chave
            const recentBalance = successBalances.rows.find(b => 
                b.user_id === key.id && b.exchange === key.exchange
            );
            return recentBalance && recentBalance.balance > 0;
        });
        
        if (workingKeys.length > 0) {
            console.log(`🎉 Encontradas ${workingKeys.length} chaves que coletaram saldos:`);
            for (const key of workingKeys) {
                console.log(`✅ ID ${key.id} - ${key.name} (${key.exchange})`);
                console.log(`   🔑 API: ${key.api_key}`);
                console.log(`   🔐 Secret: ${key.api_secret.substring(0, 20)}...`);
            }
        } else {
            console.log('⚠️ Nenhuma chave encontrada com saldos recentes coletados');
        }

    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
    } finally {
        pool.end();
    }
}

// Executar verificação
verificarChavesReais();
