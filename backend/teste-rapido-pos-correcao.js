
// 🧪 TESTE RÁPIDO PÓS-CORREÇÃO
// Execute: node teste-rapido-pos-correcao.js

const { Pool } = require('pg');
const crypto = require('crypto');
const https = require('https');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function testarPosCorrecao() {
    console.log('🧪 TESTE RÁPIDO PÓS-CORREÇÃO');
    console.log('============================');
    
    // Buscar chaves da Paloma
    const paloma = await pool.query(`
        SELECT k.api_key, k.secret_key 
        FROM user_api_keys k
        JOIN users u ON k.user_id = u.id
        WHERE u.name ILIKE '%paloma%' AND k.exchange = 'bybit'
    `);
    
    if (paloma.rows.length === 0) {
        console.log('❌ Paloma não encontrada');
        return;
    }
    
    const { api_key, secret_key } = paloma.rows[0];
    console.log(`🔑 Testando chaves: ${api_key.substring(0, 8)}...`);
    
    // Testar autenticação
    const timestamp = Date.now().toString();
    const signature = crypto
        .createHmac('sha256', secret_key)
        .update(timestamp + api_key + '5000')
        .digest('hex');
    
    const options = {
        hostname: 'api.bybit.com',
        path: '/v5/user/query-api',
        method: 'GET',
        headers: {
            'X-BAPI-API-KEY': api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': '5000'
        }
    };
    
    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            const response = JSON.parse(data);
            if (response.retCode === 0) {
                console.log('✅ SUCESSO! Chaves funcionando corretamente');
                console.log(`📊 Dados: ${JSON.stringify(response.result).substring(0, 100)}...`);
            } else {
                console.log(`❌ ERRO: ${response.retMsg}`);
            }
            pool.end();
        });
    });
    
    req.on('error', (error) => {
        console.log(`❌ ERRO DE CONEXÃO: ${error.message}`);
        pool.end();
    });
    
    req.end();
}

testarPosCorrecao();
        