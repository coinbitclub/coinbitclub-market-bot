/**
 * 🧪 TESTE RÁPIDO - BYBIT API V5 COM ASSINATURA CORRIGIDA
 * 
 * Baseado no código funcional fornecido pelo usuário
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🧪 TESTE RÁPIDO - BYBIT API V5 CORRIGIDA');
console.log('=======================================');

async function testeRapidoBybit() {
    try {
        // Buscar uma chave do banco para testar
        const query = `
            SELECT api_key, secret_key, environment 
            FROM user_api_keys 
            WHERE exchange = 'bybit' AND is_active = true 
            LIMIT 1
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            console.log('❌ Nenhuma chave Bybit encontrada no banco');
            return;
        }
        
        const chave = result.rows[0];
        console.log(`🔑 Testando chave: ${chave.api_key.substring(0, 12)}...`);
        console.log(`🌍 Ambiente: ${chave.environment}`);
        
        // Teste 1: Account Info (seu código funcional adaptado)
        console.log('\n📊 Teste 1: Account Info');
        await testarAccountInfo(chave);
        
        // Teste 2: Wallet Balance (seu código funcional)
        console.log('\n💰 Teste 2: Wallet Balance');
        await testarWalletBalance(chave);
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        await pool.end();
    }
}

async function testarAccountInfo(chave) {
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        // Formato corrigido: timestamp + apiKey + recvWindow (sem query para account/info)
        const signPayload = timestamp + chave.api_key + recvWindow;
        const signature = crypto.createHmac('sha256', chave.secret_key).update(signPayload).digest('hex');
        
        const headers = {
            'Content-Type': 'application/json',
            'X-BAPI-API-KEY': chave.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'X-BAPI-SIGN-TYPE': '2'
        };
        
        console.log(`   📤 URL: ${baseUrl}/v5/account/info`);
        console.log(`   🔐 Signature payload: ${signPayload.substring(0, 50)}...`);
        
        const response = await fetch(`${baseUrl}/v5/account/info`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        console.log(`   📊 Status: ${response.status}`);
        console.log(`   📋 Resposta: ${JSON.stringify(data, null, 2)}`);
        
        if (data.retCode === 0) {
            console.log('   ✅ SUCESSO: Account Info funcionando!');
        } else {
            console.log(`   ❌ ERRO: ${data.retMsg}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Erro de conexão: ${error.message}`);
    }
}

async function testarWalletBalance(chave) {
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        // Exatamente como seu código funcional
        const query = 'accountType=UNIFIED';
        const signPayload = timestamp + chave.api_key + recvWindow + query;
        const signature = crypto.createHmac('sha256', chave.secret_key).update(signPayload).digest('hex');
        
        const headers = {
            'Content-Type': 'application/json',
            'X-BAPI-API-KEY': chave.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'X-BAPI-SIGN-TYPE': '2'
        };
        
        console.log(`   📤 URL: ${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`);
        console.log(`   🔐 Signature payload: ${signPayload.substring(0, 50)}...`);
        
        const response = await fetch(`${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        console.log(`   📊 Status: ${response.status}`);
        
        if (data.retCode === 0) {
            console.log('   ✅ SUCESSO: Wallet Balance funcionando!');
            
            if (data.result && data.result.list && data.result.list.length > 0) {
                const account = data.result.list[0];
                console.log(`   💰 Total Equity: ${account.totalEquity} USD`);
                console.log(`   💳 Total Wallet Balance: ${account.totalWalletBalance} USD`);
                
                if (account.coin && account.coin.length > 0) {
                    console.log('   🪙 Moedas com saldo:');
                    account.coin.forEach(coin => {
                        if (parseFloat(coin.walletBalance) > 0) {
                            console.log(`      ${coin.coin}: ${coin.walletBalance}`);
                        }
                    });
                }
            }
        } else {
            console.log(`   ❌ ERRO: ${data.retMsg}`);
            console.log(`   📋 Resposta completa: ${JSON.stringify(data, null, 2)}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Erro de conexão: ${error.message}`);
    }
}

// Executar teste
testeRapidoBybit().catch(console.error);
