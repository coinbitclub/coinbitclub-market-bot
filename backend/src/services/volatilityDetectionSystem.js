#!/usr/bin/env node

/**
 * 🔍 DIA 20 - SISTEMA DETECÇÃO VOLATILIDADE
 * Sistema avançado de detecção de volatilidade de mercado
 * Conforme especificação seção 8 - Detecção de Volatilidade
 */

const { logger } = require('../utils/logger');

class VolatilityDetectionSystem {
    constructor() {
        this.config = {
            // Thresholds de volatilidade
            volatility_threshold: parseFloat(process.env.VOLATILITY_THRESHOLD) || 0.05, // 5%
            volume_anomaly_threshold: parseFloat(process.env.VOLUME_ANOMALY_THRESHOLD) || 2.0,
            price_spike_threshold: parseFloat(process.env.PRICE_SPIKE_THRESHOLD) || 0.03, // 3%
            
            // Configurações de análise
            analysis_window: 300000, // 5 minutos
            historical_periods: 24, // 24 períodos históricos
            min_volume_threshold: 100000, // Volume mínimo para análise
            
            // Configurações de alertas
            alert_cooldown: 600000, // 10 minutos entre alertas
            max_alerts_per_hour: 5,
            
            // Mercados monitorados
            monitored_symbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT'],
            
            // Configurações de machine learning
            ml_confidence_threshold: 0.75,
            pattern_recognition_enabled: true,
            anomaly_detection_enabled: true
        };
        
        this.alerts = new Map(); // Cache de alertas
        this.historical_data = new Map(); // Cache de dados históricos
        this.patterns = new Map(); // Cache de padrões detectados
        
        // Inicializar componentes especializados
        this.marketAnalyzer = new MarketAnalyzer();
        this.riskCalculator = new RiskCalculator();
        this.patternDetector = new PatternDetector();
        this.alertSystem = new AlertSystem();
        
        this.data_cache = new Map();
        this.alerts_generated = 0;
        this.patterns_detected = 0;
        
        this.isActive = false;
        this.lastAnalysis = null;
        
        logger.aiLog('VolatilityDetection', 'Sistema inicializado', this.config);
        console.log('🔍 Sistema Detecção Volatilidade iniciado');
    }
    
