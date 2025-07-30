const crypto = require('crypto');

// Chaves fornecidas diretamente
const testKeys = [
    {
        name: 'Chave 1',
        api_key: '9HZy9BiUW95iXprVRI',
        secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
    }
];

async function testDirectKeys() {
    console.log('🔑 TESTE DIRETO DAS CHAVES FORNECIDAS');
    console.log('====================================');
    
    for (const key of testKeys) {
        console.log(`\n🧪 Testando: ${key.name}`);
        console.log(`   📊 API Key: ${key.api_key}`);
        console.log(`   🔐 Secret: ${key.secret_key.substring(0, 10)}...`);
        
        // Testar em ambos os ambientes
        await testInEnvironment(key, 'testnet');
        await testInEnvironment(key, 'mainnet');
        
        console.log('   ' + '─'.repeat(50));
    }
}

async function testInEnvironment(key, environment) {
    try {
        const baseUrl = environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        console.log(`\n   🌍 Testando em ${environment.toUpperCase()}:`);
        
        // Teste 1: Server Time (público)
        console.log(`      ⏰ Server Time:`);
        const timeResponse = await fetch(`${baseUrl}/v5/market/time`);
        const timeData = await timeResponse.json();
        console.log(`         ${timeData.retCode === 0 ? '✅' : '❌'} ${timeData.retCode} - ${timeData.retMsg}`);
        
        // Teste 2: Account Info (requer autenticação)
        console.log(`      👤 Account Info:`);
        const accountResult = await testAccountInfo(key, baseUrl);
        console.log(`         ${accountResult.success ? '✅' : '❌'} ${accountResult.code} - ${accountResult.message}`);
        
        if (!accountResult.success) {
            // Análise do erro
            if (accountResult.code === 10003) {
                console.log(`         🔍 Diagnóstico: API key inválida - precisa recriar`);
            } else if (accountResult.code === 10004) {
                console.log(`         🔍 Diagnóstico: Erro de assinatura - verificar secret ou IP`);
            } else if (accountResult.code === 10005) {
                console.log(`         🔍 Diagnóstico: Permissões insuficientes`);
            } else if (accountResult.code === 10006) {
                console.log(`         🔍 Diagnóstico: IP não autorizado`);
            }
        } else {
            console.log(`         💰 Saldo disponível: ${accountResult.data?.totalEquity || 'N/A'}`);
        }
        
        // Teste 3: Position Info
        console.log(`      📊 Positions:`);
        const positionResult = await testPositions(key, baseUrl);
        console.log(`         ${positionResult.success ? '✅' : '❌'} ${positionResult.code} - ${positionResult.message}`);
        
    } catch (error) {
        console.log(`      ❌ Erro de conexão: ${error.message}`);
    }
}

async function testAccountInfo(key, baseUrl) {
    try {
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        // Criar assinatura V5
        const message = timestamp + key.api_key + recvWindow;
        const signature = crypto.createHmac('sha256', key.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': key.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        const response = await fetch(`${baseUrl}/v5/account/info`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        return {
            success: data.retCode === 0,
            code: data.retCode,
            message: data.retMsg,
            data: data.result
        };
        
    } catch (error) {
        return {
            success: false,
            code: 'ERROR',
            message: error.message
        };
    }
}

async function testPositions(key, baseUrl) {
    try {
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const category = 'linear';
        
        // Query params para positions
        const queryParams = `category=${category}`;
        
        // Criar assinatura V5 com query params
        const message = timestamp + key.api_key + recvWindow + queryParams;
        const signature = crypto.createHmac('sha256', key.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': key.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        const response = await fetch(`${baseUrl}/v5/position/list?${queryParams}`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        return {
            success: data.retCode === 0,
            code: data.retCode,
            message: data.retMsg,
            data: data.result
        };
        
    } catch (error) {
        return {
            success: false,
            code: 'ERROR',
            message: error.message
        };
    }
}

async function checkIPStatus() {
    try {
        console.log('\n🌐 VERIFICANDO IP ATUAL:');
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        console.log(`   📍 IP atual: ${data.ip}`);
        console.log(`   💡 Este IP precisa estar na whitelist de todas as contas Bybit`);
        return data.ip;
    } catch (error) {
        console.log(`   ❌ Erro ao verificar IP: ${error.message}`);
        return null;
    }
}

async function fullTest() {
    console.log('🚀 TESTE COMPLETO COM CHAVES DIRETAS');
    console.log('===================================');
    
    await checkIPStatus();
    await testDirectKeys();
    
    console.log('\n📋 RESUMO:');
    console.log('- Se erro 10003: API key inválida (recriar)');
    console.log('- Se erro 10004: Problema de assinatura ou IP não whitelistado');
    console.log('- Se erro 10005: Permissões insuficientes');
    console.log('- Se erro 10006: IP bloqueado');
    console.log('- Se código 0: ✅ FUNCIONANDO!');
}

fullTest();
