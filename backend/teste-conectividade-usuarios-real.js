/**
 * 🧪 TESTE DE CONECTIVIDADE - USUÁRIOS PARA AMBIENTE REAL
 * 
 * Validar conectividade das chaves API dos novos usuários:
 * - MAURO ALVES (Bybit Testnet)
 * - PALOMA AMARAL (Bybit Produção)
 * - ÉRICA DOS SANTOS (Bybit Produção - sem restrição IP)
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
 * Testar conectividade com uma chave API
 */
async function testarConectividade(usuario, apiKey, secretKey, environment) {
    try {
        console.log(`🧪 TESTANDO: ${usuario}`);
        console.log(`   🔑 API Key: ${apiKey}`);
        console.log(`   🌍 Environment: ${environment}`);
        
        // Determinar URL baseado no ambiente
        const baseUrl = environment === 'testnet' 
            ? 'https://api-testnet.bybit.com' 
            : 'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryString = 'accountType=UNIFIED';
        
        const signature = generateBybitSignature(
            queryString, 
            secretKey, 
            timestamp, 
            apiKey, 
            recvWindow
        );
        
        const response = await axios.get(`${baseUrl}/v5/account/wallet-balance`, {
            headers: {
                'X-BAPI-API-KEY': apiKey,
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
            console.log('   ✅ CONECTIVIDADE OK');
            
            // Exibir saldos se houver
            if (response.data.result && response.data.result.list) {
                response.data.result.list.forEach(account => {
                    if (account.totalWalletBalance && parseFloat(account.totalWalletBalance) > 0) {
                        console.log(`   💰 Total: ${account.totalWalletBalance} USD`);
                    }
                    
                    if (account.coin && account.coin.length > 0) {
                        account.coin.forEach(coin => {
                            const saldo = parseFloat(coin.walletBalance);
                            if (saldo > 0) {
                                console.log(`   💎 ${coin.coin}: ${saldo}`);
                            }
                        });
                    }
                });
            }
            
            return { sucesso: true, dados: response.data.result };
        } else {
            console.log(`   ❌ ERRO API: ${response.data.retCode} - ${response.data.retMsg}`);
            return { sucesso: false, erro: response.data.retMsg };
        }
        
    } catch (error) {
        if (error.response?.data) {
            console.log(`   ❌ ERRO HTTP: ${error.response.status}`);
            console.log(`   📊 Response: ${JSON.stringify(error.response.data)}`);
            
            if (error.response.data.retCode === 10003) {
                console.log('   🚨 IP NÃO AUTORIZADO - Configure IP na Bybit');
            }
        } else {
            console.log(`   ❌ ERRO: ${error.message}`);
        }
        
        return { sucesso: false, erro: error.message };
    }
}

/**
 * Buscar usuários e suas chaves
 */
async function buscarUsuariosParaTeste() {
    try {
        const query = `
            SELECT 
                u.name,
                u.email,
                uak.api_key,
                uak.secret_key,
                uak.exchange,
                uak.environment
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE uak.is_active = true
            AND u.email IN (
                'mauroalves150391@gmail.com',
                'pamaral15@hotmail.com',
                'erica.andrade.santos@hotmail.com'
            )
            ORDER BY u.name;
        `;
        
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('❌ Erro ao buscar usuários:', error.message);
        return [];
    }
}

/**
 * Executar testes de conectividade
 */
async function executarTestes() {
    try {
        console.log('🧪 TESTE DE CONECTIVIDADE - AMBIENTE REAL');
        console.log('='.repeat(60));
        console.log('📅 Data: 29 de Julho de 2025');
        console.log('🎯 Objetivo: Validar chaves API para trading real');
        console.log('');
        
        // Verificar IP atual
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        console.log(`📍 IP atual do Railway: ${ipResponse.data.ip}`);
        console.log('');
        
        // Buscar usuários
        const usuarios = await buscarUsuariosParaTeste();
        
        if (usuarios.length === 0) {
            console.log('❌ Nenhum usuário encontrado para teste');
            return;
        }
        
        console.log(`👥 ${usuarios.length} usuário(s) encontrado(s) para teste:`);
        console.log('');
        
        const resultados = [];
        
        for (const usuario of usuarios) {
            const resultado = await testarConectividade(
                `${usuario.name} (${usuario.email})`,
                usuario.api_key,
                usuario.secret_key,
                usuario.environment
            );
            
            resultados.push({
                nome: usuario.name,
                email: usuario.email,
                exchange: usuario.exchange,
                environment: usuario.environment,
                ...resultado
            });
            
            console.log('');
        }
        
        // Resumo final
        console.log('📊 RESUMO DOS TESTES:');
        console.log('='.repeat(40));
        
        const sucessos = resultados.filter(r => r.sucesso);
        const falhas = resultados.filter(r => !r.sucesso);
        
        console.log(`✅ Sucessos: ${sucessos.length}`);
        console.log(`❌ Falhas: ${falhas.length}`);
        console.log('');
        
        if (sucessos.length > 0) {
            console.log('✅ USUÁRIOS COM CONECTIVIDADE OK:');
            sucessos.forEach(s => {
                console.log(`   • ${s.nome} (${s.exchange} - ${s.environment})`);
            });
            console.log('');
        }
        
        if (falhas.length > 0) {
            console.log('❌ USUÁRIOS COM PROBLEMAS:');
            falhas.forEach(f => {
                console.log(`   • ${f.nome} (${f.exchange} - ${f.environment})`);
                console.log(`     Erro: ${f.erro}`);
            });
            console.log('');
        }
        
        if (sucessos.length === resultados.length) {
            console.log('🎉 TODOS OS TESTES PASSARAM!');
            console.log('🚀 SISTEMA PRONTO PARA TRADING REAL!');
        } else {
            console.log('⚠️ ALGUNS TESTES FALHARAM');
            console.log('💡 Configure IPs ou verifique chaves API');
        }
        
    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar testes
executarTestes();
