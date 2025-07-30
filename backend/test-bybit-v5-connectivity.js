const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class BybitConnectivityTestV5 {
    constructor() {
        this.pool = pool;
        this.baseUrl = 'https://api.bybit.com';
    }

    // Gerar assinatura para Bybit API V5
    generateSignature(timestamp, apiKey, recv_window, queryString, secret) {
        const param_str = timestamp + apiKey + recv_window + queryString;
        return crypto.createHmac('sha256', secret).update(param_str).digest('hex');
    }

    // Fazer requisição autenticada para Bybit V5
    async makeBybitV5Request(apiKey, secretKey, endpoint, params = {}) {
        try {
            const timestamp = Date.now().toString();
            const recv_window = '5000';
            
            // Preparar query string
            const queryString = Object.keys(params).length > 0 ? 
                Object.keys(params)
                    .sort()
                    .map(key => `${key}=${encodeURIComponent(params[key])}`)
                    .join('&') : '';

            // Gerar assinatura
            const signature = this.generateSignature(timestamp, apiKey, recv_window, queryString, secretKey);

            // Preparar headers
            const headers = {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recv_window,
                'Content-Type': 'application/json'
            };

            // Construir URL
            const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
            
            console.log(`   🔄 Tentando endpoint: ${endpoint}`);
            console.log(`   🔑 API Key: ${apiKey.substring(0, 15)}...`);

            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            const data = await response.json();
            
            console.log(`   📡 Status: ${response.status}`);
            if (data.retMsg) {
                console.log(`   💬 Mensagem: ${data.retMsg}`);
            }

            return {
                success: response.ok && data.retCode === 0,
                status: response.status,
                data: data,
                retCode: data.retCode,
                retMsg: data.retMsg
            };

        } catch (error) {
            console.error(`   ❌ Erro na requisição:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Testar conectividade básica (sem autenticação)
    async testBasicConnectivity() {
        try {
            console.log(`\n🌐 TESTE DE CONECTIVIDADE BÁSICA`);
            console.log(`   🔄 Testando acesso à API pública...`);
            
            const response = await fetch(`${this.baseUrl}/v5/market/time`);
            const data = await response.json();
            
            if (response.ok && data.retCode === 0) {
                console.log(`   ✅ Conectividade OK - Servidor Time: ${new Date(parseInt(data.result.timeSecond) * 1000)}`);
                return true;
            } else {
                console.log(`   ❌ Problema de conectividade: ${data.retMsg || 'Erro desconhecido'}`);
                return false;
            }
        } catch (error) {
            console.log(`   ❌ Erro de conectividade: ${error.message}`);
            return false;
        }
    }

    // Testar uma chave específica com múltiplos endpoints
    async testApiKeyDetailed(apiKey, secretKey, userInfo = '') {
        try {
            console.log(`\n🧪 TESTANDO CHAVE DETALHADA: ${userInfo}`);
            console.log(`   🔑 API Key: ${apiKey.substring(0, 15)}...`);
            
            const results = {};

            // Teste 1: Account Info (mais básico)
            console.log(`   📋 Teste 1: Informações da conta...`);
            const accountResult = await this.makeBybitV5Request(
                apiKey, 
                secretKey, 
                '/v5/account/info'
            );
            results.accountInfo = accountResult;

            // Teste 2: Wallet Balance
            console.log(`   💰 Teste 2: Saldo da carteira...`);
            const walletResult = await this.makeBybitV5Request(
                apiKey,
                secretKey,
                '/v5/account/wallet-balance',
                { accountType: 'UNIFIED' }
            );
            results.walletBalance = walletResult;

            // Teste 3: Position Info  
            console.log(`   📊 Teste 3: Informações de posição...`);
            const positionResult = await this.makeBybitV5Request(
                apiKey,
                secretKey,
                '/v5/position/list',
                { category: 'linear' }
            );
            results.positionInfo = positionResult;

            // Determinar se pelo menos um teste passou
            const anySuccess = Object.values(results).some(r => r.success);
            
            console.log(`   📊 RESULTADO GERAL: ${anySuccess ? '✅ CHAVE VÁLIDA' : '❌ CHAVE INVÁLIDA'}`);

            // Mostrar detalhes dos sucessos
            if (results.accountInfo.success) {
                console.log(`   ✅ Account Info: OK`);
                if (results.accountInfo.data?.result) {
                    const account = results.accountInfo.data.result;
                    console.log(`      📋 UID: ${account.uid || 'N/A'}`);
                    console.log(`      🏷️  Status: ${account.status || 'N/A'}`);
                }
            }

            if (results.walletBalance.success) {
                console.log(`   ✅ Wallet Balance: OK`);
                if (results.walletBalance.data?.result?.list) {
                    const wallets = results.walletBalance.data.result.list;
                    wallets.forEach(wallet => {
                        const coins = wallet.coin?.filter(c => parseFloat(c.walletBalance) > 0)?.slice(0, 3);
                        if (coins && coins.length > 0) {
                            console.log(`      💰 Saldos:`);
                            coins.forEach(coin => {
                                console.log(`         ${coin.coin}: ${coin.walletBalance}`);
                            });
                        }
                    });
                }
            }

            if (results.positionInfo.success) {
                console.log(`   ✅ Position Info: OK`);
            }

            return {
                valid: anySuccess,
                tests: results,
                details: {
                    accountInfo: results.accountInfo.success,
                    walletBalance: results.walletBalance.success,
                    positionInfo: results.positionInfo.success
                }
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
    async testAllUserKeysV5() {
        try {
            console.log('🔍 TESTE DE CONECTIVIDADE BYBIT V5 - CHAVES REAIS');
            console.log('================================================');

            // Primeiro testar conectividade básica
            const basicConnectivity = await this.testBasicConnectivity();
            if (!basicConnectivity) {
                console.log('\n❌ PROBLEMA DE CONECTIVIDADE BÁSICA - Verificar internet/DNS');
                return [];
            }

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

            console.log(`\n📋 Encontradas ${activeKeys.rows.length} chaves para testar\n`);

            const results = [];

            for (const keyData of activeKeys.rows) {
                const userInfo = `${keyData.name} (${keyData.vip_status ? 'VIP' : 'BÁSICO'})`;
                
                const testResult = await this.testApiKeyDetailed(
                    keyData.api_key,
                    keyData.secret_key,
                    userInfo
                );

                // Atualizar status no banco
                const newStatus = testResult.valid ? 'valid' : 'error';
                const errorMessage = testResult.valid ? null : 
                    (testResult.error || 'Falha na autenticação Bybit');

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
                    apiKey: keyData.api_key.substring(0, 15) + '...',
                    details: testResult.details
                });

                // Pausa entre testes
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            return results;

        } catch (error) {
            console.error('❌ Erro no teste geral:', error.message);
            return [];
        }
    }

    // Testar chave compartilhada
    async testSharedKeysV5() {
        try {
            console.log('\n🌐 TESTANDO CHAVE COMPARTILHADA (V5)');
            console.log('===================================');

            const sharedApiKey = 'q3JH2TYGwCHaupbwgG';
            const sharedSecretKey = 'GqF3E7RZWHBhERnBTUBK4l2qpSiVF3GBWEs';

            const result = await this.testApiKeyDetailed(
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

    // Relatório final melhorado
    async generateDetailedReport(individualResults, sharedResult) {
        try {
            console.log('\n📊 RELATÓRIO DETALHADO DE CONECTIVIDADE');
            console.log('=======================================');

            const validIndividual = individualResults.filter(r => r.valid);
            const invalidIndividual = individualResults.filter(r => !r.valid);

            console.log(`📈 RESUMO DAS CHAVES:`);
            console.log(`   🔑 Chaves individuais testadas: ${individualResults.length}`);
            console.log(`   ✅ Válidas: ${validIndividual.length}`);
            console.log(`   ❌ Inválidas: ${invalidIndividual.length}`);
            console.log(`   🌐 Chave compartilhada: ${sharedResult.valid ? 'VÁLIDA' : 'INVÁLIDA'}`);

            if (validIndividual.length > 0) {
                console.log(`\n✅ CHAVES FUNCIONANDO:`);
                validIndividual.forEach(result => {
                    const plan = result.vip ? '⭐ VIP' : '👤 BÁSICO';
                    console.log(`   ${plan} ${result.user}`);
                    console.log(`      🔑 ${result.apiKey}`);
                    if (result.details) {
                        const tests = Object.entries(result.details)
                            .map(([test, success]) => success ? `✅ ${test}` : `❌ ${test}`)
                            .join(', ');
                        console.log(`      📊 Testes: ${tests}`);
                    }
                });
            }

            if (invalidIndividual.length > 0) {
                console.log(`\n❌ CHAVES COM PROBLEMA:`);
                invalidIndividual.forEach(result => {
                    const plan = result.vip ? '⭐ VIP' : '👤 BÁSICO';
                    console.log(`   ${plan} ${result.user} - ${result.apiKey}`);
                });
            }

            // Recomendações
            console.log(`\n💡 RECOMENDAÇÕES:`);
            
            if (validIndividual.length === 0 && !sharedResult.valid) {
                console.log(`   🚨 CRÍTICO: Nenhuma chave está funcionando!`);
                console.log(`   🔧 Ações necessárias:`);
                console.log(`      1. Verificar se as chaves API não expiraram`);
                console.log(`      2. Confirmar permissões das chaves na Bybit`);
                console.log(`      3. Verificar se IPs estão na whitelist`);
                console.log(`      4. Gerar novas chaves se necessário`);
            } else if (sharedResult.valid) {
                console.log(`   ✅ Chave compartilhada funcionando - sistema operacional`);
                console.log(`   📈 Recomendação: Corrigir chaves individuais para melhor performance`);
            } else {
                console.log(`   ⚠️  Sistema parcialmente operacional`);
                console.log(`   🔧 Corrigir chaves inválidas quando possível`);
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
    const tester = new BybitConnectivityTestV5();

    try {
        // 1. Testar todas as chaves individuais
        const individualResults = await tester.testAllUserKeysV5();

        // 2. Testar chave compartilhada
        const sharedResult = await tester.testSharedKeysV5();

        // 3. Gerar relatório detalhado
        await tester.generateDetailedReport(individualResults, sharedResult);

        console.log('\n✅ TESTE DE CONECTIVIDADE V5 CONCLUÍDO!');

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

module.exports = BybitConnectivityTestV5;
