const crypto = require('crypto');

// Teste específico para problemas do Railway
async function testarConfiguracoesRailway() {
    console.log('🚂 TESTE ESPECÍFICO - CONFIGURAÇÕES RAILWAY');
    console.log('===========================================');
    
    // 1. Verificar informações do ambiente Railway
    await verificarAmbienteRailway();
    
    // 2. Testar com diferentes configurações de fetch
    await testarConfiguracoesFetch();
    
    // 3. Verificar se Railway usa proxy reverso
    await verificarProxyReverso();
    
    // 4. Testar com curl nativo
    await testarCurlNativo();
    
    // 5. Verificar DNS do Railway
    await verificarDNSRailway();
    
    // 6. Testar bypass do Railway
    await testarBypassRailway();
}

async function verificarAmbienteRailway() {
    console.log('\n🔍 VERIFICANDO AMBIENTE RAILWAY:');
    console.log('================================');
    
    // Variáveis de ambiente específicas do Railway
    const railwayVars = [
        'RAILWAY_DEPLOYMENT_ID',
        'RAILWAY_ENVIRONMENT',
        'RAILWAY_PROJECT_ID',
        'RAILWAY_SERVICE_ID',
        'RAILWAY_REPLICA_ID',
        'RAILWAY_PUBLIC_DOMAIN',
        'RAILWAY_PRIVATE_DOMAIN',
        'PORT'
    ];
    
    console.log('📊 Variáveis de ambiente Railway:');
    railwayVars.forEach(varName => {
        const value = process.env[varName];
        console.log(`   ${varName}: ${value || 'NÃO DEFINIDA'}`);
    });
    
    // Verificar se estamos realmente no Railway
    const isRailway = process.env.RAILWAY_DEPLOYMENT_ID || process.env.RAILWAY_PROJECT_ID;
    console.log(`\n🚂 Executando no Railway: ${isRailway ? 'SIM' : 'NÃO'}`);
    
    // Verificar informações de rede
    console.log('\n🌐 Informações de rede:');
    try {
        const os = require('os');
        const networkInterfaces = os.networkInterfaces();
        
        Object.keys(networkInterfaces).forEach(interfaceName => {
            const interfaces = networkInterfaces[interfaceName];
            interfaces.forEach(iface => {
                if (!iface.internal) {
                    console.log(`   Interface ${interfaceName}: ${iface.address} (${iface.family})`);
                }
            });
        });
    } catch (error) {
        console.log(`   ❌ Erro ao verificar interfaces: ${error.message}`);
    }
}

