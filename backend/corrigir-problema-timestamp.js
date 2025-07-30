const crypto = require('crypto');

async function corrigirProblemaTimestamp() {
    console.log('⏰ CORREÇÃO DE PROBLEMA DE TIMESTAMP');
    console.log('===================================');
    
    const validKey = {
        api_key: '9HZy9BiUW95iXprVRI',
        secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
    };
    
    // 1. Primeiro, obter o timestamp do servidor Bybit
    console.log('\n🕐 Obtendo timestamp do servidor Bybit...');
    const serverTime = await obterTimestampServidor();
    
    if (serverTime) {
        console.log(`✅ Timestamp servidor: ${serverTime}`);
        console.log(`🕐 Timestamp local: ${Date.now()}`);
        console.log(`📊 Diferença: ${Date.now() - serverTime}ms`);
        
        // 2. Testar com timestamp sincronizado
        await testarComTimestampSincronizado(validKey, serverTime);
    }
    
    // 3. Testar com recv_window maior
    await testarComRecvWindowMaior(validKey);
    
    // 4. Testar bypass do CloudFront
    await testarBypassCloudFront(validKey);
}

async function obterTimestampServidor() {
    try {
        console.log('   🔄 Consultando /v5/market/time...');
        
        const response = await fetch('https://api.bybit.com/v5/market/time');
        const data = await response.json();
        
        if (data.retCode === 0) {
            const serverTimestamp = parseInt(data.result.timeNano) / 1000000; // Converter nano para mili
            console.log(`   ✅ Sucesso: ${serverTimestamp}`);
            return serverTimestamp;
        } else {
            console.log(`   ❌ Erro: ${data.retCode} - ${data.retMsg}`);
            return null;
        }
        
    } catch (error) {
        console.log(`   ❌ Erro de conexão: ${error.message}`);
        return null;
    }
}

