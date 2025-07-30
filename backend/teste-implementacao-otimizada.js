/**
 * 🔧 IMPLEMENTAÇÃO BYBIT OTIMIZADA
 * Baseada na documentação oficial V5 da Bybit
 * Remove inconsistências e adiciona headers recomendados
 */

const crypto = require('crypto');
const https = require('https');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class BybitAPIOptimized {
    constructor() {
        this.baseURL = 'api.bybit.com';
        this.recvWindow = 5000; // Padrão recomendado pela documentação
    }

    /**
     * Criar assinatura HMAC SHA256 conforme documentação oficial
     * @param {string} timestamp - UTC timestamp em milliseconds
     * @param {string} apiKey - API key
     * @param {string} recvWindow - Janela de tempo
     * @param {string} params - Query string (GET) ou JSON body (POST)
     * @param {string} apiSecret - API secret
     */
    createSignature(timestamp, apiKey, recvWindow, params, apiSecret) {
        const payload = `${timestamp}${apiKey}${recvWindow}${params}`;
        return crypto.createHmac('sha256', apiSecret)
            .update(payload)
            .digest('hex'); // lowercase hex conforme documentação
    }

    /**
     * Criar headers conforme documentação oficial V5
     * @param {string} apiKey - API key
     * @param {string} signature - HMAC signature
     * @param {string} timestamp - UTC timestamp
     */
    createHeaders(apiKey, signature, timestamp) {
        return {
            'Content-Type': 'application/json',
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-TIMESTAMP': timestamp.toString(),
            'X-BAPI-RECV-WINDOW': this.recvWindow.toString()
            // Removido X-BAPI-SIGN-TYPE (não mencionado na doc V5)
        };
    }

    /**
     * Testar conexão com API Bybit usando implementação otimizada
     * @param {string} apiKey - API key
     * @param {string} apiSecret - API secret
     */
    async testConnection(apiKey, apiSecret) {
        return new Promise((resolve, reject) => {
            try {
                const timestamp = Date.now();
                const queryString = 'accountType=UNIFIED'; // Para V5
                
                const signature = this.createSignature(
                    timestamp,
                    apiKey,
                    this.recvWindow,
                    queryString,
                    apiSecret
                );

                const headers = this.createHeaders(apiKey, signature, timestamp);

                const options = {
                    hostname: this.baseURL,
                    path: `/v5/account/wallet-balance?${queryString}`,
                    method: 'GET',
                    headers: headers,
                    timeout: 10000
                };

                console.log('🔧 TESTANDO COM IMPLEMENTAÇÃO OTIMIZADA:');
                console.log(`   📅 Timestamp: ${timestamp}`);
                console.log(`   🔐 Signature: ${signature.substring(0, 10)}...`);
                console.log(`   📋 Query: ${queryString}`);
                console.log('   🌐 Headers enviados:');
                Object.entries(headers).forEach(([key, value]) => {
                    if (key === 'X-BAPI-SIGN') {
                        console.log(`     ${key}: ${value.substring(0, 10)}...`);
                    } else {
                        console.log(`     ${key}: ${value}`);
                    }
                });

                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        try {
                            console.log(`   📊 Status HTTP: ${res.statusCode}`);
                            console.log(`   📋 Raw Data: ${data.substring(0, 200)}...`);
                            
                            if (!data || data.trim() === '') {
                                resolve({
                                    success: false,
                                    error: 'EMPTY_RESPONSE',
                                    message: 'Resposta vazia do servidor',
                                    statusCode: res.statusCode
                                });
                                return;
                            }
                            
                            const response = JSON.parse(data);
                            console.log(`   📋 Resposta: ${JSON.stringify(response, null, 2)}`);
                            
                            if (response.retCode === 0) {
                                resolve({
                                    success: true,
                                    data: response,
                                    message: 'Conexão bem-sucedida com implementação otimizada'
                                });
                            } else {
                                resolve({
                                    success: false,
                                    error: response.retCode,
                                    message: response.retMsg,
                                    data: response
                                });
                            }
                        } catch (parseError) {
                            resolve({
                                success: false,
                                error: 'PARSE_ERROR',
                                message: parseError.message,
                                rawData: data,
                                statusCode: res.statusCode
                            });
                        }
                    });
                });

                req.on('error', (error) => {
                    reject({
                        success: false,
                        error: 'REQUEST_ERROR',
                        message: error.message
                    });
                });

                req.on('timeout', () => {
                    req.destroy();
                    reject({
                        success: false,
                        error: 'TIMEOUT',
                        message: 'Request timeout após 10 segundos'
                    });
                });

                req.end();

            } catch (error) {
                reject({
                    success: false,
                    error: 'SETUP_ERROR',
                    message: error.message
                });
            }
        });
    }
}

