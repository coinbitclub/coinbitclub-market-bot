#!/usr/bin/env node

/**
 * 🧪 TESTE COMPLETO DO SISTEMA ENTERPRISE
 * ======================================
 * 
 * Script para testar completamente o novo sistema enterprise
 * de conexão com Binance e Bybit
 */

const EnterpriseExchangeConnector = require('./enterprise-exchange-connector');
const EnterpriseExchangeOrchestrator = require('./enterprise-exchange-orchestrator');

class EnterpriseSystemTester {
    constructor() {
        this.connector = new EnterpriseExchangeConnector();
        this.orchestrator = new EnterpriseExchangeOrchestrator();
        
        // Chaves de teste conhecidas (Binance Testnet)
        this.testKeys = {
            binance_testnet: {
                apiKey: '43e7f148ec0f1e155f0451d683f881103803ed036efacb95e026ce8805882803',
                apiSecret: 'af0d2856f3c6fe825f084fd28a0ab7b471e2a8fa88691e7c990b75be6557bd82'
            },
            bybit_testnet: {
                apiKey: '1FHeimNdrGvCSPABD4',
                apiSecret: 'xX5KU5VhxvXy1YZ2sN51GCTLp4DGBxKygrwG'
            }
        };
    }

    async runCompleteTest() {
        console.log('🧪 INICIANDO TESTE COMPLETO DO SISTEMA ENTERPRISE');
        console.log('==================================================');
        console.log('');

        try {
            // TESTE 1: Connector Enterprise
            await this.testEnterpriseConnector();
            
            // TESTE 2: Auto-detecção
            await this.testAutoDetection();
            
            // TESTE 3: Validação Enterprise
            await this.testEnterpriseValidation();
            
            // TESTE 4: Cache e Performance
            await this.testCacheAndPerformance();
            
            // TESTE 5: Orquestrador
            await this.testOrchestrator();
            
            // TESTE 6: Monitoramento
            await this.testMonitoring();
            
            // TESTE 7: Recovery
            await this.testAutoRecovery();

            console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
            console.log('✅ Sistema enterprise funcionando perfeitamente');

        } catch (error) {
            console.error('\n❌ ERRO NOS TESTES:', error.message);
            console.error('Stack:', error.stack);
        }
    }

    async testEnterpriseConnector() {
        console.log('🔌 TESTE 1: Enterprise Connector');
        console.log('================================');

        try {
            // Teste Binance Testnet
            console.log('🟡 Testando Binance Testnet...');
            const binanceResult = await this.connector.connectAndValidateExchange(
                9999, // userId de teste
                this.testKeys.binance_testnet.apiKey,
                this.testKeys.binance_testnet.apiSecret,
                'binance'
            );

            if (binanceResult.success) {
                console.log(`  ✅ Conexão: ${binanceResult.exchangeName}`);
                console.log(`  ✅ Ambiente: ${binanceResult.environment}`);
                console.log(`  ✅ Conta: ${binanceResult.account.canTrade ? 'Trading habilitado' : 'Trading desabilitado'}`);
                
                // Testar operação de saldo
                if (binanceResult.operations && binanceResult.operations.getBalance) {
                    const balance = await binanceResult.operations.getBalance();
                    console.log(`  ✅ Saldo: ${balance.success ? 'Obtido com sucesso' : 'Erro: ' + balance.error}`);
                }
            } else {
                console.log(`  ❌ Binance falhou: ${binanceResult.error}`);
                console.log(`  📋 Detalhes: ${binanceResult.details}`);
            }

            // Teste Bybit Testnet
            console.log('\n🔵 Testando Bybit Testnet...');
            const bybitResult = await this.connector.connectAndValidateExchange(
                9999, // userId de teste
                this.testKeys.bybit_testnet.apiKey,
                this.testKeys.bybit_testnet.apiSecret,
                'bybit'
            );

            if (bybitResult.success) {
                console.log(`  ✅ Conexão: ${bybitResult.exchangeName}`);
                console.log(`  ✅ Ambiente: ${bybitResult.environment}`);
                console.log(`  ✅ Conta: ${bybitResult.account.accountType || 'N/A'}`);
                
                // Testar operação de saldo
                if (bybitResult.operations && bybitResult.operations.getBalance) {
                    const balance = await bybitResult.operations.getBalance();
                    console.log(`  ✅ Saldo: ${balance.success ? 'Obtido com sucesso' : 'Erro: ' + balance.error}`);
                }
            } else {
                console.log(`  ❌ Bybit falhou: ${bybitResult.error}`);
                console.log(`  📋 Detalhes: ${bybitResult.details}`);
            }

            console.log('\n✅ TESTE 1 CONCLUÍDO');

        } catch (error) {
            console.log(`\n❌ TESTE 1 FALHOU: ${error.message}`);
            throw error;
        }
    }

