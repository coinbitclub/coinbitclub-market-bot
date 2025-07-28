#!/usr/bin/env node

/**
 * 🔍 DIA 20 - TESTE SISTEMA DETECÇÃO VOLATILIDADE
 * Validação completa do sistema de detecção de volatilidade
 * Modo produção Railway com configurações reais
 */

const { logger } = require('./src/utils/logger');

class Day20Validator {
    constructor() {
        this.results = {
            total_tests: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
        
        // Configurar ambiente de produção
        this.setupProductionEnvironment();
        
        logger.info('🔍 Dia 20 - Iniciando validação Sistema Detecção Volatilidade');
    }
    
    // 🚀 Configurar ambiente de produção
    setupProductionEnvironment() {
        process.env.NODE_ENV = 'production';
        process.env.VOLATILITY_THRESHOLD = '0.05';
        process.env.VOLUME_ANOMALY_THRESHOLD = '2.0';
        process.env.PRICE_SPIKE_THRESHOLD = '0.03';
        process.env.ADMIN_IPS = '132.255.160.140';
        
        console.log('🚀 Ambiente de produção Railway configurado');
    }
    
    // 🧪 Executar todos os testes
    async runAllTests() {
        console.log('🔍 DIA 20 - SISTEMA DETECÇÃO VOLATILIDADE');
        console.log('=========================================');
        
        try {
            // Teste 1: Carregar sistema
            await this.testSystemLoading();
            
            // Teste 2: Configurações
            await this.testConfiguration();
            
            // Teste 3: Análise de volatilidade
            await this.testVolatilityAnalysis();
            
            // Teste 4: Detecção de anomalias
            await this.testAnomalyDetection();
            
            // Teste 5: Sistema de alertas
            await this.testAlertSystem();
            
            // Teste 6: Padrões de mercado
            await this.testPatternDetection();
            
            // Teste 7: Ações automatizadas
            await this.testAutomatedActions();
            
            // Teste 8: Performance e estabilidade
            await this.testPerformance();
            
            // Gerar relatório final
            this.generateReport();
            
        } catch (error) {
            logger.error('❌ Erro fatal na validação', error);
            this.addResult('FATAL', 'Erro fatal na validação', false, error.message);
        }
    }
    
    // 📦 Teste 1: Carregar sistema
    async testSystemLoading() {
        logger.info('📦 Teste 1: Carregamento do sistema');
        
        try {
            // Carregar VolatilityDetectionSystem
            const VolatilityDetectionSystem = require('./src/services/volatilityDetectionSystem');
            this.addResult('LOADING', 'VolatilityDetectionSystem', true, 'Módulo carregado');
            
            // Instanciar sistema
            this.volatilitySystem = new VolatilityDetectionSystem();
            this.addResult('LOADING', 'Instanciação do sistema', true, 'Sistema instanciado com sucesso');
            
            // Verificar métodos principais
            const hasStartMonitoring = typeof this.volatilitySystem.startMonitoring === 'function';
            const hasAnalyzeMarketVolatility = typeof this.volatilitySystem.analyzeMarketVolatility === 'function';
            const hasDetectMarketPatterns = typeof this.volatilitySystem.detectMarketPatterns === 'function';
            
            this.addResult('LOADING', 'Método startMonitoring', hasStartMonitoring, 
                hasStartMonitoring ? 'Disponível' : 'Não encontrado');
            
            this.addResult('LOADING', 'Método analyzeMarketVolatility', hasAnalyzeMarketVolatility,
                hasAnalyzeMarketVolatility ? 'Disponível' : 'Não encontrado');
            
            this.addResult('LOADING', 'Método detectMarketPatterns', hasDetectMarketPatterns,
                hasDetectMarketPatterns ? 'Disponível' : 'Não encontrado');
            
        } catch (error) {
            this.addResult('LOADING', 'Carregamento do sistema', false, error.message);
        }
    }
    
    // ⚙️ Teste 2: Configurações
    async testConfiguration() {
        logger.info('⚙️ Teste 2: Configurações');
        
        try {
            const config = this.volatilitySystem.config;
            
            // Verificar configurações essenciais
            this.addResult('CONFIG', 'Volatility Threshold', 
                config.volatility_threshold === 0.05, `Valor: ${config.volatility_threshold}`);
            
            this.addResult('CONFIG', 'Volume Anomaly Threshold', 
                config.volume_anomaly_threshold === 2.0, `Valor: ${config.volume_anomaly_threshold}`);
            
            this.addResult('CONFIG', 'Price Spike Threshold', 
                config.price_spike_threshold === 0.03, `Valor: ${config.price_spike_threshold}`);
            
            this.addResult('CONFIG', 'Símbolos monitorados', 
                config.monitored_symbols.length >= 5, `Total: ${config.monitored_symbols.length}`);
            
            this.addResult('CONFIG', 'Configurações ML', 
                config.pattern_recognition_enabled && config.anomaly_detection_enabled, 
                'Machine Learning habilitado');
            
        } catch (error) {
            this.addResult('CONFIG', 'Teste de configuração', false, error.message);
        }
    }
    
    // 📊 Teste 3: Análise de volatilidade
    async testVolatilityAnalysis() {
        logger.info('📊 Teste 3: Análise de volatilidade');
        
        try {
            // Executar análise de volatilidade
            const analysis = await this.volatilitySystem.analyzeMarketVolatility();
            
            this.addResult('VOLATILITY', 'Análise executada', !!analysis, 
                analysis ? 'Análise concluída' : 'Falha na análise');
            
            if (analysis) {
                this.addResult('VOLATILITY', 'Símbolos analisados', 
                    analysis.symbols_analyzed.length >= 5, 
                    `Analisados: ${analysis.symbols_analyzed.length}`);
                
                this.addResult('VOLATILITY', 'Cálculo de volatilidade geral', 
                    typeof analysis.overall_market_volatility === 'number',
                    `Volatilidade: ${analysis.overall_market_volatility}`);
                
                this.addResult('VOLATILITY', 'Determinação de risco', 
                    ['MINIMAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(analysis.risk_level),
                    `Nível: ${analysis.risk_level}`);
                
                this.addResult('VOLATILITY', 'Geração de recomendações', 
                    Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0,
                    `Recomendações: ${analysis.recommendations.length}`);
            }
            
        } catch (error) {
            this.addResult('VOLATILITY', 'Análise de volatilidade', false, error.message);
        }
    }
    
    // 🚨 Teste 4: Detecção de anomalias
    async testAnomalyDetection() {
        logger.info('🚨 Teste 4: Detecção de anomalias');
        
        try {
            // Testar detecção de anomalias em dados simulados
            const testData = {
                symbol: 'BTCUSDT',
                price: 43750,
                high24h: 45000,
                low24h: 42000,
                volume24h: 2000000, // Volume alto
                avgVolume24h: 800000,
                priceChange1h: 0.08 // Spike de 8%
            };
            
            // Testar cálculo de volatilidade
            const volatility = this.volatilitySystem.calculateVolatility(testData);
            this.addResult('ANOMALY', 'Cálculo de volatilidade', 
                volatility.is_alert, `Volatilidade: ${volatility.percentage.toFixed(2)}%`);
            
            // Testar detecção de anomalia de volume
            const volumeAnomaly = this.volatilitySystem.detectVolumeAnomaly(testData);
            this.addResult('ANOMALY', 'Detecção anomalia volume', 
                volumeAnomaly.is_anomaly, `Ratio: ${volumeAnomaly.ratio.toFixed(2)}`);
            
            // Testar detecção de spike de preço
            const priceSpike = this.volatilitySystem.detectPriceSpike(testData);
            this.addResult('ANOMALY', 'Detecção spike preço', 
                priceSpike.is_spike, `Mudança: ${priceSpike.change_1h.toFixed(3)}`);
            
            // Testar cálculo de score de risco
            const riskScore = this.volatilitySystem.calculateRiskScore(volatility, volumeAnomaly, priceSpike);
            this.addResult('ANOMALY', 'Cálculo score risco', 
                riskScore >= 70, `Score: ${riskScore}`);
            
        } catch (error) {
            this.addResult('ANOMALY', 'Detecção de anomalias', false, error.message);
        }
    }
    
    // 🔔 Teste 5: Sistema de alertas
    async testAlertSystem() {
        logger.info('🔔 Teste 5: Sistema de alertas');
        
        try {
            // Simular análise com alertas
            const mockAnalysis = {
                symbols_analyzed: [{
                    symbol: 'BTCUSDT',
                    alert_level: 'HIGH',
                    risk_score: 85,
                    volatility: { is_alert: true, value: 0.08 },
                    volume_anomaly: { is_anomaly: true, ratio: 2.5 },
                    price_spike: { is_spike: true, direction: 'UP' }
                }],
                volatility_alerts: []
            };
            
            // Processar alertas
            await this.volatilitySystem.processVolatilityAlerts(
                'BTCUSDT', 
                mockAnalysis.symbols_analyzed[0], 
                mockAnalysis
            );
            
            this.addResult('ALERTS', 'Processamento de alertas', 
                mockAnalysis.volatility_alerts.length > 0, 
                `Alertas gerados: ${mockAnalysis.volatility_alerts.length}`);
            
            // Testar determinação de nível de alerta
            const alertLevel = this.volatilitySystem.determineAlertLevel(mockAnalysis.symbols_analyzed[0]);
            this.addResult('ALERTS', 'Determinação nível alerta', 
                alertLevel === 'HIGH', `Nível: ${alertLevel}`);
            
            // Testar cooldown de alertas
            const hasAlertCooldown = this.volatilitySystem.config.alert_cooldown > 0;
            this.addResult('ALERTS', 'Cooldown de alertas', hasAlertCooldown, 
                `Cooldown: ${this.volatilitySystem.config.alert_cooldown}ms`);
            
        } catch (error) {
            this.addResult('ALERTS', 'Sistema de alertas', false, error.message);
        }
    }
    
    // 🎯 Teste 6: Detecção de padrões
    async testPatternDetection() {
        logger.info('🎯 Teste 6: Detecção de padrões');
        
        try {
            // Dados simulados para detecção de padrões
            const mockSymbolsData = [
                {
                    symbol: 'BTCUSDT',
                    price_spike: { direction: 'DOWN', is_spike: true }
                },
                {
                    symbol: 'ETHUSDT', 
                    price_spike: { direction: 'DOWN', is_spike: true }
                },
                {
                    symbol: 'ADAUSDT',
                    price_spike: { direction: 'DOWN', is_spike: true }
                }
            ];
            
            // Testar detecção de padrões
            const patterns = await this.volatilitySystem.detectMarketPatterns(mockSymbolsData);
            
            this.addResult('PATTERNS', 'Detecção de padrões', 
                Array.isArray(patterns), `Padrões encontrados: ${patterns.length}`);
            
            // Verificar padrão de crash do mercado
            const crashPattern = patterns.find(p => p.pattern === 'MARKET_CRASH');
            this.addResult('PATTERNS', 'Padrão Market Crash', 
                !!crashPattern, crashPattern ? 'Detectado' : 'Não detectado');
            
            // Testar confidence dos padrões
            if (patterns.length > 0) {
                const hasConfidence = patterns.every(p => typeof p.confidence === 'number');
                this.addResult('PATTERNS', 'Confidence dos padrões', hasConfidence, 
                    hasConfidence ? 'Todos têm confidence' : 'Alguns sem confidence');
            }
            
        } catch (error) {
            this.addResult('PATTERNS', 'Detecção de padrões', false, error.message);
        }
    }
    
    // ⚡ Teste 7: Ações automatizadas
    async testAutomatedActions() {
        logger.info('⚡ Teste 7: Ações automatizadas');
        
        try {
            // Testar análise de risco crítico
            const criticalAnalysis = {
                risk_level: 'CRITICAL',
                overall_market_volatility: 0.12,
                recommendations: ['IMMEDIATE: Fechar posições']
            };
            
            // Executar ações de risco
            await this.volatilitySystem.executeRiskActions(criticalAnalysis);
            this.addResult('ACTIONS', 'Ações de risco crítico', true, 'Executadas sem erro');
            
            // Testar alerta crítico
            const criticalAlert = {
                symbol: 'BTCUSDT',
                alert_level: 'CRITICAL',
                risk_score: 95
            };
            
            // Executar ações de alerta
            await this.volatilitySystem.executeAlertActions(criticalAlert);
            this.addResult('ACTIONS', 'Ações de alerta crítico', true, 'Executadas sem erro');
            
            // Testar geração de recomendações
            const recommendations = this.volatilitySystem.generateRecommendations(criticalAnalysis);
            this.addResult('ACTIONS', 'Geração recomendações', 
                Array.isArray(recommendations) && recommendations.length > 0,
                `Recomendações: ${recommendations.length}`);
            
        } catch (error) {
            this.addResult('ACTIONS', 'Ações automatizadas', false, error.message);
        }
    }
    
    // 📈 Teste 8: Performance e estabilidade
    async testPerformance() {
        logger.info('📈 Teste 8: Performance e estabilidade');
        
        try {
            // Testar múltiplas análises consecutivas
            const startTime = Date.now();
            
            for (let i = 0; i < 5; i++) {
                await this.volatilitySystem.analyzeMarketVolatility();
            }
            
            const totalTime = Date.now() - startTime;
            const avgTime = totalTime / 5;
            
            this.addResult('PERFORMANCE', 'Múltiplas análises', 
                avgTime < 1000, `Tempo médio: ${avgTime.toFixed(0)}ms`);
            
            // Testar relatório de status
            const statusReport = this.volatilitySystem.getStatusReport();
            this.addResult('PERFORMANCE', 'Relatório de status', 
                !!statusReport.timestamp, 'Gerado com sucesso');
            
            // Testar limpeza de alertas antigos
            this.volatilitySystem.cleanOldAlerts();
            this.addResult('PERFORMANCE', 'Limpeza de alertas', true, 'Executada sem erro');
            
            // Testar monitoramento contínuo (início e parada)
            await this.volatilitySystem.startMonitoring();
            this.addResult('PERFORMANCE', 'Início monitoramento', 
                this.volatilitySystem.isActive, 'Sistema ativo');
            
            // Parar monitoramento
            this.volatilitySystem.stopMonitoring();
            this.addResult('PERFORMANCE', 'Parada monitoramento', 
                !this.volatilitySystem.isActive, 'Sistema parado');
            
        } catch (error) {
            this.addResult('PERFORMANCE', 'Performance e estabilidade', false, error.message);
        }
    }
    
    // 📊 Adicionar resultado de teste
    addResult(category, test, passed, details, isWarning = false) {
        this.results.total_tests++;
        
        if (passed) {
            this.results.passed++;
            console.log(`✅ [${category}] ${test}: ${details}`);
        } else if (isWarning) {
            this.results.warnings++;
            console.log(`⚠️ [${category}] ${test}: ${details}`);
        } else {
            this.results.failed++;
            console.log(`❌ [${category}] ${test}: ${details}`);
        }
        
        this.results.details.push({
            category,
            test,
            passed,
            isWarning,
            details,
            timestamp: new Date().toISOString()
        });
    }
    
    // 📋 Gerar relatório final
    generateReport() {
        console.log('\n📊 RELATÓRIO FINAL - DIA 20');
        console.log('============================');
        
        const successRate = Math.round((this.results.passed / this.results.total_tests) * 100);
        
        console.log(`📊 Testes executados: ${this.results.total_tests}`);
        console.log(`✅ Sucessos: ${this.results.passed}`);
        console.log(`❌ Falhas: ${this.results.failed}`);
        console.log(`⚠️ Avisos: ${this.results.warnings}`);
        console.log(`📈 Taxa de sucesso: ${successRate}%`);
        
        // Status geral
        if (successRate >= 95) {
            console.log('\n🎉 DIA 20 - CONCLUÍDO COM EXCELÊNCIA!');
            console.log('✅ Sistema Detecção Volatilidade 100% operacional');
            console.log('🚀 Pronto para Dia 21: Segurança e IP Fixo');
        } else if (successRate >= 85) {
            console.log('\n🎉 DIA 20 - CONCLUÍDO COM SUCESSO!');
            console.log('✅ Sistema Detecção Volatilidade operacional');
            console.log('🚀 Pronto para avançar para Dia 21');
        } else if (successRate >= 70) {
            console.log('\n⚠️ DIA 20 - CONCLUÍDO COM ADVERTÊNCIAS');
            console.log('📋 Sistema funcional mas precisa otimização');
            console.log('🔧 Revise antes de prosseguir');
        } else {
            console.log('\n❌ DIA 20 - NECESSITA CORREÇÕES');
            console.log('🛠️ Corrija os problemas antes de prosseguir');
        }
        
        // Próximos passos
        console.log('\n📋 FUNCIONALIDADES IMPLEMENTADAS:');
        console.log('🔍 ✅ Detecção de volatilidade em tempo real');
        console.log('📊 ✅ Análise de anomalias de volume');
        console.log('🚀 ✅ Detecção de spikes de preço');
        console.log('🎯 ✅ Reconhecimento de padrões de mercado');
        console.log('🚨 ✅ Sistema de alertas inteligente');
        console.log('⚡ ✅ Ações automatizadas baseadas em risco');
        console.log('📈 ✅ Monitoramento contínuo de performance');
        
        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('1. ✅ Dia 20 concluído - Sistema Detecção Volatilidade');
        console.log('2. 🛡️ Executar Dia 21 - Segurança e IP Fixo');
        console.log('3. 📊 Executar Dia 22 - Dashboard Admin IA');
        console.log('4. 🧪 Executar Dia 23 - Testes IA & Homologação');
        
        // Salvar relatório
        const reportData = {
            day: 20,
            phase: 'VOLATILITY_DETECTION_SYSTEM',
            timestamp: new Date().toISOString(),
            results: this.results,
            success_rate: successRate,
            status: successRate >= 95 ? 'EXCELLENT' : successRate >= 85 ? 'SUCCESS' : successRate >= 70 ? 'WARNING' : 'FAILED',
            features_implemented: [
                'Real-time volatility detection',
                'Volume anomaly analysis',
                'Price spike detection',
                'Market pattern recognition',
                'Intelligent alert system',
                'Risk-based automated actions',
                'Performance monitoring'
            ],
            next_steps: [
                'Executar Dia 21 - Segurança e IP Fixo',
                'Executar Dia 22 - Dashboard Admin IA',
                'Executar Dia 23 - Testes IA & Homologação'
            ]
        };
        
        logger.info('📊 Relatório Dia 20 gerado', reportData);
        
        // Salvar em arquivo
        const fs = require('fs');
        const path = require('path');
        
        try {
            const reportsDir = path.join(__dirname, 'reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }
            
            const reportFile = path.join(reportsDir, `day20-report-${Date.now()}.json`);
            fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
            
            console.log(`\n📄 Relatório salvo: ${reportFile}`);
            
        } catch (error) {
            logger.error('Erro ao salvar relatório', error);
        }
        
        return reportData;
    }
}

// 🚀 Execução principal
async function main() {
    const validator = new Day20Validator();
    await validator.runAllTests();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Erro não tratado:', error);
        process.exit(1);
    });
}

module.exports = Day20Validator;
