const crypto = require('crypto');

// Problemas comuns que outros já enfrentaram com Bybit API
async function investigarProblemasComuns() {
    console.log('🔍 INVESTIGAÇÃO DE PROBLEMAS COMUNS - BYBIT API');
    console.log('==============================================');
    console.log('Baseado em problemas reportados pela comunidade\n');
    
    // 1. Verificar User-Agent (muito importante!)
    console.log('1. 🌐 TESTANDO USER-AGENT:');
    await testarComDiferentesUserAgents();
    
    // 2. Verificar encoding de caracteres
    console.log('\n2. 📝 TESTANDO ENCODING:');
    await testarEncodingProblemas();
    
    // 3. Verificar ordem dos headers
    console.log('\n3. 📋 TESTANDO ORDEM DOS HEADERS:');
    await testarOrdemHeaders();
    
    // 4. Verificar proxy/cloudflare
    console.log('\n4. ☁️ TESTANDO PROBLEMAS DE PROXY/CLOUDFLARE:');
    await testarProblemasProxy();
    
    // 5. Verificar rate limiting
    console.log('\n5. ⏱️ TESTANDO RATE LIMITING:');
    await testarRateLimiting();
    
    // 6. Verificar problemas de SSL
    console.log('\n6. 🔒 TESTANDO SSL/TLS:');
    await testarSSLProblemas();
}

