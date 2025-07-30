const crypto = require('crypto');

// Chaves fornecidas (confirmadas como válidas na Bybit)
const validKey = {
    api_key: '9HZy9BiUW95iXprVRI',
    secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
};

async function debugSignatureGeneration() {
    console.log('🔍 DEBUG DETALHADO - GERAÇÃO DE ASSINATURA');
    console.log('==========================================');
    
    console.log('\n📊 CHAVE TESTADA:');
    console.log(`   API Key: ${validKey.api_key}`);
    console.log(`   Secret: ${validKey.secret_key}`);
    console.log(`   Tamanho API Key: ${validKey.api_key.length}`);
    console.log(`   Tamanho Secret: ${validKey.secret_key.length}`);
    
    // Verificar IP atual
    const ip = await getCurrentIP();
    console.log(`\n🌐 IP ATUAL: ${ip}`);
    
    // Testar diferentes métodos de assinatura
    await testDifferentSignatureMethods();
    
    // Testar endpoints específicos
    await testSpecificEndpoints();
    
    // Testar com diferentes timestamps
    await testTimestampVariations();
}

async function getCurrentIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'ERRO_AO_VERIFICAR';
    }
}

async function testDifferentSignatureMethods() {
    console.log('\n🔐 TESTANDO DIFERENTES MÉTODOS DE ASSINATURA:');
    console.log('==============================================');
    
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    
    // Método 1: V5 padrão (timestamp + apiKey + recvWindow)
    console.log('\n📝 Método 1 - V5 Padrão:');
    const message1 = timestamp + validKey.api_key + recvWindow;
    const signature1 = crypto.createHmac('sha256', validKey.secret_key).update(message1).digest('hex');
    
    console.log(`   Message: "${message1}"`);
    console.log(`   Signature: ${signature1}`);
    
    const result1 = await testAccountInfoWithSignature(signature1, timestamp, recvWindow, 'V5 Padrão');
    
    // Método 2: V5 com query params vazios
    console.log('\n📝 Método 2 - V5 com Query Params:');
    const queryParams = '';
    const message2 = timestamp + validKey.api_key + recvWindow + queryParams;
    const signature2 = crypto.createHmac('sha256', validKey.secret_key).update(message2).digest('hex');
    
    console.log(`   Message: "${message2}"`);
    console.log(`   Signature: ${signature2}`);
    
    const result2 = await testAccountInfoWithSignature(signature2, timestamp, recvWindow, 'V5 com Query');
    
    // Método 3: V3 estilo (query string)
    console.log('\n📝 Método 3 - Estilo V3:');
    const params = `api_key=${validKey.api_key}&timestamp=${timestamp}&recv_window=${recvWindow}`;
    const signature3 = crypto.createHmac('sha256', validKey.secret_key).update(params).digest('hex');
    
    console.log(`   Message: "${params}"`);
    console.log(`   Signature: ${signature3}`);
    
    // Não vou testar V3 porque estamos focando em V5
    
    // Método 4: V5 com diferentes encodings
    console.log('\n📝 Método 4 - V5 com Buffer:');
    const messageBuffer = Buffer.from(message1, 'utf8');
    const signature4 = crypto.createHmac('sha256', validKey.secret_key).update(messageBuffer).digest('hex');
    
    console.log(`   Message (Buffer): ${messageBuffer.toString()}`);
    console.log(`   Signature: ${signature4}`);
    
    const result4 = await testAccountInfoWithSignature(signature4, timestamp, recvWindow, 'V5 Buffer');
}

