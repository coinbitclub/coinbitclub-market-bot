/**
 * 🚀 SERVIDOR INTEGRADO COM SISTEMA DE ORQUESTRAÇÃO COMPLETA
 * CoinBitClub Market Bot V3 - Sistema Híbrido Multiusuário
 * 
 * FUNCIONALIDADES:
 * ✅ Sistema de Liga/Desliga Completo
 * ✅ Orquestração de Fluxo de Trading
 * ✅ Controle Web via API
 * ✅ Monitoramento em Tempo Real
 * ✅ Multiusuário com Comissionamento
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');

// Sistema de Orquestração
const SystemController = require('./controlador-sistema-web');
const DashboardLiveData = require('./dashboard-live-data');

class IntegratedServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = process.env.PORT || 3000;
        this.systemController = new SystemController();
        this.dashboardLive = new DashboardLiveData(this.systemController.orchestrator);
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupErrorHandlers();
    }

    setupMiddleware() {
        console.log('🔧 Configurando middleware...');
        
        // Trust proxy (necessário para Railway)
        this.app.set('trust proxy', 1);
        
        // Security
        this.app.use(helmet({
            contentSecurityPolicy: false, // Desabilitar para desenvolvimento
            crossOriginResourcePolicy: { policy: "cross-origin" }
        }));
        
        // Compression
        this.app.use(compression());
        
        // CORS
        this.app.use(cors({
            origin: [
                'http://localhost:3000',
                'http://localhost:3001',
                'https://coinbitclub-market-bot-production.up.railway.app',
                'https://*.railway.app'
            ],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 1 * 60 * 1000, // 1 minuto
            max: 100, // máximo 100 requests por minuto
            message: {
                error: 'Muitas solicitações, tente novamente em um minuto.'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api/', limiter);
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Logging
        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip}`);
            next();
        });
        
        console.log('✅ Middleware configurado');
    }

    setupRoutes() {
        console.log('🛣️ Configurando rotas...');
        
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                name: 'CoinBitClub Market Bot V3',
                version: '3.0.0',
                description: 'Sistema Híbrido Multiusuário com Orquestração Completa',
                status: 'Sistema Operacional',
                features: [
                    '🎛️ Sistema Liga/Desliga Completo',
                    '📊 Leitura de Mercado Automatizada',
                    '🤖 IA Guardian Integrada',
                    '👥 Sistema Multiusuário',
                    '💰 Comissionamento Automático',
                    '📡 Webhooks TradingView',
                    '👁️ Monitoramento Tempo Real'
                ],
                endpoints: {
                    systemControl: '/api/system/*',
                    trading: '/api/webhook/tradingview',
                    monitoring: '/api/monitoring/*',
                    dashboard: '/api/dashboard'
                },
                timestamp: new Date().toISOString()
            });
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                memory: process.memoryUsage(),
                version: process.version
            });
        });
        
        // Configurar rotas do Sistema de Orquestração
        this.systemController.setupRoutes(this.app);
        
        // Rotas específicas para WebSocket
        this.app.get('/api/dashboard/connections', (req, res) => {
            const stats = this.dashboardLive.getConnectionStats();
            res.json({
                success: true,
                message: 'Estatísticas de conexões obtidas',
                data: stats,
                timestamp: new Date().toISOString()
            });
        });
        
        this.app.post('/api/dashboard/broadcast', (req, res) => {
            const { message, targetUserId } = req.body;
            
            if (targetUserId) {
                // Enviar para usuário específico
                const ws = this.dashboardLive.clients.get(targetUserId);
                if (ws) {
                    this.dashboardLive.sendToClient(ws, {
                        type: 'admin_message',
                        data: message,
                        timestamp: new Date().toISOString()
                    });
                    res.json({ success: true, message: 'Mensagem enviada' });
                } else {
                    res.status(404).json({ success: false, message: 'Usuário não conectado' });
                }
            } else {
                // Broadcast para todos
                this.dashboardLive.broadcast({
                    type: 'admin_broadcast',
                    data: message,
                    timestamp: new Date().toISOString()
                });
                res.json({ success: true, message: 'Broadcast enviado' });
            }
        });
        
        // Rota para página de controle (desenvolvimento)
        this.app.get('/control', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>CoinBitClub - Controle do Sistema</title>
                    <meta charset="UTF-8">
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            max-width: 1200px; 
                            margin: 0 auto; 
                            padding: 20px;
                            background: #1a1a1a;
                            color: #fff;
                        }
                        .card { 
                            background: #2d2d2d; 
                            padding: 20px; 
                            margin: 20px 0; 
                            border-radius: 8px; 
                            border-left: 4px solid #00ff88;
                        }
                        .button { 
                            background: #00ff88; 
                            color: #000; 
                            padding: 10px 20px; 
                            border: none; 
                            border-radius: 5px; 
                            cursor: pointer; 
                            margin: 5px;
                            font-weight: bold;
                        }
                        .button:hover { background: #00cc6a; }
                        .button.stop { background: #ff4757; color: #fff; }
                        .button.stop:hover { background: #ff3742; }
                        .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
                        .status.online { background: #2ed573; color: #000; }
                        .status.offline { background: #ff4757; color: #fff; }
                        #log { 
                            background: #000; 
                            color: #00ff88; 
                            padding: 20px; 
                            border-radius: 5px; 
                            height: 300px; 
                            overflow-y: scroll; 
                            font-family: monospace; 
                            white-space: pre-wrap;
                        }
                    </style>
                </head>
                <body>
                    <h1>🎛️ CoinBitClub - Controle do Sistema</h1>
                    
                    <div class="card">
                        <h2>📊 Status do Sistema</h2>
                        <div id="systemStatus" class="status offline">Sistema Offline</div>
                        <button class="button" onclick="updateStatus()">🔄 Atualizar Status</button>
                    </div>
                    
                    <div class="card">
                        <h2>🎛️ Controles Principais</h2>
                        <button class="button" onclick="startSystem()">🟢 Ligar Sistema</button>
                        <button class="button stop" onclick="stopSystem()">🔴 Desligar Sistema</button>
                        <button class="button" onclick="getMarketReading()">📊 Leitura de Mercado</button>
                        <button class="button" onclick="getDashboard()">🎛️ Dashboard</button>
                        <button class="button" onclick="websocket = connectWebSocket()">📡 Conectar WebSocket</button>
                    </div>
                    
                    <div class="card">
                        <h2>📋 Log de Operações</h2>
                        <div id="log">Aguardando operações...</div>
                        <button class="button" onclick="clearLog()">🗑️ Limpar Log</button>
                    </div>
                    
                    <script>
                        function log(message) {
                            const logElement = document.getElementById('log');
                            const timestamp = new Date().toLocaleTimeString();
                            logElement.textContent += \`[\${timestamp}] \${message}\\n\`;
                            logElement.scrollTop = logElement.scrollHeight;
                        }
                        
                        function clearLog() {
                            document.getElementById('log').textContent = '';
                        }
                        
                        async function apiCall(endpoint, method = 'GET', body = null) {
                            try {
                                const options = {
                                    method,
                                    headers: { 'Content-Type': 'application/json' }
                                };
                                if (body) options.body = JSON.stringify(body);
                                
                                const response = await fetch(endpoint, options);
                                const data = await response.json();
                                
                                log(\`\${method} \${endpoint}: \${data.message}\`);
                                return data;
                            } catch (error) {
                                log(\`Erro em \${endpoint}: \${error.message}\`);
                                return null;
                            }
                        }
                        
                        async function startSystem() {
                            log('🟢 Iniciando sistema...');
                            await apiCall('/api/system/start', 'POST');
                            await updateStatus();
                        }
                        
                        async function stopSystem() {
                            log('🔴 Desligando sistema...');
                            await apiCall('/api/system/stop', 'POST');
                            await updateStatus();
                        }
                        
                        function updateStatus() {
                            const data = await apiCall('/api/system/status');
                            if (data && data.success) {
                                const statusDiv = document.getElementById('systemStatus');
                                const isOnline = data.data.isActive;
                                statusDiv.className = \`status \${isOnline ? 'online' : 'offline'}\`;
                                statusDiv.textContent = \`Sistema \${isOnline ? 'Online' : 'Offline'} - Trading: \${data.data.tradingEnabled ? 'Ativo' : 'Pausado'}\`;
                            }
                        }
                        
                        async function getMarketReading() {
                            log('📊 Realizando leitura de mercado...');
                            await apiCall('/api/market/reading');
                        }
                        
                        async function getDashboard() {
                            log('🎛️ Carregando dashboard...');
                            const data = await apiCall('/api/dashboard');
                            if (data && data.success) {
                                log(JSON.stringify(data.data, null, 2));
                            }
                        }
                        
                        // Demonstração de WebSocket
                        function connectWebSocket() {
                            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                            const wsUrl = \`\${protocol}//\${window.location.host}/ws/dashboard?userId=demo&userName=Demo\`;
                            
                            log('📡 Conectando WebSocket: ' + wsUrl);
                            
                            const ws = new WebSocket(wsUrl);
                            
                            ws.onopen = () => {
                                log('✅ WebSocket conectado');
                            };
                            
                            ws.onmessage = (event) => {
                                const data = JSON.parse(event.data);
                                log(\`📨 WebSocket: \${data.type} - \${JSON.stringify(data.data || {}, null, 2)}\`);
                            };
                            
                            ws.onclose = () => {
                                log('❌ WebSocket desconectado');
                            };
                            
                            ws.onerror = (error) => {
                                log('❌ Erro WebSocket: ' + error);
                            };
                            
                            return ws;
                        }
                        
                        // Conectar WebSocket automaticamente
                        let websocket = null;
                        setTimeout(() => {
                            websocket = connectWebSocket();
                        }, 2000);
                        
                        // Atualizar status automaticamente
                        setInterval(updateStatus, 10000); // A cada 10 segundos
                        updateStatus(); // Primeira atualização
                    </script>
                </body>
                </html>
            `);
        });
        
        // Fallback para rotas não encontradas
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Rota não encontrada',
                path: req.originalUrl,
                method: req.method,
                timestamp: new Date().toISOString(),
                availableEndpoints: [
                    'GET /',
                    'GET /health',
                    'GET /control',
                    'POST /api/system/start',
                    'POST /api/system/stop',
                    'GET /api/system/status',
                    'POST /api/webhook/tradingview',
                    'GET /api/dashboard'
                ]
            });
        });
        
        console.log('✅ Rotas configuradas');
    }

    setupWebSocket() {
        console.log('📡 Configurando WebSocket para Dashboard Live...');
        
        // Inicializar sistema de WebSocket
        this.dashboardLive.initialize(this.server);
        
        // Integrar eventos do orquestrador com WebSocket
        this.integrateOrchestratorEvents();
        
        console.log('✅ WebSocket configurado');
    }

    integrateOrchestratorEvents() {
        const orchestrator = this.systemController.orchestrator;
        
        // Interceptar criação de operações
        const originalCreateOperation = orchestrator.createOperation.bind(orchestrator);
        orchestrator.createOperation = async (...args) => {
            const operation = await originalCreateOperation(...args);
            
            // Transmitir nova operação via WebSocket
            if (operation && operation.userId) {
                this.dashboardLive.broadcastNewOperation(operation.userId, {
                    id: operation.id,
                    symbol: operation.symbol,
                    side: operation.side,
                    entryPrice: operation.entryPrice,
                    timestamp: new Date().toISOString()
                });
            }
            
            return operation;
        };
        
        // Interceptar fechamento de operações
        const originalCloseOperation = orchestrator.closeOperation.bind(orchestrator);
        orchestrator.closeOperation = async (...args) => {
            const result = await originalCloseOperation(...args);
            
            // Transmitir operação fechada via WebSocket
            if (result && result.success && args[0]) {
                const operation = args[0];
                this.dashboardLive.broadcastOperationClosed(operation.user_id, {
                    id: operation.id,
                    finalPnL: result.finalPnL,
                    finalReturn: result.finalReturn,
                    reason: result.reason,
                    timestamp: new Date().toISOString()
                });
            }
            
            return result;
        };
        
        console.log('🔗 Eventos do orquestrador integrados com WebSocket');
    }

    setupErrorHandlers() {
        console.log('🛡️ Configurando tratamento de erros...');
        
        // Error handler
        this.app.use((err, req, res, next) => {
            console.error('❌ Erro não tratado:', err);
            
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
                timestamp: new Date().toISOString(),
                path: req.originalUrl
            });
        });
        
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('📴 SIGTERM recebido. Iniciando desligamento gracioso...');
            this.shutdown();
        });
        
        process.on('SIGINT', () => {
            console.log('📴 SIGINT recebido. Iniciando desligamento gracioso...');
            this.shutdown();
        });
        
        process.on('uncaughtException', (err) => {
            console.error('💥 Exceção não capturada:', err);
            this.shutdown(1);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 Promise rejeitada não tratada:', reason);
            this.shutdown(1);
        });
        
        console.log('✅ Tratamento de erros configurado');
    }

    async shutdown(exitCode = 0) {
        console.log('📴 Iniciando desligamento do servidor...');
        
        try {
            // Desligar sistema de orquestração
            await this.systemController.orchestrator.stopSystem();
            console.log('✅ Sistema de orquestração desligado');
            
            // Desligar WebSocket
            this.dashboardLive.stop();
            console.log('✅ Dashboard Live Data desligado');
        } catch (error) {
            console.error('❌ Erro ao desligar sistema:', error);
        }
        
        // Aguardar um pouco antes de sair
        setTimeout(() => {
            console.log('👋 Servidor desligado');
            process.exit(exitCode);
        }, 1000);
    }

    start() {
        this.server.listen(this.port, '0.0.0.0', () => {
            console.log('='.repeat(80));
            console.log('🚀 COINBITCLUB MARKET BOT V3 - SISTEMA HÍBRIDO MULTIUSUÁRIO');
            console.log('='.repeat(80));
            console.log(`📡 Servidor rodando na porta: ${this.port}`);
            console.log(`🌐 URL local: http://localhost:${this.port}`);
            console.log(`🎛️ Painel de controle: http://localhost:${this.port}/control`);
            console.log(`❤️ Health check: http://localhost:${this.port}/health`);
            console.log(`📡 WebSocket Dashboard: ws://localhost:${this.port}/ws/dashboard`);
            console.log('');
            console.log('📋 ENDPOINTS PRINCIPAIS:');
            console.log('   🟢 POST /api/system/start - Ligar sistema completo');
            console.log('   🔴 POST /api/system/stop - Desligar sistema completo');
            console.log('   📊 GET  /api/system/status - Status do sistema');
            console.log('   📡 POST /api/webhook/tradingview - Webhook para sinais');
            console.log('   🎛️ GET  /api/dashboard - Dashboard completo');
            console.log('   📱 GET  /api/dashboard/connections - Conexões WebSocket');
            console.log('   📢 POST /api/dashboard/broadcast - Enviar mensagem');
            console.log('');
            console.log('✨ FUNCIONALIDADES ATIVAS:');
            console.log('   🎛️ Sistema Liga/Desliga Completo');
            console.log('   📊 Leitura de Mercado (Fear & Greed + BTC Dominance)');
            console.log('   🤖 IA Guardian para Análise de Sinais');
            console.log('   👥 Sistema Multiusuário com Comissionamento');
            console.log('   📡 Processamento de Webhooks TradingView');
            console.log('   👁️ Monitoramento em Tempo Real');
            console.log('   💰 Fluxo Completo: Sinal → Operação → Comissão');
            console.log('   📱 Dashboard Live - Dados minuto a minuto via WebSocket');
            console.log('='.repeat(80));
            console.log('');
            console.log('🎯 PARA ATIVAR O SISTEMA:');
            console.log('   1. Acesse: http://localhost:' + this.port + '/control');
            console.log('   2. Clique em "🟢 Ligar Sistema"');
            console.log('   3. Sistema iniciará o fluxo completo de trading');
            console.log('   4. WebSocket conectará automaticamente para dados ao vivo');
            console.log('');
            console.log('� DASHBOARD LIVE DATA:');
            console.log('   • Dados atualizados a cada minuto');
            console.log('   • Operações em tempo real');
            console.log('   • Notificações instantâneas');
            console.log('   • Estatísticas ao vivo');
            console.log('');
            console.log('�📡 SISTEMA AGUARDANDO SINAIS DO TRADINGVIEW...');
            console.log('');
        });

        // Configurar timeout do servidor
        this.server.timeout = 30000; // 30 segundos
        
        return this.server;
    }
}

// Inicializar e iniciar o servidor
if (require.main === module) {
    const server = new IntegratedServer();
    server.start();
}

module.exports = IntegratedServer;
