/**
 * 🧪 TESTE DA CHAVE BYBIT - DIRETO DO BANCO
 * 
 * Testar a chave da Luiza pegando diretamente do banco de dados
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🧪 TESTE DA CHAVE BYBIT - DIRETO DO BANCO');
console.log('========================================');

async function testarChaveDoBanco() {
    try {
        console.log('\n📊 1. BUSCANDO CHAVE DA LUIZA NO BANCO:');
        
        const result = await pool.query(`
            SELECT 
                u.name,
                u.email,
                uak.api_key,
                uak.secret_key,
                uak.environment,
                uak.validation_status,
                uak.updated_at,
                LENGTH(uak.api_key) as api_len,
                LENGTH(uak.secret_key) as secret_len
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE u.name ILIKE '%luiza%' 
            AND uak.exchange = 'bybit'
        `);
        
        if (result.rows.length === 0) {
            console.log('❌ Chave da Luiza não encontrada!');
            return;
        }
        
        const luiza = result.rows[0];
        console.log(`👤 Usuário: ${luiza.name} (${luiza.email})`);
        console.log(`🔑 API Key: ${luiza.api_key} (${luiza.api_len} chars)`);
        console.log(`🔐 Secret: ${luiza.secret_key?.substring(0, 20)}... (${luiza.secret_len} chars)`);
        console.log(`🌍 Ambiente: ${luiza.environment}`);
        console.log(`📊 Status: ${luiza.validation_status}`);
        console.log(`📅 Atualizada: ${new Date(luiza.updated_at).toLocaleString('pt-BR')}`);
        
        console.log('\n🧪 2. TESTANDO CHAVE DIRETO DO BANCO:');
        
        // Teste 1: Account Info
        console.log('\n📋 Teste 1: Account Info');
        await testarAccountInfo(luiza);
        
        // Teste 2: Wallet Balance
        console.log('\n💰 Teste 2: Wallet Balance');
        await testarWalletBalance(luiza);
        
        // Teste 3: Position List
        console.log('\n📈 Teste 3: Position List');
        await testarPositionList(luiza);
        
        console.log('\n✅ TESTE COMPLETO FINALIZADO!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        console.error(error.stack);
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
        
        // Formato correto: timestamp + apiKey + recvWindow (sem query para account/info)
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
        console.log(`   🔐 Signature: ${signature.substring(0, 20)}...`);
        
        const response = await fetch(`${baseUrl}/v5/account/info`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        console.log(`   📊 Status HTTP: ${response.status}`);
        console.log(`   📋 RetCode: ${data.retCode}`);
        console.log(`   📋 RetMsg: ${data.retMsg}`);
        
        if (data.retCode === 0) {
            console.log('   ✅ SUCESSO: Account Info OK!');
            if (data.result) {
                console.log(`   📊 Margin Mode: ${data.result.marginMode}`);
                console.log(`   📊 DCP Status: ${data.result.dcpStatus}`);
                console.log(`   📊 Unified Margin Status: ${data.result.unifiedMarginStatus}`);
            }
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
        const query = 'accountType=UNIFIED';
        
        // Formato correto: timestamp + apiKey + recvWindow + query
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
        console.log(`   🔐 Signature: ${signature.substring(0, 20)}...`);
        
        const response = await fetch(`${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        console.log(`   📊 Status HTTP: ${response.status}`);
        console.log(`   📋 RetCode: ${data.retCode}`);
        console.log(`   📋 RetMsg: ${data.retMsg}`);
        
        if (data.retCode === 0 && data.result && data.result.list && data.result.list.length > 0) {
            console.log('   ✅ SUCESSO: Wallet Balance OK!');
            const account = data.result.list[0];
            console.log(`   💰 Total Equity: ${account.totalEquity} USD`);
            console.log(`   💳 Total Wallet: ${account.totalWalletBalance} USD`);
            console.log(`   💵 Total Available: ${account.totalAvailableBalance} USD`);
            
            if (account.coin && account.coin.length > 0) {
                console.log('   🪙 Moedas com saldo:');
                account.coin.forEach(coin => {
                    if (parseFloat(coin.walletBalance) > 0) {
                        console.log(`      ${coin.coin}: ${coin.walletBalance} (Equity: ${coin.equity})`);
                    }
                });
            }
        } else {
            console.log(`   ❌ ERRO: ${data.retMsg || 'Sem dados de saldo'}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Erro de conexão: ${error.message}`);
    }
}

async function testarPositionList(chave) {
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const query = 'category=linear';
        
        // Formato correto: timestamp + apiKey + recvWindow + query
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
        
        console.log(`   📤 URL: ${baseUrl}/v5/position/list?category=linear`);
        console.log(`   🔐 Signature: ${signature.substring(0, 20)}...`);
        
        const response = await fetch(`${baseUrl}/v5/position/list?category=linear`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        console.log(`   📊 Status HTTP: ${response.status}`);
        console.log(`   📋 RetCode: ${data.retCode}`);
        console.log(`   📋 RetMsg: ${data.retMsg}`);
        
        if (data.retCode === 0) {
            console.log('   ✅ SUCESSO: Position List OK!');
            if (data.result && data.result.list) {
                console.log(`   📈 Total de posições: ${data.result.list.length}`);
                
                const positionsWithBalance = data.result.list.filter(pos => 
                    parseFloat(pos.size) > 0 || parseFloat(pos.positionValue) > 0
                );
                
                if (positionsWithBalance.length > 0) {
                    console.log('   📊 Posições ativas:');
                    positionsWithBalance.forEach(pos => {
                        console.log(`      ${pos.symbol}: Size ${pos.size}, Value ${pos.positionValue}`);
                    });
                } else {
                    console.log('   📊 Nenhuma posição ativa encontrada');
                }
            }
        } else {
            console.log(`   ❌ ERRO: ${data.retMsg}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Erro de conexão: ${error.message}`);
    }
}

// Executar teste
testarChaveDoBanco().catch(console.error);
