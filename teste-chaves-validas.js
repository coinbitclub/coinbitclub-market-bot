/**
 * 🔍 TESTE ESPECÍFICO - CHAVES VÁLIDAS DA BYBIT
 * 
 * Como as chaves são válidas na Bybit, vamos testar:
 * 1. Formato de assinatura
 * 2. Parâmetros da requisição
 * 3. Headers necessários
 * 4. Endpoints corretos
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔍 TESTE ESPECÍFICO - CHAVES VÁLIDAS DA BYBIT');
console.log('==============================================');

async function testarChavesValidas() {
    try {
        // 1. Buscar uma chave específica para testar
        console.log('\n📊 1. BUSCANDO CHAVE PARA TESTE DETALHADO:');
        
        const chaves = await pool.query(`
            SELECT 
                u.name,
                u.email,
                uak.api_key,
                uak.secret_key,
                uak.environment
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.exchange = 'bybit' AND uak.is_active = true
            LIMIT 1
        `);
        
        if (chaves.rows.length === 0) {
            console.log('❌ Nenhuma chave encontrada');
            return;
        }
        
        const chave = chaves.rows[0];
        console.log(`✅ Testando chave de: ${chave.name}`);
        console.log(`   API Key: ${chave.api_key}`);
        console.log(`   Ambiente: ${chave.environment}`);
        
        // 2. Testar diferentes formatos de assinatura
        console.log('\n🔧 2. TESTANDO DIFERENTES FORMATOS DE ASSINATURA:');
        
        await testarFormatoAssinatura1(chave);
        await testarFormatoAssinatura2(chave);
        await testarFormatoAssinatura3(chave);
        
        // 3. Testar diferentes endpoints
        console.log('\n🌐 3. TESTANDO DIFERENTES ENDPOINTS:');
        
        await testarEndpointServerTime(chave);
        await testarEndpointAccountInfo(chave);
        await testarEndpointWalletBalance(chave);
        
        // 4. Verificar se o problema pode ser de IP
        console.log('\n🔍 4. TESTE ESPECÍFICO DE IP:');
        
        await testarComErroDeferente(chave);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

// Formato 1: Método atual que estamos usando
async function testarFormatoAssinatura1(chave) {
    console.log('\n🧪 FORMATO 1 - Método Atual:');
    
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        // Assinatura: timestamp + apiKey + recvWindow
        const message = timestamp + chave.api_key + recvWindow;
        const signature = crypto.createHmac('sha256', chave.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': chave.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        console.log(`   📝 Message: ${message.substring(0, 50)}...`);
        console.log(`   🔐 Signature: ${signature.substring(0, 20)}...`);
        
        const response = await fetch(`${baseUrl}/v5/market/time`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        console.log(`   📊 Resultado: ${data.retCode} - ${data.retMsg}`);
        
        if (data.retCode === 10006) {
            console.log('   🚨 CONFIRMADO: Problema de IP!');
            return true;
        }
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
    
    return false;
}

// Formato 2: Com query string (se houver)
async function testarFormatoAssinatura2(chave) {
    console.log('\n🧪 FORMATO 2 - Com Query String:');
    
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryString = ''; // Sem parâmetros para /v5/market/time
        
        // Assinatura: timestamp + apiKey + recvWindow + queryString
        const message = timestamp + chave.api_key + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', chave.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': chave.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        console.log(`   📝 Message: ${message.substring(0, 50)}...`);
        console.log(`   🔐 Signature: ${signature.substring(0, 20)}...`);
        
        const response = await fetch(`${baseUrl}/v5/market/time`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        console.log(`   📊 Resultado: ${data.retCode} - ${data.retMsg}`);
        
        if (data.retCode === 10006) {
            console.log('   🚨 CONFIRMADO: Problema de IP!');
            return true;
        }
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
    
    return false;
}

// Formato 3: Endpoint que requer autenticação mas é mais simples
async function testarFormatoAssinatura3(chave) {
    console.log('\n🧪 FORMATO 3 - Endpoint Account Info:');
    
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        const message = timestamp + chave.api_key + recvWindow;
        const signature = crypto.createHmac('sha256', chave.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': chave.api_key,
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
        console.log(`   📊 Resultado: ${data.retCode} - ${data.retMsg}`);
        
        if (data.retCode === 10006) {
            console.log('   🚨 CONFIRMADO: Problema de IP!');
            return true;
        } else if (data.retCode === 0) {
            console.log('   ✅ SUCESSO! Chave funcionando!');
            return false;
        }
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
    
    return false;
}

async function testarEndpointServerTime(chave) {
    console.log('\n🕐 Server Time (Público):');
    
    const baseUrl = chave.environment === 'testnet' ? 
        'https://api-testnet.bybit.com' : 
        'https://api.bybit.com';
    
    try {
        const response = await fetch(`${baseUrl}/v5/market/time`);
        const data = await response.json();
        console.log(`   📊 Server Time: ${data.retCode === 0 ? 'OK' : 'Erro'}`);
        
        if (data.retCode === 0) {
            console.log(`   🕐 Time: ${new Date(parseInt(data.result.timeSecond) * 1000).toLocaleString()}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
}

async function testarEndpointAccountInfo(chave) {
    console.log('\n👤 Account Info (Privado):');
    // Já testado no formato 3
}

async function testarEndpointWalletBalance(chave) {
    console.log('\n💰 Wallet Balance (Privado):');
    
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryString = 'accountType=UNIFIED';
        
        const message = timestamp + chave.api_key + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', chave.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': chave.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        const response = await fetch(`${baseUrl}/v5/account/wallet-balance?${queryString}`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        console.log(`   📊 Wallet Balance: ${data.retCode} - ${data.retMsg}`);
        
        if (data.retCode === 10006) {
            console.log('   🚨 CONFIRMADO: Problema de IP!');
        }
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
}

async function testarComErroDeferente(chave) {
    console.log('🎯 TESTE FINAL - ANÁLISE DE ERROS:');
    console.log('==================================');
    
    console.log('📋 CÓDIGOS DE ERRO BYBIT:');
    console.log('   10001: Parâmetros obrigatórios ausentes');
    console.log('   10003: API key inválida');
    console.log('   10004: Erro de assinatura'); 
    console.log('   10005: Permissões insuficientes');
    console.log('   10006: IP não autorizado ← ESTE É O QUE PRECISAMOS VER');
    console.log('   10007: Muitas tentativas');
    
    console.log('\n💡 CONCLUSÃO:');
    console.log('Se você confirma que as chaves são válidas na Bybit,');
    console.log('e estamos recebendo erro 10003 (API key inválida),');
    console.log('então há 3 possibilidades:');
    console.log('');
    console.log('1. 🔐 PROBLEMA DE ASSINATURA:');
    console.log('   • Formato da assinatura incorreto');
    console.log('   • Encoding diferente');
    console.log('   • Timestamp fora do range');
    console.log('');
    console.log('2. 🌐 PROBLEMA DE IP (mais provável):');
    console.log('   • IP restrito nas chaves');
    console.log('   • Erro 10003 sendo mostrado como 10006');
    console.log('   • Configuração de whitelist ativa');
    console.log('');
    console.log('3. 🔧 PROBLEMA DE CONFIGURAÇÃO:');
    console.log('   • Chaves no ambiente errado (testnet vs mainnet)');
    console.log('   • Permissões específicas não habilitadas');
    console.log('');
    console.log('🎯 TESTE DEFINITIVO:');
    console.log('Acesse uma das contas Bybit e verifique:');
    console.log('• As chaves estão ativas?');
    console.log('• Há restrição de IP configurada?');
    console.log('• As permissões incluem "Read"?');
}

// Executar teste
testarChavesValidas().catch(console.error);
