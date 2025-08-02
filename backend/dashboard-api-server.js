/**
 * 🌐 API SERVER PARA DASHBOARD - COINBITCLUB MARKET BOT
 * 
 * Servidor Express para alimentar os dashboards com dados em tempo real
 * Suporta WebSocket para updates automáticos
 * 
 * @version 3.0.0 API
 * @date 2025-07-31
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const DashboardSystem = require('./dashboard-system');

class DashboardAPIServer {
    constructor(port = 3002) {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = port;
        this.dashboardSystem = new DashboardSystem();
        this.clients = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.log = this.log.bind(this);
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const emoji = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : '🌐';
        console.log(`${emoji} [DASHBOARD-API] ${timestamp}: ${message}`);
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // Log de requests
        this.app.use((req, res, next) => {
            this.log(`${req.method} ${req.path} - IP: ${req.ip}`);
            next();
        });
    }

    setupRoutes() {
        // 👑 Dashboard Administração
        this.app.get('/api/dashboard/admin', async (req, res) => {
            try {
                const dashboard = await this.dashboardSystem.getAdminDashboard();
                res.json({
                    success: true,
                    data: dashboard,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                this.log(`Erro dashboard admin: ${error.message}`, 'ERROR');
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 🤝 Dashboard Afiliado
        this.app.get('/api/dashboard/affiliate/:id', async (req, res) => {
            try {
                const affiliateId = req.params.id;
                const dashboard = await this.dashboardSystem.getAffiliateDashboard(affiliateId);
                res.json({
                    success: true,
                    data: dashboard,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                this.log(`Erro dashboard afiliado: ${error.message}`, 'ERROR');
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 👤 Dashboard Usuário
        this.app.get('/api/dashboard/user/:id', async (req, res) => {
            try {
                const userId = req.params.id;
                const dashboard = await this.dashboardSystem.getUserDashboard(userId);
                res.json({
                    success: true,
                    data: dashboard,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                this.log(`Erro dashboard usuário: ${error.message}`, 'ERROR');
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 🔄 Update em tempo real
        this.app.post('/api/dashboard/update', async (req, res) => {
            try {
                const { profile, userId } = req.body;
                const dashboard = await this.dashboardSystem.updateRealTimeData(profile, userId);
                
                // Broadcast para clientes WebSocket
                this.broadcastToClients('dashboard_update', {
                    profile,
                    userId,
                    data: dashboard
                });

                res.json({
                    success: true,
                    data: dashboard,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                this.log(`Erro update dashboard: ${error.message}`, 'ERROR');
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 📊 Métricas de sistema
        this.app.get('/api/system/metrics', async (req, res) => {
            try {
                const metrics = {
                    server_status: 'ONLINE',
                    uptime: process.uptime(),
                    memory_usage: process.memoryUsage(),
                    connected_clients: this.clients.size,
                    last_update: new Date().toISOString(),
                    version: '3.0.0'
                };

                res.json({
                    success: true,
                    data: metrics
                });
            } catch (error) {
                this.log(`Erro métricas sistema: ${error.message}`, 'ERROR');
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 🏠 Página principal
        this.app.get('/', (req, res) => {
            res.json({
                title: '🚀 CoinBitClub Dashboard API',
                version: '3.0.0',
                status: 'ONLINE',
                endpoints: {
                    admin: '/api/dashboard/admin',
                    affiliate: '/api/dashboard/affiliate/:id',
                    user: '/api/dashboard/user/:id',
                    update: '/api/dashboard/update (POST)',
                    metrics: '/api/system/metrics'
                },
                websocket: {
                    url: `ws://localhost:${this.port}`,
                    events: ['dashboard_update', 'system_alert', 'trade_signal']
                }
            });
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const clientId = Math.random().toString(36).substr(2, 9);
            this.clients.set(clientId, ws);
            
            this.log(`Cliente WebSocket conectado: ${clientId} (${this.clients.size} total)`);

            // Enviar dados iniciais
            ws.send(JSON.stringify({
                type: 'connection',
                clientId,
                message: 'Conectado ao Dashboard em Tempo Real',
                timestamp: new Date().toISOString()
            }));

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(clientId, data);
                } catch (error) {
                    this.log(`Erro mensagem WebSocket: ${error.message}`, 'ERROR');
                }
            });

            ws.on('close', () => {
                this.clients.delete(clientId);
                this.log(`Cliente WebSocket desconectado: ${clientId} (${this.clients.size} restantes)`);
            });

            ws.on('error', (error) => {
                this.log(`Erro WebSocket cliente ${clientId}: ${error.message}`, 'ERROR');
                this.clients.delete(clientId);
            });
        });
    }

    handleWebSocketMessage(clientId, data) {
        switch (data.type) {
            case 'subscribe_dashboard':
                this.log(`Cliente ${clientId} inscrito em dashboard: ${data.profile}`);
                // Armazenar preferência do cliente
                const client = this.clients.get(clientId);
                if (client) {
                    client.dashboardProfile = data.profile;
                    client.userId = data.userId;
                }
                break;

            case 'request_update':
                this.log(`Cliente ${clientId} solicitou update do dashboard`);
                this.sendDashboardUpdate(clientId, data.profile, data.userId);
                break;

            default:
                this.log(`Tipo de mensagem desconhecido: ${data.type}`);
        }
    }

    async sendDashboardUpdate(clientId, profile, userId) {
        try {
            const client = this.clients.get(clientId);
            if (!client) return;

            const dashboard = await this.dashboardSystem.updateRealTimeData(profile, userId);
            
            client.send(JSON.stringify({
                type: 'dashboard_update',
                profile,
                userId,
                data: dashboard,
                timestamp: new Date().toISOString()
            }));

        } catch (error) {
            this.log(`Erro enviando update para cliente ${clientId}: ${error.message}`, 'ERROR');
        }
    }

    broadcastToClients(type, data) {
        const message = JSON.stringify({
            type,
            ...data,
            timestamp: new Date().toISOString()
        });

        this.clients.forEach((client, clientId) => {
            try {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            } catch (error) {
                this.log(`Erro broadcast para cliente ${clientId}: ${error.message}`, 'ERROR');
                this.clients.delete(clientId);
            }
        });

        this.log(`Broadcast enviado para ${this.clients.size} clientes: ${type}`);
    }

    // 🔄 Atualização automática a cada 30 segundos
    startAutoUpdate() {
        setInterval(async () => {
            try {
                // Atualizar dashboards de clientes conectados
                for (const [clientId, client] of this.clients) {
                    if (client.dashboardProfile && client.readyState === WebSocket.OPEN) {
                        await this.sendDashboardUpdate(clientId, client.dashboardProfile, client.userId);
                    }
                }
            } catch (error) {
                this.log(`Erro no auto-update: ${error.message}`, 'ERROR');
            }
        }, 30000); // 30 segundos

        this.log('Auto-update iniciado (30s intervals)', 'SUCCESS');
    }

    start() {
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                this.log(`🚀 Dashboard API Server rodando na porta ${this.port}`, 'SUCCESS');
                this.log(`📊 Dashboard Admin: http://localhost:${this.port}/api/dashboard/admin`);
                this.log(`🤝 Dashboard Afiliado: http://localhost:${this.port}/api/dashboard/affiliate/ID`);
                this.log(`👤 Dashboard Usuário: http://localhost:${this.port}/api/dashboard/user/ID`);
                this.log(`🌐 WebSocket: ws://localhost:${this.port}`);
                
                // Iniciar auto-update
                this.startAutoUpdate();
                
                resolve();
            });
        });
    }
}

// 🚀 Auto-start se executado diretamente
if (require.main === module) {
    const server = new DashboardAPIServer(3002);
    server.start().catch(console.error);
}

module.exports = DashboardAPIServer;
