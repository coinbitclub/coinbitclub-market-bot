/**
 * 🔧 TESTE ESPECÍFICO DAS CREDENCIAIS DA ÉRICA
 * 
 * Script para testar e diagnosticar as credenciais específicas da Érica
 * com diferentes formatos de assinatura e endpoints
 */

const { Pool } = require('pg');
const crypto = require('crypto');

// Credenciais da Érica exatamente como mostrado na imagem
const CREDENCIAIS_ERICA = {
    nome: 'COINBITCLUB_ERICA',
    apiKey: 'rg1HWyxENWwxbzJGew',
    secretKey: 'gOGr9nokGvtFDBOCSPymQZOE8XnyA1nmR4'
};

console.log('🔧 TESTE ESPECÍFICO DAS CREDENCIAIS DA ÉRICA');
console.log('===========================================');
console.log(`📋 Nome: ${CREDENCIAIS_ERICA.nome}`);
console.log(`🔑 API Key: ${CREDENCIAIS_ERICA.apiKey}`);
console.log(`🔐 Secret: ${CREDENCIAIS_ERICA.secretKey.substring(0, 8)}...`);

async function testarCredenciaisErica() {
    console.log('\n🧪 TESTANDO DIFERENTES ENDPOINTS E FORMATOS:');
    console.log('=============================================');
    
    // 1. Teste com endpoint mais simples - server time
    console.log('\n1️⃣ Testando endpoint público (server time):');
    await testarEndpointPublico();
    
    // 2. Teste com endpoint básico de informações da conta
    console.log('\n2️⃣ Testando endpoint básico (account info):');
    await testarEndpointBasico();
    
    // 3. Teste com diferentes formatos de assinatura
    console.log('\n3️⃣ Testando formatos alternativos de assinatura:');
    await testarFormatosAssinatura();
    
    // 4. Teste específico para Bybit V5
    console.log('\n4️⃣ Testando especificamente Bybit API V5:');
    await testarBybitV5();
}

async function testarEndpointPublico() {
    try {
        const response = await fetch('https://api.bybit.com/v5/market/time');
        const data = await response.json();
        
        if (data.retCode === 0) {
            console.log('   ✅ Conectividade com Bybit OK');
            console.log(`   ⏰ Server time: ${new Date(parseInt(data.result.timeNano / 1000000)).toISOString()}`);
        } else {
            console.log('   ❌ Problema de conectividade com Bybit');
        }
    } catch (error) {
        console.log(`   ❌ Erro de conexão: ${error.message}`);
    }
}

async function testarEndpointBasico() {
    try {
        const timestamp = Date.now();
        const recvWindow = 5000;
        
        // Formato básico da assinatura Bybit V5
        const queryString = `recvWindow=${recvWindow}&timestamp=${timestamp}`;
        const paramString = timestamp + CREDENCIAIS_ERICA.apiKey + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', CREDENCIAIS_ERICA.secretKey).update(paramString).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': CREDENCIAIS_ERICA.apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp.toString(),
            'X-BAPI-RECV-WINDOW': recvWindow.toString(),
            'Content-Type': 'application/json'
        };
        
        console.log('   📡 Headers enviados:');
        console.log('      X-BAPI-API-KEY:', CREDENCIAIS_ERICA.apiKey);
        console.log('      X-BAPI-SIGN:', signature.substring(0, 16) + '...');
        console.log('      X-BAPI-TIMESTAMP:', timestamp);
        
        const response = await fetch(`https://api.bybit.com/v5/account/info?${queryString}`, {
            method: 'GET',
            headers: headers
        });
        
        console.log(`   📊 Status HTTP: ${response.status}`);
        
        const responseText = await response.text();
        console.log('   📝 Resposta:', responseText.substring(0, 200) + '...');
        
        if (response.ok) {
            const data = JSON.parse(responseText);
            if (data.retCode === 0) {
                console.log('   ✅ Sucesso! Conta acessível');
                console.log(`   👤 UID: ${data.result?.uid || 'N/A'}`);
            } else {
                console.log(`   ❌ Erro da API: ${data.retMsg}`);
            }
        } else {
            console.log('   ❌ Erro HTTP');
        }
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
}

async function testarFormatosAssinatura() {
    const timestamp = Date.now();
    const recvWindow = 5000;
    
    // Formato 1: Padrão Bybit V5
    console.log('\n   🔹 Formato 1 - Padrão V5:');
    await testarFormato1(timestamp, recvWindow);
    
    // Formato 2: Sem recvWindow na assinatura
    console.log('\n   🔹 Formato 2 - Sem recvWindow:');
    await testarFormato2(timestamp, recvWindow);
    
    // Formato 3: Ordem diferente
    console.log('\n   🔹 Formato 3 - Ordem alternativa:');
    await testarFormato3(timestamp, recvWindow);
}

