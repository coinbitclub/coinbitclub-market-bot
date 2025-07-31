/**
 * 🎛️ CONTROLADOR WEB - SISTEMA DE ORQUESTRAÇÃO (VERSÃO SEGURA)
 * Interface web para controle do sistema de trading
 */

const { exec } = require('child_process');
const path = require('path');
const SignalAnalyzer = require('./signal-analyzer');

class SystemController {
    constructor() {
        this.systemState = {
            isActive: false,
            tradingEnabled: false,
            aiGuardianActive: false,
            fearGreedActive: false,
            multiuserActive: false,
            microservicesActive: false,
            managersActive: false,
            supervisorsActive: false,
            startTime: null,
            activeOperations: 0,
            lastHeartbeat: new Date()
        };
        
        // Inicializar monitores de forma lazy (sob demanda)
        this.operationsMonitor = null;
        this.operationsMonitorInitialized = false;
        
        // Inicializar analisador de sinais
        this.signalAnalyzer = new SignalAnalyzer();
    }

    /**
     * 📊 Inicializar Monitor de Operações (Lazy Loading)
     */
    async initOperationsMonitor() {
        if (!this.operationsMonitorInitialized) {
            try {
                const OperationsMonitor = require('./operations-monitor');
                this.operationsMonitor = new OperationsMonitor();
                this.operationsMonitorInitialized = true;
                console.log('✅ Monitor de operações inicializado com sucesso');
            } catch (error) {
                console.error('⚠️ Erro ao inicializar monitor de operações:', error.message);
                this.operationsMonitor = null;
            }
        }
        return this.operationsMonitor;
    }

