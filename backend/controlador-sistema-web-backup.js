/**
 * 🎛️ CONTROLADOR WEB - SISTEMA DE ORQUESTRAÇÃO
 * Interface web para controle do sistema de trading
 */

const { exec } = require('child_process');
const path = require('path');
const SignalAnalyzer = require('./signal-analyzer');
const OperationsMonitor = require('./operations-monitor');

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
        
        // Inicializar monitores
        try {
            this.operationsMonitor = new OperationsMonitor();
        } catch (error) {
            console.log('⚠️ Monitor de operações será iniciado quando necessário');
            this.operationsMonitor = null;
        }
        
        // Inicializar analisador de sinais
        this.signalAnalyzer = new SignalAnalyzer();
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
                this.systemState.aiGuardianActive = true;
                this.systemState.fearGreedActive = true;
                this.systemState.multiuserActive = true;
                this.systemState.microservicesActive = true;
                this.systemState.managersActive = true;
                this.systemState.supervisorsActive = true;
                this.systemState.startTime = new Date();
                this.systemState.lastHeartbeat = new Date();
            }
            
            res.json({
                success: result.success,
                message: result.success ? '🟢 Sistema iniciado com sucesso!' : '❌ Erro ao iniciar sistema',
                data: this.getSystemStatus(),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao ligar sistema:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao iniciar sistema',
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
            
            // Resetar estado do sistema
            this.systemState.isActive = false;
            this.systemState.tradingEnabled = false;
            this.systemState.aiGuardianActive = false;
            this.systemState.fearGreedActive = false;
            this.systemState.multiuserActive = false;
            this.systemState.microservicesActive = false;
            this.systemState.managersActive = false;
            this.systemState.supervisorsActive = false;
            this.systemState.startTime = null;
            this.systemState.activeOperations = 0;
            
            res.json({
                success: true,
                message: '🔴 Sistema desligado com segurança!',
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
     * 🔧 Executar Orquestrador Mestre
     */
    async executeOrchestrator() {
        return new Promise((resolve) => {
            const orchestratorPath = path.join(__dirname, 'orquestrador-mestre-completo.js');
            
            exec(`node "${orchestratorPath}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Erro no orquestrador:', error);
                    resolve({ success: false, error: error.message });
                    return;
                }

                if (stderr) {
                    console.warn('⚠️ Warnings do orquestrador:', stderr);
                }

                console.log('✅ Orquestrador executado com sucesso');
                console.log(stdout);
                
                resolve({ 
                    success: true, 
                    output: stdout,
                    message: 'Orquestração completa realizada'
                });
            });
        });
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
    async processWebhook(req, res) {
        try {
            console.log('📡 [WEB] Sinal do TradingView recebido:', req.body);
            
            // Usar o analisador de sinais para capturar e analisar
            const result = await this.signalAnalyzer.captureSignal(req.body, req);
            
            res.json({
                success: result.success,
                message: result.success ? 
                    '📡 Sinal processado com sucesso!' : 
                    `⚠️ Sinal rejeitado: ${result.rejectionReason || result.error}`,
                data: result,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro no webhook:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao processar sinal',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 📊 ENDPOINT: Leitura de Mercado
     */
    async performMarketReading(req, res) {
        try {
            console.log('📊 [WEB] Solicitação de leitura de mercado');
            
            const result = await this.orchestrator.performMarketReading();
            
            res.json({
                success: true,
                message: '📊 Leitura de mercado realizada com sucesso',
                data: result,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro na leitura de mercado:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro na leitura de mercado',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * � ENDPOINT: Status de Monitoramento
     */
    async getMonitoringStatus(req, res) {
        try {
            const status = this.getSystemStatus();
            
            // Estatísticas detalhadas
            const stats = {
                activeOperations: status.activeOperations,
                systemState: {
                    isActive: status.isActive,
                    tradingEnabled: status.tradingEnabled,
                    aiGuardianActive: status.aiGuardianActive,
                    fearGreedActive: status.fearGreedActive,
                    multiuserActive: status.multiuserActive
                },
                uptime: status.uptime,
                lastHeartbeat: status.lastHeartbeat,
                marketReading: status.marketReading
            };
            
            res.json({
                success: true,
                message: '👁️ Status de monitoramento obtido',
                data: stats,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro no monitoramento:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao obter status de monitoramento',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 📡 ENDPOINT: Monitoramento de Sinais
     */
    async getSignalsMonitoring(req, res) {
        try {
            // Temporariamente usar dados mock até o banco estar configurado
            const mockSignals = this.generateMockSignals();
            
            res.json({
                success: true,
                message: '📡 Sinais obtidos com sucesso',
                signals: mockSignals,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao obter sinais:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao obter sinais',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 🎭 Gerar dados mock de sinais para demonstração
     */
    generateMockSignals() {
        const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT'];
        const actions = ['buy', 'sell'];
        const statuses = ['processed', 'rejected', 'pending'];
        const signals = [];

        // Gerar 15 sinais dos últimos 5 minutos
        for (let i = 0; i < 15; i++) {
            const now = new Date();
            const receivedAt = new Date(now.getTime() - Math.random() * 5 * 60 * 1000);
            
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const action = actions[Math.floor(Math.random() * actions.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            const price = 45000 + (Math.random() * 10000);
            const stopLoss = action === 'buy' ? price * 0.97 : price * 1.03;
            const takeProfit = action === 'buy' ? price * 1.05 : price * 0.95;
            
            const signal = {
                id: `sig_${Date.now()}_${i}`,
                received_at: receivedAt.toISOString(),
                status: status,
                processing_time: Math.floor(Math.random() * 500) + 50,
                signal_data: {
                    symbol: symbol,
                    action: action,
                    price: price.toFixed(2),
                    stop_loss: stopLoss.toFixed(2),
                    take_profit: takeProfit.toFixed(2),
                    quantity: 'auto',
                    exchange: 'Bybit'
                },
                decision_flow: this.generateDecisionFlow(status, action),
                performance: {
                    processing_time: Math.floor(Math.random() * 500) + 50,
                    fear_greed_index: Math.floor(Math.random() * 100),
                    users_affected: Math.floor(Math.random() * 10),
                    operations_created: status === 'processed' ? Math.floor(Math.random() * 5) : 0
                }
            };
            
            signals.push(signal);
        }

        return signals.sort((a, b) => new Date(b.received_at) - new Date(a.received_at));
    }

    /**
     * 🔄 Gerar fluxo de decisão mock
     */
    generateDecisionFlow(status, action) {
        const baseFlow = [
            {
                description: '📡 Sinal recebido do TradingView',
                result: 'pass',
                details: 'Webhook validado'
            },
            {
                description: '🔍 Validação de formato do sinal',
                result: 'pass',
                details: 'JSON válido, campos obrigatórios presentes'
            },
            {
                description: '📊 Consulta Fear & Greed Index',
                result: Math.random() > 0.2 ? 'pass' : 'fail',
                details: `Índice: ${Math.floor(Math.random() * 100)} - ${Math.random() > 0.5 ? 'Permitido' : 'Bloqueado'}`
            }
        ];

        // Adicionar mais etapas baseado no status
        if (status === 'processed') {
            baseFlow.push(
                {
                    description: '👥 Verificação de usuários ativos',
                    result: 'pass',
                    details: `${Math.floor(Math.random() * 10) + 1} usuários encontrados`
                },
                {
                    description: '💰 Validação de saldos disponíveis',
                    result: 'pass',
                    details: 'Saldos suficientes confirmados'
                },
                {
                    description: '🎯 Criação de operações',
                    result: 'pass',
                    details: `${Math.floor(Math.random() * 5) + 1} operações criadas`
                },
                {
                    description: '📤 Envio para exchanges',
                    result: 'pass',
                    details: 'Ordens enviadas com sucesso'
                }
            );
        } else if (status === 'rejected') {
            const rejectionReasons = [
                'Fear & Greed Index fora do limite',
                'Usuários sem saldo suficiente',
                'Limite máximo de operações atingido',
                'Exchange indisponível',
                'Símbolo não suportado'
            ];
            
            baseFlow.push({
                description: '❌ Sinal rejeitado',
                result: 'fail',
                details: rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)]
            });
        } else {
            baseFlow.push({
                description: '⏳ Processamento em andamento',
                result: 'skip',
                details: 'Aguardando validações adicionais'
            });
        }

        return baseFlow;
    }

    /**
     * 🎭 Gerar dados mock de sinais para demonstração
     */
    generateMockSignals() {
        const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT'];
        const actions = ['buy', 'sell'];
        const statuses = ['processed', 'rejected', 'pending'];
        const signals = [];

        // Gerar 15 sinais dos últimos 5 minutos
        for (let i = 0; i < 15; i++) {
            const now = new Date();
            const receivedAt = new Date(now.getTime() - Math.random() * 5 * 60 * 1000);
            
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const action = actions[Math.floor(Math.random() * actions.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            const price = 45000 + (Math.random() * 10000);
            const stopLoss = action === 'buy' ? price * 0.97 : price * 1.03;
            const takeProfit = action === 'buy' ? price * 1.05 : price * 0.95;
            
            const signal = {
                id: `sig_${Date.now()}_${i}`,
                received_at: receivedAt.toISOString(),
                status: status,
                processing_time: Math.floor(Math.random() * 500) + 50,
                signal_data: {
                    symbol: symbol,
                    action: action,
                    price: price.toFixed(2),
                    stop_loss: stopLoss.toFixed(2),
                    take_profit: takeProfit.toFixed(2),
                    quantity: 'auto',
                    exchange: 'Bybit'
                },
                decision_flow: this.generateDecisionFlow(status, action),
                performance: {
                    processing_time: Math.floor(Math.random() * 500) + 50,
                    fear_greed_index: Math.floor(Math.random() * 100),
                    users_affected: Math.floor(Math.random() * 10),
                    operations_created: status === 'processed' ? Math.floor(Math.random() * 5) : 0
                }
            };
            
            signals.push(signal);
        }

        return signals.sort((a, b) => new Date(b.received_at) - new Date(a.received_at));
    }

    /**
     * 🔄 Gerar fluxo de decisão mock
     */
    generateDecisionFlow(status, action) {
        const baseFlow = [
            {
                description: '📡 Sinal recebido do TradingView',
                result: 'pass',
                details: 'Webhook validado'
            },
            {
                description: '🔍 Validação de formato do sinal',
                result: 'pass',
                details: 'JSON válido, campos obrigatórios presentes'
            },
            {
                description: '📊 Consulta Fear & Greed Index',
                result: Math.random() > 0.2 ? 'pass' : 'fail',
                details: `Índice: ${Math.floor(Math.random() * 100)} - ${Math.random() > 0.5 ? 'Permitido' : 'Bloqueado'}`
            }
        ];

        // Adicionar mais etapas baseado no status
        if (status === 'processed') {
            baseFlow.push(
                {
                    description: '👥 Verificação de usuários ativos',
                    result: 'pass',
                    details: `${Math.floor(Math.random() * 10) + 1} usuários encontrados`
                },
                {
                    description: '💰 Validação de saldos disponíveis',
                    result: 'pass',
                    details: 'Saldos suficientes confirmados'
                },
                {
                    description: '🎯 Criação de operações',
                    result: 'pass',
                    details: `${Math.floor(Math.random() * 5) + 1} operações criadas`
                },
                {
                    description: '📤 Envio para exchanges',
                    result: 'pass',
                    details: 'Ordens enviadas com sucesso'
                }
            );
        } else if (status === 'rejected') {
            const rejectionReasons = [
                'Fear & Greed Index fora do limite',
                'Usuários sem saldo suficiente',
                'Limite máximo de operações atingido',
                'Exchange indisponível',
                'Símbolo não suportado'
            ];
            
            baseFlow.push({
                description: '❌ Sinal rejeitado',
                result: 'fail',
                details: rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)]
            });
        } else {
            baseFlow.push({
                description: '⏳ Processamento em andamento',
                result: 'skip',
                details: 'Aguardando validações adicionais'
            });
        }

        return baseFlow;
    }

    /**
     * 🎛️ ENDPOINT: Dashboard Principal
     */
    async getDashboard(req, res) {
        try {
            const status = this.orchestrator.getSystemStatus();
            
            const dashboard = {
                systemStatus: status.isActive ? 'ONLINE' : 'OFFLINE',
                tradingStatus: status.tradingEnabled ? 'ATIVO' : 'PAUSADO',
                components: {
                    aiGuardian: status.aiGuardianActive ? '🟢' : '🔴',
                    fearGreed: status.fearGreedActive ? '🟢' : '🔴',
                    multiuser: status.multiuserActive ? '🟢' : '🔴'
                },
                metrics: {
                    activeOperations: status.activeOperations,
                    uptime: Math.floor(status.uptime / 60), // em minutos
                    lastUpdate: status.lastHeartbeat
                },
                market: status.marketReading
            };
            
            res.json({
                success: true,
                message: '🎛️ Dashboard carregado com sucesso',
                data: dashboard,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro no dashboard:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao carregar dashboard',
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
            const { action, settings } = req.body;
            
            console.log(`🔧 [WEB] Configuração solicitada: ${action}`, settings);
            
            let result = { success: true, message: 'Configuração aplicada' };
            
            switch (action) {
                case 'toggle_trading':
                    this.orchestrator.systemState.tradingEnabled = !this.orchestrator.systemState.tradingEnabled;
                    result.message = `Trading ${this.orchestrator.systemState.tradingEnabled ? 'habilitado' : 'desabilitado'}`;
                    break;
                    
                case 'toggle_ai_guardian':
                    this.orchestrator.systemState.aiGuardianActive = !this.orchestrator.systemState.aiGuardianActive;
                    result.message = `IA Guardian ${this.orchestrator.systemState.aiGuardianActive ? 'ativado' : 'desativado'}`;
                    break;
                    
                case 'update_settings':
                    // Aplicar configurações específicas
                    result.message = 'Configurações atualizadas';
                    break;
                    
                default:
                    result = { success: false, message: 'Ação não reconhecida' };
            }
            
            res.json({
                success: result.success,
                message: `🔧 ${result.message}`,
                data: this.orchestrator.getSystemStatus(),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro na configuração:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao aplicar configuração',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 📋 Configurar Rotas Express
     */
    setupRoutes(app) {
        console.log('📋 Configurando rotas do Sistema de Orquestração...');
        
        // Controle do Sistema
        app.post('/api/system/start', this.startSystem.bind(this));
        app.post('/api/system/stop', this.stopSystem.bind(this));
        app.get('/api/system/status', this.getSystemStatusEndpoint.bind(this));
        app.post('/api/system/configure', this.configureSystem.bind(this));
        
        // Trading
        app.post('/api/webhook/tradingview', this.processWebhook.bind(this));
        app.get('/api/market/reading', this.performMarketReading.bind(this));
        
        // Monitoramento
        app.get('/api/monitoring/status', this.getMonitoringStatus.bind(this));
        app.get('/api/monitoring/signals', this.getSignalsMonitoring.bind(this));
        app.get('/api/dashboard', this.getDashboard.bind(this));
        
        // Monitor de Operações
        app.get('/api/operations/metrics', this.getOperationsMetrics.bind(this));
        app.get('/api/operations/open', this.getOpenOperations.bind(this));
        app.get('/api/operations/history', this.getOperationHistory.bind(this));
        app.post('/api/operations/register', this.registerOperation.bind(this));
        app.put('/api/operations/:operationId/close', this.closeOperation.bind(this));
        
        // Health Check específico
        app.get('/api/system/health', (req, res) => {
            const status = this.getSystemStatus();
            res.json({
                status: status.isActive ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: status.uptime,
                activeOperations: status.activeOperations
            });
        });
        
        console.log('✅ Rotas do Sistema de Orquestração configuradas:');
        console.log('   🟢 POST /api/system/start - Ligar sistema');
        console.log('   🔴 POST /api/system/stop - Desligar sistema');
        console.log('   📊 GET  /api/system/status - Status do sistema');
        console.log('   🔧 POST /api/system/configure - Configurar sistema');
        console.log('   📡 POST /api/webhook/tradingview - Webhook TradingView');
        console.log('   📊 GET  /api/market/reading - Leitura de mercado');
        console.log('   👁️ GET  /api/monitoring/status - Status monitoramento');
        console.log('   📡 GET  /api/monitoring/signals - Sinais TradingView');
        console.log('   🎛️ GET  /api/dashboard - Dashboard principal');
        console.log('   📊 GET  /api/operations/metrics - Métricas operações');
        console.log('   🔓 GET  /api/operations/open - Operações abertas');
        console.log('   📋 GET  /api/operations/history - Histórico operações');
        console.log('   ❤️ GET  /api/system/health - Health check');
    }

    // =======================================================
    // 📊 MÉTODOS PARA MONITOR DE OPERAÇÕES
    // =======================================================

    /**
     * 📊 ENDPOINT: Obter Métricas de Operações
     */
    async getOperationsMetrics(req, res) {
        try {
            if (!this.operationsMonitor) {
                return res.json({
                    success: true,
                    data: {
                        hoje: { operacoesAbertas: 0, operacoesFechadas: 0, taxaSucesso: 0, classificacao: { nivel: 'AGUARDANDO', cor: '#9e9e9e', emoji: '⏳' } },
                        historico: { totalOperacoes: 0, taxaSucesso: 0, classificacao: { nivel: 'AGUARDANDO', cor: '#9e9e9e', emoji: '⏳' } }
                    }
                });
            }

            const metricas = await this.operationsMonitor.obterMetricasResumo();
            
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
     * 🔓 ENDPOINT: Obter Operações Abertas
     */
    async getOpenOperations(req, res) {
        try {
            if (!this.operationsMonitor) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'Monitor de operações não inicializado'
                });
            }

            const operacoes = await this.operationsMonitor.obterOperacoesAbertas();
            
            res.json({
                success: true,
                message: '🔓 Operações abertas obtidas com sucesso',
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
     * 📋 ENDPOINT: Obter Histórico de Operações
     */
    async getOperationHistory(req, res) {
        try {
            if (!this.operationsMonitor) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'Monitor de operações não inicializado'
                });
            }

            const limite = parseInt(req.query.limit) || 20;
            const historico = await this.operationsMonitor.obterHistoricoOperacoes(limite);
            
            res.json({
                success: true,
                message: '📋 Histórico de operações obtido com sucesso',
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
     * 💼 ENDPOINT: Registrar Nova Operação (para integração)
     */
    async registerOperation(req, res) {
        try {
            if (!this.operationsMonitor) {
                return res.status(500).json({
                    success: false,
                    message: 'Monitor de operações não disponível'
                });
            }

            const { sinal, usuario, parametros } = req.body;
            
            const operationId = await this.operationsMonitor.iniciarOperacao(sinal, usuario, parametros);
            
            res.json({
                success: true,
                message: '💼 Operação registrada com sucesso',
                data: { operationId },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao registrar operação:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao registrar operação',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 🔒 ENDPOINT: Fechar Operação (para integração)
     */
    async closeOperation(req, res) {
        try {
            if (!this.operationsMonitor) {
                return res.status(500).json({
                    success: false,
                    message: 'Monitor de operações não disponível'
                });
            }

            const { operationId } = req.params;
            const closeData = req.body;
            
            await this.operationsMonitor.fecharOperacao(operationId, closeData);
            
            res.json({
                success: true,
                message: '🔒 Operação fechada com sucesso',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEB] Erro ao fechar operação:', error);
            
            res.status(500).json({
                success: false,
                message: '❌ Erro ao fechar operação',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = SystemController;
