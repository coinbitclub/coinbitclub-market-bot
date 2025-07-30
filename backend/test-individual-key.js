const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Testar apenas um usuário com sua chave individual primeiro
async function testIndividualKey() {
    try {
        console.log('🔍 TESTE DE CHAVE INDIVIDUAL - API V5');
        console.log('====================================');
        
        // Buscar usuário com chave individual (ex: Érica)
        const result = await pool.query(`
            SELECT u.id, u.name, ak.api_key, ak.secret_key
            FROM users u 
            JOIN user_api_keys ak ON u.id = ak.user_id 
            WHERE ak.is_active = true AND u.name = 'Érica dos Santos'
            LIMIT 1
        `);
        
        if (result.rows.length === 0) {
            console.log('❌ Nenhuma chave individual encontrada');
            return;
        }
        
        const user = result.rows[0];
        console.log(`\n👤 Usuário: ${user.name} (ID: ${user.id})`);
        console.log(`🔑 API Key: ${user.api_key.substring(0,20)}... (${user.api_key.length} chars)`);
        console.log(`🔐 Secret Key: ${user.secret_key.substring(0,20)}... (${user.secret_key.length} chars)`);
        
        // Testar assinatura correta para API V5
        const timestamp = Date.now().toString();
        const apiKey = user.api_key;
        const secretKey = user.secret_key;
        const recvWindow = '5000';
        
        // Para endpoint simples sem parâmetros
        const message = timestamp + apiKey + recvWindow;
        const signature = crypto.createHmac('sha256', secretKey).update(message).digest('hex');
        
        console.log(`\n📝 TESTE DE ASSINATURA:`);
        console.log(`   Timestamp: ${timestamp}`);
        console.log(`   Message: ${message}`);
        console.log(`   Signature: ${signature}`);
        
        // Fazer requisição real para API V5
        const headers = {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        console.log(`\n🔄 Fazendo requisição para /v5/account/info...`);
        
        const response = await fetch('https://api.bybit.com/v5/account/info', {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        console.log(`\n📊 RESULTADO:`);
        console.log(`   Status: ${response.status}`);
        console.log(`   RetCode: ${data.retCode}`);
        console.log(`   RetMsg: ${data.retMsg}`);
        
        if (data.retCode === 0) {
            console.log(`   ✅ SUCESSO! Chave individual funcionando`);
            console.log(`   📄 Dados: ${JSON.stringify(data.result || 'OK').substring(0,100)}...`);
        } else {
            console.log(`   ❌ FALHA: ${data.retMsg}`);
        }
        
        return data.retCode === 0;
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        return false;
    } finally {
        pool.end();
    }
}

testIndividualKey();
