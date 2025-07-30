const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function debugAllKeys() {
    try {
        console.log('🔍 DEBUG COMPLETO - TODAS AS CHAVES E SECRETS');
        console.log('============================================');
        
        // 1. Buscar todas as chaves do banco
        const dbKeys = await pool.query(`
            SELECT u.name, ak.api_key, ak.secret_key, ak.validation_status
            FROM user_api_keys ak
            JOIN users u ON ak.user_id = u.id
            WHERE ak.is_active = true
            ORDER BY u.name
        `);
        
        console.log('\n📋 CHAVES NO BANCO DE DADOS:');
        dbKeys.rows.forEach(key => {
            console.log(`   👤 ${key.name}:`);
            console.log(`      🔑 API: ${key.api_key} (${key.api_key.length} chars)`);
            console.log(`      🔐 Secret: ${key.secret_key.substring(0,30)}... (${key.secret_key.length} chars)`);
            console.log(`      📊 Status: ${key.validation_status}`);
            console.log('');
        });
        
        // 2. Testar cada combinação
        console.log('\n🧪 TESTANDO CADA CHAVE COM API V5:');
        console.log('==================================');
        
        for (const key of dbKeys.rows) {
            console.log(`\n🔄 Testando: ${key.name}`);
            const success = await testSingleKey(key.api_key, key.secret_key, key.name);
            
            if (success) {
                console.log(`   ✅ ${key.name}: FUNCIONANDO!`);
            } else {
                console.log(`   ❌ ${key.name}: Não funcionou`);
            }
            
            // Aguardar para evitar rate limit
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 3. Testar também as chaves das variáveis de ambiente
        console.log(`\n🌐 Testando chave das variáveis de ambiente:`);
        const envSuccess = await testSingleKey(
            'q3JH2TYGwCHaupbwgG', 
            'GqF3E7RZWHBhERnBTUBK4l2qpSiVF3GBWEs', 
            'Variáveis ENV'
        );
        
        if (envSuccess) {
            console.log(`   ✅ Variáveis ENV: FUNCIONANDO!`);
        } else {
            console.log(`   ❌ Variáveis ENV: Não funcionou`);
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

async function testSingleKey(apiKey, secretKey, name) {
    try {
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        // String de assinatura para API V5
        const message = timestamp + apiKey + recvWindow;
        const signature = crypto.createHmac('sha256', secretKey).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        const response = await fetch('https://api.bybit.com/v5/account/info', {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        console.log(`      📊 RetCode: ${data.retCode} | RetMsg: ${data.retMsg}`);
        
        return data.retCode === 0;
        
    } catch (error) {
        console.error(`      ❌ Erro: ${error.message}`);
        return false;
    }
}

debugAllKeys();
