const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class BybitV5ApiManager {
    constructor() {
        this.pool = pool;
        this.baseUrl = 'https://api.bybit.com';
        // Chave compartilhada das variáveis de ambiente
        this.fallbackKeys = {
            apiKey: 'q3JH2TYGwCHaupbwgG',
            secretKey: 'GqF3E7RZWHBhERnBTUBK4l2qpSiVF3GBWEs'
        };
    }

    // Gerar assinatura para API V5 (corrigida)
    generateSignature(timestamp, apiKey, secretKey, params = '') {
        // Para API V5, a string é: timestamp + apiKey + recvWindow + params
        const recvWindow = '5000';
        const message = timestamp + apiKey + recvWindow + params;
        
        console.log(`📝 Debug signature: timestamp=${timestamp}, apiKey=${apiKey.substring(0,10)}..., params=${params}`);
        console.log(`📝 Message to sign: ${message}`);
        
        const signature = crypto.createHmac('sha256', secretKey).update(message).digest('hex');
        console.log(`📝 Generated signature: ${signature.substring(0,20)}...`);
        
        return signature;
    }

    // Buscar chaves para um usuário (corrigido para priorizar individuais)
    async getUserKeys(userId) {
        try {
            console.log(`🔍 Buscando chaves para usuário ${userId}...`);
            
            // Tentar chave individual primeiro
            const userKeys = await this.pool.query(`
                SELECT api_key, secret_key, exchange, environment 
                FROM user_api_keys 
                WHERE user_id = $1 AND exchange = 'bybit' 
                AND is_active = true 
                ORDER BY created_at DESC LIMIT 1
            `, [userId]);

            if (userKeys.rows.length > 0) {
                const key = userKeys.rows[0];
                console.log(`   ✅ Chave individual encontrada: ${key.api_key.substring(0,15)}...`);
                return {
                    type: 'individual',
                    apiKey: key.api_key,
                    secretKey: key.secret_key,
                    source: `Chave individual do usuário ${userId}`
                };
            }

            console.log(`   ⚠️  Nenhuma chave individual, usando compartilhada`);
            // Usar chave compartilhada como fallback
            return {
                type: 'shared',
                apiKey: this.fallbackKeys.apiKey,
                secretKey: this.fallbackKeys.secretKey,
                source: 'Chave compartilhada das variáveis de ambiente'
            };

        } catch (error) {
            console.error(`❌ Erro ao buscar chaves do usuário ${userId}:`, error.message);
            return {
                type: 'shared',
                apiKey: this.fallbackKeys.apiKey,
                secretKey: this.fallbackKeys.secretKey,
                source: 'Chave compartilhada (fallback de erro)'
            };
        }
    }

    // Fazer requisição autenticada para API V5
    async makeV5Request(endpoint, userId, params = {}) {
        try {
            const keys = await this.getUserKeys(userId);
            const timestamp = Date.now().toString();
            
            // Preparar parâmetros
            const queryString = new URLSearchParams(params).toString();
            
            // Gerar assinatura
            const signature = this.generateSignature(timestamp, keys.apiKey, keys.secretKey, queryString);
            
            // Headers para API V5
            const headers = {
                'X-BAPI-API-KEY': keys.apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': '5000',
                'Content-Type': 'application/json'
            };

            const url = queryString ? 
                `${this.baseUrl}${endpoint}?${queryString}` : 
                `${this.baseUrl}${endpoint}`;

            console.log(`🔄 V5 Request: ${endpoint} (${keys.source})`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            const data = await response.json();
            
            return {
                success: data.retCode === 0,
                data: data,
                keyType: keys.type,
                source: keys.source,
                userId: userId
            };

        } catch (error) {
            console.error(`❌ Erro na requisição V5:`, error.message);
            return {
                success: false,
                error: error.message,
                userId: userId
            };
        }
    }

    // Buscar saldo de um usuário (API V5)
    async getWalletBalance(userId, accountType = 'UNIFIED') {
        return await this.makeV5Request('/v5/account/wallet-balance', userId, {
            accountType: accountType
        });
    }

    // Buscar informações da conta (API V5)
    async getAccountInfo(userId) {
        return await this.makeV5Request('/v5/account/info', userId);
    }

    // Buscar posições (API V5)
    async getPositions(userId, category = 'linear') {
        return await this.makeV5Request('/v5/position/list', userId, {
            category: category
        });
    }

    // Buscar ordens ativas (API V5)
    async getActiveOrders(userId, category = 'linear') {
        return await this.makeV5Request('/v5/order/realtime', userId, {
            category: category
        });
    }

    // Teste completo de um usuário com múltiplas APIs V5
    async testUserCompleteV5(userId, userName) {
        console.log(`\n🧪 TESTE COMPLETO V5 - ${userName} (ID: ${userId})`);
        console.log('=' .repeat(50));

        const tests = [
            { name: 'Account Info', func: () => this.getAccountInfo(userId) },
            { name: 'Wallet Balance', func: () => this.getWalletBalance(userId) },
            { name: 'Positions', func: () => this.getPositions(userId) },
            { name: 'Active Orders', func: () => this.getActiveOrders(userId) }
        ];

        const results = {};

        for (const test of tests) {
            try {
                console.log(`\n🔄 Testando: ${test.name}`);
                const result = await test.func();
                
                if (result.success) {
                    console.log(`   ✅ SUCESSO: ${test.name}`);
                    console.log(`   🔑 Tipo: ${result.keyType}`);
                    console.log(`   📊 Dados recebidos: ${JSON.stringify(result.data.result || 'OK').substring(0, 100)}...`);
                    results[test.name] = { success: true, type: result.keyType };
                } else {
                    console.log(`   ❌ FALHA: ${test.name}`);
                    console.log(`   🚨 Erro: ${result.data?.retMsg || result.error || 'Erro desconhecido'}`);
                    results[test.name] = { success: false, error: result.data?.retMsg || result.error };
                }
                
                // Aguardar um pouco entre requisições para evitar rate limit
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.log(`   ❌ ERRO CRÍTICO: ${test.name} - ${error.message}`);
                results[test.name] = { success: false, error: error.message };
            }
        }

        return results;
    }

    // Testar todos os usuários com API V5
    async testAllUsersV5() {
        try {
            console.log('🚀 TESTE COMPLETO - TODOS OS USUÁRIOS COM API V5');
            console.log('===============================================');

            const users = await this.pool.query(`
                SELECT id, name, email, vip_status 
                FROM users 
                WHERE is_active = true 
                ORDER BY vip_status DESC, id
            `);

            console.log(`📊 Testando ${users.rows.length} usuários ativos\n`);

            const allResults = {};

            for (const user of users.rows) {
                const results = await this.testUserCompleteV5(user.id, user.name);
                allResults[user.id] = {
                    user: user,
                    results: results
                };
            }

            // Relatório consolidado
            console.log('\n📋 RELATÓRIO CONSOLIDADO - API V5');
            console.log('=================================');

            let totalTests = 0;
            let totalSuccess = 0;

            Object.values(allResults).forEach(userData => {
                const { user, results } = userData;
                const planType = user.vip_status ? '⭐ VIP' : '👤 BÁSICO';
                
                const testsCount = Object.keys(results).length;
                const successCount = Object.values(results).filter(r => r.success).length;
                const successRate = Math.round((successCount / testsCount) * 100);

                console.log(`\n${planType} ${user.name} (ID: ${user.id})`);
                console.log(`   📧 ${user.email}`);
                console.log(`   📊 Sucesso: ${successCount}/${testsCount} (${successRate}%)`);

                Object.entries(results).forEach(([testName, result]) => {
                    const status = result.success ? '✅' : '❌';
                    const detail = result.success ? 
                        (result.type ? `(${result.type})` : '') : 
                        `(${result.error?.substring(0, 30) || 'erro'}...)`;
                    console.log(`      ${status} ${testName} ${detail}`);
                });

                totalTests += testsCount;
                totalSuccess += successCount;
            });

            const overallSuccessRate = Math.round((totalSuccess / totalTests) * 100);
            
            console.log(`\n🎯 ESTATÍSTICAS GERAIS:`);
            console.log(`   📊 Total de testes: ${totalTests}`);
            console.log(`   ✅ Sucessos: ${totalSuccess}`);
            console.log(`   ❌ Falhas: ${totalTests - totalSuccess}`);
            console.log(`   📈 Taxa de sucesso geral: ${overallSuccessRate}%`);

            if (overallSuccessRate >= 80) {
                console.log(`\n🎉 SISTEMA API V5 FUNCIONANDO MUITO BEM!`);
            } else if (overallSuccessRate >= 60) {
                console.log(`\n⚠️  SISTEMA API V5 COM ALGUNS PROBLEMAS`);
            } else {
                console.log(`\n🚨 SISTEMA API V5 PRECISA DE CORREÇÕES`);
            }

            return allResults;

        } catch (error) {
            console.error('❌ Erro no teste geral:', error.message);
            return {};
        }
    }

    async close() {
        await this.pool.end();
    }
}

// Executar teste completo
async function main() {
    const apiManager = new BybitV5ApiManager();

    try {
        await apiManager.testAllUsersV5();
        
        console.log('\n✅ TESTE COMPLETO API V5 FINALIZADO!');
        console.log('\n📝 PRÓXIMOS PASSOS:');
        console.log('   1. Analisar resultados dos testes');
        console.log('   2. Corrigir problemas identificados');
        console.log('   3. Implementar API V5 no sistema principal');
        console.log('   4. Deploy da versão atualizada');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await apiManager.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = BybitV5ApiManager;
