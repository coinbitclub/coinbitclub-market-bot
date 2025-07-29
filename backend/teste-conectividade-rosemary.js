/**
 * 🧪 TESTE DE CONECTIVIDADE - ROSEMARY DOS SANTOS
 * 
 * Verificar conectividade das chaves API da Rosemary (ex-Érica)
 * Conta sem restrição de IP configurada
 */

const axios = require('axios');
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

/**
 * Gerar assinatura HMAC para Bybit
 */
function generateBybitSignature(queryString, secret, timestamp, apiKey, recvWindow) {
    const paramStr = timestamp + apiKey + recvWindow + queryString;
    return crypto.createHmac('sha256', secret).update(paramStr).digest('hex');
}

/**
 * Buscar dados da Rosemary no banco
 */
async function buscarDadosRosemary() {
    try {
        const query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                uak.api_key,
                uak.secret_key,
                uak.exchange,
                uak.environment,
                uak.updated_at
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.email = 'erica.andrade.santos@hotmail.com'
            AND uak.is_active IS NOT FALSE
            ORDER BY uak.updated_at DESC
            LIMIT 1;
        `;
        
        const result = await pool.query(query);
        return result.rows[0];
    } catch (error) {
        console.error('❌ Erro ao buscar dados:', error.message);
        return null;
    }
}

/**
 * Testar conectividade Bybit
 */
async function testarConectividadeBybit(dadosUsuario) {
    try {
        console.log(`🔍 TESTANDO CONECTIVIDADE: ${dadosUsuario.name}`);
        console.log(`   📧 Email: ${dadosUsuario.email}`);
        console.log(`   🔑 API Key: ${dadosUsuario.api_key}`);
        console.log(`   🔐 Secret: ${dadosUsuario.secret_key.substring(0, 8)}***`);
        console.log(`   🏢 Exchange: ${dadosUsuario.exchange}`);
        console.log(`   🌍 Environment: ${dadosUsuario.environment}`);
        console.log(`   📅 Última atualização: ${dadosUsuario.updated_at}`);
        console.log('');
        
        // Verificar IP atual
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        console.log(`📍 IP atual do Railway: ${ipResponse.data.ip}`);
        console.log('');
        
        // Determinar URL base
        const baseUrl = dadosUsuario.environment === 'testnet' 
            ? 'https://api-testnet.bybit.com' 
            : 'https://api.bybit.com';
        
        console.log(`🌐 Testando endpoint: ${baseUrl}`);
        
        // Preparar requisição
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryString = 'accountType=UNIFIED';
        
        console.log(`⏰ Timestamp: ${timestamp}`);
        console.log(`📦 Recv Window: ${recvWindow}`);
        console.log(`🔗 Query String: ${queryString}`);
        
        // Gerar assinatura
        const signature = generateBybitSignature(
            queryString,
            dadosUsuario.secret_key,
            timestamp,
            dadosUsuario.api_key,
            recvWindow
        );
        
        console.log(`📝 Signature: ${signature}`);
        console.log('');
        
        // Headers da requisição
        const headers = {
            'X-BAPI-API-KEY': dadosUsuario.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        console.log('📋 Headers da requisição:');
        Object.keys(headers).forEach(key => {
            const value = key === 'X-BAPI-SIGN' ? signature.substring(0, 16) + '***' : headers[key];
            console.log(`   ${key}: ${value}`);
        });
        console.log('');
        
        console.log('🚀 Fazendo requisição para wallet balance...');
        
        // Fazer requisição
        const response = await axios.get(`${baseUrl}/v5/account/wallet-balance`, {
            headers,
            params: { accountType: 'UNIFIED' },
            timeout: 15000
        });
        
        console.log('✅ RESPOSTA RECEBIDA!');
        console.log(`📊 Status Code: ${response.status}`);
        console.log(`📊 Return Code: ${response.data.retCode}`);
        console.log(`📨 Return Message: ${response.data.retMsg}`);
        console.log('');
        
        if (response.data.retCode === 0) {
            console.log('🎉 CONECTIVIDADE PERFEITA!');
            console.log('💰 INFORMAÇÕES DA CONTA:');
            
            if (response.data.result && response.data.result.list) {
                response.data.result.list.forEach((account, index) => {
                    console.log(`   📊 Conta ${index + 1}:`);
                    console.log(`      Tipo: ${account.accountType}`);
                    
                    if (account.totalWalletBalance) {
                        const saldoTotal = parseFloat(account.totalWalletBalance);
                        console.log(`      💰 Saldo Total: ${saldoTotal} USD`);
                    }
                    
                    if (account.totalAvailableBalance) {
                        const saldoDisponivel = parseFloat(account.totalAvailableBalance);
                        console.log(`      💳 Disponível: ${saldoDisponivel} USD`);
                    }
                    
                    if (account.coin && account.coin.length > 0) {
                        console.log('      💎 Moedas:');
                        account.coin.forEach(coin => {
                            const saldo = parseFloat(coin.walletBalance);
                            if (saldo > 0) {
                                console.log(`         ${coin.coin}: ${saldo}`);
                            }
                        });
                    }
                    console.log('');
                });
            }
            
            return { sucesso: true, dados: response.data.result };
        } else {
            console.log('❌ ERRO NA API:');
            console.log(`   Código: ${response.data.retCode}`);
            console.log(`   Mensagem: ${response.data.retMsg}`);
            
            // Analisar códigos de erro específicos
            switch (response.data.retCode) {
                case 10003:
                    console.log('   💡 Solução: IP não está na whitelist (mas você disse que não tem restrição)');
                    break;
                case 10004:
                    console.log('   💡 Solução: API key inválida ou revogada');
                    break;
                case 20001:
                    console.log('   💡 Solução: Assinatura inválida');
                    break;
                default:
                    console.log('   💡 Verifique as credenciais na Bybit');
            }
            
            return { sucesso: false, erro: response.data.retMsg };
        }
        
    } catch (error) {
        console.log('❌ ERRO DE CONECTIVIDADE:');
        
        if (error.response) {
            console.log(`   📊 Status HTTP: ${error.response.status}`);
            console.log(`   📋 Headers:`, JSON.stringify(error.response.headers, null, 2));
            
            if (error.response.data) {
                console.log(`   📄 Dados da resposta:`, JSON.stringify(error.response.data, null, 2));
                
                if (error.response.data.retCode) {
                    console.log(`   🚨 Código de erro Bybit: ${error.response.data.retCode}`);
                    console.log(`   📝 Mensagem: ${error.response.data.retMsg}`);
                }
            } else {
                console.log('   📄 Resposta vazia (possível problema de autenticação)');
            }
        } else if (error.request) {
            console.log('   📡 Erro de rede/timeout');
            console.log(`   📄 Detalhes: ${error.message}`);
        } else {
            console.log(`   ⚙️ Erro de configuração: ${error.message}`);
        }
        
        return { sucesso: false, erro: error.message };
    }
}

/**
 * Testar outras funcionalidades da API
 */
async function testarOutrosFuncoes(dadosUsuario) {
    try {
        console.log('🔍 TESTANDO OUTRAS FUNÇÕES DA API...');
        console.log('-'.repeat(50));
        
        const baseUrl = dadosUsuario.environment === 'testnet' 
            ? 'https://api-testnet.bybit.com' 
            : 'https://api.bybit.com';
        
        // 1. Testar tempo do servidor
        console.log('⏰ Testando tempo do servidor...');
        try {
            const timeResponse = await axios.get(`${baseUrl}/v5/market/time`);
            if (timeResponse.data.retCode === 0) {
                const serverTime = parseInt(timeResponse.data.result.timeSecond) * 1000;
                const localTime = Date.now();
                const diff = Math.abs(localTime - serverTime);
                
                console.log(`   ✅ Tempo do servidor: ${new Date(serverTime).toISOString()}`);
                console.log(`   🏠 Tempo local: ${new Date(localTime).toISOString()}`);
                console.log(`   ⏱️ Diferença: ${diff}ms`);
                
                if (diff > 5000) {
                    console.log('   ⚠️ AVISO: Diferença de tempo significativa');
                } else {
                    console.log('   ✅ Sincronização OK');
                }
            }
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
        }
        
        console.log('');
        
        // 2. Testar informações da conta (sem autenticação)
        console.log('📊 Testando endpoint público...');
        try {
            const publicResponse = await axios.get(`${baseUrl}/v5/market/tickers`, {
                params: { category: 'spot', symbol: 'BTCUSDT' },
                timeout: 5000
            });
            
            if (publicResponse.data.retCode === 0) {
                console.log('   ✅ Endpoint público funcionando');
                console.log('   📈 Conectividade com Bybit OK');
            }
        } catch (error) {
            console.log(`   ❌ Erro no endpoint público: ${error.message}`);
        }
        
    } catch (error) {
        console.log(`❌ Erro nos testes adicionais: ${error.message}`);
    }
}

/**
 * Executar teste completo
 */
async function executarTesteCompleto() {
    try {
        console.log('🧪 TESTE DE CONECTIVIDADE - ROSEMARY DOS SANTOS');
        console.log('='.repeat(70));
        console.log('📅 Data: 29 de Julho de 2025');
        console.log('🎯 Objetivo: Verificar conectividade sem restrição IP');
        console.log('');
        
        // Buscar dados do banco
        console.log('📂 BUSCANDO DADOS NO BANCO...');
        const dadosRosemary = await buscarDadosRosemary();
        
        if (!dadosRosemary) {
            console.log('❌ Dados da Rosemary não encontrados no banco');
            return;
        }
        
        console.log('✅ Dados encontrados no banco');
        console.log('');
        
        // Testar conectividade principal
        const resultado = await testarConectividadeBybit(dadosRosemary);
        
        console.log('');
        
        // Testes adicionais
        await testarOutrosFuncoes(dadosRosemary);
        
        // Resumo final
        console.log('📋 RESUMO DO TESTE:');
        console.log('='.repeat(40));
        
        if (resultado.sucesso) {
            console.log('✅ CONECTIVIDADE: PERFEITA');
            console.log('🔑 CHAVES API: FUNCIONANDO');
            console.log('🌐 IP: SEM RESTRIÇÕES');
            console.log('🚀 STATUS: PRONTO PARA TRADING');
        } else {
            console.log('❌ CONECTIVIDADE: PROBLEMA');
            console.log('🔑 CHAVES API: VERIFICAR');
            console.log('🌐 IP: POSSÍVEL RESTRIÇÃO');
            console.log('🔧 STATUS: NECESSITA AJUSTE');
            console.log(`💡 Erro: ${resultado.erro}`);
        }
        
    } catch (error) {
        console.error('❌ ERRO NO TESTE COMPLETO:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar teste
executarTesteCompleto();