async function testarImplementacaoOtimizada() {
    console.log('🔧 TESTE: IMPLEMENTAÇÃO BYBIT OTIMIZADA');
    console.log('='.repeat(50));
    
    try {
        // Buscar chaves API do banco
        const chaves = await pool.query(`
            SELECT u.full_name, uk.api_key, uk.secret_key
            FROM user_api_keys uk
            JOIN users u ON uk.user_id = u.id
            WHERE uk.exchange = 'bybit' AND uk.is_active = true
            AND uk.api_key NOT LIKE 'API_KEY_%'
            LIMIT 1
        `);

        if (chaves.rows.length === 0) {
            console.log('❌ Nenhuma chave API válida encontrada');
            return;
        }

        const api = new BybitAPIOptimized();
        
        console.log('\n📊 DIFERENÇAS NA IMPLEMENTAÇÃO OTIMIZADA:');
        console.log('✅ Adicionado: X-BAPI-RECV-WINDOW: 5000');
        console.log('❌ Removido: X-BAPI-SIGN-TYPE (não na doc V5)');
        console.log('✅ Padronizado: HMAC SHA256 lowercase hex');
        console.log('✅ Endpoint: /v5/account/wallet-balance');
        console.log('✅ Query: accountType=UNIFIED (V5)');

        for (const chave of chaves.rows) {
            console.log(`\n🔑 TESTANDO: ${chave.full_name}`);
            console.log('='.repeat(30));
            
            const resultado = await api.testConnection(
                chave.api_key,
                chave.secret_key
            );
            
            if (resultado.success) {
                console.log('✅ SUCESSO! Implementação otimizada funcionou!');
                console.log('🎉 Problema resolvido com as otimizações!');
            } else {
                console.log(`❌ Falha: ${resultado.error}`);
                console.log(`📋 Mensagem: ${resultado.message}`);
                
                if (resultado.error === 10003) {
                    console.log('🚨 AINDA É PROBLEMA DE IP WHITELIST');
                    console.log('   IP 132.255.160.140 deve estar na whitelist');
                } else if (resultado.error === 10004) {
                    console.log('🔑 PROBLEMA DE API KEY INVÁLIDA');
                } else {
                    console.log('❓ ERRO DIFERENTE - investigar');
                }
            }
        }

        console.log('\n🎯 COMPARAÇÃO: ANTIGA vs OTIMIZADA');
        console.log('='.repeat(35));
        console.log('📊 IMPLEMENTAÇÃO ANTIGA:');
        console.log('   • X-BAPI-SIGN-TYPE: "2" (desnecessário)');
        console.log('   • SEM X-BAPI-RECV-WINDOW');
        console.log('   • Inconsistências entre arquivos');
        
        console.log('\n📊 IMPLEMENTAÇÃO OTIMIZADA:');
        console.log('   • X-BAPI-RECV-WINDOW: 5000 ✅');
        console.log('   • SEM X-BAPI-SIGN-TYPE ✅');
        console.log('   • Padronizada conforme doc V5 ✅');
        console.log('   • HMAC SHA256 lowercase hex ✅');

        console.log('\n🔍 RESULTADO DA OTIMIZAÇÃO:');
        if (chaves.rows.length > 0) {
            console.log('   Se ainda der erro 10003: problema é whitelist IP');
            console.log('   Se funcionar: otimizações resolveram!');
            console.log('   Se erro diferente: novo problema identificado');
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        pool.end();
    }
}

// Executar teste
testarImplementacaoOtimizada();
