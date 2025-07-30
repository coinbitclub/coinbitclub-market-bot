const { Pool } = require('pg');
const axios = require('axios');
const crypto = require('crypto');

// Configuração do banco Railway
const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Função para criar assinatura Bybit (versão otimizada)
function createBybitSignature(timestamp, apiKey, recvWindow, queryString, apiSecret) {
    const message = timestamp + apiKey + recvWindow + queryString;
    return crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
}

// Função para debug detalhado da requisição
async function debugBybitRequest() {
    console.log('🔍 DEBUG DETALHADO: HEADERS E IMPLEMENTAÇÃO');
    console.log('=============================================');

    try {
        // Buscar chave API da Érica (a que atualizamos)
        const userQuery = `
            SELECT api_key, api_secret, nome 
            FROM users 
            WHERE api_key = 'rg1HWyxEfWwobzJGew'
            LIMIT 1
        `;
        
        const userResult = await pool.query(userQuery);
        
        if (userResult.rows.length === 0) {
            console.log('❌ Usuário não encontrado');
            return;
        }

        const user = userResult.rows[0];
        console.log(`👤 Testando usuário: ${user.nome || 'Érica'}`);
        console.log(`🔑 API Key: ${user.api_key}`);
        console.log(`🗝️ Secret: ${user.api_secret.substring(0, 10)}...`);

        // Parâmetros da requisição
        const apiKey = user.api_key;
        const apiSecret = user.api_secret;
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const endpoint = '/v5/account/wallet-balance';
        const queryString = 'accountType=UNIFIED';
        
        // Criar assinatura
        const signature = createBybitSignature(timestamp, apiKey, recvWindow, queryString, apiSecret);
        
        console.log('\n📋 PARÂMETROS DA REQUISIÇÃO:');
        console.log(`   • Timestamp: ${timestamp}`);
        console.log(`   • RecvWindow: ${recvWindow}`);
        console.log(`   • QueryString: ${queryString}`);
        console.log(`   • Signature: ${signature}`);

        // Headers versão 1 (atual)
        const headers1 = {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-SIGN': signature,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };

        // Headers versão 2 (com User-Agent específico)
        const headers2 = {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-SIGN': signature,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; CoinTech2U/1.0)'
        };

        // Headers versão 3 (máximo compatibilidade)
        const headers3 = {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-SIGN': signature,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'NodeJS/CoinBitClub-Bot'
        };

        console.log('\n🧪 TESTE 1: Headers básicos');
        try {
            const response1 = await axios.get(
                `https://api.bybit.com${endpoint}?${queryString}`,
                { headers: headers1, timeout: 10000 }
            );
            console.log(`   ✅ Status: ${response1.status}`);
            console.log(`   📊 RetCode: ${response1.data.retCode}`);
            console.log(`   📝 RetMsg: ${response1.data.retMsg}`);
        } catch (error) {
            if (error.response) {
                console.log(`   ❌ Status: ${error.response.status}`);
                console.log(`   📊 RetCode: ${error.response.data?.retCode}`);
                console.log(`   📝 RetMsg: ${error.response.data?.retMsg}`);
            } else {
                console.log(`   ❌ Erro: ${error.message}`);
            }
        }

        console.log('\n🧪 TESTE 2: Headers com User-Agent CoinTech2U');
        try {
            const response2 = await axios.get(
                `https://api.bybit.com${endpoint}?${queryString}`,
                { headers: headers2, timeout: 10000 }
            );
            console.log(`   ✅ Status: ${response2.status}`);
            console.log(`   📊 RetCode: ${response2.data.retCode}`);
            console.log(`   📝 RetMsg: ${response2.data.retMsg}`);
        } catch (error) {
            if (error.response) {
                console.log(`   ❌ Status: ${error.response.status}`);
                console.log(`   📊 RetCode: ${error.response.data?.retCode}`);
                console.log(`   📝 RetMsg: ${error.response.data?.retMsg}`);
            } else {
                console.log(`   ❌ Erro: ${error.message}`);
            }
        }

        console.log('\n🧪 TESTE 3: Headers completos');
        try {
            const response3 = await axios.get(
                `https://api.bybit.com${endpoint}?${queryString}`,
                { headers: headers3, timeout: 10000 }
            );
            console.log(`   ✅ Status: ${response3.status}`);
            console.log(`   📊 RetCode: ${response3.data.retCode}`);
            console.log(`   📝 RetMsg: ${response3.data.retMsg}`);
        } catch (error) {
            if (error.response) {
                console.log(`   ❌ Status: ${error.response.status}`);
                console.log(`   📊 RetCode: ${error.response.data?.retCode}`);
                console.log(`   📝 RetMsg: ${error.response.data?.retMsg}`);
            } else {
                console.log(`   ❌ Erro: ${error.message}`);
            }
        }

        // Teste de endpoint diferente
        console.log('\n🧪 TESTE 4: Endpoint diferente (account info)');
        const endpoint2 = '/v5/account/info';
        const queryString2 = '';
        const signature2 = createBybitSignature(timestamp, apiKey, recvWindow, queryString2, apiSecret);
        
        const headers4 = {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-SIGN': signature2,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };

        try {
            const response4 = await axios.get(
                `https://api.bybit.com${endpoint2}`,
                { headers: headers4, timeout: 10000 }
            );
            console.log(`   ✅ Status: ${response4.status}`);
            console.log(`   📊 RetCode: ${response4.data.retCode}`);
            console.log(`   📝 RetMsg: ${response4.data.retMsg}`);
        } catch (error) {
            if (error.response) {
                console.log(`   ❌ Status: ${error.response.status}`);
                console.log(`   📊 RetCode: ${error.response.data?.retCode}`);
                console.log(`   📝 RetMsg: ${error.response.data?.retMsg}`);
            } else {
                console.log(`   ❌ Erro: ${error.message}`);
            }
        }

        console.log('\n🔍 ANÁLISE DO IP COINTECH2U:');
        console.log('=============================');
        
        // Verificar se podemos descobrir o IP do cointech2u
        try {
            const ipResponse = await axios.get('https://api.ipify.org?format=json');
            console.log(`🌐 IP atual (Railway): ${ipResponse.data.ip}`);
            
            console.log('\n💡 POSSÍVEIS SOLUÇÕES:');
            console.log('   1. Cointech2u pode estar rodando em servidor próprio');
            console.log('   2. IP diferente na whitelist do Bybit');
            console.log('   3. Configuração de proxy/VPN');
            console.log('   4. Versão diferente da API');
            
        } catch (error) {
            console.log('❌ Erro ao verificar IP:', error.message);
        }

    } catch (error) {
        console.error('❌ Erro no debug:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar debug
debugBybitRequest();
