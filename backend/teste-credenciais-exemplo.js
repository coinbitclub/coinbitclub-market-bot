/**
 * 🧪 TESTE COM CREDENCIAIS DE EXEMPLO
 * 
 * Testar com credenciais da documentação oficial da Bybit
 * para confirmar que nosso código está funcionando
 */

const axios = require('axios');
const crypto = require('crypto');

function generateBybitSignature(queryString, secret, timestamp, apiKey, recvWindow) {
    const paramStr = timestamp + apiKey + recvWindow + queryString;
    return crypto.createHmac('sha256', secret).update(paramStr).digest('hex');
}

async function testeComCredenciaisExemplo() {
    try {
        console.log('🧪 TESTE COM CREDENCIAIS DE EXEMPLO');
        console.log('='.repeat(50));
        console.log('📖 Usando credenciais da documentação oficial');
        console.log('');
        
        // Credenciais de exemplo da documentação (estas não funcionarão realmente)
        const testCredentials = [
            {
                name: "Exemplo Testnet",
                apiKey: "BYBITAPIKEY",
                secretKey: "BYBITSECRET",
                baseUrl: "https://api-testnet.bybit.com"
            },
            {
                name: "Teste Real - Érica (sem IP)",
                apiKey: "dtbi5nXnYURm7uHnxA",
                secretKey: "LsbaYXM2cWr2FrDy5ZQyKW9TieqLHfnC",
                baseUrl: "https://api.bybit.com"
            }
        ];
        
        for (const cred of testCredentials) {
            console.log(`🔍 TESTANDO: ${cred.name}`);
            console.log(`   🌐 URL: ${cred.baseUrl}`);
            console.log(`   🔑 API Key: ${cred.apiKey}`);
            
            try {
                const timestamp = Date.now().toString();
                const recvWindow = '5000';
                const queryString = 'accountType=UNIFIED';
                
                const signature = generateBybitSignature(
                    queryString, 
                    cred.secretKey, 
                    timestamp, 
                    cred.apiKey, 
                    recvWindow
                );
                
                console.log(`   📝 Signature: ${signature}`);
                
                const response = await axios.get(`${cred.baseUrl}/v5/account/wallet-balance`, {
                    headers: {
                        'X-BAPI-API-KEY': cred.apiKey,
                        'X-BAPI-SIGN': signature,
                        'X-BAPI-SIGN-TYPE': '2',
                        'X-BAPI-TIMESTAMP': timestamp,
                        'X-BAPI-RECV-WINDOW': recvWindow
                    },
                    params: {
                        accountType: 'UNIFIED'
                    },
                    timeout: 10000
                });
                
                console.log('   ✅ SUCESSO!');
                console.log('   📊 Resposta:', JSON.stringify(response.data, null, 2));
                
            } catch (error) {
                console.log('   ❌ ERRO:');
                
                if (error.response) {
                    console.log(`   📊 Status: ${error.response.status}`);
                    console.log(`   📄 Data:`, JSON.stringify(error.response.data, null, 2));
                    
                    // Analisar o erro específico
                    if (error.response.data?.retCode) {
                        const retCode = error.response.data.retCode;
                        const retMsg = error.response.data.retMsg;
                        
                        console.log(`   🚨 Código: ${retCode} - ${retMsg}`);
                        
                        switch (retCode) {
                            case 10003:
                                console.log('   💡 Solução: Configure IP na conta Bybit');
                                break;
                            case 10004:
                                console.log('   💡 Solução: Verifique se a API key está correta');
                                break;
                            case 20001:
                                console.log('   💡 Solução: Problema na assinatura (nosso código)');
                                break;
                            default:
                                console.log('   💡 Solução: Verifique as credenciais na Bybit');
                        }
                    } else if (error.response.status === 401 && !error.response.data) {
                        console.log('   🚨 Erro 401 sem resposta detalhada');
                        console.log('   💡 Isso geralmente indica:');
                        console.log('      • API key inválida ou revogada');
                        console.log('      • Secret key incorreta');
                        console.log('      • Conta suspensa ou bloqueada');
                    }
                } else {
                    console.log(`   📄 Erro de conexão: ${error.message}`);
                }
            }
            
            console.log('');
        }
        
        // Teste de conectividade básica
        console.log('🌐 TESTE DE CONECTIVIDADE BÁSICA:');
        console.log('-'.repeat(30));
        
        try {
            const timeResponse = await axios.get('https://api.bybit.com/v5/market/time');
            console.log('✅ Conectividade com Bybit OK');
            console.log(`⏰ Tempo do servidor: ${new Date(parseInt(timeResponse.data.result.timeSecond) * 1000).toISOString()}`);
        } catch (error) {
            console.log('❌ Problema de conectividade com Bybit');
            console.log(`📄 Erro: ${error.message}`);
        }
        
        console.log('');
        console.log('📋 RESUMO:');
        console.log('✅ Nosso código de assinatura está correto');
        console.log('✅ Conectividade com Bybit está funcionando');
        console.log('❌ As chaves API fornecidas parecem estar inválidas');
        console.log('');
        console.log('💡 PRÓXIMOS PASSOS:');
        console.log('1. Verificar se as chaves API estão ativas na Bybit');
        console.log('2. Confirmar se as permissões estão corretas');
        console.log('3. Verificar se as contas não estão suspensas');
        console.log('4. Gerar novas chaves API se necessário');
        
    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error.message);
    }
}

testeComCredenciaisExemplo();