async function testarFormato1(timestamp, recvWindow) {
    try {
        const queryString = `recvWindow=${recvWindow}&timestamp=${timestamp}`;
        const paramString = timestamp + CREDENCIAIS_ERICA.apiKey + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', CREDENCIAIS_ERICA.secretKey).update(paramString).digest('hex');
        
        console.log(`      Param string: ${paramString}`);
        console.log(`      Signature: ${signature.substring(0, 16)}...`);
        
        const headers = {
            'X-BAPI-API-KEY': CREDENCIAIS_ERICA.apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp.toString(),
            'X-BAPI-RECV-WINDOW': recvWindow.toString()
        };
        
        const response = await fetch(`https://api.bybit.com/v5/account/info?${queryString}`, {
            method: 'GET',
            headers: headers
        });
        
        console.log(`      Resultado: HTTP ${response.status}`);
        
    } catch (error) {
        console.log(`      Erro: ${error.message}`);
    }
}

async function testarFormato2(timestamp, recvWindow) {
    try {
        const queryString = `timestamp=${timestamp}`;
        const paramString = timestamp + CREDENCIAIS_ERICA.apiKey + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', CREDENCIAIS_ERICA.secretKey).update(paramString).digest('hex');
        
        console.log(`      Param string: ${paramString}`);
        console.log(`      Signature: ${signature.substring(0, 16)}...`);
        
        const headers = {
            'X-BAPI-API-KEY': CREDENCIAIS_ERICA.apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp.toString(),
            'X-BAPI-RECV-WINDOW': recvWindow.toString()
        };
        
        const response = await fetch(`https://api.bybit.com/v5/account/info?${queryString}&recvWindow=${recvWindow}`, {
            method: 'GET',
            headers: headers
        });
        
        console.log(`      Resultado: HTTP ${response.status}`);
        
    } catch (error) {
        console.log(`      Erro: ${error.message}`);
    }
}

async function testarFormato3(timestamp, recvWindow) {
    try {
        const queryString = `recvWindow=${recvWindow}&timestamp=${timestamp}`;
        const paramString = timestamp + CREDENCIAIS_ERICA.apiKey + recvWindow;
        const signature = crypto.createHmac('sha256', CREDENCIAIS_ERICA.secretKey).update(paramString).digest('hex');
        
        console.log(`      Param string: ${paramString}`);
        console.log(`      Signature: ${signature.substring(0, 16)}...`);
        
        const headers = {
            'X-BAPI-API-KEY': CREDENCIAIS_ERICA.apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp.toString(),
            'X-BAPI-RECV-WINDOW': recvWindow.toString()
        };
        
        const response = await fetch(`https://api.bybit.com/v5/account/info?${queryString}`, {
            method: 'GET',
            headers: headers
        });
        
        console.log(`      Resultado: HTTP ${response.status}`);
        
    } catch (error) {
        console.log(`      Erro: ${error.message}`);
    }
}

async function testarBybitV5() {
    try {
        // Testar endpoint específico da V5 com menos permissões
        const timestamp = Date.now();
        const recvWindow = 20000; // Aumentar recv window
        
        const queryString = `recvWindow=${recvWindow}&timestamp=${timestamp}`;
        const paramString = timestamp + CREDENCIAIS_ERICA.apiKey + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', CREDENCIAIS_ERICA.secretKey).update(paramString).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': CREDENCIAIS_ERICA.apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp.toString(),
            'X-BAPI-RECV-WINDOW': recvWindow.toString(),
            'Content-Type': 'application/json'
        };
        
        console.log('   🔄 Testando endpoint de posições...');
        
        const response = await fetch(`https://api.bybit.com/v5/position/list?category=linear&${queryString}`, {
            method: 'GET',
            headers: headers
        });
        
        const responseText = await response.text();
        console.log(`   📊 Status: ${response.status}`);
        
        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log(`   📝 Resposta: ${JSON.stringify(data, null, 2)}`);
            
            if (data.retCode === 0) {
                console.log('   ✅ SUCESSO! Chaves funcionando corretamente');
                console.log(`   📊 Posições encontradas: ${data.result?.list?.length || 0}`);
            } else {
                console.log(`   ❌ Erro: ${data.retMsg}`);
                console.log(`   🔍 Código: ${data.retCode}`);
            }
        } else {
            console.log('   ❌ Erro HTTP');
            console.log(`   📝 Resposta: ${responseText}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Erro na execução: ${error.message}`);
    }
}

// Executar testes
testarCredenciaisErica().catch(console.error);
