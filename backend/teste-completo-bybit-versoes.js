const { Pool } = require('pg');
const crypto = require('crypto');
const axios = require('axios');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class BybitApiTester {
    constructor() {
        this.pool = pool;
        this.baseUrls = {
            v1: 'https://api.bybit.com',
            v2: 'https://api.bybit.com',
            v3: 'https://api.bybit.com',
            v5: 'https://api.bybit.com'
        };
        
        this.endpoints = {
            v1: {
                balance: '/v1/account',
                wallet: '/v1/wallet/balance'
            },
            v2: {
                balance: '/v2/private/wallet/balance',
                account: '/v2/private/account',
                position: '/v2/private/position/list'
            },
            v3: {
                balance: '/v3/private/account/wallet/balance',
                account: '/v3/private/account/info'
            },
            v5: {
                balance: '/v5/account/wallet-balance',
                account: '/v5/account/info',
                position: '/v5/position/list'
            }
        };
    }

    // Gerar assinatura V1/V2
    generateSignatureV2(params, secret) {
        const sortedParams = Object.keys(params).sort().reduce((result, key) => {
            result[key] = params[key];
            return result;
        }, {});
        
        const queryString = Object.keys(sortedParams)
            .map(key => `${key}=${sortedParams[key]}`)
            .join('&');
            
        return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
    }

    // Gerar assinatura V3/V5
    generateSignatureV5(timestamp, apiKey, secret, params = '') {
        const payload = timestamp + apiKey + '5000' + params;
        return crypto.createHmac('sha256', secret).update(payload).digest('hex');
    }

    // Teste V1
    async testV1(apiKey, secret) {
        try {
            console.log('   🔄 Testando API V1...');
            
            const timestamp = Date.now();
            const params = {
                api_key: apiKey,
                timestamp: timestamp
            };
            
            params.sign = this.generateSignatureV2(params, secret);
            
            const response = await axios.get(`${this.baseUrls.v1}${this.endpoints.v1.balance}`, {
                params: params,
                timeout: 10000
            });
            
            return {
                success: true,
                version: 'V1',
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                version: 'V1',
                error: error.response?.data || error.message
            };
        }
    }

    // Teste V2
    async testV2(apiKey, secret) {
        try {
            console.log('   🔄 Testando API V2...');
            
            const timestamp = Date.now();
            const params = {
                api_key: apiKey,
                timestamp: timestamp
            };
            
            params.sign = this.generateSignatureV2(params, secret);
            
            const response = await axios.get(`${this.baseUrls.v2}${this.endpoints.v2.balance}`, {
                params: params,
                timeout: 10000
            });
            
            return {
                success: true,
                version: 'V2',
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                version: 'V2',
                error: error.response?.data || error.message
            };
        }
    }

    // Teste V3
    async testV3(apiKey, secret) {
        try {
            console.log('   🔄 Testando API V3...');
            
            const timestamp = Date.now().toString();
            const recv_window = '5000';
            
            const signature = this.generateSignatureV5(timestamp, apiKey, secret);
            
            const headers = {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recv_window,
                'Content-Type': 'application/json'
            };
            
            const response = await axios.get(`${this.baseUrls.v3}${this.endpoints.v3.balance}`, {
                headers: headers,
                timeout: 10000
            });
            
            return {
                success: true,
                version: 'V3',
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                version: 'V3',
                error: error.response?.data || error.message
            };
        }
    }

    // Teste V5 (Mais recente)
    async testV5(apiKey, secret) {
        try {
            console.log('   🔄 Testando API V5...');
            
            const timestamp = Date.now().toString();
            const recv_window = '5000';
            
            const signature = this.generateSignatureV5(timestamp, apiKey, secret);
            
            const headers = {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recv_window,
                'Content-Type': 'application/json'
            };
            
            // Testar múltiplos endpoints V5
            const endpoints = [
                { name: 'Account Info', url: '/v5/account/info' },
                { name: 'Wallet Balance', url: '/v5/account/wallet-balance' },
                { name: 'Coin Balance', url: '/v5/account/wallet-balance?accountType=UNIFIED' }
            ];
            
            const results = [];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await axios.get(`${this.baseUrls.v5}${endpoint.url}`, {
                        headers: headers,
                        timeout: 10000
                    });
                    
                    results.push({
                        endpoint: endpoint.name,
                        success: true,
                        data: response.data
                    });
                } catch (endpointError) {
                    results.push({
                        endpoint: endpoint.name,
                        success: false,
                        error: endpointError.response?.data || endpointError.message
                    });
                }
            }
            
            return {
                success: results.some(r => r.success),
                version: 'V5',
                results: results
            };
        } catch (error) {
            return {
                success: false,
                version: 'V5',
                error: error.response?.data || error.message
            };
        }
    }

    // Teste de conectividade básica
    async testConnectivity() {
        try {
            console.log('   🌐 Testando conectividade básica...');
            
            const response = await axios.get('https://api.bybit.com/v5/market/time', {
                timeout: 5000
            });
            
            return {
                success: true,
                serverTime: response.data,
                latency: Date.now() - parseInt(response.data.result.timeSecond) * 1000
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Teste abrangente para uma chave
    async testAllVersions(userId, userName, apiKey, secret) {
        console.log(`\n🧪 TESTANDO TODAS AS VERSÕES - ${userName} (ID: ${userId})`);
        console.log('=' .repeat(60));
        
        // 1. Teste de conectividade
        const connectivity = await this.testConnectivity();
        if (connectivity.success) {
            console.log(`   ✅ Conectividade: OK (Latência: ${Math.abs(connectivity.latency)}ms)`);
            console.log(`   🕐 Servidor: ${new Date(connectivity.serverTime.result.timeSecond * 1000).toISOString()}`);
        } else {
            console.log(`   ❌ Conectividade: FALHA - ${connectivity.error}`);
        }
        
        // 2. Testar todas as versões
        const versions = ['V1', 'V2', 'V3', 'V5'];
        const results = [];
        
        for (const version of versions) {
            let result;
            
            switch (version) {
                case 'V1':
                    result = await this.testV1(apiKey, secret);
                    break;
                case 'V2':
                    result = await this.testV2(apiKey, secret);
                    break;
                case 'V3':
                    result = await this.testV3(apiKey, secret);
                    break;
                case 'V5':
                    result = await this.testV5(apiKey, secret);
                    break;
            }
            
            results.push(result);
            
            if (result.success) {
                console.log(`   ✅ ${version}: SUCESSO`);
                if (result.version === 'V5' && result.results) {
                    result.results.forEach(r => {
                        const status = r.success ? '✅' : '❌';
                        console.log(`      ${status} ${r.endpoint}: ${r.success ? 'OK' : r.error?.retMsg || 'Erro'}`);
                    });
                } else if (result.data) {
                    console.log(`      📊 Dados recebidos: ${JSON.stringify(result.data).substring(0, 100)}...`);
                }
            } else {
                console.log(`   ❌ ${version}: FALHA`);
                if (result.error) {
                    console.log(`      🔍 Erro: ${result.error.retMsg || result.error.message || JSON.stringify(result.error).substring(0, 100)}`);
                }
            }
        }
        
        // 3. Atualizar status no banco
        const workingVersions = results.filter(r => r.success).map(r => r.version);
        const status = workingVersions.length > 0 ? 'valid' : 'error';
        const errorMsg = workingVersions.length > 0 ? null : 
            results.map(r => `${r.version}: ${r.error?.retMsg || 'Falha'}`).join('; ');
        
        await this.pool.query(`
            UPDATE user_api_keys 
            SET validation_status = $1, error_message = $2, last_validated_at = NOW()
            WHERE user_id = $3 AND exchange = 'bybit' AND is_active = true
        `, [status, errorMsg, userId]);
        
        return {
            userId,
            userName,
            workingVersions,
            allResults: results,
            recommended: workingVersions.includes('V5') ? 'V5' : workingVersions[0] || null
        };
    }

    // Executar teste completo do sistema
    async runCompleteTest() {
        try {
            console.log('🚀 TESTE COMPLETO DE TODAS AS VERSÕES DA API BYBIT');
            console.log('================================================');
            
            // Buscar todas as chaves válidas
            const users = await this.pool.query(`
                SELECT u.id, u.name, u.email, ak.api_key, ak.secret_key
                FROM users u 
                JOIN user_api_keys ak ON u.id = ak.user_id 
                WHERE u.is_active = true AND ak.is_active = true
                AND ak.api_key NOT LIKE '%PENDING%'
                AND ak.api_key NOT LIKE '%PLACEHOLDER%'
                ORDER BY u.id
            `);
            
            console.log(`📋 Encontrados ${users.rows.length} usuários para testar\n`);
            
            const testResults = [];
            
            for (const user of users.rows) {
                const result = await this.testAllVersions(
                    user.id, 
                    user.name, 
                    user.api_key, 
                    user.secret_key
                );
                testResults.push(result);
                
                // Pequena pausa entre testes
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Relatório final
            console.log('\n📊 RELATÓRIO FINAL DE COMPATIBILIDADE');
            console.log('====================================');
            
            const versionStats = {
                V1: 0, V2: 0, V3: 0, V5: 0
            };
            
            testResults.forEach(result => {
                const success = result.workingVersions.length > 0 ? '✅' : '❌';
                console.log(`\n${success} ${result.userName} (ID: ${result.userId})`);
                console.log(`   🔧 Versões funcionais: ${result.workingVersions.join(', ') || 'NENHUMA'}`);
                console.log(`   🎯 Recomendada: ${result.recommended || 'NENHUMA'}`);
                
                result.workingVersions.forEach(version => {
                    versionStats[version]++;
                });
            });
            
            console.log('\n📈 ESTATÍSTICAS POR VERSÃO:');
            Object.entries(versionStats).forEach(([version, count]) => {
                const percentage = Math.round((count / testResults.length) * 100);
                console.log(`   ${version}: ${count}/${testResults.length} usuários (${percentage}%)`);
            });
            
            // Recomendação final
            const bestVersion = Object.entries(versionStats)
                .sort(([,a], [,b]) => b - a)[0][0];
            
            console.log(`\n🎯 RECOMENDAÇÃO FINAL: Usar API ${bestVersion}`);
            console.log(`   📊 Funciona para ${versionStats[bestVersion]} de ${testResults.length} usuários`);
            
            if (bestVersion === 'V5') {
                console.log('   ✅ V5 é a versão mais recente e recomendada pela Bybit');
            }
            
            return {
                testResults,
                versionStats,
                recommendation: bestVersion
            };
            
        } catch (error) {
            console.error('❌ Erro no teste completo:', error.message);
            console.error(error.stack);
        }
    }

    async close() {
        await this.pool.end();
    }
}

// Executar teste
async function main() {
    const tester = new BybitApiTester();
    
    try {
        const results = await tester.runCompleteTest();
        
        console.log('\n🎉 TESTE CONCLUÍDO!');
        console.log('Agora você sabe exatamente qual versão usar para cada usuário.');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await tester.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = BybitApiTester;
