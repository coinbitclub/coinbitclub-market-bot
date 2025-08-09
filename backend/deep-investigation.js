/**
 * 🔍 INVESTIGAÇÃO PROFUNDA - PROBLEMA NO CÓDIGO
 * =============================================
 * 
 * Se as chaves funcionavam antes, o problema pode ser:
 * 1. Formato da assinatura
 * 2. Ordem dos parâmetros
 * 3. Encoding de caracteres
 * 4. Headers incorretos
 * 5. Timestamp fora do range
 */

const crypto = require('crypto');

// Chaves que sabemos que funcionavam
const workingKey = {
    apiKey: "15t5ByCJWFAKOvNF0E",
    apiSecret: "LxHPOFcxzZ6v9l0HYLm9GUvhm6TaF6PQX1vN"
};

console.log('🔍 INVESTIGAÇÃO PROFUNDA - POSSÍVEL PROBLEMA NO CÓDIGO');
console.log('=======================================================\n');

// Teste 1: Método exato da documentação oficial Bybit
async function testOfficialMethod() {
    console.log('📚 TESTE 1: MÉTODO OFICIAL DA DOCUMENTAÇÃO BYBIT');
    console.log('================================================');
    
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    
    // Parâmetros exatos da documentação
    const queryString = `accountType=UNIFIED`;
    
    // String para assinatura: timestamp + apikey + recvWindow + queryString
    const signaturePayload = timestamp + workingKey.apiKey + recvWindow + queryString;
    
    console.log(`🔐 Payload para assinatura: "${signaturePayload}"`);
    
    const signature = crypto
        .createHmac('sha256', workingKey.apiSecret)
        .update(signaturePayload)
        .digest('hex');
    
    console.log(`✍️ Assinatura gerada: ${signature}`);
    
    const url = `https://api.bybit.com/v5/account/wallet-balance?${queryString}&sign=${signature}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-BAPI-API-KEY': workingKey.apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📡 Status: ${response.status} ${response.statusText}`);
        
        // Mostrar todos os headers de resposta
        console.log('📋 Headers de resposta:');
        for (const [key, value] of response.headers.entries()) {
            console.log(`   ${key}: ${value}`);
        }
        
        const responseText = await response.text();
        console.log(`📝 Resposta: ${responseText.substring(0, 500)}`);
        
        if (responseText) {
            try {
                const data = JSON.parse(responseText);
                console.log(`🎯 Código de retorno: ${data.retCode}`);
                console.log(`💬 Mensagem: ${data.retMsg}`);
            } catch (e) {
                console.log('❌ Erro ao parsear JSON');
            }
        }
        
    } catch (error) {
        console.log('❌ Erro na requisição:', error.message);
    }
}

// Teste 2: Método sem query parameters na URL
async function testWithoutUrlParams() {
    console.log('\n📚 TESTE 2: SEM PARÂMETROS NA URL');
    console.log('=================================');
    
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    const queryString = 'accountType=UNIFIED';
    
    const signaturePayload = timestamp + workingKey.apiKey + recvWindow + queryString;
    const signature = crypto
        .createHmac('sha256', workingKey.apiSecret)
        .update(signaturePayload)
        .digest('hex');
    
    // URL sem parâmetros, tudo nos headers
    const url = 'https://api.bybit.com/v5/account/wallet-balance';
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-BAPI-API-KEY': workingKey.apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'X-BAPI-QUERY-STRING': queryString
            }
        });
        
        console.log(`📡 Status: ${response.status}`);
        const text = await response.text();
        console.log(`📝 Resposta: ${text.substring(0, 200)}`);
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

