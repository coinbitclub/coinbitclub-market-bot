/**
 * DIAGNÓSTICO COMPLETO - BINANCE TESTNET
 * Ferramenta específica para diagnosticar problemas na API da Binance Testnet
 */

require('dotenv').config({ path: '.env.test-mauro' });
const axios = require('axios');
const crypto = require('crypto');

console.log('🔍 DIAGNÓSTICO COMPLETO BINANCE TESTNET');
console.log('=======================================\n');

// Configurações
const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_API_SECRET;
const BASE_URL = 'https://testnet.binancefuture.com';

async function verificarIP() {
    try {
        console.log('📍 1. VERIFICANDO IP ATUAL');
        console.log('─────────────────────────');
        
        const resposta = await axios.get('https://api.ipify.org?format=json');
        console.log(`✅ Seu IP atual: ${resposta.data.ip}`);
        console.log(`📝 Configure este IP na Binance: ${resposta.data.ip}\n`);
        
        return resposta.data.ip;
    } catch (error) {
        console.log('❌ Erro ao obter IP:', error.message);
        return null;
    }
}

async function testarEndpointPublico() {
    try {
        console.log('🌐 2. TESTANDO ENDPOINT PÚBLICO');
        console.log('─────────────────────────────');
        
        const url = `${BASE_URL}/fapi/v1/ping`;
        const resposta = await axios.get(url);
        
        console.log('✅ Endpoint público OK');
        console.log(`📊 Status: ${resposta.status}\n`);
        
        return true;
    } catch (error) {
        console.log('❌ Erro no endpoint público:', error.message);
        return false;
    }
}

async function obterHoraServidor() {
    try {
        console.log('⏰ 3. OBTENDO HORA DO SERVIDOR');
        console.log('─────────────────────────────');
        
        const url = `${BASE_URL}/fapi/v1/time`;
        const resposta = await axios.get(url);
        
        const horaServidor = new Date(resposta.data.serverTime);
        const horaLocal = new Date();
        const diferenca = Math.abs(horaLocal.getTime() - horaServidor.getTime());
        
        console.log(`✅ Hora do servidor: ${horaServidor.toISOString()}`);
        console.log(`🕐 Hora local: ${horaLocal.toISOString()}`);
        console.log(`⏱️ Diferença: ${diferenca}ms`);
        
        if (diferenca > 1000) {
            console.log('⚠️ ATENÇÃO: Diferença de tempo > 1 segundo');
        }
        
        console.log('');
        return resposta.data.serverTime;
    } catch (error) {
        console.log('❌ Erro ao obter hora do servidor:', error.message);
        return Date.now();
    }
}

function criarAssinatura(queryString, secret) {
    return crypto
        .createHmac('sha256', secret)
        .update(queryString)
        .digest('hex');
}

async function testarAutenticacao() {
    try {
        console.log('🔐 4. TESTANDO AUTENTICAÇÃO');
        console.log('─────────────────────────');
        
        console.log(`📋 API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 8)}`);
        console.log(`🔑 Secret: ${API_SECRET.substring(0, 8)}...${API_SECRET.substring(API_SECRET.length - 8)}`);
        
        // Obter timestamp
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`;
        const signature = criarAssinatura(queryString, API_SECRET);
        
        console.log(`⏰ Timestamp: ${timestamp}`);
        console.log(`✏️ Assinatura: ${signature.substring(0, 16)}...`);
        
        const url = `${BASE_URL}/fapi/v2/account?${queryString}&signature=${signature}`;
        
        const resposta = await axios.get(url, {
            headers: {
                'X-MBX-APIKEY': API_KEY
            }
        });
        
        console.log('✅ Autenticação bem-sucedida!');
        console.log(`📊 Status: ${resposta.status}`);
        console.log(`💰 Saldo total USDT: ${resposta.data.totalWalletBalance}`);
        console.log('');
        
        return true;
    } catch (error) {
        console.log('❌ Erro na autenticação:');
        
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Código: ${error.response.data.code}`);
            console.log(`   Mensagem: ${error.response.data.msg}`);
            
            // Análise específica do erro -2015
            if (error.response.data.code === -2015) {
                console.log('\n🔧 ANÁLISE DO ERRO -2015:');
                console.log('   Este erro geralmente indica:');
                console.log('   1. API Key inválida');
                console.log('   2. IP não autorizado');
                console.log('   3. Permissões insuficientes');
                console.log('   4. Chaves de produção sendo usadas no testnet');
            }
        } else {
            console.log(`   Erro: ${error.message}`);
        }
        
        console.log('');
        return false;
    }
}

async function verificarPermissoes() {
    try {
        console.log('🔒 5. VERIFICANDO PERMISSÕES');
        console.log('──────────────────────────');
        
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`;
        const signature = criarAssinatura(queryString, API_SECRET);
        
        const url = `${BASE_URL}/fapi/v1/apiTradingStatus?${queryString}&signature=${signature}`;
        
        const resposta = await axios.get(url, {
            headers: {
                'X-MBX-APIKEY': API_KEY
            }
        });
        
        console.log('✅ Verificação de permissões OK');
        console.log(`📊 Status: ${JSON.stringify(resposta.data, null, 2)}`);
        console.log('');
        
        return true;
    } catch (error) {
        console.log('❌ Erro ao verificar permissões:');
        
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Código: ${error.response.data.code}`);
            console.log(`   Mensagem: ${error.response.data.msg}`);
        } else {
            console.log(`   Erro: ${error.message}`);
        }
        
        console.log('');
        return false;
    }
}

async function executarDiagnostico() {
    console.log('🎯 Executando diagnóstico completo...\n');
    
    // 1. Verificar IP
    const ip = await verificarIP();
    
    // 2. Testar endpoint público
    const endpointOK = await testarEndpointPublico();
    
    if (!endpointOK) {
        console.log('❌ Falha na conectividade básica');
        return;
    }
    
    // 3. Obter hora do servidor
    await obterHoraServidor();
    
    // 4. Testar autenticação
    const authOK = await testarAutenticacao();
    
    // 5. Se autenticação OK, verificar permissões
    if (authOK) {
        await verificarPermissoes();
    }
    
    console.log('📋 RESUMO DO DIAGNÓSTICO');
    console.log('=======================');
    console.log(`📍 IP atual: ${ip}`);
    console.log(`🌐 Conectividade: ${endpointOK ? '✅ OK' : '❌ Falha'}`);
    console.log(`🔐 Autenticação: ${authOK ? '✅ OK' : '❌ Falha'}`);
    
    if (!authOK) {
        console.log('\n🔧 PRÓXIMOS PASSOS:');
        console.log('1. Verifique se as chaves são realmente do TESTNET');
        console.log('2. Configure o IP na Binance (se necessário)');
        console.log('3. Verifique as permissões da API Key');
        console.log('4. Certifique-se de estar usando testnet.binancefuture.com');
    }
}

// Executar diagnóstico
executarDiagnostico().catch(console.error);