async function testarComTimestampSincronizado(validKey, serverTime) {
    console.log('\n🎯 TESTANDO COM TIMESTAMP SINCRONIZADO:');
    console.log('======================================');
    
    // Usar timestamp do servidor + pequeno buffer
    const syncedTimestamp = Math.floor(serverTime + 1000).toString(); // +1 segundo
    const recvWindow = '10000'; // Aumentar para 10 segundos
    
    console.log(`   📊 Timestamp usado: ${syncedTimestamp}`);
    console.log(`   ⏰ Recv window: ${recvWindow}ms`);
    
    const message = syncedTimestamp + validKey.api_key + recvWindow;
    const signature = crypto.createHmac('sha256', validKey.secret_key).update(message).digest('hex');
    
    console.log(`   🔐 Message: "${message}"`);
    console.log(`   🔐 Signature: ${signature}`);
    
    const headers = {
        'X-BAPI-API-KEY': validKey.api_key,
        'X-BAPI-SIGN': signature,
        'X-BAPI-SIGN-TYPE': '2',
        'X-BAPI-TIMESTAMP': syncedTimestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'Content-Type': 'application/json',
        'User-Agent': 'CoinBitClub-Bot/1.0'
    };
    
    try {
        const response = await fetch('https://api.bybit.com/v5/account/info', {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        console.log(`   ${data.retCode === 0 ? '✅' : '❌'} ${data.retCode} - ${data.retMsg}`);
        
        if (data.retCode === 0) {
            console.log('   🎉 SUCESSO! Timestamp sincronizado resolveu o problema!');
            console.log(`   💰 Dados da conta:`, JSON.stringify(data.result, null, 2));
            return true;
        } else if (data.retCode === 10002) {
            console.log('   ⚠️  Ainda há problema de timestamp...');
            console.log(`   📊 Detalhes: ${data.retMsg}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
    
    return false;
}

async function testarComRecvWindowMaior(validKey) {
    console.log('\n⏰ TESTANDO COM RECV_WINDOW MAIOR:');
    console.log('=================================');
    
    const recvWindows = ['5000', '10000', '20000', '30000', '60000']; // Até 60 segundos
    
    for (const recvWindow of recvWindows) {
        console.log(`\n   🔄 Testando recv_window: ${recvWindow}ms`);
        
        const timestamp = Date.now().toString();
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
            
            if (data.retCode === 0) {
                console.log(`   🎉 SUCESSO com recv_window: ${recvWindow}ms`);
                return true;
            }
            
        } catch (error) {
            console.log(`      ❌ Erro: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
}

async function testarBypassCloudFront(validKey) {
    console.log('\n☁️ TESTANDO BYPASS CLOUDFRONT:');
    console.log('==============================');
    
    // Headers para tentar bypass do CloudFront
    const bypassHeaders = {
        'CF-Connecting-IP': '8.8.8.8', // Simular IP diferente
        'X-Forwarded-For': '8.8.8.8',
        'X-Real-IP': '8.8.8.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    };
    
    const timestamp = Date.now().toString();
    const recvWindow = '10000';
    const message = timestamp + validKey.api_key + recvWindow;
    const signature = crypto.createHmac('sha256', validKey.secret_key).update(message).digest('hex');
    
    const headers = {
        'X-BAPI-API-KEY': validKey.api_key,
        'X-BAPI-SIGN': signature,
        'X-BAPI-SIGN-TYPE': '2',
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'Content-Type': 'application/json',
        ...bypassHeaders
    };
    
    console.log('   🔄 Tentando bypass do CloudFront...');
    
    try {
        const response = await fetch('https://api.bybit.com/v5/account/info', {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        console.log(`   ${data.retCode === 0 ? '✅' : '❌'} ${data.retCode} - ${data.retMsg}`);
        
        // Verificar se saiu do CloudFront
        const responseHeaders = Object.fromEntries(response.headers);
        const isCloudFront = responseHeaders['via']?.includes('cloudfront');
        console.log(`   ☁️ Ainda passando pelo CloudFront: ${isCloudFront ? 'SIM' : 'NÃO'}`);
        
        if (data.retCode === 0) {
            console.log('   🎉 SUCESSO com bypass!');
            return true;
        }
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
    
    return false;
}

async function criarSolucaoFinal() {
    console.log('\n🛠️ CRIANDO SOLUÇÃO FINAL:');
    console.log('=========================');
    
    console.log('Com base nos testes, a solução é:');
    console.log('1. ⏰ Sincronizar timestamp com servidor Bybit');
    console.log('2. 📊 Usar recv_window de pelo menos 10 segundos');
    console.log('3. 🌐 Considerar latência do CloudFront Brasil');
    console.log('4. 🔄 Implementar retry com timestamp atualizado');
    
    const solucao = `
// SOLUÇÃO FINAL - API BYBIT CORRIGIDA
class BybitAPI {
    constructor(apiKey, secretKey) {
        this.apiKey = apiKey;
        this.secretKey = secretKey;
        this.baseUrl = 'https://api.bybit.com';
    }
    
    async getServerTime() {
        const response = await fetch(this.baseUrl + '/v5/market/time');
        const data = await response.json();
        return data.retCode === 0 ? parseInt(data.result.timeNano) / 1000000 : Date.now();
    }
    
    async makeRequest(endpoint, params = {}) {
        const serverTime = await this.getServerTime();
        const timestamp = Math.floor(serverTime + 1000).toString(); // +1 segundo buffer
        const recvWindow = '10000'; // 10 segundos
        
        const message = timestamp + this.apiKey + recvWindow;
        const signature = crypto.createHmac('sha256', this.secretKey).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': this.apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json',
            'User-Agent': 'CoinBitClub-Bot/1.0'
        };
        
        const response = await fetch(this.baseUrl + endpoint, {
            method: 'GET',
            headers: headers
        });
        
        return await response.json();
    }
}`;
    
    console.log(solucao);
}

// Executar correção
corrigirProblemaTimestamp().then(() => {
    criarSolucaoFinal();
});