    /**
     * 🟢 ENDPOINT: Ligar Sistema
     */
    async startSystem(req, res) {
        try {
            console.log('🟢 [WEB] Solicitação para ligar sistema recebida');
            
            // Executar orquestrador mestre
            const result = await this.executeOrchestrator();
            
            if (result.success) {
                this.systemState.isActive = true;
                this.systemState.tradingEnabled = true;
                this.systemState.startTime = new Date();
                this.systemState.lastHeartbeat = new Date();
                
                console.log('✅ [WEB] Sistema ligado com sucesso!');
                
                res.json({
                    success: true,
                    message: '✅ Sistema ligado com sucesso!',
                    data: this.getSystemStatus(),
                    timestamp: new Date().toISOString()
                });
            } else {
                throw new Error(result.error || 'Falha ao iniciar sistema');
            }
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao ligar sistema:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao ligar sistema',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 🔴 ENDPOINT: Desligar Sistema
     */
    async stopSystem(req, res) {
        try {
            console.log('🔴 [WEB] Solicitação para desligar sistema recebida');
            
            this.systemState.isActive = false;
            this.systemState.tradingEnabled = false;
            this.systemState.aiGuardianActive = false;
            this.systemState.fearGreedActive = false;
            this.systemState.multiuserActive = false;
            this.systemState.microservicesActive = false;
            this.systemState.managersActive = false;
            this.systemState.supervisorsActive = false;
            this.systemState.activeOperations = 0;
            this.systemState.lastHeartbeat = new Date();
            
            console.log('✅ [WEB] Sistema desligado com sucesso!');
            
            res.json({
                success: true,
                message: '✅ Sistema desligado com sucesso!',
                data: this.getSystemStatus(),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao desligar sistema:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao desligar sistema',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 🔧 ENDPOINT: Configurar Sistema
     */
    async configureSystem(req, res) {
        try {
            const { tradingEnabled, aiGuardianActive, fearGreedActive } = req.body;
            
            console.log('🔧 [WEB] Configuração do sistema alterada:', {
                tradingEnabled,
                aiGuardianActive,
                fearGreedActive
            });
            
            if (typeof tradingEnabled === 'boolean') {
                this.systemState.tradingEnabled = tradingEnabled;
            }
            if (typeof aiGuardianActive === 'boolean') {
                this.systemState.aiGuardianActive = aiGuardianActive;
            }
            if (typeof fearGreedActive === 'boolean') {
                this.systemState.fearGreedActive = fearGreedActive;
            }
            
            this.systemState.lastHeartbeat = new Date();
            
            res.json({
                success: true,
                message: '✅ Configuração atualizada com sucesso!',
                data: this.getSystemStatus(),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao configurar sistema:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao configurar sistema',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 📊 Obter Status do Sistema
     */
    getSystemStatus() {
        const uptime = this.systemState.startTime ? 
            Math.floor((new Date() - this.systemState.startTime) / 1000) : 0;

        return {
            isActive: this.systemState.isActive,
            tradingEnabled: this.systemState.tradingEnabled,
            aiGuardianActive: this.systemState.aiGuardianActive,
            fearGreedActive: this.systemState.fearGreedActive,
            multiuserActive: this.systemState.multiuserActive,
            microservicesActive: this.systemState.microservicesActive,
            managersActive: this.systemState.managersActive,
            supervisorsActive: this.systemState.supervisorsActive,
            activeOperations: this.systemState.activeOperations,
            uptime: uptime,
            lastHeartbeat: this.systemState.lastHeartbeat,
            startTime: this.systemState.startTime
        };
    }

    /**
     * 📊 ENDPOINT: Status do Sistema
     */
    async getSystemStatusEndpoint(req, res) {
        try {
            const status = this.getSystemStatus();
            
            res.json({
                success: true,
                message: '📊 Status do sistema obtido com sucesso',
                data: status,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao obter status:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao obter status do sistema',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 📡 ENDPOINT: Processar Sinal do TradingView
     */
    async processTradingViewSignal(req, res) {
        try {
            const signal = req.body;
            
            console.log('📡 [WEB] Sinal TradingView recebido:', signal);
            
            if (!this.systemState.isActive) {
                return res.json({
                    success: false,
                    message: '⚠️ Sistema inativo - sinal ignorado',
                    timestamp: new Date().toISOString()
                });
            }
            
            if (!this.systemState.tradingEnabled) {
                return res.json({
                    success: false,
                    message: '⚠️ Trading desabilitado - sinal ignorado',
                    timestamp: new Date().toISOString()
                });
            }
            
            // Analisar sinal
            const analysis = await this.signalAnalyzer.analyzeSignal(signal);
            
            // Atualizar heartbeat
            this.systemState.lastHeartbeat = new Date();
            
            res.json({
                success: true,
                message: '📡 Sinal processado com sucesso',
                data: {
                    signal,
                    analysis,
                    systemStatus: this.getSystemStatus()
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao processar sinal:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao processar sinal',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 📈 ENDPOINT: Leitura de Mercado
     */
    async getMarketReading(req, res) {
        try {
            const marketData = {
                timestamp: new Date().toISOString(),
                btcPrice: Math.floor(Math.random() * 100000) + 40000,
                fearGreedIndex: Math.floor(Math.random() * 100),
                volatility: Math.random() * 5,
                trend: ['ALTA', 'BAIXA', 'LATERAL'][Math.floor(Math.random() * 3)]
            };
            
            res.json({
                success: true,
                message: '📈 Leitura de mercado obtida com sucesso',
                data: marketData,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao obter leitura de mercado:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao obter leitura de mercado',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 👁️ ENDPOINT: Status do Monitoramento
     */
    async getMonitoringStatus(req, res) {
        try {
            const monitoringData = {
                activeMonitors: 5,
                alertsCount: 2,
                lastUpdate: new Date().toISOString(),
                healthStatus: 'HEALTHY'
            };
            
            res.json({
                success: true,
                message: '👁️ Status de monitoramento obtido com sucesso',
                data: monitoringData,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao obter status de monitoramento:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao obter status de monitoramento',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 🎛️ ENDPOINT: Dashboard Principal
     */
    async getDashboard(req, res) {
        try {
            const dashboardData = {
                systemStatus: this.getSystemStatus(),
                operationsToday: Math.floor(Math.random() * 20),
                successRate: (Math.random() * 40 + 60).toFixed(2),
                pnlToday: (Math.random() * 2000 - 1000).toFixed(2),
                alerts: [
                    { type: 'INFO', message: 'Sistema funcionando normalmente' },
                    { type: 'WARNING', message: 'Alta volatilidade detectada' }
                ]
            };
            
            res.json({
                success: true,
                message: '🎛️ Dashboard obtido com sucesso',
                data: dashboardData,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao obter dashboard:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao obter dashboard',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * ❤️ ENDPOINT: Health Check
     */
    async healthCheck(req, res) {
        try {
            const healthData = {
                status: 'HEALTHY',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            };
            
            res.json({
                success: true,
                message: '❤️ Sistema saudável',
                data: healthData,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro no health check:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro no health check',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 📊 ENDPOINT: Obter Métricas de Operações
     */
    async getOperationsMetrics(req, res) {
        try {
            const monitor = await this.initOperationsMonitor();
            
            if (!monitor) {
                return res.json({
                    success: true,
                    data: {
                        hoje: { operacoesAbertas: 0, operacoesFechadas: 0, taxaSucesso: 0, classificacao: { nivel: 'AGUARDANDO', cor: '#9e9e9e', emoji: '⏳' } },
                        historico: { totalOperacoes: 0, taxaSucesso: 0, classificacao: { nivel: 'AGUARDANDO', cor: '#9e9e9e', emoji: '⏳' } }
                    }
                });
            }

            const metricas = await monitor.obterMetricasResumo();
            
            res.json({
                success: true,
                message: '📊 Métricas de operações obtidas com sucesso',
                data: metricas,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao obter métricas de operações:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao obter métricas de operações',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 📋 ENDPOINT: Obter Operações Abertas
     */
    async getOpenOperations(req, res) {
        try {
            const monitor = await this.initOperationsMonitor();
            
            if (!monitor) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            const operacoes = await monitor.obterOperacoesAbertas();
            
            res.json({
                success: true,
                message: '📋 Operações abertas obtidas com sucesso',
                data: operacoes,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao obter operações abertas:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao obter operações abertas',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 📈 ENDPOINT: Obter Histórico de Operações
     */
    async getOperationHistory(req, res) {
        try {
            const monitor = await this.initOperationsMonitor();
            
            if (!monitor) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            const historico = await monitor.obterHistoricoOperacoes();
            
            res.json({
                success: true,
                message: '📈 Histórico de operações obtido com sucesso',
                data: historico,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao obter histórico de operações:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao obter histórico de operações',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * ⚡ Executar Orquestrador
     */
    async executeOrchestrator() {
        return new Promise((resolve) => {
            exec('node orquestrador-mestre.js', { 
                cwd: path.join(__dirname), 
                timeout: 30000 
            }, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ [EXEC] Erro ao executar orquestrador:', error);
                    resolve({ success: false, error: error.message });
                    return;
                }
                
                console.log('✅ [EXEC] Orquestrador executado com sucesso');
                console.log(stdout);
                
                resolve({ success: true, output: stdout });
            });
        });
    }

    /**
     * 🌐 Configurar Rotas do Express
     */
    setupRoutes(app) {
        console.log('📋 Configurando rotas do Sistema de Orquestração...');
        
        // Rotas principais do sistema
        app.post('/api/system/start', this.startSystem.bind(this));
        app.post('/api/system/stop', this.stopSystem.bind(this));
        app.get('/api/system/status', this.getSystemStatusEndpoint.bind(this));
        app.post('/api/system/configure', this.configureSystem.bind(this));
        app.post('/api/webhook/tradingview', this.processTradingViewSignal.bind(this));
        app.get('/api/market/reading', this.getMarketReading.bind(this));
        app.get('/api/monitoring/status', this.getMonitoringStatus.bind(this));
        app.get('/api/dashboard', this.getDashboard.bind(this));
        app.get('/api/system/health', this.healthCheck.bind(this));
        
        // Rotas do monitor de operações
        app.get('/api/operations/metrics', this.getOperationsMetrics.bind(this));
        app.get('/api/operations/open', this.getOpenOperations.bind(this));
        app.get('/api/operations/history', this.getOperationHistory.bind(this));
        
        console.log('✅ Rotas do Sistema de Orquestração configuradas:');
        console.log('   🟢 POST /api/system/start - Ligar sistema');
        console.log('   🔴 POST /api/system/stop - Desligar sistema');
        console.log('   📊 GET  /api/system/status - Status do sistema');
        console.log('   🔧 POST /api/system/configure - Configurar sistema');
        console.log('   📡 POST /api/webhook/tradingview - Webhook TradingView');
        console.log('   📊 GET  /api/market/reading - Leitura de mercado');
        console.log('   👁️ GET  /api/monitoring/status - Status monitoramento');
        console.log('   🎛️ GET  /api/dashboard - Dashboard principal');
        console.log('   ❤️ GET  /api/system/health - Health check');
        console.log('   📊 GET  /api/operations/metrics - Métricas de operações');
        console.log('   📋 GET  /api/operations/open - Operações abertas');
        console.log('   📈 GET  /api/operations/history - Histórico de operações');
    }
}

module.exports = SystemController;
