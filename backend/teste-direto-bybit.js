/**
 * 🔧 TESTE DIRETO BYBIT - COM CREDENCIAIS FIXAS
 * 
 * Teste direto com as credenciais conhecidas da Érica
 * Para validar se a implementação está correta
 */

const axios = require('axios');
const crypto = require('crypto');

// Credenciais da Érica dos Santos (DADOS REAIS)
const CREDENCIAIS = {
    api_key: 'dtbi5nXnYURm7uHnxA',
    secret_key: 'LsbaYXM2cWr2FrDy5ZQyKW9TieqLHfnC',
    nome: 'Érica dos Santos Andrade'
};

const IP_RAILWAY = '132.255.160.140';

/**
 * Gerar assinatura HMAC SHA256 para Bybit API v5
 * Baseado na documentação oficial
 */
function generateSignature(queryString, secret, timestamp, apiKey, recvWindow) {
    const paramStr = timestamp + apiKey + recvWindow + queryString;
    console.log('🔧 DADOS PARA ASSINATURA:');
    console.log(`   📅 Timestamp: ${timestamp}`);
    console.log(`   🔑 API Key: ${apiKey}`);
    console.log(`   ⏰ Recv Window: ${recvWindow}`);
    console.log(`   🔗 Query String: ${queryString}`);
    console.log(`   📝 String completa: ${paramStr}`);
    
    const signature = crypto.createHmac('sha256', secret).update(paramStr).digest('hex');
    console.log(`   🔐 Signature: ${signature}`);
    return signature;
}

/**
 * Verificar IP atual
 */
async function verificarIP() {
    try {
        const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
        return response.data.ip;
    } catch (error) {
        return 'Não foi possível verificar';
    }
}

/**
 * Teste direto com Bybit
 */
async function testarBybitDireto() {
    try {
        console.log('🔧 TESTE DIRETO BYBIT - CREDENCIAIS FIXAS');
        console.log('='.repeat(60));
        
        // Verificar IP
        const ipAtual = await verificarIP();
        console.log(`📍 IP atual: ${ipAtual}`);
        console.log(`🎯 IP esperado: ${IP_RAILWAY}`);
        console.log(`👤 Usuária: ${CREDENCIAIS.nome}`);
        console.log(`🔑 API Key: ${CREDENCIAIS.api_key}`);
        console.log('');
        
        // Parâmetros da requisição
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryString = 'accountType=UNIFIED';
        
        // Gerar assinatura
        const signature = generateSignature(
            queryString, 
            CREDENCIAIS.secret_key, 
            timestamp, 
            CREDENCIAIS.api_key, 
            recvWindow
        );
        
        console.log('');
        console.log('🚀 ENVIANDO REQUISIÇÃO...');
        
        // Fazer requisição
        const response = await axios.get('https://api.bybit.com/v5/account/wallet-balance', {
            headers: {
                'X-BAPI-API-KEY': CREDENCIAIS.api_key,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow
            },
            params: {
                accountType: 'UNIFIED'
            },
            timeout: 15000
        });
        
        console.log('');
        console.log('🎉 SUCESSO! CONECTIVIDADE ESTABELECIDA!');
        console.log(`✅ Status: ${response.status}`);
        console.log(`✅ Código de retorno: ${response.data.retCode}`);
        console.log(`✅ Mensagem: ${response.data.retMsg}`);
        
        if (response.data.result && response.data.result.list) {
            console.log('');
            console.log('💰 SALDOS DA CONTA:');
            
            let temSaldos = false;
            response.data.result.list.forEach(account => {
                if (account.coin && account.coin.length > 0) {
                    console.log(`   📊 ${account.accountType}:`);
                    console.log(`   💎 Total Wallet Balance: ${account.totalWalletBalance} USD`);
                    console.log(`   💰 Total Available Balance: ${account.totalAvailableBalance} USD`);
                    
                    account.coin.forEach(coin => {
                        const saldo = parseFloat(coin.walletBalance);
                        if (saldo > 0) {
                            console.log(`      💎 ${coin.coin}: ${saldo}`);
                            temSaldos = true;
                        }
                    });
                }
            });
            
            if (!temSaldos) {
                console.log('   📭 Conta sem saldos ou saldos zerados');
            }
        }
        
        console.log('');
        console.log('🚀 SISTEMA OPERACIONAL - IP CONFIGURADO CORRETAMENTE!');
        
        return true;
        
    } catch (error) {
        console.log('');
        console.log('❌ FALHA NA CONECTIVIDADE');
        
        if (error.response) {
            console.log(`🌐 Status HTTP: ${error.response.status}`);
            console.log('📊 Resposta completa:');
            console.log(JSON.stringify(error.response.data, null, 2));
            
            if (error.response.data.retCode === 10003) {
                console.log('');
                console.log('🚨 ERRO 10003 - IP NÃO AUTORIZADO');
                console.log(`💡 O IP ${ipAtual} não está configurado na Bybit`);
                console.log('📋 Configure o IP na Bybit:');
                console.log('   1. Acesse: https://www.bybit.com');
                console.log('   2. Vá em: Account & Security > API Management');
                console.log(`   3. Edite a chave: ${CREDENCIAIS.api_key}`);
                console.log(`   4. Configure IP Restriction: ${ipAtual}`);
                console.log('   5. Salve as alterações');
            } else if (error.response.data.retCode === 10004) {
                console.log('');
                console.log('🚨 ERRO 10004 - PROBLEMA DE ASSINATURA');
                console.log('💡 Verificar implementação da assinatura HMAC');
            }
        } else {
            console.log(`❗ Erro: ${error.message}`);
        }
        
        return false;
    }
}

// Executar teste
console.log('Iniciando teste direto...');
testarBybitDireto().then(sucesso => {
    console.log('');
    console.log('='.repeat(60));
    console.log(sucesso ? '✅ TESTE CONCLUÍDO COM SUCESSO' : '❌ TESTE FALHOU');
    process.exit(sucesso ? 0 : 1);
}).catch(error => {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
});