    // 🔄 Iniciar monitoramento contínuo
    async startMonitoring() {
        if (this.isActive) {
            logger.warn('Sistema já está ativo');
            return;
        }
        
        this.isActive = true;
        logger.aiLog('VolatilityDetection', 'Monitoramento iniciado');
        
        console.log('🔄 Iniciando monitoramento de volatilidade...');
        
        // Loop principal de monitoramento
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.analyzeMarketVolatility();
            } catch (error) {
                logger.error('Erro no ciclo de monitoramento', error);
            }
        }, this.config.analysis_window);
        
        // Primeira análise imediata
        await this.analyzeMarketVolatility();
        
        console.log('✅ Monitoramento de volatilidade ativo');
    }
    
    // 🛑 Parar monitoramento
    stopMonitoring() {
        if (!this.isActive) {
            return;
        }
        
        this.isActive = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        logger.aiLog('VolatilityDetection', 'Monitoramento parado');
        console.log('🛑 Monitoramento de volatilidade parado');
    }
    
    // 📊 Análise principal de volatilidade
    async analyzeMarketVolatility() {
        try {
            const analysisStartTime = Date.now();
            
            logger.debug('Iniciando análise de volatilidade');
            
            const analysis = {
                timestamp: new Date().toISOString(),
                analysis_id: `vol_${analysisStartTime}`,
                symbols_analyzed: [],
                volatility_alerts: [],
                volume_anomalies: [],
                price_spikes: [],
                patterns_detected: [],
                overall_market_volatility: 0,
                risk_level: 'LOW',
                recommendations: []
            };
            
            // Analisar cada símbolo monitorado
            for (const symbol of this.config.monitored_symbols) {
                const symbolAnalysis = await this.analyzeSymbolVolatility(symbol);
                analysis.symbols_analyzed.push(symbolAnalysis);
                
                // Processar alertas baseados na análise
                await this.processVolatilityAlerts(symbol, symbolAnalysis, analysis);
            }
            
            // Calcular volatilidade geral do mercado
            analysis.overall_market_volatility = this.calculateOverallVolatility(analysis.symbols_analyzed);
            analysis.risk_level = this.determineRiskLevel(analysis.overall_market_volatility);
            
            // Gerar recomendações
            analysis.recommendations = this.generateRecommendations(analysis);
            
            // Detecção de padrões avançados
            if (this.config.pattern_recognition_enabled) {
                analysis.patterns_detected = await this.detectMarketPatterns(analysis.symbols_analyzed);
            }
            
            // Salvar análise
            this.lastAnalysis = analysis;
            
            // Log da análise
            logger.aiLog('VolatilityDetection', 'Análise concluída', {
                symbols_count: analysis.symbols_analyzed.length,
                alerts_count: analysis.volatility_alerts.length,
                risk_level: analysis.risk_level,
                overall_volatility: analysis.overall_market_volatility
            });
            
            // Executar ações baseadas no nível de risco
            await this.executeRiskActions(analysis);
            
            const analysisTime = Date.now() - analysisStartTime;
            console.log(`📊 Análise concluída em ${analysisTime}ms - Risco: ${analysis.risk_level}`);
            
            return analysis;
            
        } catch (error) {
            logger.error('Erro na análise de volatilidade', error);
            throw error;
        }
    }
    
    // 📈 Analisar volatilidade de um símbolo específico
    async analyzeSymbolVolatility(symbol) {
        try {
            // Obter dados de mercado (simulado)
            const marketData = await this.getMarketData(symbol);
            
            // Calcular métricas de volatilidade
            const volatility = this.calculateVolatility(marketData);
            const volumeAnomaly = this.detectVolumeAnomaly(marketData);
            const priceSpike = this.detectPriceSpike(marketData);
            
            // Análise técnica avançada
            const technicalIndicators = this.calculateTechnicalIndicators(marketData);
            
            const symbolAnalysis = {
                symbol: symbol,
                timestamp: new Date().toISOString(),
                current_price: marketData.price,
                price_change_1h: marketData.priceChange1h,
                price_change_24h: marketData.priceChange24h,
                volume_24h: marketData.volume24h,
                volatility: volatility,
                volume_anomaly: volumeAnomaly,
                price_spike: priceSpike,
                technical_indicators: technicalIndicators,
                risk_score: this.calculateRiskScore(volatility, volumeAnomaly, priceSpike),
                alert_level: 'NONE'
            };
            
            // Determinar nível de alerta
            symbolAnalysis.alert_level = this.determineAlertLevel(symbolAnalysis);
            
            // Atualizar dados históricos
            this.updateHistoricalData(symbol, symbolAnalysis);
            
            return symbolAnalysis;
            
        } catch (error) {
            logger.error(`Erro na análise de ${symbol}`, error);
            return null;
        }
    }
    
    // 💹 Obter dados de mercado (simulado - integrar com exchange real)
    async getMarketData(symbol) {
        // Simular dados de mercado realistas
        const basePrice = this.getBasePrice(symbol);
        const volatilityFactor = (Math.random() - 0.5) * 0.1; // -5% a +5%
        
        return {
            symbol: symbol,
            price: basePrice * (1 + volatilityFactor),
            priceChange1h: volatilityFactor * 0.3,
            priceChange24h: volatilityFactor,
            volume24h: Math.random() * 1000000 + 500000,
            avgVolume24h: 800000,
            high24h: basePrice * (1 + Math.abs(volatilityFactor)),
            low24h: basePrice * (1 - Math.abs(volatilityFactor)),
            timestamp: Date.now(),
            trades24h: Math.floor(Math.random() * 50000) + 10000
        };
    }
    
    // 📊 Obter preço base do símbolo
    getBasePrice(symbol) {
        const basePrices = {
            'BTCUSDT': 43750.00,
            'ETHUSDT': 2630.00,
            'ADAUSDT': 0.485,
            'SOLUSDT': 102.50,
            'DOGEUSDT': 0.085
        };
        
        return basePrices[symbol] || 1.0;
    }
    
    // 📈 Calcular volatilidade
    calculateVolatility(marketData) {
        const priceRange = marketData.high24h - marketData.low24h;
        const volatility = priceRange / marketData.price;
        
        return {
            value: volatility,
            percentage: volatility * 100,
            level: volatility > this.config.volatility_threshold ? 'HIGH' : 'NORMAL',
            is_alert: volatility > this.config.volatility_threshold
        };
    }
    
    // 📊 Detectar anomalia de volume
    detectVolumeAnomaly(marketData) {
        const volumeRatio = marketData.volume24h / marketData.avgVolume24h;
        
        return {
            ratio: volumeRatio,
            is_anomaly: volumeRatio > this.config.volume_anomaly_threshold,
            level: volumeRatio > this.config.volume_anomaly_threshold ? 'HIGH' : 'NORMAL',
            volume_current: marketData.volume24h,
            volume_average: marketData.avgVolume24h
        };
    }
    
    // 🚀 Detectar spike de preço
    detectPriceSpike(marketData) {
        const absChange1h = Math.abs(marketData.priceChange1h);
        
        return {
            change_1h: marketData.priceChange1h,
            abs_change_1h: absChange1h,
            is_spike: absChange1h > this.config.price_spike_threshold,
            level: absChange1h > this.config.price_spike_threshold ? 'HIGH' : 'NORMAL',
            direction: marketData.priceChange1h > 0 ? 'UP' : 'DOWN'
        };
    }
    
    // 📊 Calcular indicadores técnicos
    calculateTechnicalIndicators(marketData) {
        // Simulação de indicadores técnicos (RSI, MACD, etc.)
        return {
            rsi: Math.random() * 100,
            macd: (Math.random() - 0.5) * 2,
            bollinger_position: Math.random(),
            moving_average_trend: Math.random() > 0.5 ? 'UP' : 'DOWN',
            support_level: marketData.low24h * 0.98,
            resistance_level: marketData.high24h * 1.02
        };
    }
    
    // 🎯 Calcular score de risco
    calculateRiskScore(volatility, volumeAnomaly, priceSpike) {
        let score = 0;
        
        // Peso da volatilidade (40%)
        if (volatility.is_alert) score += 40;
        
        // Peso da anomalia de volume (30%)
        if (volumeAnomaly.is_anomaly) score += 30;
        
        // Peso do spike de preço (30%)
        if (priceSpike.is_spike) score += 30;
        
        return Math.min(score, 100);
    }
    
    // 🚨 Determinar nível de alerta
    determineAlertLevel(symbolAnalysis) {
        const riskScore = symbolAnalysis.risk_score;
        
        if (riskScore >= 70) return 'CRITICAL';
        if (riskScore >= 50) return 'HIGH';
        if (riskScore >= 30) return 'MEDIUM';
        if (riskScore >= 15) return 'LOW';
        
        return 'NONE';
    }
    
    // 📊 Calcular volatilidade geral do mercado
    calculateOverallVolatility(symbolsAnalyzed) {
        if (!symbolsAnalyzed || symbolsAnalyzed.length === 0) return 0;
        
        const totalVolatility = symbolsAnalyzed
            .filter(s => s && s.volatility)
            .reduce((sum, s) => sum + s.volatility.value, 0);
        
        return totalVolatility / symbolsAnalyzed.length;
    }
    
    // 🎯 Determinar nível de risco do mercado
    determineRiskLevel(overallVolatility) {
        if (overallVolatility >= 0.08) return 'CRITICAL';
        if (overallVolatility >= 0.05) return 'HIGH';
        if (overallVolatility >= 0.03) return 'MEDIUM';
        if (overallVolatility >= 0.01) return 'LOW';
        
        return 'MINIMAL';
    }
    
    // 💡 Gerar recomendações
    generateRecommendations(analysis) {
        const recommendations = [];
        
        // Recomendações baseadas no nível de risco
        switch (analysis.risk_level) {
            case 'CRITICAL':
                recommendations.push('IMMEDIATE: Considere fechar todas as posições');
                recommendations.push('STOP: Pare novas ordens até estabilização');
                recommendations.push('MONITOR: Monitore continuamente por 1 hora');
                break;
                
            case 'HIGH':
                recommendations.push('CAUTION: Reduza exposição do portfólio');
                recommendations.push('LIMIT: Limite novas posições a 25% do normal');
                recommendations.push('TIGHT: Use stop-loss mais apertados');
                break;
                
            case 'MEDIUM':
                recommendations.push('WATCH: Monitore posições abertas');
                recommendations.push('ADJUST: Ajuste estratégias conforme volatilidade');
                break;
                
            case 'LOW':
                recommendations.push('NORMAL: Operação normal com cautela');
                break;
                
            default:
                recommendations.push('OPTIMAL: Condições favoráveis para trading');
        }
        
        // Recomendações específicas por alertas
        const criticalAlerts = analysis.symbols_analyzed.filter(s => s && s.alert_level === 'CRITICAL');
        if (criticalAlerts.length > 0) {
            recommendations.push(`CRITICAL SYMBOLS: ${criticalAlerts.map(s => s.symbol).join(', ')}`);
        }
        
        return recommendations;
    }
    
    // 🎯 Detectar padrões de mercado
    async detectMarketPatterns(symbolsAnalyzed) {
        const patterns = [];
        
        try {
            // Padrão: Crash simultâneo
            const crashSymbols = symbolsAnalyzed.filter(s => 
                s && s.price_spike && s.price_spike.direction === 'DOWN' && s.price_spike.is_spike
            );
            
            if (crashSymbols.length >= 3) {
                patterns.push({
                    pattern: 'MARKET_CRASH',
                    confidence: 0.9,
                    symbols: crashSymbols.map(s => s.symbol),
                    description: 'Queda simultânea detectada em múltiplos ativos'
                });
            }
            
            // Padrão: Rally simultâneo
            const rallySymbols = symbolsAnalyzed.filter(s => 
                s && s.price_spike && s.price_spike.direction === 'UP' && s.price_spike.is_spike
            );
            
            if (rallySymbols.length >= 3) {
                patterns.push({
                    pattern: 'MARKET_RALLY',
                    confidence: 0.85,
                    symbols: rallySymbols.map(s => s.symbol),
                    description: 'Alta simultânea detectada em múltiplos ativos'
                });
            }
            
            // Padrão: Divergência Bitcoin
            const btcAnalysis = symbolsAnalyzed.find(s => s && s.symbol === 'BTCUSDT');
            const altcoins = symbolsAnalyzed.filter(s => s && s.symbol !== 'BTCUSDT');
            
            if (btcAnalysis && altcoins.length > 0) {
                const btcDirection = btcAnalysis.price_spike ? btcAnalysis.price_spike.direction : 'NEUTRAL';
                const altcoinDirections = altcoins.map(s => s.price_spike ? s.price_spike.direction : 'NEUTRAL');
                
                const divergent = altcoinDirections.filter(dir => dir !== btcDirection && dir !== 'NEUTRAL');
                
                if (divergent.length >= 2) {
                    patterns.push({
                        pattern: 'BTC_DIVERGENCE',
                        confidence: 0.7,
                        description: `Bitcoin movendo ${btcDirection}, altcoins divergindo`,
                        btc_direction: btcDirection
                    });
                }
            }
            
        } catch (error) {
            logger.error('Erro na detecção de padrões', error);
        }
        
        return patterns;
    }
    
    // 🚨 Processar alertas de volatilidade
    async processVolatilityAlerts(symbol, symbolAnalysis, mainAnalysis) {
        if (!symbolAnalysis || symbolAnalysis.alert_level === 'NONE') {
            return;
        }
        
        try {
            // Verificar cooldown de alertas
            const lastAlert = this.alerts.get(symbol);
            const now = Date.now();
            
            if (lastAlert && (now - lastAlert.timestamp) < this.config.alert_cooldown) {
                return; // Still in cooldown
            }
            
            // Criar alerta
            const alert = {
                symbol: symbol,
                alert_level: symbolAnalysis.alert_level,
                risk_score: symbolAnalysis.risk_score,
                volatility: symbolAnalysis.volatility,
                volume_anomaly: symbolAnalysis.volume_anomaly,
                price_spike: symbolAnalysis.price_spike,
                timestamp: now,
                alert_id: `alert_${symbol}_${now}`
            };
            
            // Salvar alerta
            this.alerts.set(symbol, alert);
            mainAnalysis.volatility_alerts.push(alert);
            
            // Log do alerta
            logger.aiLog('VolatilityDetection', 'Alerta gerado', alert);
            
            // Executar ações do alerta
            await this.executeAlertActions(alert);
            
        } catch (error) {
            logger.error(`Erro ao processar alerta para ${symbol}`, error);
        }
    }
    
    // 🎬 Executar ações baseadas no nível de risco
    async executeRiskActions(analysis) {
        try {
            switch (analysis.risk_level) {
                case 'CRITICAL':
                    logger.aiLog('VolatilityDetection', 'Ação CRÍTICA iniciada');
                    // await this.pauseAllTrading();
                    // await this.notifyAdministrators('CRITICAL_VOLATILITY', analysis);
                    break;
                    
                case 'HIGH':
                    logger.aiLog('VolatilityDetection', 'Ação ALTA iniciada');
                    // await this.reduceTradingExposure();
                    // await this.notifyTraders('HIGH_VOLATILITY', analysis);
                    break;
                    
                case 'MEDIUM':
                    logger.aiLog('VolatilityDetection', 'Ação MÉDIA iniciada');
                    // await this.adjustTradingParameters();
                    break;
            }
            
        } catch (error) {
            logger.error('Erro ao executar ações de risco', error);
        }
    }
    
    // ⚡ Executar ações de alerta
    async executeAlertActions(alert) {
        try {
            console.log(`🚨 ALERTA ${alert.alert_level}: ${alert.symbol} - Risk Score: ${alert.risk_score}`);
            
            // Ações baseadas no nível de alerta
            switch (alert.alert_level) {
                case 'CRITICAL':
                    // await this.closePositions(alert.symbol);
                    // await this.sendEmergencyNotification(alert);
                    break;
                    
                case 'HIGH':
                    // await this.adjustStopLoss(alert.symbol);
                    // await this.sendHighPriorityAlert(alert);
                    break;
                    
                case 'MEDIUM':
                    // await this.sendNormalAlert(alert);
                    break;
            }
            
        } catch (error) {
            logger.error('Erro ao executar ações de alerta', error);
        }
    }
    
    // 📚 Atualizar dados históricos
    updateHistoricalData(symbol, analysis) {
        if (!this.historical_data.has(symbol)) {
            this.historical_data.set(symbol, []);
        }
        
        const history = this.historical_data.get(symbol);
        history.push(analysis);
        
        // Manter apenas os últimos N períodos
        if (history.length > this.config.historical_periods) {
            history.shift();
        }
    }
    
    // 📊 Obter relatório de status
    getStatusReport() {
        const now = new Date().toISOString();
        
        return {
            timestamp: now,
            is_active: this.isActive,
            last_analysis: this.lastAnalysis?.timestamp,
            monitored_symbols: this.config.monitored_symbols,
            active_alerts: Array.from(this.alerts.values()),
            config: this.config,
            historical_data_points: Array.from(this.historical_data.keys()).map(symbol => ({
                symbol: symbol,
                data_points: this.historical_data.get(symbol).length
            }))
        };
    }
    
    // 🧹 Limpar alertas antigos
    cleanOldAlerts() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 horas
        
        for (const [symbol, alert] of this.alerts.entries()) {
            if (alert.timestamp < cutoffTime) {
                this.alerts.delete(symbol);
            }
        }
        
        logger.debug('Alertas antigos removidos');
    }
}

