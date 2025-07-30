const crypto = require('crypto');

// TESTE DEFINITIVO - Verificar se as chaves estão realmente válidas
async function testeFinalDefinitivo() {
    console.log('🔬 TESTE DEFINITIVO - VALIDAÇÃO DAS CHAVES');
    console.log('==========================================');
    
    const validKey = {
        api_key: '9HZy9BiUW95iXprVRI',
        secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
    };
    
    console.log('\n📊 CHAVE TESTADA:');
    console.log(`   API Key: ${validKey.api_key}`);
    console.log(`   Secret (últimos 6): ...${validKey.secret_key.slice(-6)}`);
    
    // 1. Testar ambiente TESTNET (mais permissivo)
    console.log('\n🧪 TESTE 1 - TESTNET:');
    const testnetResult = await testarChaveCompleta(validKey, 'testnet');
    
    // 2. Testar ambiente MAINNET
    console.log('\n🌍 TESTE 2 - MAINNET:');
    const mainnetResult = await testarChaveCompleta(validKey, 'mainnet');
    
    // 3. Verificar com diferentes métodos de assinatura
    console.log('\n🔐 TESTE 3 - MÉTODOS DE ASSINATURA:');
    await testarMetodosAssinatura(validKey);
    
    // 4. Conclusão final
    console.log('\n🎯 CONCLUSÃO FINAL:');
    console.log('==================');
    
    if (!testnetResult && !mainnetResult) {
        console.log('❌ CHAVES INVÁLIDAS ou EXPIRADAS');
        console.log('📋 AÇÃO NECESSÁRIA:');
        console.log('   1. Verificar se a conta Bybit ainda está ativa');
        console.log('   2. Verificar se as API keys não expiraram');
        console.log('   3. Recriar as API keys no painel Bybit');
        console.log('   4. Verificar se a conta não está suspensa');
        console.log('   5. Confirmar permissões das API keys');
        
        // Gerar comando para testar manualmente
        console.log('\n📝 TESTE MANUAL COM CURL:');
        gerarComandoCurl(validKey);
        
    } else {
        console.log('✅ Pelo menos uma configuração funcionou!');
    }
}

async function testarChaveCompleta(validKey, environment) {
    const baseUrl = environment === 'testnet' ? 
        'https://api-testnet.bybit.com' : 
        'https://api.bybit.com';
    
    try {
        // Obter timestamp do servidor primeiro
        const timeResponse = await fetch(`${baseUrl}/v5/market/time`);
        const timeData = await timeResponse.json();
        
        if (timeData.retCode !== 0) {
            console.log(`   ❌ Erro ao obter server time: ${timeData.retMsg}`);
            return false;
        }
        
        const serverTime = parseInt(timeData.result.timeNano) / 1000000;
        const timestamp = Math.floor(serverTime + 500).toString(); // +500ms buffer
        const recvWindow = '10000';
        
        // Testar diferentes endpoints
        const endpoints = [
            { name: 'Account Info', path: '/v5/account/info' },
            { name: 'API Key Info', path: '/v5/user/query-api' },
            { name: 'Wallet Balance', path: '/v5/account/wallet-balance?accountType=UNIFIED' }
        ];
        
        for (const endpoint of endpoints) {
            console.log(`   🔍 ${endpoint.name}:`);
            
            const message = timestamp + validKey.api_key + recvWindow;
            const signature = crypto.createHmac('sha256', validKey.secret_key).update(message).digest('hex');
            
            const headers = {
                'X-BAPI-API-KEY': validKey.api_key,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'Content-Type': 'application/json',
                'User-Agent': 'CoinBitClub-Test/1.0'
            };
            
            const response = await fetch(`${baseUrl}${endpoint.path}`, {
                method: 'GET',
                headers: headers
            });
            
            const data = await response.json();
            console.log(`      ${data.retCode === 0 ? '✅' : '❌'} ${data.retCode} - ${data.retMsg}`);
            
            if (data.retCode === 0) {
                console.log(`      🎉 SUCESSO no ${environment.toUpperCase()}!`);
                if (data.result) {
                    console.log(`      📊 Dados:`, JSON.stringify(data.result, null, 2).substring(0, 200) + '...');
                }
                return true;
            }
            
            // Análise detalhada dos erros
            if (data.retCode === 10003) {
                console.log(`      🔍 Análise: API key inválida, expirada ou conta suspensa`);
            } else if (data.retCode === 10004) {
                console.log(`      🔍 Análise: Erro de assinatura ou IP bloqueado`);
            } else if (data.retCode === 10005) {
                console.log(`      🔍 Análise: Permissões insuficientes na API key`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
    } catch (error) {
        console.log(`   ❌ Erro de conexão: ${error.message}`);
    }
    
    return false;
}

async function testarMetodosAssinatura(validKey) {
    const timestamp = Date.now().toString();
    const recvWindow = '10000';
    
    // Diferentes métodos de criar a mensagem de assinatura
    const metodos = [
        {
            name: 'V5 Padrão',
            message: timestamp + validKey.api_key + recvWindow
        },
        {
            name: 'V5 com query params',
            message: timestamp + validKey.api_key + recvWindow + ''
        },
        {
            name: 'V5 com GET query',
            message: timestamp + validKey.api_key + recvWindow + 'accountType=UNIFIED'
        },
        {
            name: 'Com encoding UTF-8',
            message: Buffer.from(timestamp + validKey.api_key + recvWindow, 'utf8').toString()
        }
    ];
    
    for (const metodo of metodos) {
        console.log(`   🔐 ${metodo.name}:`);
        
        const signature = crypto.createHmac('sha256', validKey.secret_key).update(metodo.message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': validKey.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        try {
            const response = await fetch('https://api.bybit.com/v5/account/info', {
                method: 'GET',
                headers: headers
            });
            
            const data = await response.json();
            console.log(`      ${data.retCode === 0 ? '✅' : '❌'} ${data.retCode} - ${data.retMsg}`);
            
        } catch (error) {
            console.log(`      ❌ Erro: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

function gerarComandoCurl(validKey) {
    const timestamp = Date.now().toString();
    const recvWindow = '10000';
    const message = timestamp + validKey.api_key + recvWindow;
    const signature = crypto.createHmac('sha256', validKey.secret_key).update(message).digest('hex');
    
    console.log('Para testar manualmente:');
    console.log('========================');
    console.log(`curl -X GET "https://api.bybit.com/v5/account/info" \\`);
    console.log(`  -H "X-BAPI-API-KEY: ${validKey.api_key}" \\`);
    console.log(`  -H "X-BAPI-SIGN: ${signature}" \\`);
    console.log(`  -H "X-BAPI-SIGN-TYPE: 2" \\`);
    console.log(`  -H "X-BAPI-TIMESTAMP: ${timestamp}" \\`);
    console.log(`  -H "X-BAPI-RECV-WINDOW: ${recvWindow}" \\`);
    console.log(`  -H "Content-Type: application/json"`);
    
    console.log('\n📝 Ou teste online em: https://www.postman.com/');
    console.log('📝 Ou teste diretamente no painel Bybit: https://www.bybit.com/app/user/api-management');
}

// Executar teste final
testeFinalDefinitivo();
