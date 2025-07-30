const crypto = require('crypto');

// Testar apenas a chave compartilhada das variáveis de ambiente
async function testSharedKey() {
    try {
        console.log('🔍 TESTE DE CHAVE COMPARTILHADA - API V5');
        console.log('=======================================');
        
        // Chaves das variáveis de ambiente
        const apiKey = 'q3JH2TYGwCHaupbwgG';
        const secretKey = 'GqF3E7RZWHBhERnBTUBK4l2qpSiVF3GBWEs';
        
        console.log(`🔑 API Key: ${apiKey} (${apiKey.length} chars)`);
        console.log(`🔐 Secret Key: ${secretKey.substring(0,20)}... (${secretKey.length} chars)`);
        
        // Testar assinatura correta para API V5
        const timestamp = Date.now().toString();
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
            console.log(`   ✅ SUCESSO! Chave compartilhada funcionando`);
            console.log(`   📄 Dados: ${JSON.stringify(data.result || 'OK').substring(0,100)}...`);
            
            // Testar também wallet balance
            console.log(`\n🔄 Testando wallet balance...`);
            await testWalletBalance(apiKey, secretKey);
            
        } else {
            console.log(`   ❌ FALHA: ${data.retMsg}`);
        }
        
        return data.retCode === 0;
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        return false;
    }
}

async function testWalletBalance(apiKey, secretKey) {
    try {
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const params = 'accountType=UNIFIED';
        
        const message = timestamp + apiKey + recvWindow + params;
        const signature = crypto.createHmac('sha256', secretKey).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        const response = await fetch(`https://api.bybit.com/v5/account/wallet-balance?${params}`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        console.log(`   📊 Wallet Balance Result:`);
        console.log(`      RetCode: ${data.retCode}`);
        console.log(`      RetMsg: ${data.retMsg}`);
        
        if (data.retCode === 0) {
            console.log(`      ✅ Wallet balance OK`);
            if (data.result && data.result.list) {
                data.result.list.forEach(account => {
                    console.log(`         💰 Account: ${account.accountType}`);
                    if (account.coin && account.coin.length > 0) {
                        account.coin.forEach(coin => {
                            if (parseFloat(coin.walletBalance) > 0) {
                                console.log(`            ${coin.coin}: ${coin.walletBalance}`);
                            }
                        });
                    }
                });
            }
        } else {
            console.log(`      ❌ Wallet balance falhou: ${data.retMsg}`);
        }
        
    } catch (error) {
        console.error('❌ Erro no wallet balance:', error.message);
    }
}

testSharedKey();