async function testAccountInfoWithSignature(signature, timestamp, recvWindow, method) {
    try {
        const headers = {
            'X-BAPI-API-KEY': validKey.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        console.log(`   Headers:`, JSON.stringify(headers, null, 2));
        
        // Testar testnet primeiro
        const testnetResponse = await fetch('https://api-testnet.bybit.com/v5/account/info', {
            method: 'GET',
            headers: headers
        });
        
        const testnetData = await testnetResponse.json();
        console.log(`   🧪 TESTNET: ${testnetData.retCode} - ${testnetData.retMsg}`);
        
        // Testar mainnet
        const mainnetResponse = await fetch('https://api.bybit.com/v5/account/info', {
            method: 'GET',
            headers: headers
        });
        
        const mainnetData = await mainnetResponse.json();
        console.log(`   🌍 MAINNET: ${mainnetData.retCode} - ${mainnetData.retMsg}`);
        
        return { testnet: testnetData, mainnet: mainnetData };
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        return null;
    }
}

async function testSpecificEndpoints() {
    console.log('\n🎯 TESTANDO ENDPOINTS ESPECÍFICOS:');
    console.log('===================================');
    
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    
    const endpoints = [
        { name: 'Server Time', url: '/v5/market/time', auth: false },
        { name: 'Account Info', url: '/v5/account/info', auth: true },
        { name: 'Wallet Balance', url: '/v5/account/wallet-balance', auth: true, params: 'accountType=UNIFIED' },
        { name: 'API Key Info', url: '/v5/user/query-api', auth: true }
    ];
    
    for (const endpoint of endpoints) {
        console.log(`\n🔍 ${endpoint.name}:`);
        
        if (!endpoint.auth) {
            // Endpoint público
            try {
                const response = await fetch(`https://api.bybit.com${endpoint.url}`);
                const data = await response.json();
                console.log(`   ✅ ${data.retCode} - ${data.retMsg}`);
            } catch (error) {
                console.log(`   ❌ Erro: ${error.message}`);
            }
        } else {
            // Endpoint autenticado
            const params = endpoint.params || '';
            const message = timestamp + validKey.api_key + recvWindow + params;
            const signature = crypto.createHmac('sha256', validKey.secret_key).update(message).digest('hex');
            
            const headers = {
                'X-BAPI-API-KEY': validKey.api_key,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'Content-Type': 'application/json'
            };
            
            try {
                const url = params ? `${endpoint.url}?${params}` : endpoint.url;
                const response = await fetch(`https://api.bybit.com${url}`, {
                    method: 'GET',
                    headers: headers
                });
                
                const data = await response.json();
                console.log(`   ${data.retCode === 0 ? '✅' : '❌'} ${data.retCode} - ${data.retMsg}`);
                
                if (data.retCode === 0 && endpoint.name === 'API Key Info') {
                    console.log(`   📊 Permissões: ${JSON.stringify(data.result?.permissions || 'N/A')}`);
                    console.log(`   🌐 IPs Permitidos: ${JSON.stringify(data.result?.ips || 'N/A')}`);
                }
                
            } catch (error) {
                console.log(`   ❌ Erro: ${error.message}`);
            }
        }
        
        // Pequena pausa entre requests
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

async function testTimestampVariations() {
    console.log('\n⏰ TESTANDO VARIAÇÕES DE TIMESTAMP:');
    console.log('===================================');
    
    const recvWindow = '5000';
    const baseTime = Date.now();
    
    const timeVariations = [
        { name: 'Timestamp atual', time: baseTime },
        { name: 'Timestamp -5 segundos', time: baseTime - 5000 },
        { name: 'Timestamp +5 segundos', time: baseTime + 5000 },
        { name: 'Timestamp em segundos', time: Math.floor(baseTime / 1000) }
    ];
    
    for (const variation of timeVariations) {
        console.log(`\n🕒 ${variation.name}: ${variation.time}`);
        
        const message = variation.time.toString() + validKey.api_key + recvWindow;
        const signature = crypto.createHmac('sha256', validKey.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': validKey.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': variation.time.toString(),
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        try {
            const response = await fetch('https://api.bybit.com/v5/account/info', {
                method: 'GET',
                headers: headers
            });
            
            const data = await response.json();
            console.log(`   ${data.retCode === 0 ? '✅' : '❌'} ${data.retCode} - ${data.retMsg}`);
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

async function main() {
    console.log('🚀 DIAGNÓSTICO COMPLETO - CHAVES VÁLIDAS BYBIT');
    console.log('==============================================');
    console.log('Se as chaves são válidas, o problema pode ser:');
    console.log('1. 🔐 Método de assinatura incorreto');
    console.log('2. 🌐 IP não whitelistado');
    console.log('3. ⏰ Problemas de timestamp');
    console.log('4. 🔒 Permissões insuficientes');
    console.log('5. 📡 Headers incorretos');
    
    await debugSignatureGeneration();
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('==================');
    console.log('1. Verificar se IP está na whitelist da conta Bybit');
    console.log('2. Confirmar permissões da API key');
    console.log('3. Verificar se a conta não está suspensa');
    console.log('4. Testar diretamente no Postman/curl');
}

main();
