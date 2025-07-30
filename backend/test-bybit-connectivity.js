const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class BybitConnectivityTest {
    constructor() {
        this.pool = pool;
        this.baseUrl = 'https://api.bybit.com';
    }

    // Gerar assinatura para autenticação Bybit
    generateSignature(params, secret, timestamp) {
        const paramString = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        
        const signString = timestamp + process.env.BYBIT_API_KEY + paramString;
        return crypto.createHmac('sha256', secret).update(signString).digest('hex');
    }

    // Fazer requisição autenticada para Bybit
    async makeBybitRequest(apiKey, secretKey, endpoint, params = {}) {
        try {
            const timestamp = Date.now().toString();
            
            // Preparar parâmetros
            const requestParams = {
                ...params,
                api_key: apiKey,
                timestamp: timestamp
            };

            // Gerar assinatura
            const signature = this.generateSignature(requestParams, secretKey, timestamp);
            requestParams.sign = signature;

            // Fazer requisição
            const url = new URL(endpoint, this.baseUrl);
            Object.keys(requestParams).forEach(key => {
                url.searchParams.append(key, requestParams[key]);
            });

            console.log(`   🔄 Fazendo requisição para: ${endpoint}`);
            console.log(`   🔑 API Key: ${apiKey.substring(0, 15)}...`);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };

        } catch (error) {
            console.error(`   ❌ Erro na requisição:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Testar uma chave específica
    async testApiKey(apiKey, secretKey, userInfo = '') {
        try {
            console.log(`\n🧪 TESTANDO CHAVE: ${userInfo}`);
            console.log(`   🔑 API Key: ${apiKey.substring(0, 15)}...`);
            
            // Teste 1: Buscar saldo da conta
            console.log(`   📊 Teste 1: Saldo da conta...`);
            const balanceResult = await this.makeBybitRequest(
                apiKey, 
                secretKey, 
                '/v2/private/wallet/balance'
            );

            if (balanceResult.success) {
                console.log(`   ✅ Saldo obtido com sucesso!`);
                if (balanceResult.data && balanceResult.data.result) {
                    const balances = Object.entries(balanceResult.data.result)
                        .filter(([coin, data]) => parseFloat(data.available_balance) > 0)
                        .slice(0, 5); // Mostrar apenas 5 primeiros

                    if (balances.length > 0) {
                        console.log(`   💰 Saldos disponíveis:`);
                        balances.forEach(([coin, data]) => {
                            console.log(`      ${coin}: ${data.available_balance}`);
                        });
                    } else {
                        console.log(`   ℹ️  Conta sem saldos ou saldos zerados`);
                    }
                } else {
                    console.log(`   ⚠️  Resposta sem dados de saldo`);
                }
            } else {
                console.log(`   ❌ Erro ao buscar saldo: ${balanceResult.data?.ret_msg || balanceResult.error}`);
            }

            // Teste 2: Informações da conta
            console.log(`   👤 Teste 2: Informações da conta...`);
            const accountResult = await this.makeBybitRequest(
                apiKey,
                secretKey,
                '/v2/private/account'
            );

            if (accountResult.success) {
                console.log(`   ✅ Informações da conta obtidas!`);
                if (accountResult.data && accountResult.data.result) {
                    const account = accountResult.data.result;
                    console.log(`   📋 UID: ${account.uid || 'N/A'}`);
                    console.log(`   🏷️  Tipo: ${account.account_type || 'N/A'}`);
                }
            } else {
                console.log(`   ❌ Erro nas informações da conta: ${accountResult.data?.ret_msg || accountResult.error}`);
            }

            // Resultado final do teste
            const overallSuccess = balanceResult.success || accountResult.success;
            console.log(`   📊 RESULTADO: ${overallSuccess ? '✅ CHAVE VÁLIDA' : '❌ CHAVE INVÁLIDA'}`);
            
            return {
                valid: overallSuccess,
                balanceTest: balanceResult.success,
                accountTest: accountResult.success,
                balanceData: balanceResult.data,
                accountData: accountResult.data
            };

        } catch (error) {
            console.error(`   ❌ Erro no teste da chave:`, error.message);
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Testar todas as chaves do sistema
    async testAllUserKeys() {
        try {
            console.log('🔍 TESTE DE CONECTIVIDADE - CHAVES BYBIT');
            console.log('========================================');

            // Buscar todas as chaves ativas
            const activeKeys = await this.pool.query(`
                SELECT ak.*, u.name, u.email, u.vip_status
                FROM user_api_keys ak
                JOIN users u ON ak.user_id = u.id
                WHERE ak.is_active = true 
                AND ak.exchange = 'bybit'
                AND u.is_active = true
                ORDER BY u.vip_status DESC, u.name
            `);

            console.log(`📋 Encontradas ${activeKeys.rows.length} chaves para testar\n`);

            const results = [];

            for (const keyData of activeKeys.rows) {
                const userInfo = `${keyData.name} (${keyData.vip_status ? 'VIP' : 'BÁSICO'})`;
                
                const testResult = await this.testApiKey(
                    keyData.api_key,
                    keyData.secret_key,
                    userInfo
                );

                // Atualizar status no banco
                const newStatus = testResult.valid ? 'valid' : 'error';
                const errorMessage = testResult.valid ? null : 
                    (testResult.error || 'Falha na conexão com Bybit');

                await this.pool.query(`
                    UPDATE user_api_keys 
                    SET validation_status = $1, 
                        error_message = $2,
                        last_validated_at = NOW()
                    WHERE id = $3
                `, [newStatus, errorMessage, keyData.id]);

                results.push({
                    user: keyData.name,
                    email: keyData.email,
                    vip: keyData.vip_status,
                    valid: testResult.valid,
                    apiKey: keyData.api_key.substring(0, 15) + '...'
                });

                // Pequena pausa entre testes para não sobrecarregar a API
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            return results;

        } catch (error) {
            console.error('❌ Erro no teste geral:', error.message);
            return [];
        }
    }

    // Testar chave compartilhada das variáveis de ambiente
    async testSharedKeys() {
        try {
            console.log('\n🌐 TESTANDO CHAVE COMPARTILHADA');
            console.log('==============================');

            const sharedApiKey = 'q3JH2TYGwCHaupbwgG';
            const sharedSecretKey = 'GqF3E7RZWHBhERnBTUBK4l2qpSiVF3GBWEs';

            const result = await this.testApiKey(
                sharedApiKey,
                sharedSecretKey,
                'Chave Compartilhada (Variáveis de Ambiente)'
            );

            return result;

        } catch (error) {
            console.error('❌ Erro no teste da chave compartilhada:', error.message);
            return { valid: false, error: error.message };
        }
    }

    // Relatório final dos testes
    async generateConnectivityReport(individualResults, sharedResult) {
        try {
            console.log('\n📊 RELATÓRIO DE CONECTIVIDADE');
            console.log('=============================');

            const validIndividual = individualResults.filter(r => r.valid);
            const invalidIndividual = individualResults.filter(r => !r.valid);

            console.log(`📈 CHAVES INDIVIDUAIS:`);
            console.log(`   ✅ Válidas: ${validIndividual.length}`);
            console.log(`   ❌ Inválidas: ${invalidIndividual.length}`);
            console.log(`   📊 Taxa de sucesso: ${Math.round((validIndividual.length / individualResults.length) * 100)}%`);

            if (validIndividual.length > 0) {
                console.log(`\n   ✅ CHAVES FUNCIONANDO:`);
                validIndividual.forEach(result => {
                    console.log(`      ${result.vip ? '⭐' : '👤'} ${result.user} - ${result.apiKey}`);
                });
            }

            if (invalidIndividual.length > 0) {
                console.log(`\n   ❌ CHAVES COM PROBLEMA:`);
                invalidIndividual.forEach(result => {
                    console.log(`      ${result.vip ? '⭐' : '👤'} ${result.user} - ${result.apiKey}`);
                });
            }

            console.log(`\n🌐 CHAVE COMPARTILHADA:`);
            console.log(`   Status: ${sharedResult.valid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);

            // Calcular operabilidade geral
            const totalUsers = await this.pool.query(`
                SELECT COUNT(*) as total FROM users WHERE is_active = true
            `);

            const usersCount = parseInt(totalUsers.rows[0].total);
            const operationalUsers = sharedResult.valid ? usersCount : validIndividual.length;
            const operabilityRate = Math.round((operationalUsers / usersCount) * 100);

            console.log(`\n🎯 OPERABILIDADE GERAL:`);
            console.log(`   👥 Total de usuários: ${usersCount}`);
            console.log(`   ⚡ Usuários operacionais: ${operationalUsers}`);
            console.log(`   📊 Taxa de operabilidade: ${operabilityRate}%`);

            if (operabilityRate === 100) {
                console.log(`   🎉 SISTEMA 100% OPERACIONAL!`);
            } else if (operabilityRate >= 80) {
                console.log(`   ✅ Sistema altamente operacional`);
            } else {
                console.log(`   ⚠️  Sistema precisa de atenção`);
            }

        } catch (error) {
            console.error('❌ Erro no relatório:', error.message);
        }
    }

    async close() {
        await this.pool.end();
    }
}

// Função principal
async function main() {
    const tester = new BybitConnectivityTest();

    try {
        // 1. Testar todas as chaves individuais
        const individualResults = await tester.testAllUserKeys();

        // 2. Testar chave compartilhada
        const sharedResult = await tester.testSharedKeys();

        // 3. Gerar relatório final
        await tester.generateConnectivityReport(individualResults, sharedResult);

        console.log('\n✅ TESTE DE CONECTIVIDADE CONCLUÍDO!');

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        await tester.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = BybitConnectivityTest;
