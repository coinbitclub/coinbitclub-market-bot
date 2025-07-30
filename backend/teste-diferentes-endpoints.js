/**
 * 🔍 TESTE DE ENDPOINTS BYBIT
 * Verificar se o problema é o endpoint específico
 */

const crypto = require('crypto');
const https = require('https');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class BybitEndpointTester {
    constructor(apiKey, secretKey) {
        this.apiKey = apiKey;
        this.secretKey = secretKey;
        this.baseURL = 'api.bybit.com';
    }

    createSignature(timestamp, queryString = '') {
        const payload = `${timestamp}${this.apiKey}5000${queryString}`;
        return crypto.createHmac('sha256', this.secretKey)
            .update(payload)
            .digest('hex');
    }

    async testEndpoint(path, queryString = '', description = '') {
        return new Promise((resolve) => {
            const timestamp = Date.now();
            const signature = this.createSignature(timestamp, queryString);
            
            const fullPath = queryString ? `${path}?${queryString}` : path;
            
            const options = {
                hostname: this.baseURL,
                path: fullPath,
                method: 'GET',
                headers: {
                    'X-BAPI-API-KEY': this.apiKey,
                    'X-BAPI-SIGN': signature,
                    'X-BAPI-TIMESTAMP': timestamp.toString(),
                    'X-BAPI-RECV-WINDOW': '5000'
                },
                timeout: 10000
            };

            console.log(`\n🧪 TESTANDO: ${description || path}`);
            console.log(`   📍 Endpoint: ${fullPath}`);
            console.log(`   🔐 Signature: ${signature.substring(0, 10)}...`);

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    console.log(`   📊 Status: ${res.statusCode}`);
                    
                    if (data) {
                        try {
                            const response = JSON.parse(data);
                            console.log(`   📋 RetCode: ${response.retCode}`);
                            console.log(`   📋 RetMsg: ${response.retMsg}`);
                            
                            resolve({
                                endpoint: path,
                                status: res.statusCode,
                                retCode: response.retCode,
                                retMsg: response.retMsg,
                                success: response.retCode === 0,
                                response: response
                            });
                        } catch (e) {
                            console.log(`   ❌ Parse Error: ${e.message}`);
                            console.log(`   📋 Raw: ${data.substring(0, 100)}...`);
                            resolve({
                                endpoint: path,
                                status: res.statusCode,
                                error: 'PARSE_ERROR',
                                rawData: data
                            });
                        }
                    } else {
                        console.log('   📋 Resposta vazia');
                        resolve({
                            endpoint: path,
                            status: res.statusCode,
                            error: 'EMPTY_RESPONSE'
                        });
                    }
                });
            });

            req.on('error', (error) => {
                console.log(`   ❌ Erro: ${error.message}`);
                resolve({
                    endpoint: path,
                    error: 'REQUEST_ERROR',
                    message: error.message
                });
            });

            req.on('timeout', () => {
                req.destroy();
                console.log('   ⏰ Timeout');
                resolve({
                    endpoint: path,
                    error: 'TIMEOUT'
                });
            });

            req.end();
        });
    }
}

async function testarDiferentesEndpoints() {
    console.log('🔍 TESTE: DIFERENTES ENDPOINTS BYBIT');
    console.log('='.repeat(40));

    try {
        // Buscar chave API
        const chaves = await pool.query(`
            SELECT u.full_name, uk.api_key, uk.secret_key
            FROM user_api_keys uk
            JOIN users u ON uk.user_id = u.id
            WHERE uk.exchange = 'bybit' AND uk.is_active = true
            AND uk.api_key NOT LIKE 'API_KEY_%'
            LIMIT 1
        `);

        if (chaves.rows.length === 0) {
            console.log('❌ Nenhuma chave API encontrada');
            return;
        }

        const { api_key, secret_key } = chaves.rows[0];
        const tester = new BybitEndpointTester(api_key, secret_key);

        console.log(`🔑 Testando com chave: ${api_key.substring(0, 8)}...`);

        // Lista de endpoints para testar
        const endpoints = [
            {
                path: '/v5/account/wallet-balance',
                query: 'accountType=UNIFIED',
                desc: 'Wallet Balance V5 (que estávamos usando)'
            },
            {
                path: '/v5/account/info',
                query: '',
                desc: 'Account Info V5'
            },
            {
                path: '/v5/user/query-api',
                query: '',
                desc: 'API Key Info V5'
            },
            {
                path: '/v5/asset/coin/query-info',
                query: '',
                desc: 'Coin Info V5'
            },
            {
                path: '/v5/account/upgrade-to-uta',
                query: '',
                desc: 'UTA Info V5 (menos permissões)'
            }
        ];

        const resultados = [];

        for (const endpoint of endpoints) {
            const resultado = await tester.testEndpoint(
                endpoint.path, 
                endpoint.query, 
                endpoint.desc
            );
            resultados.push(resultado);
            
            // Aguardar entre requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n📊 RESUMO DOS TESTES:');
        console.log('='.repeat(25));

        let sucessos = 0;
        let erro10003 = 0;
        let erro401 = 0;
        let outrosErros = 0;

        resultados.forEach(r => {
            const status = r.success ? '✅' : 
                          r.retCode === 10003 ? '🚨' :
                          r.status === 401 ? '❌' : '❓';
            
            console.log(`${status} ${r.endpoint}`);
            console.log(`   Status: ${r.status || 'N/A'} | RetCode: ${r.retCode || r.error}`);

            if (r.success) sucessos++;
            else if (r.retCode === 10003) erro10003++;
            else if (r.status === 401) erro401++;
            else outrosErros++;
        });

        console.log('\n📈 ESTATÍSTICAS:');
        console.log(`   ✅ Sucessos: ${sucessos}`);
        console.log(`   🚨 Erro 10003 (IP): ${erro10003}`);
        console.log(`   ❌ Erro 401: ${erro401}`);
        console.log(`   ❓ Outros: ${outrosErros}`);

        console.log('\n🔍 ANÁLISE:');
        if (sucessos > 0) {
            console.log('✅ ALGUNS ENDPOINTS FUNCIONAM!');
            console.log('   O problema pode ser endpoint específico');
            console.log('   Usar endpoint que funciona');
        } else if (erro10003 > 0) {
            console.log('🚨 TODOS COM ERRO 10003');
            console.log('   Confirma: problema é IP whitelist');
            console.log('   Adicionar IP 132.255.160.140 na Bybit');
        } else if (erro401 === resultados.length) {
            console.log('❌ TODOS COM ERRO 401');
            console.log('   Problema pode ser API key inválida');
            console.log('   Ou conta Bybit suspensa');
        } else {
            console.log('❓ RESULTADOS MISTOS');
            console.log('   Investigar padrões específicos');
        }

        console.log('\n💡 RECOMENDAÇÃO:');
        const sucessoEncontrado = resultados.find(r => r.success);
        if (sucessoEncontrado) {
            console.log(`🎯 Usar endpoint: ${sucessoEncontrado.endpoint}`);
            console.log('   Este endpoint está funcionando!');
        } else {
            console.log('🔧 Foco na configuração da conta Bybit');
            console.log('   Verificar IP whitelist e status da API key');
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        pool.end();
    }
}

testarDiferentesEndpoints();
