/**
 * 🎛️ CONTROLADOR WEB - SISTEMA DE ORQUESTRAÇÃO
 * Interface web para controle do sistema de trading
 */

const SystemOrchestrator = require('./sistema-orquestrador-completo');

class SystemController {
    constructor() {
        this.orchestrator = new SystemOrchestrator();
    }

    /**
     * 🟢 ENDPOINT: Ligar Sistema
     */
    async startSystem(req, res) {
        try {
            console.log('🟢 [WEB] Solicitação para ligar sistema recebida');
            
            const result = await this.orchestrator.startSystem();
            
            res.json({
                success: true,
                message: '🟢 Sistema iniciado com sucesso!',
                data: result,
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
            
            const result = await this.orchestrator.stopSystem();
            
            res.json({
                success: true,
                message: '🔴 Sistema desligado com segurança!',
                data: result,
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
     * 📊 ENDPOINT: Status do Sistema
     */
    async getSystemStatus(req, res) {
        try {
            const status = this.orchestrator.getSystemStatus();
            
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
            
            const result = await this.orchestrator.processSignal(req.body);
            
            res.json({
                success: result.success,
                message: result.success ? 
                    '📡 Sinal processado com sucesso!' : 
                    `⚠️ Sinal rejeitado: ${result.reason}`,
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
     * 👁️ ENDPOINT: Status de Monitoramento
     */
    async getMonitoringStatus(req, res) {
        try {
            const status = this.orchestrator.getSystemStatus();
            
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
        app.get('/api/system/status', this.getSystemStatus.bind(this));
        app.post('/api/system/configure', this.configureSystem.bind(this));
        
        // Trading
        app.post('/api/webhook/tradingview', this.processWebhook.bind(this));
        app.get('/api/market/reading', this.performMarketReading.bind(this));
        
        // Monitoramento
        app.get('/api/monitoring/status', this.getMonitoringStatus.bind(this));
        app.get('/api/dashboard', this.getDashboard.bind(this));
        
        // Health Check específico
        app.get('/api/system/health', (req, res) => {
            const status = this.orchestrator.getSystemStatus();
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
        console.log('   🎛️ GET  /api/dashboard - Dashboard principal');
        console.log('   ❤️ GET  /api/system/health - Health check');
    }
}

module.exports = SystemController;