async function testarComDiferentesUserAgents() {
    const validKey = {
        api_key: '9HZy9BiUW95iXprVRI',
        secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
    };
    
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Bybit-API-Client/1.0',
        'Node.js',
        'okhttp/4.9.0',
        'python-requests/2.25.1',
        '', // Sem User-Agent
        'PostmanRuntime/7.28.4'
    ];
    
    for (const userAgent of userAgents) {
        console.log(`   🔍 User-Agent: "${userAgent || 'VAZIO'}"`);
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const message = timestamp + validKey.api_key + recvWindow;
        const signature = crypto.createHmac('sha256', validKey.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': validKey.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        if (userAgent) {
            headers['User-Agent'] = userAgent;
        }
        
        try {
            const response = await fetch('https://api.bybit.com/v5/account/info', {
                method: 'GET',
                headers: headers
            });
            
            const data = await response.json();
            console.log(`      ${data.retCode === 0 ? '✅' : '❌'} ${data.retCode} - ${data.retMsg}`);
            
            if (data.retCode === 0) {
                console.log(`      🎉 SUCESSO COM USER-AGENT: "${userAgent}"`);
                return true;
            }
            
        } catch (error) {
            console.log(`      ❌ Erro: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo entre testes
    }
    
    return false;
}

async function testarEncodingProblemas() {
    const validKey = {
        api_key: '9HZy9BiUW95iXprVRI',
        secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
    };
    
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    
    // Testar diferentes encodings da mensagem
    const encodingTests = [
        {
            name: 'UTF-8 padrão',
            message: timestamp + validKey.api_key + recvWindow
        },
        {
            name: 'ASCII',
            message: Buffer.from(timestamp + validKey.api_key + recvWindow, 'ascii').toString()
        },
        {
            name: 'Base64 → String',
            message: Buffer.from(timestamp + validKey.api_key + recvWindow).toString('base64')
        },
        {
            name: 'Hex → String',
            message: Buffer.from(timestamp + validKey.api_key + recvWindow).toString('hex')
        }
    ];
    
    for (const test of encodingTests) {
        console.log(`   🔤 ${test.name}:`);
        
        try {
            const signature = crypto.createHmac('sha256', validKey.secret_key).update(test.message).digest('hex');
            
            const headers = {
                'X-BAPI-API-KEY': validKey.api_key,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'Content-Type': 'application/json'
            };
            
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

async function testarOrdemHeaders() {
    const validKey = {
        api_key: '9HZy9BiUW95iXprVRI',
        secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
    };
    
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    const message = timestamp + validKey.api_key + recvWindow;
    const signature = crypto.createHmac('sha256', validKey.secret_key).update(message).digest('hex');
    
    const headerOrders = [
        {
            name: 'Ordem A (Bybit docs)',
            headers: {
                'X-BAPI-API-KEY': validKey.api_key,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'Content-Type': 'application/json'
            }
        },
        {
            name: 'Ordem B (Content-Type primeiro)',
            headers: {
                'Content-Type': 'application/json',
                'X-BAPI-API-KEY': validKey.api_key,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow
            }
        },
        {
            name: 'Ordem C (Alfabética)',
            headers: {
                'Content-Type': 'application/json',
                'X-BAPI-API-KEY': validKey.api_key,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp
            }
        }
    ];
    
    for (const test of headerOrders) {
        console.log(`   📋 ${test.name}:`);
        
        try {
            const response = await fetch('https://api.bybit.com/v5/account/info', {
                method: 'GET',
                headers: test.headers
            });
            
            const data = await response.json();
            console.log(`      ${data.retCode === 0 ? '✅' : '❌'} ${data.retCode} - ${data.retMsg}`);
            
        } catch (error) {
            console.log(`      ❌ Erro: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

async function testarProblemasProxy() {
    console.log('   🔍 Verificando headers de proxy/cloudflare...');
    
    try {
        // Verificar headers enviados pelo Railway
        const response = await fetch('https://httpbin.org/headers');
        const data = await response.json();
        
        console.log('   📊 Headers detectados pelo httpbin:');
        Object.entries(data.headers).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`);
        });
        
        // Verificar se há headers de proxy que podem interferir
        const problematicHeaders = ['X-Forwarded-For', 'X-Real-IP', 'CF-Connecting-IP', 'X-Railway-*'];
        let foundProxyHeaders = false;
        
        Object.keys(data.headers).forEach(header => {
            if (header.toLowerCase().includes('forward') || 
                header.toLowerCase().includes('proxy') ||
                header.toLowerCase().includes('cf-') ||
                header.toLowerCase().includes('railway')) {
                console.log(`      ⚠️  Header suspeito: ${header}`);
                foundProxyHeaders = true;
            }
        });
        
        if (!foundProxyHeaders) {
            console.log('      ✅ Nenhum header de proxy problemático encontrado');
        }
        
    } catch (error) {
        console.log(`   ❌ Erro ao verificar headers: ${error.message}`);
    }
}

async function testarRateLimiting() {
    console.log('   ⏱️ Testando com delays entre requests...');
    
    const validKey = {
        api_key: '9HZy9BiUW95iXprVRI',
        secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
    };
    
    const delays = [0, 1000, 2000, 5000]; // 0s, 1s, 2s, 5s
    
    for (const delay of delays) {
        console.log(`   ⏰ Delay: ${delay}ms`);
        
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const message = timestamp + validKey.api_key + recvWindow;
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
            const response = await fetch('https://api.bybit.com/v5/account/info', {
                method: 'GET',
                headers: headers
            });
            
            const data = await response.json();
            console.log(`      ${data.retCode === 0 ? '✅' : '❌'} ${data.retCode} - ${data.retMsg}`);
            
        } catch (error) {
            console.log(`      ❌ Erro: ${error.message}`);
        }
    }
}

async function testarSSLProblemas() {
    console.log('   🔒 Testando diferentes configurações SSL...');
    
    const validKey = {
        api_key: '9HZy9BiUW95iXprVRI',
        secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
    };
    
    // Testar com diferentes URLs
    const urls = [
        'https://api.bybit.com/v5/account/info',
        'https://api.bytick.com/v5/account/info', // URL alternativa
        'https://api.bybit.com:443/v5/account/info' // Porta explícita
    ];
    
    for (const url of urls) {
        console.log(`   🌐 URL: ${url}`);
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const message = timestamp + validKey.api_key + recvWindow;
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
            const response = await fetch(url, {
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

// Executar investigação
investigarProblemasComuns().then(() => {
    console.log('\n🎯 CONCLUSÕES POSSÍVEIS:');
    console.log('========================');
    console.log('1. User-Agent pode ser obrigatório');
    console.log('2. Railway pode estar enviando headers de proxy');
    console.log('3. IP do Railway pode estar blacklistado temporariamente');
    console.log('4. Rate limiting pode estar ativo');
    console.log('5. Problemas de SSL/TLS com certificados');
    console.log('\n💡 PRÓXIMO PASSO: Testar com curl direto no Railway');
});