/**
 * 🔍 Pattern Detector - Detecta padrões de volatilidade
 */
class PatternDetector {
    constructor() {
        this.patterns = {
            SPIKE: 'Spike de Preço',
            DROP: 'Queda Abrupta',
            ACCUMULATION: 'Acumulação',
            DISTRIBUTION: 'Distribuição',
            VOLATILITY_CLUSTER: 'Cluster de Volatilidade'
        };
    }

    detectPatterns(marketData) {
        const patterns = [];
        
        // Detectar spike de preço
        if (this.detectPriceSpike(marketData)) {
            patterns.push({
                type: this.patterns.SPIKE,
                confidence: 0.85,
                data: marketData
            });
        }
        
        // Detectar queda abrupta
        if (this.detectPriceDrop(marketData)) {
            patterns.push({
                type: this.patterns.DROP,
                confidence: 0.80,
                data: marketData
            });
        }
        
        // Detectar cluster de volatilidade
        if (this.detectVolatilityCluster(marketData)) {
            patterns.push({
                type: this.patterns.VOLATILITY_CLUSTER,
                confidence: 0.75,
                data: marketData
            });
        }
        
        return patterns;
    }

    detectPriceSpike(data) {
        return data.price_change_percent > 5;
    }

    detectPriceDrop(data) {
        return data.price_change_percent < -5;
    }

