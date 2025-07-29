/**
 * 📡 SISTEMA DE TRANSMISSÃO EM TEMPO REAL
 * Dashboard Live - Dados minuto a minuto para usuários ativos
 */

const WebSocket = require('ws');
const { EventEmitter } = require('events');

class DashboardLiveData extends EventEmitter {
    constructor(orchestrator) {
        super();
        this.orchestrator = orchestrator;
        this.wss = null;
        this.clients = new Map(); // userId -> websocket connection
        this.dataCache = new Map(); // Cache de dados por usuário
        
        // Configurações
        this.updateInterval = 60000; // 1 minuto
        this.heartbeatInterval = 30000; // 30 segundos
        
        this.isActive = false;
        this.intervals = {
            dataUpdate: null,
            heartbeat: null,
            cleanup: null
        };
    }

    /**
     * 🚀 Inicializar servidor WebSocket
     */
    initialize(server) {
        console.log('📡 Inicializando Dashboard Live Data...');
        
        this.wss = new WebSocket.Server({ 
            server,
            path: '/ws/dashboard',
            verifyClient: this.verifyClient.bind(this)
        });
        
        this.wss.on('connection', this.handleConnection.bind(this));
        this.wss.on('error', this.handleError.bind(this));
        
        this.setupIntervals();
        this.isActive = true;
        
        console.log('✅ Dashboard Live Data ativo na rota /ws/dashboard');
    }

    /**
     * 🔌 Verificar cliente antes da conexão
     */
    verifyClient(info) {
        const url = new URL(info.req.url, 'http://localhost');
        const token = url.searchParams.get('token');
        const userId = url.searchParams.get('userId');
        
        // Aqui você pode adicionar validação de token JWT
        if (!userId) {
            console.log('❌ Conexão rejeitada: userId não fornecido');
            return false;
        }
        
        return true;
    }

    /**
     * 🤝 Gerenciar nova conexão
     */
    handleConnection(ws, req) {
        const url = new URL(req.url, 'http://localhost');
        const userId = url.searchParams.get('userId');
        const userName = url.searchParams.get('userName') || 'Usuário';
        
        console.log(`📱 Nova conexão dashboard: ${userName} (ID: ${userId})`);
        
        // Configurar cliente
        ws.userId = userId;
        ws.userName = userName;
        ws.connectedAt = new Date();
        ws.lastPing = new Date();
        ws.isAlive = true;
        
        // Adicionar à lista de clientes
        this.clients.set(userId, ws);
        
        // Enviar dados iniciais
        this.sendInitialData(ws);
        
        // Configurar handlers
        ws.on('message', (data) => this.handleMessage(ws, data));
        ws.on('close', () => this.handleDisconnection(ws));
        ws.on('error', (error) => this.handleClientError(ws, error));
        ws.on('pong', () => {
            ws.isAlive = true;
            ws.lastPing = new Date();
        });
        
        // Notificar outros clientes
        this.broadcastSystemUpdate('user_connected', {
            userId,
            userName,
            connectedAt: ws.connectedAt
        });
    }

    /**
     * 📤 Enviar dados iniciais para cliente
     */
    async sendInitialData(ws) {
        try {
            const systemStatus = this.orchestrator.getSystemStatus();
            const userData = await this.getUserDashboardData(ws.userId);
            
            const initialData = {
                type: 'initial_data',
                timestamp: new Date().toISOString(),
                data: {
                    system: systemStatus,
                    user: userData,
                    market: systemStatus.marketReading,
                    server: {
                        uptime: Math.floor(process.uptime()),
                        memory: process.memoryUsage(),
                        activeConnections: this.clients.size
                    }
                }
            };
            
            this.sendToClient(ws, initialData);
            
        } catch (error) {
            console.error(`❌ Erro ao enviar dados iniciais para ${ws.userName}:`, error);
        }
    }