// Teste 3: Método POST (algumas APIs preferem POST)
async function testPostMethod() {
    console.log('\n📚 TESTE 3: MÉTODO POST');
    console.log('=======================');
    
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    
    const body = JSON.stringify({
        accountType: 'UNIFIED'
    });
    
    const signaturePayload = timestamp + workingKey.apiKey + recvWindow + body;
    const signature = crypto
        .createHmac('sha256', workingKey.apiSecret)
        .update(signaturePayload)
        .digest('hex');
    
    try {
        const response = await fetch('https://api.bybit.com/v5/account/wallet-balance', {
            method: 'POST',
            headers: {
                'X-BAPI-API-KEY': workingKey.apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'Content-Type': 'application/json'
            },
            body: body
        });
        
        console.log(`📡 Status: ${response.status}`);
        const text = await response.text();
        console.log(`📝 Resposta: ${text.substring(0, 200)}`);
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

// Teste 4: Verificar se o timestamp está correto
async function testTimestamp() {
    console.log('\n📚 TESTE 4: VERIFICAÇÃO DE TIMESTAMP');
    console.log('====================================');
    
    try {
        // Obter tempo do servidor Bybit
        const serverTimeResponse = await fetch('https://api.bybit.com/v5/market/time');
        const serverTime = await serverTimeResponse.json();
        
        console.log(`⏰ Tempo do servidor Bybit: ${serverTime.result.timeNano}`);
        console.log(`⏰ Tempo local: ${Date.now()}`);
        
        const serverMs = Math.floor(serverTime.result.timeNano / 1000000);
        const localMs = Date.now();
        const diff = Math.abs(serverMs - localMs);
        
        console.log(`🔄 Diferença: ${diff}ms`);
        
        if (diff > 5000) {
            console.log('⚠️ ATENÇÃO: Diferença de tempo muito grande! Pode causar erro 401');
        } else {
            console.log('✅ Diferença de tempo aceitável');
        }
        
        // Testar com timestamp do servidor
        await testWithServerTime(serverMs);
        
    } catch (error) {
        console.log('❌ Erro ao verificar timestamp:', error.message);
    }
}

async function testWithServerTime(serverTimestamp) {
    console.log('\n🕐 Testando com timestamp do servidor...');
    
    const timestamp = serverTimestamp.toString();
    const recvWindow = '5000';
    const queryString = 'accountType=UNIFIED';
    
    const signaturePayload = timestamp + workingKey.apiKey + recvWindow + queryString;
    const signature = crypto
        .createHmac('sha256', workingKey.apiSecret)
        .update(signaturePayload)
        .digest('hex');
    
    const url = `https://api.bybit.com/v5/account/wallet-balance?${queryString}&sign=${signature}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'X-BAPI-API-KEY': workingKey.apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow
            }
        });
        
        console.log(`📡 Status com timestamp do servidor: ${response.status}`);
        const text = await response.text();
        console.log(`📝 Resposta: ${text.substring(0, 200)}`);
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

// Teste 5: Testar endpoint mais simples primeiro
async function testSimpleEndpoint() {
    console.log('\n📚 TESTE 5: ENDPOINT SIMPLES (ACCOUNT INFO)');
    console.log('===========================================');
    
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    
    // Endpoint mais simples que não requer parâmetros
    const queryString = '';
    const signaturePayload = timestamp + workingKey.apiKey + recvWindow + queryString;
    const signature = crypto
        .createHmac('sha256', workingKey.apiSecret)
        .update(signaturePayload)
        .digest('hex');
    
    try {
        const response = await fetch('https://api.bybit.com/v5/account/info', {
            headers: {
                'X-BAPI-API-KEY': workingKey.apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow
            }
        });
        
        console.log(`📡 Status endpoint simples: ${response.status}`);
        const text = await response.text();
        console.log(`📝 Resposta: ${text.substring(0, 300)}`);
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

async function runDeepInvestigation() {
    await testOfficialMethod();
    await new Promise(r => setTimeout(r, 1000));
    
    await testWithoutUrlParams();
    await new Promise(r => setTimeout(r, 1000));
    
    await testPostMethod();
    await new Promise(r => setTimeout(r, 1000));
    
    await testTimestamp();
    await new Promise(r => setTimeout(r, 1000));
    
    await testSimpleEndpoint();
    
    console.log('\n🎯 INVESTIGAÇÃO CONCLUÍDA');
    console.log('========================');
    console.log('Se todos os testes falharam com 401, o problema pode ser:');
    console.log('1. Chave realmente expirou');
    console.log('2. IP não está no whitelist');
    console.log('3. Permissões da chave foram alteradas');
    console.log('4. Conta foi suspensa temporariamente');
}

runDeepInvestigation();