    detectVolatilityCluster(data) {
        return data.volatility > 0.08;
    }
}

/**
 * 🚨 Alert System - Sistema de alertas
 */
class AlertSystem {
    constructor() {
        this.alertCooldowns = new Map();
        this.alertsGenerated = 0;
    }

    generateAlert(alertData) {
        const alertKey = `${alertData.symbol}_${alertData.type}`;
        const now = Date.now();
        
        // Verificar cooldown
        if (this.alertCooldowns.has(alertKey)) {
            const lastAlert = this.alertCooldowns.get(alertKey);
            if (now - lastAlert < 600000) { // 10 minutos cooldown
                return null;
            }
        }
        
        const alert = {
            id: `alert_${Date.now()}`,
            type: alertData.type,
            symbol: alertData.symbol,
            message: alertData.message,
            severity: this.calculateSeverity(alertData),
            timestamp: new Date().toISOString(),
            data: alertData
        };
        
        this.alertCooldowns.set(alertKey, now);
        this.alertsGenerated++;
        
        console.log(`🚨 ALERTA: ${alert.message}`);
        
        return alert;
    }

    calculateSeverity(alertData) {
        if (alertData.volatility > 0.15) return 'CRITICAL';
        if (alertData.volatility > 0.10) return 'HIGH';
        if (alertData.volatility > 0.05) return 'MEDIUM';
        return 'LOW';
    }
}

module.exports = VolatilityDetectionSystem;