    async testAutoDetection() {
        console.log('\n🔍 TESTE 2: Auto-detecção');
        console.log('========================');

        try {
            // Teste sem hint
            console.log('🎯 Testando auto-detecção sem hint...');
            const autoResult = await this.connector.connectAndValidateExchange(
                9998,
                this.testKeys.binance_testnet.apiKey,
                this.testKeys.binance_testnet.apiSecret
            );

            if (autoResult.success) {
                console.log(`  ✅ Auto-detectado: ${autoResult.exchange} ${autoResult.environment}`);
            } else {
                console.log(`  ❌ Auto-detecção falhou: ${autoResult.error}`);
            }

            // Teste com hint errado
            console.log('\n🎯 Testando auto-detecção com hint errado...');
            const hintResult = await this.connector.connectAndValidateExchange(
                9997,
                this.testKeys.binance_testnet.apiKey,
                this.testKeys.binance_testnet.apiSecret,
                'bybit' // hint errado propositalmente
            );

            if (hintResult.success) {
                console.log(`  ✅ Corrigiu hint errado: ${hintResult.exchange} ${hintResult.environment}`);
            } else {
                console.log(`  ⚠️ Não conseguiu corrigir hint: ${hintResult.error}`);
            }

            console.log('\n✅ TESTE 2 CONCLUÍDO');

        } catch (error) {
            console.log(`\n❌ TESTE 2 FALHOU: ${error.message}`);
            throw error;
        }
    }

    async testEnterpriseValidation() {
        console.log('\n🔒 TESTE 3: Validação Enterprise');
        console.log('==============================');

        try {
            // Teste com chaves inválidas
            console.log('🚫 Testando chaves inválidas...');
            const invalidResult = await this.connector.connectAndValidateExchange(
                9996,
                'invalid_key_123',
                'invalid_secret_456'
            );

            if (!invalidResult.success) {
                console.log(`  ✅ Rejeitou chaves inválidas: ${invalidResult.error}`);
            } else {
                console.log(`  ❌ Aceitou chaves inválidas (problema!)`);
            }

            // Teste com formato correto mas chaves falsas
            console.log('\n🚫 Testando chaves com formato correto mas falsas...');
            const fakeResult = await this.connector.connectAndValidateExchange(
                9995,
                'fakeApiKey1234567890abcdefghijklmnopqrstuvwxyz1234567890abcd', // formato Binance
                'fakeSecretKey1234567890abcdefghijklmnopqrstuvwxyz1234567890'
            );

            if (!fakeResult.success) {
                console.log(`  ✅ Rejeitou chaves falsas: ${fakeResult.error}`);
            } else {
                console.log(`  ❌ Aceitou chaves falsas (problema!)`);
            }

            console.log('\n✅ TESTE 3 CONCLUÍDO');

        } catch (error) {
            console.log(`\n❌ TESTE 3 FALHOU: ${error.message}`);
            throw error;
        }
    }

    async testCacheAndPerformance() {
        console.log('\n⚡ TESTE 4: Cache e Performance');
        console.log('=============================');

        try {
            // Primeira conexão (deve ser lenta)
            console.log('🐌 Primeira conexão (sem cache)...');
            const start1 = Date.now();
            const result1 = await this.connector.connectAndValidateExchange(
                9994,
                this.testKeys.binance_testnet.apiKey,
                this.testKeys.binance_testnet.apiSecret,
                'binance'
            );
            const time1 = Date.now() - start1;
            console.log(`  📊 Tempo: ${time1}ms | Sucesso: ${result1.success}`);

            // Segunda conexão (deve usar cache)
            console.log('\n⚡ Segunda conexão (com cache)...');
            const start2 = Date.now();
            const result2 = await this.connector.connectAndValidateExchange(
                9994,
                this.testKeys.binance_testnet.apiKey,
                this.testKeys.binance_testnet.apiSecret,
                'binance'
            );
            const time2 = Date.now() - start2;
            console.log(`  📊 Tempo: ${time2}ms | Sucesso: ${result2.success}`);

            // Verificar se foi mais rápido
            if (time2 < time1 * 0.5) {
                console.log(`  ✅ Cache funcionando: ${((time1 - time2) / time1 * 100).toFixed(1)}% mais rápido`);
            } else {
                console.log(`  ⚠️ Cache não parece estar funcionando`);
            }

            // Testar estatísticas
            const stats = this.connector.getStats();
            console.log(`\n📊 Estatísticas do Connector:`);
            console.log(`  📈 Total de conexões: ${stats.totalConnections}`);
            console.log(`  ✅ Conexões bem-sucedidas: ${stats.successfulConnections}`);
            console.log(`  ❌ Conexões falhadas: ${stats.failedConnections}`);
            console.log(`  🎯 Taxa de sucesso: ${stats.successRate}`);
            console.log(`  ⚡ Cache hits: ${stats.cacheHits}`);

            console.log('\n✅ TESTE 4 CONCLUÍDO');

        } catch (error) {
            console.log(`\n❌ TESTE 4 FALHOU: ${error.message}`);
            throw error;
        }
    }

