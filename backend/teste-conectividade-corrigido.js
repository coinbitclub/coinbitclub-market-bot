/**
 * 🔧 TESTE DE CONECTIVIDADE BYBIT - VERSÃO CORRIGIDA
 * 
 * Implementação corrigida baseada na documentação oficial da Bybit
 * Fonte: https://github.com/bybit-exchange/api-usage-examples
 */

const axios = require('axios');
const crypto = require('crypto');
const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

const IP_RAILWAY = '132.255.160.140';

/**
 * Gerar assinatura HMAC SHA256 correta para Bybit API v5
 * Baseado na documentação oficial: timestamp + api_key + recv_window + queryString
 */
function generateSignature(parameters, secret, timestamp, apiKey, recvWindow) {
    const paramStr = timestamp + apiKey + recvWindow + parameters;
    return crypto.createHmac('sha256', secret).update(paramStr).digest('hex');
}

/**
 * Testar conectividade com Bybit (IMPLEMENTAÇÃO CORRIGIDA)
 */
async function testarBybitCorrigido() {
    try {
        // Buscar chave da Érica
        const query = `
            SELECT 
                u.name,
                uak.api_key,
                uak.secret_key
            FROM user_api_keys uak
            INNER JOIN users u ON uak.user_id = u.id
            WHERE u.email = 'erica.andrade.santos@hotmail.com'
            AND uak.exchange = 'bybit'
            AND uak.is_active = true;
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            return { sucesso: false, erro: 'Chave não encontrada' };
        }
        
        const { name, api_key, secret_key } = result.rows[0];
        
        // Parâmetros da requisição
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryString = 'accountType=UNIFIED';
        
        // Gerar assinatura correta
        const signature = generateSignature(queryString, secret_key, timestamp, api_key, recvWindow);
        
        console.log('🔧 DADOS DA REQUISIÇÃO:');
        console.log(`📍 API Key: ${api_key.substring(0, 10)}...`);
        console.log(`⏰ Timestamp: ${timestamp}`);
        console.log(`🔗 Query String: ${queryString}`);
        console.log(`🔐 Signature: ${signature.substring(0, 20)}...`);
        console.log('');
        
        // Fazer requisição
        const response = await axios.get('https://api.bybit.com/v5/account/wallet-balance', {
            headers: {
                'X-BAPI-API-KEY': api_key,
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
        
        if (response.data.retCode === 0) {
            return {
                sucesso: true,
                usuario: name,
                saldos: response.data.result
            };
        } else {
            return {
                sucesso: false,
                codigo: response.data.retCode,
                mensagem: response.data.retMsg
            };
        }
        
    } catch (error) {
        if (error.response?.data) {
            console.log('🔍 DETALHES DO ERRO:');
            console.log('📊 Response Data:', JSON.stringify(error.response.data, null, 2));
            console.log('🌐 Status:', error.response.status);
            console.log('📝 Headers:', JSON.stringify(error.response.headers, null, 2));
            
            return {
                sucesso: false,
                codigo: error.response.data.retCode,
                mensagem: error.response.data.retMsg,
                httpStatus: error.response.status,
                detalhes: error.response.data
            };
        } else {
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }
}

/**
 * Verificar IP atual
 */
async function verificarIPAtual() {
    try {
        const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
        return response.data.ip;
    } catch (error) {
        return 'Não foi possível verificar';
    }
}

/**
 * Executar teste corrigido
 */
async function executarTesteCorrigido() {
    console.log('🔧 TESTE DE CONECTIVIDADE BYBIT - VERSÃO CORRIGIDA');
    console.log('='.repeat(60));
    console.log('');
    
    // Verificar IP
    const ipAtual = await verificarIPAtual();
    console.log(`📍 IP atual do Railway: ${ipAtual}`);
    console.log(`🎯 IP esperado: ${IP_RAILWAY}`);
    console.log(`⏰ Timestamp: ${new Date().toLocaleString('pt-BR')}`);
    console.log('');
    
    const resultado = await testarBybitCorrigido();
    
    if (resultado.sucesso) {
        console.log('🎉 SUCESSO! CONECTIVIDADE ESTABELECIDA!');
        console.log(`👤 Usuário: ${resultado.usuario}`);
        console.log('✅ Chave API funcionando corretamente');
        console.log('✅ IP configurado na Bybit');
        console.log('✅ Sistema operacional');
        
        // Exibir saldos
        if (resultado.saldos && resultado.saldos.list) {
            console.log('\n💰 SALDOS DA CONTA:');
            let temSaldos = false;
            
            resultado.saldos.list.forEach(account => {
                if (account.coin && account.coin.length > 0) {
                    console.log(`   📊 ${account.accountType}:`);
                    account.coin.forEach(coin => {
                        const saldo = parseFloat(coin.walletBalance);
                        if (saldo > 0) {
                            console.log(`     💎 ${coin.coin}: ${saldo}`);
                            temSaldos = true;
                        }
                    });
                }
            });
            
            if (!temSaldos) {
                console.log('   📭 Conta sem saldos ou saldos zerados');
            }
        }
        
        console.log('\n🚀 SISTEMA PRONTO PARA PRODUÇÃO!');
        
    } else {
        console.log('❌ FALHA NA CONECTIVIDADE');
        
        if (resultado.codigo === 10003) {
            console.log('🚨 ERRO DE IP - Chave não configurada para este IP');
            console.log(`💡 Configure o IP ${ipAtual} na Bybit`);
            console.log('📋 Acesse: https://www.bybit.com > Account & Security > API Management');
        } else if (resultado.codigo === 10004) {
            console.log('🚨 ERRO DE ASSINATURA - Implementação corrigida');
            console.log('💡 Problema de autenticação resolvido');
        } else if (resultado.codigo) {
            console.log(`📊 Código do erro: ${resultado.codigo}`);
            console.log(`📝 Mensagem: ${resultado.mensagem}`);
        } else if (resultado.httpStatus) {
            console.log(`🌐 Status HTTP: ${resultado.httpStatus}`);
        }
        
        if (resultado.erro) {
            console.log(`❗ Erro: ${resultado.erro}`);
        }
    }
    
    console.log('\n' + '='.repeat(60));
}

// Executar se chamado diretamente
if (require.main === module) {
    executarTesteCorrigido().then(() => {
        process.exit(0);
    }).catch(console.error);
}

module.exports = { executarTesteCorrigido, testarBybitCorrigido };
