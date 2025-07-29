/**
 * 🔧 TESTE AVANÇADO - SINCRONIZAÇÃO DE TEMPO
 * 
 * Verificar se o problema é sincronização de tempo
 */

const crypto = require('crypto');
const axios = require('axios');

// Credenciais da Érica dos Santos
const apiKey = 'dtbi5nXnYURm7uHnxA';
const secret = 'LsbaYXM2cWr2FrDy5ZQyKW9TieqLHfnC';
const recvWindow = 5000;

/**
 * Obter tempo do servidor Bybit
 */
async function obterTempoServidor() {
    try {
        const response = await axios.get('https://api.bybit.com/v5/market/time');
        return parseInt(response.data.result.timeSecond) * 1000; // converter para ms
    } catch (error) {
        console.log('❌ Erro ao obter tempo do servidor');
        return Date.now();
    }
}

/**
 * Teste com tempo do servidor
 */
async function testarComTempoServidor() {
    try {
        console.log('🕐 TESTE COM TEMPO DO SERVIDOR BYBIT');
        console.log('='.repeat(50));
        
        // Obter tempo do servidor
        const serverTime = await obterTempoServidor();
        const localTime = Date.now();
        
        console.log(`⏰ Tempo local: ${localTime}`);
        console.log(`🌐 Tempo servidor: ${serverTime}`);
        console.log(`🔄 Diferença: ${Math.abs(serverTime - localTime)} ms`);
        console.log('');
        
        // Usar tempo do servidor para timestamp
        const timestamp = serverTime.toString();
        const queryString = 'accountType=UNIFIED';
        const paramStr = timestamp + apiKey + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', secret).update(paramStr).digest('hex');
        
        console.log('🔧 DADOS PARA ASSINATURA (TEMPO SERVIDOR):');
        console.log(`   📅 Timestamp: ${timestamp}`);
        console.log(`   🔑 API Key: ${apiKey}`);
        console.log(`   ⏰ Recv Window: ${recvWindow}`);
        console.log(`   🔗 Query String: ${queryString}`);
        console.log(`   📝 String completa: ${paramStr}`);
        console.log(`   🔐 Signature: ${signature}`);
        console.log('');
        
        // Fazer requisição
        const response = await axios.get('https://api.bybit.com/v5/account/wallet-balance', {
            headers: {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow.toString()
            },
            params: {
                accountType: 'UNIFIED'
            },
            timeout: 15000
        });
        
        console.log('🎉 SUCESSO COM TEMPO DO SERVIDOR!');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ ERRO MESMO COM TEMPO DO SERVIDOR:');
        if (error.response) {
            console.log(`🌐 Status: ${error.response.status}`);
            console.log('📊 Data:', error.response.data);
        } else {
            console.log(`❗ ${error.message}`);
        }
    }
}

/**
 * Teste simples de conectividade sem auth
 */
async function testarConectividadeSimples() {
    console.log('📡 TESTE DE CONECTIVIDADE SIMPLES');
    console.log('='.repeat(40));
    
    try {
        // IP check
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        console.log(`📍 IP: ${ipResponse.data.ip}`);
        
        // Server time
        const timeResponse = await axios.get('https://api.bybit.com/v5/market/time');
        console.log(`⏰ Server time: OK`);
        
        // Market data
        const marketResponse = await axios.get('https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT');
        console.log(`📊 Market data: OK`);
        
        console.log('✅ Conectividade básica perfeita');
        
    } catch (error) {
        console.log('❌ Problema de conectividade básica');
    }
}

/**
 * Executar todos os testes
 */
async function executarTestes() {
    console.log('🔍 DIAGNÓSTICO AVANÇADO - BYBIT API');
    console.log('='.repeat(60));
    console.log('');
    
    await testarConectividadeSimples();
    console.log('');
    await testarComTempoServidor();
    
    console.log('');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('1. Se ainda falhar, verificar IP na Bybit');
    console.log('2. Confirmar que a chave API está ativa');
    console.log('3. Verificar se há restrições de IP configuradas');
}

executarTestes();
