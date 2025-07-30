/**
 * 🚀 TESTE DE ESTRESSE COMPLETO - SISTEMA DINÂMICO COINBITCLUB
 * 
 * Teste abrangente de performance e estabilidade:
 * 🔥 Carga massiva de chaves simultâneas
 * 🔥 Stress test de validação automática
 * 🔥 Teste de recarregamento dinâmico sob pressão
 * 🔥 Monitoramento de performance e memória
 * 🔥 Simulação de cenários extremos
 */

const axios = require('axios');
const { Pool } = require('pg');
const crypto = require('crypto');

class StressTestCoinBitClub {
    constructor() {
        this.apiUrl = 'http://localhost:3001';
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
        
        this.testResults = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimeSum: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            errors: [],
            memoryUsage: [],
            startTime: null,
            endTime: null
        };
        
        console.log('🚀 TESTE DE ESTRESSE COINBITCLUB INICIALIZADO');
        console.log('==============================================');
    }
    
    /**
     * Executar bateria completa de testes de estresse
     */
    async executarTestesCompletos() {
        try {
            console.log('\n🎯 INICIANDO BATERIA COMPLETA DE TESTES DE ESTRESSE');
            console.log('===================================================');
            
            this.testResults.startTime = new Date();
            
            // 1. Teste de conectividade inicial
            await this.testeConectividadeInicial();
            
            // 2. Teste de carga moderada
            await this.testeCargaModerada();
            
            // 3. Teste de carga pesada
            await this.testeCargaPesada();
            
            // 4. Teste de carga extrema
            await this.testeCargaExtrema();
            
            // 5. Teste de validação simultânea
            await this.testeValidacaoSimultanea();
            
            // 6. Teste de recarregamento sob pressão
            await this.testeRecarregamentoPressao();
            
            // 7. Teste de resistência contínua
            await this.testeResistenciaContinua();
            
            // 8. Relatório final
            await this.gerarRelatorioFinal();
            
        } catch (error) {
            console.error('❌ Erro nos testes de estresse:', error.message);
        } finally {
            this.testResults.endTime = new Date();
            await this.pool.end();
        }
    }
    
    /**
     * Teste de conectividade inicial
     */
    async testeConectividadeInicial() {
        console.log('\n🔌 TESTE 1: CONECTIVIDADE INICIAL');
        console.log('==================================');
        
        try {
            const start = Date.now();
            const response = await axios.get(`${this.apiUrl}/health`);
            const responseTime = Date.now() - start;
            
            if (response.status === 200) {
                console.log(`✅ Sistema respondendo em ${responseTime}ms`);
                console.log(`📊 Status: ${response.data.status}`);
                return true;
            } else {
                console.log('❌ Sistema não está respondendo adequadamente');
                return false;
            }
        } catch (error) {
            console.log('❌ Sistema não está acessível:', error.message);
            return false;
        }
    }
    
    /**
     * Teste de carga moderada (10 requests simultâneas)
     */
    async testeCargaModerada() {
        console.log('\n⚡ TESTE 2: CARGA MODERADA (10 requests simultâneas)');
        console.log('===================================================');
        
        const requests = [];
        for (let i = 0; i < 10; i++) {
            requests.push(this.enviarRequestTeste(`moderate_${i}`));
        }
        
        const start = Date.now();
        const results = await Promise.allSettled(requests);
        const totalTime = Date.now() - start;
        
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;
        
        console.log(`📊 Resultados em ${totalTime}ms:`);
        console.log(`   ✅ Sucessos: ${successCount}/10`);
        console.log(`   ❌ Falhas: ${failCount}/10`);
        console.log(`   ⚡ Throughput: ${(10 / totalTime * 1000).toFixed(2)} req/s`);
        
        if (successCount >= 8) {
            console.log('✅ TESTE PASSOU - Sistema estável sob carga moderada');
        } else {
            console.log('⚠️ TESTE CRÍTICO - Sistema instável sob carga moderada');
        }
    }
    
    /**
     * Teste de carga pesada (50 requests simultâneas)
     */
    async testeCargaPesada() {
        console.log('\n🔥 TESTE 3: CARGA PESADA (50 requests simultâneas)');
        console.log('==================================================');
        
        const requests = [];
        for (let i = 0; i < 50; i++) {
            requests.push(this.enviarRequestTeste(`heavy_${i}`));
        }
        
        const start = Date.now();
        const results = await Promise.allSettled(requests);
        const totalTime = Date.now() - start;
        
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;
        
        console.log(`📊 Resultados em ${totalTime}ms:`);
        console.log(`   ✅ Sucessos: ${successCount}/50`);
        console.log(`   ❌ Falhas: ${failCount}/50`);
        console.log(`   ⚡ Throughput: ${(50 / totalTime * 1000).toFixed(2)} req/s`);
        
        // Verificar uso de memória
        this.verificarMemoria('Carga Pesada');
        
        if (successCount >= 40) {
            console.log('✅ TESTE PASSOU - Sistema resiliente sob carga pesada');
        } else {
            console.log('⚠️ TESTE CRÍTICO - Sistema com problemas sob carga pesada');
        }
    }
    
    /**
     * Teste de carga extrema (100 requests simultâneas)
     */
    async testeCargaExtrema() {
        console.log('\n💥 TESTE 4: CARGA EXTREMA (100 requests simultâneas)');
        console.log('====================================================');
        
        const requests = [];
        for (let i = 0; i < 100; i++) {
            requests.push(this.enviarRequestTeste(`extreme_${i}`));
        }
        
        const start = Date.now();
        const results = await Promise.allSettled(requests);
        const totalTime = Date.now() - start;
        
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;
        
        console.log(`📊 Resultados em ${totalTime}ms:`);
        console.log(`   ✅ Sucessos: ${successCount}/100`);
        console.log(`   ❌ Falhas: ${failCount}/100`);
        console.log(`   ⚡ Throughput: ${(100 / totalTime * 1000).toFixed(2)} req/s`);
        
        // Verificar uso de memória
        this.verificarMemoria('Carga Extrema');
        
        if (successCount >= 70) {
            console.log('🎉 TESTE PASSOU - Sistema EXCEPCIONAL sob carga extrema!');
        } else if (successCount >= 50) {
            console.log('✅ TESTE PASSOU - Sistema estável sob carga extrema');
        } else {
            console.log('🚨 TESTE FALHADO - Sistema não suporta carga extrema');
        }
    }
    
    /**
     * Teste de validação simultânea (múltiplas chaves)
     */
    async testeValidacaoSimultanea() {
        console.log('\n🔑 TESTE 5: VALIDAÇÃO SIMULTÂNEA (20 chaves)');
        console.log('=============================================');
        
        const chavesParaTestar = [];
        for (let i = 0; i < 20; i++) {
            chavesParaTestar.push({
                userId: Math.floor(Math.random() * 5) + 1, // Users 1-5
                exchange: Math.random() > 0.5 ? 'bybit' : 'binance',
                apiKey: `stress_test_api_${Date.now()}_${i}`,
                secretKey: `stress_test_secret_${Date.now()}_${i}`,
                environment: 'testnet'
            });
        }
        
        const requests = chavesParaTestar.map((chave, index) => 
            this.adicionarChaveStress(chave, `validation_${index}`)
        );
        
        const start = Date.now();
        const results = await Promise.allSettled(requests);
        const totalTime = Date.now() - start;
        
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        
        console.log(`📊 Resultados em ${totalTime}ms:`);
        console.log(`   ✅ Chaves adicionadas: ${successCount}/20`);
        console.log(`   ⚡ Taxa de adição: ${(20 / totalTime * 1000).toFixed(2)} chaves/s`);
        
        // Aguardar processamento da fila de validação
        console.log('⏳ Aguardando processamento da fila de validação...');
        await this.sleep(30000); // 30 segundos
        
        // Verificar quantas foram processadas
        const statusFinal = await this.verificarStatusValidacao();
        console.log(`📋 Chaves processadas: ${statusFinal.processadas}`);
        console.log(`✅ Chaves válidas: ${statusFinal.validas}`);
        console.log(`❌ Chaves inválidas: ${statusFinal.invalidas}`);
        
        if (statusFinal.processadas >= 15) {
            console.log('✅ TESTE PASSOU - Sistema processa validações simultaneamente');
        } else {
            console.log('⚠️ TESTE CRÍTICO - Sistema com gargalo na validação');
        }
    }
    
    /**
     * Teste de recarregamento sob pressão
     */
    async testeRecarregamentoPressao() {
        console.log('\n🔄 TESTE 6: RECARREGAMENTO SOB PRESSÃO');
        console.log('======================================');
        
        // Disparar múltiplos recarregamentos simultâneos
        const reloadRequests = [];
        for (let i = 0; i < 10; i++) {
            reloadRequests.push(
                axios.post(`${this.apiUrl}/api/reload`)
                    .catch(error => ({ error: error.message }))
            );
            await this.sleep(100); // 100ms entre requests
        }
        
        const start = Date.now();
        const results = await Promise.allSettled(reloadRequests);
        const totalTime = Date.now() - start;
        
        const successCount = results.filter(r => 
            r.status === 'fulfilled' && !r.value.error
        ).length;
        
        console.log(`📊 Resultados em ${totalTime}ms:`);
        console.log(`   ✅ Recarregamentos bem-sucedidos: ${successCount}/10`);
        
        if (successCount >= 8) {
            console.log('✅ TESTE PASSOU - Sistema gerencia recarregamentos simultâneos');
        } else {
            console.log('⚠️ TESTE CRÍTICO - Sistema com problemas no recarregamento');
        }
    }
    
    /**
     * Teste de resistência contínua
     */
    async testeResistenciaContinua() {
        console.log('\n⏰ TESTE 7: RESISTÊNCIA CONTÍNUA (2 minutos)');
        console.log('=============================================');
        
        const duracaoTeste = 120000; // 2 minutos
        const intervalos = 1000; // 1 segundo
        const start = Date.now();
        let requestCount = 0;
        let successCount = 0;
        
        console.log('🔄 Enviando requests contínuas por 2 minutos...');
        
        const interval = setInterval(async () => {
            requestCount++;
            try {
                await axios.get(`${this.apiUrl}/api/status`);
                successCount++;
                
                if (requestCount % 10 === 0) {
                    const elapsed = Date.now() - start;
                    const successRate = (successCount / requestCount * 100).toFixed(1);
                    console.log(`   📊 ${Math.floor(elapsed/1000)}s - ${requestCount} requests, ${successRate}% sucesso`);
                }
            } catch (error) {
                // Request falhou
            }
        }, intervalos);
        
        // Aguardar duração do teste
        await this.sleep(duracaoTeste);
        clearInterval(interval);
        
        const successRate = (successCount / requestCount * 100).toFixed(1);
        
        console.log(`📊 Resultados finais:`);
        console.log(`   📈 Total de requests: ${requestCount}`);
        console.log(`   ✅ Taxa de sucesso: ${successRate}%`);
        console.log(`   ⚡ Requests/segundo: ${(requestCount / 120).toFixed(2)}`);
        
        if (successRate >= 95) {
            console.log('🎉 TESTE PASSOU - Sistema EXTREMAMENTE estável!');
        } else if (successRate >= 85) {
            console.log('✅ TESTE PASSOU - Sistema estável sob carga contínua');
        } else {
            console.log('🚨 TESTE FALHADO - Sistema instável sob carga contínua');
        }
    }
    
    /**
     * Enviar request de teste
     */
    async enviarRequestTeste(id) {
        const start = Date.now();
        
        try {
            const response = await axios.get(`${this.apiUrl}/api/status`, {
                timeout: 10000
            });
            
            const responseTime = Date.now() - start;
            
            this.testResults.totalRequests++;
            this.testResults.successfulRequests++;
            this.testResults.responseTimeSum += responseTime;
            this.testResults.minResponseTime = Math.min(this.testResults.minResponseTime, responseTime);
            this.testResults.maxResponseTime = Math.max(this.testResults.maxResponseTime, responseTime);
            
            return { success: true, responseTime, id };
            
        } catch (error) {
            const responseTime = Date.now() - start;
            
            this.testResults.totalRequests++;
            this.testResults.failedRequests++;
            this.testResults.errors.push({
                id,
                error: error.message,
                responseTime
            });
            
            throw error;
        }
    }
    
    /**
     * Adicionar chave para teste de stress
     */
    async adicionarChaveStress(chaveData, id) {
        try {
            const response = await axios.post(`${this.apiUrl}/api/keys/add`, chaveData, {
                timeout: 15000
            });
            
            return { success: true, keyId: response.data.keyId, id };
            
        } catch (error) {
            throw new Error(`Erro ao adicionar chave ${id}: ${error.message}`);
        }
    }
    
    /**
     * Verificar status de validação
     */
    async verificarStatusValidacao() {
        try {
            const result = await this.pool.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN validation_status = 'valid' THEN 1 END) as validas,
                    COUNT(CASE WHEN validation_status = 'failed' THEN 1 END) as invalidas,
                    COUNT(CASE WHEN validation_status = 'pending' THEN 1 END) as pendentes
                FROM user_api_keys 
                WHERE created_at >= NOW() - INTERVAL '10 minutes'
            `);
            
            const stats = result.rows[0];
            
            return {
                processadas: parseInt(stats.validas) + parseInt(stats.invalidas),
                validas: parseInt(stats.validas),
                invalidas: parseInt(stats.invalidas),
                pendentes: parseInt(stats.pendentes)
            };
            
        } catch (error) {
            return { processadas: 0, validas: 0, invalidas: 0, pendentes: 0 };
        }
    }
    
    /**
     * Verificar uso de memória
     */
    verificarMemoria(fase) {
        const usage = process.memoryUsage();
        const memoryMB = {
            rss: Math.round(usage.rss / 1024 / 1024),
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
            external: Math.round(usage.external / 1024 / 1024)
        };
        
        this.testResults.memoryUsage.push({
            fase,
            timestamp: new Date(),
            ...memoryMB
        });
        
        console.log(`   💾 Memória (${fase}): RSS ${memoryMB.rss}MB, Heap ${memoryMB.heapUsed}/${memoryMB.heapTotal}MB`);
    }
    
    /**
     * Gerar relatório final
     */
    async gerarRelatorioFinal() {
        console.log('\n📊 RELATÓRIO FINAL DO TESTE DE ESTRESSE');
        console.log('========================================');
        
        const duracaoTotal = this.testResults.endTime - this.testResults.startTime;
        const avgResponseTime = this.testResults.totalRequests > 0 ? 
            this.testResults.responseTimeSum / this.testResults.successfulRequests : 0;
        
        console.log(`⏰ Duração total: ${Math.floor(duracaoTotal / 1000)} segundos`);
        console.log(`📈 Total de requests: ${this.testResults.totalRequests}`);
        console.log(`✅ Requests bem-sucedidas: ${this.testResults.successfulRequests}`);
        console.log(`❌ Requests falhadas: ${this.testResults.failedRequests}`);
        
        if (this.testResults.totalRequests > 0) {
            const successRate = (this.testResults.successfulRequests / this.testResults.totalRequests * 100).toFixed(2);
            console.log(`📊 Taxa de sucesso: ${successRate}%`);
        }
        
        if (this.testResults.successfulRequests > 0) {
            console.log(`⚡ Tempo médio de resposta: ${avgResponseTime.toFixed(2)}ms`);
            console.log(`🚀 Tempo mínimo: ${this.testResults.minResponseTime}ms`);
            console.log(`🐌 Tempo máximo: ${this.testResults.maxResponseTime}ms`);
        }
        
        // Análise de memória
        if (this.testResults.memoryUsage.length > 0) {
            console.log('\n💾 ANÁLISE DE MEMÓRIA:');
            const maxMemory = Math.max(...this.testResults.memoryUsage.map(m => m.heapUsed));
            const minMemory = Math.min(...this.testResults.memoryUsage.map(m => m.heapUsed));
            console.log(`   📈 Pico de memória: ${maxMemory}MB`);
            console.log(`   📉 Mínimo de memória: ${minMemory}MB`);
            console.log(`   📊 Variação: ${maxMemory - minMemory}MB`);
        }
        
        // Análise de erros
        if (this.testResults.errors.length > 0) {
            console.log('\n🚨 ANÁLISE DE ERROS:');
            const errorTypes = {};
            this.testResults.errors.forEach(error => {
                const type = error.error.split(':')[0];
                errorTypes[type] = (errorTypes[type] || 0) + 1;
            });
            
            Object.entries(errorTypes).forEach(([type, count]) => {
                console.log(`   • ${type}: ${count} ocorrências`);
            });
        }
        
        // Avaliação geral
        console.log('\n🎯 AVALIAÇÃO GERAL:');
        const successRate = this.testResults.totalRequests > 0 ? 
            (this.testResults.successfulRequests / this.testResults.totalRequests * 100) : 0;
        
        if (successRate >= 95 && avgResponseTime < 1000) {
            console.log('🏆 EXCELENTE - Sistema passou em todos os testes com performance excepcional!');
        } else if (successRate >= 85 && avgResponseTime < 2000) {
            console.log('✅ BOM - Sistema estável e confiável sob estresse');
        } else if (successRate >= 70) {
            console.log('⚠️ ACEITÁVEL - Sistema funcional mas com limitações');
        } else {
            console.log('🚨 CRÍTICO - Sistema precisa de otimizações urgentes');
        }
        
        // Salvar relatório
        await this.salvarRelatorio();
    }
    
    /**
     * Salvar relatório em arquivo
     */
    async salvarRelatorio() {
        try {
            const fs = require('fs');
            const relatorio = {
                timestamp: new Date().toISOString(),
                duracao: this.testResults.endTime - this.testResults.startTime,
                estatisticas: this.testResults,
                sistema: 'CoinBitClub Dynamic System',
                versao: '2.0'
            };
            
            const filename = `stress-test-report-${Date.now()}.json`;
            fs.writeFileSync(filename, JSON.stringify(relatorio, null, 2));
            
            console.log(`📄 Relatório salvo: ${filename}`);
            
        } catch (error) {
            console.log('⚠️ Erro ao salvar relatório:', error.message);
        }
    }
    
    /**
     * Função auxiliar de sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Executar teste de estresse
async function executarTesteEstresse() {
    const stressTest = new StressTestCoinBitClub();
    
    console.log('⚠️ IMPORTANTE: Certifique-se de que o sistema dinâmico está rodando!');
    console.log('   Execute: node final-dynamic-system.js em outro terminal');
    console.log('');
    console.log('⏰ Aguardando 5 segundos para iniciar teste...');
    
    await stressTest.sleep(5000);
    
    try {
        await stressTest.executarTestesCompletos();
    } catch (error) {
        console.error('❌ Erro durante teste de estresse:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executarTesteEstresse().catch(console.error);
}

module.exports = {
    StressTestCoinBitClub
};