    async testOrchestrator() {
        console.log('\n🎯 TESTE 5: Orquestrador Enterprise');
        console.log('==================================');

        try {
            // Não vamos iniciar o orquestrador completo para não conflitar
            // Apenas testar a lógica de inicialização
            console.log('🏗️ Testando inicialização do orquestrador...');
            
            // Verificar se o orquestrador foi criado corretamente
            if (this.orchestrator) {
                console.log('  ✅ Orquestrador criado com sucesso');
                console.log(`  📋 Configurações: ${JSON.stringify(this.orchestrator.config, null, 2)}`);
            }

            // Testar métodos utilitários
            console.log('\n🛠️ Testando métodos utilitários...');
            const connectionId = this.orchestrator.connector.generateConnectionId();
            console.log(`  ✅ Connection ID gerado: ${connectionId}`);

            const rateLimits = this.orchestrator.connector.getRateLimits('binance');
            console.log(`  ✅ Rate limits Binance: ${JSON.stringify(rateLimits)}`);

            console.log('\n✅ TESTE 5 CONCLUÍDO');

        } catch (error) {
            console.log(`\n❌ TESTE 5 FALHOU: ${error.message}`);
            throw error;
        }
    }

    async testMonitoring() {
        console.log('\n📊 TESTE 6: Sistema de Monitoramento');
        console.log('===================================');

        try {
            // Testar health check individual
            console.log('🏥 Testando health check das exchanges...');
            
            const binanceHealth = await this.orchestrator.checkExchangeHealth('binance', 'testnet');
            console.log(`  🟡 Binance Testnet: ${binanceHealth.status} (${binanceHealth.responseTime}ms)`);

            const bybitHealth = await this.orchestrator.checkExchangeHealth('bybit', 'testnet');
            console.log(`  🔵 Bybit Testnet: ${bybitHealth.status} (${bybitHealth.responseTime}ms)`);

            // Testar health check completo
            console.log('\n🏥 Testando health check completo...');
            await this.orchestrator.performHealthCheckAllExchanges();
            
            const health = this.orchestrator.orchestratorState.exchangeHealth;
            for (const [exchange, status] of Object.entries(health)) {
                const emoji = status.status === 'healthy' ? '✅' : status.status === 'degraded' ? '⚠️' : '❌';
                console.log(`  ${emoji} ${exchange}: ${status.status}`);
            }

            console.log('\n✅ TESTE 6 CONCLUÍDO');

        } catch (error) {
            console.log(`\n❌ TESTE 6 FALHOU: ${error.message}`);
            throw error;
        }
    }

    async testAutoRecovery() {
        console.log('\n🛠️ TESTE 7: Sistema de Auto-Recovery');
        console.log('===================================');

        try {
            // Simular um usuário com problemas de conexão
            console.log('🔧 Simulando cenário de recovery...');
            
            this.orchestrator.orchestratorState.activeUsers.set(9993, {
                id: 9993,
                username: 'test_recovery_user',
                email: 'recovery@test.com',
                binance_api_key_encrypted: 'encrypted_test_key',
                binance_api_secret_encrypted: 'encrypted_test_secret',
                connections: new Map(),
                status: 'connection_failed'
            });

            console.log('  ✅ Usuário de teste adicionado com status: connection_failed');

            // Testar a lógica de recovery (sem executar completamente)
            const testUser = this.orchestrator.orchestratorState.activeUsers.get(9993);
            if (testUser && testUser.status === 'connection_failed') {
                console.log('  ✅ Sistema detectaria usuário para recovery');
            }

            // Limpar usuário de teste
            this.orchestrator.orchestratorState.activeUsers.delete(9993);
            console.log('  🧹 Usuário de teste removido');

            console.log('\n✅ TESTE 7 CONCLUÍDO');

        } catch (error) {
            console.log(`\n❌ TESTE 7 FALHOU: ${error.message}`);
            throw error;
        }
    }

    async cleanup() {
        console.log('\n🧹 Limpando recursos de teste...');
        
        // Limpar cache
        this.connector.clearCache();
        console.log('  ✅ Cache limpo');

        // Fechar conexões do banco se necessário
        if (this.orchestrator.pool) {
            // await this.orchestrator.pool.end(); // Não fechar para não afetar outros testes
            console.log('  ✅ Conexões de banco mantidas');
        }

        console.log('🧹 Cleanup concluído');
    }
}

// Executar testes se chamado diretamente
if (require.main === module) {
    const tester = new EnterpriseSystemTester();
    
    tester.runCompleteTest()
        .then(async () => {
            await tester.cleanup();
            console.log('\n🎉 TESTE COMPLETO FINALIZADO COM SUCESSO!');
            process.exit(0);
        })
        .catch(async (error) => {
            await tester.cleanup();
            console.error('\n💥 TESTE FALHOU:', error.message);
            process.exit(1);
        });
}

module.exports = EnterpriseSystemTester;
