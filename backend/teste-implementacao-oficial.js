/**
 * 🔧 TESTE BYBIT - IMPLEMENTAÇÃO OFICIAL
 * 
 * Baseado no código oficial do GitHub da Bybit:
 * https://github.com/bybit-exchange/api-usage-examples/tree/main/V5_demo/api_demo/Encryption_HMAC.js
 */

const crypto = require('crypto');
const axios = require('axios');

// URL da API (produção)
const url = 'https://api.bybit.com';

// Credenciais da Érica dos Santos (DADOS REAIS)
const apiKey = 'dtbi5nXnYURm7uHnxA';
const secret = 'LsbaYXM2cWr2FrDy5ZQyKW9TieqLHfnC';
const recvWindow = 5000;

/**
 * Gerar assinatura HMAC - IMPLEMENTAÇÃO OFICIAL
 */
function getSignature(parameters, secret) {
    const timestamp = Date.now().toString();
    return crypto.createHmac('sha256', secret).update(timestamp + apiKey + recvWindow + parameters).digest('hex');
}

/**
 * Requisição HTTP - IMPLEMENTAÇÃO OFICIAL
 */
async function http_request(endpoint, method, data, Info) {
    const timestamp = Date.now().toString();
    const sign = crypto.createHmac('sha256', secret).update(timestamp + apiKey + recvWindow + data).digest('hex');
    
    let fullendpoint;

    // Build the request URL based on the method
    if (method === "POST") {
        fullendpoint = url + endpoint;
    } else {
        fullendpoint = url + endpoint + "?" + data;
        data = "";
    }

    const headers = {
        'X-BAPI-SIGN-TYPE': '2',
        'X-BAPI-SIGN': sign,
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow.toString()  
    };

    if (method === "POST") {
        headers['Content-Type'] = 'application/json; charset=utf-8';
    }

    const config = {
        method: method,
        url: fullendpoint,
        headers: headers,
        data: data
    };

    console.log(`${Info} - Enviando requisição...`);
    console.log('🔧 DETALHES DA REQUISIÇÃO:');
    console.log(`   📍 URL: ${fullendpoint}`);
    console.log(`   🔑 API Key: ${apiKey}`);
    console.log(`   ⏰ Timestamp: ${timestamp}`);
    console.log(`   🔐 Signature: ${sign.substring(0, 20)}...`);
    console.log(`   📋 Headers:`, JSON.stringify(headers, null, 2));
    console.log('');

    try {
        const response = await axios(config);
        console.log('✅ SUCESSO!');
        console.log(JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.log('❌ ERRO:');
        if (error.response) {
            console.log(`🌐 Status: ${error.response.status}`);
            console.log('📊 Response Data:', JSON.stringify(error.response.data, null, 2));
            console.log('📝 Response Headers:', JSON.stringify(error.response.headers, null, 2));
        } else {
            console.log(`❗ Erro: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Teste de Wallet Balance - ENDPOINT REAL
 */
async function testarWalletBalance() {
    try {
        console.log('🧪 TESTE OFICIAL - WALLET BALANCE');
        console.log('='.repeat(60));
        
        // Verificar IP atual
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        console.log(`📍 IP atual: ${ipResponse.data.ip}`);
        console.log('');
        
        // Endpoint e parâmetros
        const endpoint = "/v5/account/wallet-balance";
        const method = "GET";
        const data = "accountType=UNIFIED";
        
        const resultado = await http_request(endpoint, method, data, "Wallet Balance Test");
        
        return resultado;
        
    } catch (error) {
        console.log('');
        console.log('❌ FALHA NO TESTE');
        
        if (error.response?.data?.retCode === 10003) {
            console.log('🚨 ERRO 10003 - IP NÃO AUTORIZADO');
            console.log('💡 Configure o IP na Bybit:');
            console.log('   1. Acesse: https://www.bybit.com');
            console.log('   2. Vá em: Account & Security > API Management');
            console.log(`   3. Edite a chave: ${apiKey}`);
            console.log('   4. Configure IP Restriction');
            console.log('   5. Salve as alterações');
        }
        
        return null;
    }
}

/**
 * Executar teste
 */
async function executarTeste() {
    console.log('🚀 INICIANDO TESTE COM IMPLEMENTAÇÃO OFICIAL DA BYBIT');
    console.log('📚 Baseado em: https://github.com/bybit-exchange/api-usage-examples');
    console.log('='.repeat(80));
    console.log('');
    
    const resultado = await testarWalletBalance();
    
    console.log('');
    console.log('='.repeat(80));
    
    if (resultado && resultado.retCode === 0) {
        console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
        console.log('✅ Conectividade estabelecida');
        console.log('✅ IP configurado corretamente');
        console.log('✅ Sistema operacional');
    } else {
        console.log('❌ TESTE FALHOU');
        console.log('💡 Verifique a configuração de IP na Bybit');
    }
}

// Executar
executarTeste();
