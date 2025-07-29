/**
 * 🔧 TESTE DE SERVIDOR TIME BYBIT
 * 
 * Teste com endpoint público para verificar conectividade básica
 */

const axios = require('axios');

async function testarServerTime() {
    try {
        console.log('🕐 TESTANDO SERVIDOR TIME DA BYBIT');
        console.log('='.repeat(50));
        
        // Endpoint público - não requer autenticação
        const response = await axios.get('https://api.bybit.com/v5/market/time', {
            timeout: 10000
        });
        
        console.log('✅ SUCESSO! Conectividade básica OK');
        console.log(`📊 Status: ${response.status}`);
        console.log(`⏰ Server Time: ${response.data.result.timeSecond}`);
        console.log(`⏰ Local Time: ${Math.floor(Date.now() / 1000)}`);
        
        const serverTime = parseInt(response.data.result.timeSecond);
        const localTime = Math.floor(Date.now() / 1000);
        const diff = Math.abs(serverTime - localTime);
        
        console.log(`🔄 Diferença: ${diff} segundos`);
        
        if (diff > 30) {
            console.log('⚠️ AVISO: Diferença de tempo > 30 segundos');
            console.log('💡 Isso pode causar problemas de autenticação');
        } else {
            console.log('✅ Sincronização de tempo OK');
        }
        
        return { serverTime, localTime, diff };
        
    } catch (error) {
        console.log('❌ FALHA NA CONECTIVIDADE BÁSICA');
        console.log(`❗ Erro: ${error.message}`);
        if (error.response) {
            console.log(`🌐 Status: ${error.response.status}`);
        }
        return null;
    }
}

// Testar endpoints públicos primeiro
async function testarEndpointsPublicos() {
    console.log('🧪 TESTANDO ENDPOINTS PÚBLICOS DA BYBIT');
    console.log('='.repeat(50));
    
    const endpoints = [
        '/v5/market/time',
        '/v5/announcements/index',
        '/v5/market/kline?category=spot&symbol=BTCUSDT&interval=1&start=1672531200000&end=1672617600000'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`📡 Testando: ${endpoint}`);
            const response = await axios.get(`https://api.bybit.com${endpoint}`, {
                timeout: 10000
            });
            console.log(`   ✅ Status: ${response.status} - OK`);
        } catch (error) {
            console.log(`   ❌ Erro: ${error.response?.status || error.message}`);
        }
    }
}

async function executarTestes() {
    console.log('🔍 DIAGNÓSTICO DE CONECTIVIDADE BYBIT');
    console.log('='.repeat(60));
    
    // Teste 1: IP atual
    try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        console.log(`📍 IP atual: ${ipResponse.data.ip}`);
    } catch (error) {
        console.log('❌ Erro ao verificar IP');
    }
    
    console.log('');
    
    // Teste 2: Endpoints públicos
    await testarEndpointsPublicos();
    
    console.log('');
    
    // Teste 3: Server time
    const timeResult = await testarServerTime();
    
    console.log('');
    console.log('📋 RESUMO:');
    console.log('='.repeat(30));
    
    if (timeResult) {
        console.log('✅ Conectividade básica: OK');
        console.log('✅ API Bybit: Acessível');
        console.log(`⏰ Sync de tempo: ${timeResult.diff <= 30 ? 'OK' : 'PROBLEMA'}`);
        console.log('');
        console.log('💡 O problema está na autenticação/assinatura, não na conectividade');
    } else {
        console.log('❌ Conectividade básica: FALHA');
        console.log('💡 Problema de rede ou firewall');
    }
}

executarTestes();