async function testarConfiguracoesFetch() {
    console.log('\n🔧 TESTANDO DIFERENTES CONFIGURAÇÕES DE FETCH:');
    console.log('===============================================');
    
    const validKey = {
        api_key: '9HZy9BiUW95iXprVRI',
        secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
    };
    
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    const message = timestamp + validKey.api_key + recvWindow;
    const signature = crypto.createHmac('sha256', validKey.secret_key).update(message).digest('hex');
    
    const baseHeaders = {
        'X-BAPI-API-KEY': validKey.api_key,
        'X-BAPI-SIGN': signature,
        'X-BAPI-SIGN-TYPE': '2',
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'Content-Type': 'application/json'
    };
    
    const fetchConfigs = [
        {
            name: 'Padrão',
            options: {
                method: 'GET',
                headers: baseHeaders
            }
        },
        {
            name: 'Com timeout',
            options: {
                method: 'GET',
                headers: baseHeaders,
                signal: AbortSignal.timeout(10000)
            }
        },
        {
            name: 'Sem cache',
            options: {
                method: 'GET',
                headers: {
                    ...baseHeaders,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                cache: 'no-cache'
            }
        },
        {
            name: 'Com User-Agent específico',
            options: {
                method: 'GET',
                headers: {
                    ...baseHeaders,
                    'User-Agent': 'Railway-Bot/1.0'
                }
            }
        },
        {
            name: 'HTTP/1.1 forçado',
            options: {
                method: 'GET',
                headers: {
                    ...baseHeaders,
                    'Connection': 'close',
                    'HTTP2-Settings': ''
                }
            }
        }
    ];
    
    for (const config of fetchConfigs) {
        console.log(`\n🧪 ${config.name}:`);
        
        try {
            const response = await fetch('https://api.bybit.com/v5/account/info', config.options);
            const data = await response.json();
            
            console.log(`   ${data.retCode === 0 ? '✅' : '❌'} ${data.retCode} - ${data.retMsg}`);
            console.log(`   📊 Status HTTP: ${response.status}`);
            console.log(`   🌐 Headers response: ${JSON.stringify(Object.fromEntries(response.headers))}`);
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function verificarProxyReverso() {
    console.log('\n🔄 VERIFICANDO PROXY REVERSO RAILWAY:');
    console.log('====================================');
    
    try {
        // Testar múltiplos serviços para verificar IPs
        const testUrls = [
            'https://httpbin.org/ip',
            'https://api.ipify.org?format=json',
            'https://ifconfig.me/ip',
            'https://checkip.amazonaws.com'
        ];
        
        console.log('📊 IPs detectados por diferentes serviços:');
        
        for (const url of testUrls) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Railway-Test/1.0'
                    }
                });
                
                let result;
                if (url.includes('json')) {
                    const data = await response.json();
                    result = data.ip || data.origin;
                } else {
                    result = (await response.text()).trim();
                }
                
                console.log(`   ${url}: ${result}`);
                
            } catch (error) {
                console.log(`   ${url}: ❌ ${error.message}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Verificar headers enviados
        console.log('\n📋 Headers enviados pelo Railway:');
        const response = await fetch('https://httpbin.org/headers');
        const data = await response.json();
        
        Object.entries(data.headers).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
        });
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
}

async function testarCurlNativo() {
    console.log('\n🌐 TESTANDO COM CURL NATIVO:');
    console.log('============================');
    
    const validKey = {
        api_key: '9HZy9BiUW95iXprVRI',
        secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
    };
    
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    const message = timestamp + validKey.api_key + recvWindow;
    const signature = crypto.createHmac('sha256', validKey.secret_key).update(message).digest('hex');
    
    // Criar comando curl
    const curlCommand = `curl -X GET "https://api.bybit.com/v5/account/info" \\
-H "X-BAPI-API-KEY: ${validKey.api_key}" \\
-H "X-BAPI-SIGN: ${signature}" \\
-H "X-BAPI-SIGN-TYPE: 2" \\
-H "X-BAPI-TIMESTAMP: ${timestamp}" \\
-H "X-BAPI-RECV-WINDOW: ${recvWindow}" \\
-H "Content-Type: application/json" \\
-H "User-Agent: Railway-Curl/1.0" \\
--connect-timeout 10 \\
--max-time 30 \\
-v`;
    
    console.log('📝 Comando curl gerado:');
    console.log(curlCommand);
    
    try {
        const { spawn } = require('child_process');
        
        console.log('\n🔄 Executando curl...');
        
        const curl = spawn('curl', [
            '-X', 'GET',
            'https://api.bybit.com/v5/account/info',
            '-H', `X-BAPI-API-KEY: ${validKey.api_key}`,
            '-H', `X-BAPI-SIGN: ${signature}`,
            '-H', 'X-BAPI-SIGN-TYPE: 2',
            '-H', `X-BAPI-TIMESTAMP: ${timestamp}`,
            '-H', `X-BAPI-RECV-WINDOW: ${recvWindow}`,
            '-H', 'Content-Type: application/json',
            '-H', 'User-Agent: Railway-Curl/1.0',
            '--connect-timeout', '10',
            '--max-time', '30',
            '-s' // Silent mode
        ]);
        
        let output = '';
        let error = '';
        
        curl.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        curl.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        curl.on('close', (code) => {
            console.log(`   📊 Exit code: ${code}`);
            if (output) {
                try {
                    const result = JSON.parse(output);
                    console.log(`   ${result.retCode === 0 ? '✅' : '❌'} ${result.retCode} - ${result.retMsg}`);
                } catch (e) {
                    console.log(`   📝 Output: ${output.substring(0, 200)}...`);
                }
            }
            if (error) {
                console.log(`   ⚠️  Error: ${error.substring(0, 200)}...`);
            }
        });
        
    } catch (error) {
        console.log(`   ❌ Curl não disponível: ${error.message}`);
    }
}

async function verificarDNSRailway() {
    console.log('\n🌐 VERIFICANDO DNS RAILWAY:');
    console.log('===========================');
    
    try {
        const dns = require('dns').promises;
        
        const domains = [
            'api.bybit.com',
            'api-testnet.bybit.com'
        ];
        
        for (const domain of domains) {
            try {
                const addresses = await dns.lookup(domain, { all: true });
                console.log(`\n📍 ${domain}:`);
                addresses.forEach((addr, index) => {
                    console.log(`   IP ${index + 1}: ${addr.address} (${addr.family})`);
                });
                
                // Verificar se consegue conectar em cada IP
                for (const addr of addresses.slice(0, 2)) { // Testar apenas os 2 primeiros
                    try {
                        const response = await fetch(`https://${addr.address}/v5/market/time`, {
                            headers: {
                                'Host': domain,
                                'User-Agent': 'Railway-DNS-Test/1.0'
                            },
                            timeout: 5000
                        });
                        
                        const data = await response.json();
                        console.log(`      ${addr.address}: ${data.retCode === 0 ? '✅' : '❌'} ${data.retCode}`);
                        
                    } catch (error) {
                        console.log(`      ${addr.address}: ❌ ${error.message}`);
                    }
                }
                
            } catch (error) {
                console.log(`   ❌ ${domain}: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.log(`   ❌ DNS lookup error: ${error.message}`);
    }
}

async function testarBypassRailway() {
    console.log('\n🚀 TESTANDO BYPASS RAILWAY:');
    console.log('===========================');
    
    const validKey = {
        api_key: '9HZy9BiUW95iXprVRI',
        secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
    };
    
    // Testar com diferentes portas e protocolos
    const alternativeEndpoints = [
        'https://api.bybit.com:443/v5/account/info',
        'https://api.bybit.com:8443/v5/account/info', // Porta alternativa
        'http://api.bybit.com/v5/account/info', // HTTP (provavelmente falhará)
    ];
    
    for (const endpoint of alternativeEndpoints) {
        console.log(`\n🧪 Testando: ${endpoint}`);
        
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
            'Content-Type': 'application/json',
            'User-Agent': 'Railway-Bypass/1.0'
        };
        
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: headers,
                timeout: 10000
            });
            
            const data = await response.json();
            console.log(`   ${data.retCode === 0 ? '✅' : '❌'} ${data.retCode} - ${data.retMsg}`);
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Executar todos os testes
testarConfiguracoesRailway().then(() => {
    console.log('\n🎯 CONCLUSÕES RAILWAY:');
    console.log('======================');
    console.log('1. Verificar se Railway está bloqueando requests HTTPS específicos');
    console.log('2. Verificar se há limitações de DNS no Railway');
    console.log('3. Verificar se Railway requer configurações especiais de headers');
    console.log('4. Verificar se há proxy reverso interferindo');
    console.log('5. Testar localmente vs Railway para comparar');
});