    /**
     * 📊 Obter dados do dashboard do usuário
     */
    async getUserDashboardData(userId) {
        try {
            const client = await this.orchestrator.pool.connect();
            
            // Dados básicos do usuário
            const userQuery = await client.query(`
                SELECT 
                    u.id,
                    u.name,
                    u.email,
                    up.account_type,
                    up.balance,
                    up.total_profit,
                    up.total_operations,
                    up.win_rate,
                    s.status as subscription_status,
                    p.name as plan_name
                FROM users u
                LEFT JOIN user_profiles up ON up.user_id = u.id
                LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
                LEFT JOIN plans p ON p.id = s.plan_id
                WHERE u.id = $1
            `, [userId]);
            
            // Operações abertas
            const openOpsQuery = await client.query(`
                SELECT 
                    id,
                    symbol,
                    side,
                    entry_price,
                    quantity,
                    leverage,
                    profit,
                    return_percentage,
                    created_at,
                    ai_confidence
                FROM operations
                WHERE user_id = $1 AND status = 'OPEN'
                ORDER BY created_at DESC
            `, [userId]);
            
            // Histórico recente (últimas 10 operações)
            const historyQuery = await client.query(`
                SELECT 
                    id,
                    symbol,
                    side,
                    entry_price,
                    exit_price,
                    profit,
                    return_percentage,
                    exit_reason,
                    created_at,
                    closed_at
                FROM operations
                WHERE user_id = $1 AND status = 'CLOSED'
                ORDER BY closed_at DESC
                LIMIT 10
            `, [userId]);
            
            // Estatísticas do dia
            const todayStatsQuery = await client.query(`
                SELECT 
                    COUNT(*) as operations_today,
                    COALESCE(SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END), 0) as wins_today,
                    COALESCE(SUM(profit), 0) as profit_today,
                    COALESCE(AVG(return_percentage), 0) as avg_return_today
                FROM operations
                WHERE user_id = $1 
                  AND status = 'CLOSED'
                  AND DATE(closed_at) = CURRENT_DATE
            `, [userId]);
            
            client.release();
            
            const user = userQuery.rows[0] || {};
            const openOperations = openOpsQuery.rows;
            const recentHistory = historyQuery.rows;
            const todayStats = todayStatsQuery.rows[0] || {};
            
            return {
                profile: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    accountType: user.account_type,
                    balance: parseFloat(user.balance || 0),
                    totalProfit: parseFloat(user.total_profit || 0),
                    totalOperations: parseInt(user.total_operations || 0),
                    winRate: parseFloat(user.win_rate || 0),
                    subscription: {
                        status: user.subscription_status,
                        plan: user.plan_name
                    }
                },
                trading: {
                    openOperations: openOperations.map(op => ({
                        id: op.id,
                        symbol: op.symbol,
                        side: op.side,
                        entryPrice: parseFloat(op.entry_price),
                        quantity: parseFloat(op.quantity),
                        leverage: parseInt(op.leverage),
                        currentProfit: parseFloat(op.profit || 0),
                        returnPercentage: parseFloat(op.return_percentage || 0),
                        duration: this.calculateDuration(op.created_at),
                        aiConfidence: parseFloat(op.ai_confidence || 0)
                    })),
                    recentHistory: recentHistory.map(op => ({
                        id: op.id,
                        symbol: op.symbol,
                        side: op.side,
                        entryPrice: parseFloat(op.entry_price),
                        exitPrice: parseFloat(op.exit_price),
                        profit: parseFloat(op.profit),
                        returnPercentage: parseFloat(op.return_percentage),
                        reason: op.exit_reason,
                        duration: this.calculateDuration(op.created_at, op.closed_at)
                    }))
                },
                statistics: {
                    today: {
                        operations: parseInt(todayStats.operations_today || 0),
                        wins: parseInt(todayStats.wins_today || 0),
                        profit: parseFloat(todayStats.profit_today || 0),
                        averageReturn: parseFloat(todayStats.avg_return_today || 0),
                        winRate: todayStats.operations_today > 0 ? 
                            (todayStats.wins_today / todayStats.operations_today) * 100 : 0
                    }
                }
            };
            
        } catch (error) {
            console.error(`❌ Erro ao obter dados do usuário ${userId}:`, error);
            return {
                profile: { id: userId, name: 'Usuário', accountType: 'demo' },
                trading: { openOperations: [], recentHistory: [] },
                statistics: { today: { operations: 0, wins: 0, profit: 0, winRate: 0 } }
            };
        }
    }

    /**
     * 📨 Gerenciar mensagens dos clientes
     */
    handleMessage(ws, data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'ping':
                    this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
                    break;
                    
                case 'request_update':
                    this.sendUserUpdate(ws);
                    break;
                    
                case 'subscribe_symbol':
                    this.subscribeToSymbol(ws, message.symbol);
                    break;
                    
                case 'unsubscribe_symbol':
                    this.unsubscribeFromSymbol(ws, message.symbol);
                    break;
                    
                default:
                    console.log(`📨 Mensagem não reconhecida de ${ws.userName}:`, message.type);
            }
            
        } catch (error) {
            console.error(`❌ Erro ao processar mensagem de ${ws.userName}:`, error);
        }
    }

    /**
     * 🔄 Configurar intervalos de atualização
     */
    setupIntervals() {
        // Atualização de dados a cada minuto
        this.intervals.dataUpdate = setInterval(() => {
            this.broadcastUserUpdates();
        }, this.updateInterval);
        
        // Heartbeat a cada 30 segundos
        this.intervals.heartbeat = setInterval(() => {
            this.performHeartbeat();
        }, this.heartbeatInterval);
        
        // Limpeza de conexões mortas a cada 5 minutos
        this.intervals.cleanup = setInterval(() => {
            this.cleanupDeadConnections();
        }, 300000);
        
        console.log('⏰ Intervalos de atualização configurados');
    }

    /**
     * 📡 Transmitir atualizações para todos os usuários
     */
    async broadcastUserUpdates() {
        if (this.clients.size === 0) return;
        
        console.log(`📡 Enviando atualizações para ${this.clients.size} clientes conectados`);
        
        const systemStatus = this.orchestrator.getSystemStatus();
        
        for (const [userId, ws] of this.clients) {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    const userData = await this.getUserDashboardData(userId);
                    
                    const updateData = {
                        type: 'live_update',
                        timestamp: new Date().toISOString(),
                        data: {
                            system: {
                                isActive: systemStatus.isActive,
                                tradingEnabled: systemStatus.tradingEnabled,
                                activeOperations: systemStatus.activeOperations,
                                uptime: Math.floor(process.uptime())
                            },
                            user: userData,
                            market: systemStatus.marketReading
                        }
                    };
                    
                    this.sendToClient(ws, updateData);
                    
                } catch (error) {
                    console.error(`❌ Erro ao enviar atualização para ${ws.userName}:`, error);
                }
            }
        }
    }

    /**
     * 💓 Realizar heartbeat
     */
    performHeartbeat() {
        const deadConnections = [];
        
        for (const [userId, ws] of this.clients) {
            if (ws.isAlive === false) {
                deadConnections.push(userId);
                ws.terminate();
            } else {
                ws.isAlive = false;
                ws.ping();
            }
        }
        
        // Remover conexões mortas
        deadConnections.forEach(userId => {
            this.clients.delete(userId);
            console.log(`💀 Conexão morta removida: ${userId}`);
        });
    }

    /**
     * 🧹 Limpar conexões mortas
     */
    cleanupDeadConnections() {
        const now = new Date();
        const timeout = 5 * 60 * 1000; // 5 minutos
        
        for (const [userId, ws] of this.clients) {
            if (ws.readyState !== WebSocket.OPEN || 
                (now - ws.lastPing) > timeout) {
                
                console.log(`🧹 Removendo conexão inativa: ${ws.userName}`);
                ws.terminate();
                this.clients.delete(userId);
            }
        }
    }

    /**
     * 📤 Enviar dados para cliente específico
     */
    sendToClient(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(data));
            } catch (error) {
                console.error(`❌ Erro ao enviar dados para ${ws.userName}:`, error);
            }
        }
    }

    /**
     * 📢 Transmitir para todos os clientes
     */
    broadcast(data, excludeUserId = null) {
        for (const [userId, ws] of this.clients) {
            if (userId !== excludeUserId) {
                this.sendToClient(ws, data);
            }
        }
    }

    /**
     * 📊 Transmitir atualização do sistema
     */
    broadcastSystemUpdate(eventType, eventData) {
        const message = {
            type: 'system_update',
            event: eventType,
            data: eventData,
            timestamp: new Date().toISOString()
        };
        
        this.broadcast(message);
    }

    /**
     * 💸 Transmitir nova operação
     */
    broadcastNewOperation(userId, operation) {
        const ws = this.clients.get(userId);
        if (ws) {
            const message = {
                type: 'new_operation',
                data: operation,
                timestamp: new Date().toISOString()
            };
            
            this.sendToClient(ws, message);
        }
    }

    /**
     * 🔚 Transmitir operação fechada
     */
    broadcastOperationClosed(userId, operation) {
        const ws = this.clients.get(userId);
        if (ws) {
            const message = {
                type: 'operation_closed',
                data: operation,
                timestamp: new Date().toISOString()
            };
            
            this.sendToClient(ws, message);
        }
    }

    /**
     * 🔌 Gerenciar desconexão
     */
    handleDisconnection(ws) {
        console.log(`📱 Cliente desconectado: ${ws.userName} (ID: ${ws.userId})`);
        
        this.clients.delete(ws.userId);
        
        // Notificar outros clientes
        this.broadcastSystemUpdate('user_disconnected', {
            userId: ws.userId,
            userName: ws.userName,
            disconnectedAt: new Date().toISOString()
        });
    }

    /**
     * ❌ Gerenciar erro de cliente
     */
    handleClientError(ws, error) {
        console.error(`❌ Erro de cliente ${ws.userName}:`, error);
    }

    /**
     * ❌ Gerenciar erro do servidor
     */
    handleError(error) {
        console.error('❌ Erro do servidor WebSocket:', error);
    }

    /**
     * 📊 Enviar atualização para usuário específico
     */
    async sendUserUpdate(ws) {
        try {
            const userData = await this.getUserDashboardData(ws.userId);
            const systemStatus = this.orchestrator.getSystemStatus();
            
            const message = {
                type: 'user_update',
                data: {
                    user: userData,
                    system: systemStatus
                },
                timestamp: new Date().toISOString()
            };
            
            this.sendToClient(ws, message);
            
        } catch (error) {
            console.error(`❌ Erro ao enviar atualização para ${ws.userName}:`, error);
        }
    }

    /**
     * ⏱️ Calcular duração
     */
    calculateDuration(startTime, endTime = null) {
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date();
        const diff = end - start;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    /**
     * 📊 Obter estatísticas de conexões
     */
    getConnectionStats() {
        return {
            totalConnections: this.clients.size,
            connections: Array.from(this.clients.entries()).map(([userId, ws]) => ({
                userId,
                userName: ws.userName,
                connectedAt: ws.connectedAt,
                lastPing: ws.lastPing,
                isAlive: ws.isAlive
            }))
        };
    }

    /**
     * 🛑 Parar sistema
     */
    stop() {
        console.log('🛑 Parando Dashboard Live Data...');
        
        this.isActive = false;
        
        // Limpar intervalos
        Object.values(this.intervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });
        
        // Fechar todas as conexões
        for (const [userId, ws] of this.clients) {
            ws.close(1000, 'Servidor sendo desligado');
        }
        
        this.clients.clear();
        
        if (this.wss) {
            this.wss.close();
        }
        
        console.log('✅ Dashboard Live Data parado');
    }
}

module.exports = DashboardLiveData;
