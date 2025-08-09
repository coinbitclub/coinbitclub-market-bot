/**
 * 🔍 TESTE COM CHAVES HARDCODED CONHECIDAS
 * ========================================
 * 
 * Vamos testar com as chaves que sabemos que funcionavam
 */

const crypto = require('crypto');

// Chaves que testamos antes
const testKeys = [
    {
        name: "Paloma Amaral",
        apiKey: "15t5ByCJWFAKOvNF0E",
        apiSecret: "LxHPOFcxzZ6v9l0HYLm9GUvhm6TaF6PQX1vN"
    },
    {
        name: "Erica dos Santos", 
        apiKey: "3rz1Bwm3SFdF3Aep8Z",
        apiSecret: "TPXH43y8r9YGsIYO5l3HXzjH3a6dWL1oi2vG"
    }
];

async function testBybitAPI(apiKey, apiSecret) {
    const baseUrl = 'https://api.bybit.com';
    const endpoint = '/v5/account/wallet-balance';
    
    // Parâmetros da requisição
    const timestamp = Date.now();
    const accountType = 'UNIFIED';
    
    // Query string
    const queryString = `accountType=${accountType}&api_key=${apiKey}&timestamp=${timestamp}`;
    
    // Gerar assinatura HMAC
    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(timestamp + apiKey + '5000' + queryString.replace('&api_key=' + apiKey, ''))
        .digest('hex');
    
    const url = `${baseUrl}${endpoint}?${queryString}&sign=${signature}`;
    
    console.log(`\n🔍 Testando API: ${apiKey}`);
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`🔐 Signature: ${signature}`);
    console.log(`🌐 URL: ${url}`);
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-TIMESTAMP': timestamp.toString(),
                'X-BAPI-RECV-WINDOW': '5000'
            }
        });
        
        console.log(`📡 Status: ${response.status} ${response.statusText}`);
        
        const responseText = await response.text();
        console.log(`📝 Response: ${responseText}`);
        
        if (response.ok && responseText) {
            try {
                const data = JSON.parse(responseText);
                if (data.retCode === 0) {
                    console.log('✅ API funcionando!');
                    if (data.result && data.result.list) {
                        for (const account of data.result.list) {
                            if (account.coin && account.coin.length > 0) {
                                for (const coin of account.coin) {
                                    if (parseFloat(coin.walletBalance) > 0) {
                                        console.log(`💰 ${coin.coin}: ${coin.walletBalance}`);
                                    }
                                }
                            }
                        }
                    }
                } else {
                    console.log(`❌ Erro da API: ${data.retMsg}`);
                }
            } catch (parseError) {
                console.log('❌ Erro ao parsear resposta:', parseError.message);
            }
        } else {
            console.log('❌ API retornou erro');
        }
        
    } catch (error) {
        console.log('❌ Erro na requisição:', error.message);
    }
}

// Vamos testar também uma abordagem diferente
async function testSimpleBybit(apiKey, apiSecret) {
    const timestamp = Date.now();
    const recvWindow = 5000;
    
    // Criar query string sem api_key
    const queryParams = `accountType=UNIFIED&timestamp=${timestamp}&recv_window=${recvWindow}`;
    
    // Criar assinatura
    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(timestamp + apiKey + recvWindow + queryParams.replace('&recv_window=' + recvWindow, ''))
        .digest('hex');
    
    const url = `https://api.bybit.com/v5/account/wallet-balance?${queryParams}&sign=${signature}`;
    
    console.log(`\n🧪 TESTE SIMPLES - ${apiKey}`);
    console.log(`🔐 Signature para verificação: ${signature}`);
    
    try {
        const response = await fetch(url, {
            headers: {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-TIMESTAMP': timestamp.toString(),
                'X-BAPI-RECV-WINDOW': recvWindow.toString()
            }
        });
        
        console.log(`📡 Status: ${response.status}`);
        const text = await response.text();
        console.log(`📝 Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

async function testAllKeys() {
    console.log('🚀 TESTANDO TODAS AS CHAVES CONHECIDAS');
    console.log('=====================================');
    
    for (const key of testKeys) {
        console.log(`\n👤 TESTANDO: ${key.name}`);
        console.log('=====================================');
        
        // Teste 1: Método original
        await testBybitAPI(key.apiKey, key.apiSecret);
        
        // Teste 2: Método simplificado
        await testSimpleBybit(key.apiKey, key.apiSecret);
        
        // Aguardar um pouco entre os testes
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Teste com chaves possivelmente diferentes
    console.log('\n🔄 TESTANDO POSSÍVEIS VARIAÇÕES');
    console.log('===============================');
    
    // Às vezes as chaves podem ter espaços ou caracteres extras
    const variations = [
        {
            name: "Paloma - Variação 1",
            apiKey: "15t5ByCJWFAKOvNF0E",
            apiSecret: "LxHPOFcxzZ6v9l0HYLm9GUvhm6TaF6PQX1vN"
        },
        {
            name: "Paloma - Testnet",
            apiKey: "15t5ByCJWFAKOvNF0E",
            apiSecret: "LxHPOFcxzZ6v9l0HYLm9GUvhm6TaF6PQX1vN"
        }
    ];
    
    for (const variation of variations) {
        await testSimpleBybit(variation.apiKey, variation.apiSecret);
    }
}

testAllKeys();
