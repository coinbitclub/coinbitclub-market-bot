/**
 * 📱 CLIENTE DASHBOARD LIVE DATA - FRONTEND
 * Exemplo de integração do WebSocket no frontend React/Vue/Vanilla JS
 */

class DashboardClient {
    constructor(userId, userName, authToken = null) {
        this.userId = userId;
        this.userName = userName;
        this.authToken = authToken;
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000; // 5 segundos
        
        // Callbacks para eventos
        this.onConnect = null;
        this.onDisconnect = null;
        this.onSystemUpdate = null;
        this.onUserUpdate = null;
        this.onNewOperation = null;
        this.onOperationClosed = null;
        this.onLiveUpdate = null;
        this.onError = null;
        
        // Dados em cache
        this.data = {
            system: null,
            user: null,
            market: null,
            operations: []
        };
    }

    /**
     * 🔗 Conectar ao WebSocket
     */
    connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            
            let wsUrl = `${protocol}//${host}/ws/dashboard?userId=${this.userId}&userName=${encodeURIComponent(this.userName)}`;
            
            if (this.authToken) {
                wsUrl += `&token=${this.authToken}`;
            }
            
            console.log('📡 Conectando ao Dashboard Live Data:', wsUrl);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = this.handleOpen.bind(this);
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onclose = this.handleClose.bind(this);
            this.ws.onerror = this.handleError.bind(this);
            
        } catch (error) {
            console.error('❌ Erro ao conectar WebSocket:', error);
            if (this.onError) this.onError(error);
        }
    }

    /**
     * ✅ Conexão estabelecida
     */
    handleOpen() {
        console.log('✅ Dashboard Live Data conectado');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Enviar ping inicial
        this.ping();
        
        if (this.onConnect) this.onConnect();
    }

    /**
     * 📨 Processar mensagens recebidas
     */
    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            
            console.log('📨 Dashboard:', message.type, message);
            
            switch (message.type) {
                case 'initial_data':
                    this.handleInitialData(message.data);
                    break;
                    
                case 'live_update':
                    this.handleLiveUpdate(message.data);
                    break;
                    
                case 'user_update':
                    this.handleUserUpdate(message.data);
                    break;
                    
                case 'system_update':
                    this.handleSystemUpdate(message);
                    break;
                    
                case 'new_operation':
                    this.handleNewOperation(message.data);
                    break;
                    
                case 'operation_closed':
                    this.handleOperationClosed(message.data);
                    break;
                    
                case 'admin_message':
                case 'admin_broadcast':
                    this.handleAdminMessage(message.data);
                    break;
                    
                case 'pong':
                    // Resposta do ping
                    break;
                    
                default:
                    console.log('📨 Tipo de mensagem não reconhecido:', message.type);
            }
            
        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
            if (this.onError) this.onError(error);
        }
    }

    /**
     * 📊 Processar dados iniciais
     */
    handleInitialData(data) {
        this.data = {
            system: data.system,
            user: data.user,
            market: data.market,
            operations: data.user?.trading?.openOperations || []
        };
        
        // Disparar callback
        if (this.onUserUpdate) {
            this.onUserUpdate(this.data);
        }
        
        console.log('📊 Dados iniciais carregados:', this.data);
    }

    /**
     * 🔄 Processar atualização ao vivo (a cada minuto)
     */
    handleLiveUpdate(data) {
        // Atualizar cache
        if (data.system) this.data.system = data.system;
        if (data.user) this.data.user = data.user;
        if (data.market) this.data.market = data.market;
        
        // Atualizar operações
        if (data.user?.trading?.openOperations) {
            this.data.operations = data.user.trading.openOperations;
        }
        
        // Disparar callback
        if (this.onLiveUpdate) {
            this.onLiveUpdate(this.data);
        }
        
        console.log('🔄 Atualização ao vivo recebida');
    }

    /**
     * 👤 Processar atualização do usuário
     */
    handleUserUpdate(data) {
        if (data.user) this.data.user = data.user;
        if (data.system) this.data.system = data.system;
        
        if (this.onUserUpdate) {
            this.onUserUpdate(this.data);
        }
    }

    /**
     * 🎛️ Processar atualização do sistema
     */
    handleSystemUpdate(message) {
        if (this.onSystemUpdate) {
            this.onSystemUpdate(message.event, message.data);
        }
    }

    /**
     * 🆕 Processar nova operação
     */
    handleNewOperation(operation) {
        // Adicionar à lista de operações
        this.data.operations.push(operation);
        
        if (this.onNewOperation) {
            this.onNewOperation(operation);
        }
        
        // Mostrar notificação
        this.showNotification('Nova Operação', 
            `${operation.symbol} ${operation.side} aberta`);
    }

    /**
     * 🔚 Processar operação fechada
     */
    handleOperationClosed(operation) {
        // Remover da lista de operações abertas
        this.data.operations = this.data.operations.filter(op => op.id !== operation.id);
        
        if (this.onOperationClosed) {
            this.onOperationClosed(operation);
        }
        
        // Mostrar notificação
        const profit = operation.finalPnL > 0 ? 'LUCRO' : 'PREJUÍZO';
        const amount = Math.abs(operation.finalPnL).toFixed(2);
        this.showNotification('Operação Fechada', 
            `${profit} de $${amount} - ${operation.reason}`);
    }

    /**
     * 📢 Processar mensagem admin
     */
    handleAdminMessage(message) {
        this.showNotification('Mensagem do Sistema', message);
    }

    /**
     * ❌ Conexão fechada
     */
    handleClose() {
        console.log('❌ Dashboard Live Data desconectado');
        this.isConnected = false;
        
        if (this.onDisconnect) this.onDisconnect();
        
        // Tentar reconectar automaticamente
        this.attemptReconnect();
    }

    /**
     * 💥 Erro na conexão
     */
    handleError(error) {
        console.error('❌ Erro no WebSocket:', error);
        if (this.onError) this.onError(error);
    }

    /**
     * 🔄 Tentar reconectar
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ Máximo de tentativas de reconexão atingido');
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectInterval);
    }

    /**
     * 💓 Enviar ping
     */
    ping() {
        if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
            this.send({ type: 'ping' });
        }
    }

    /**
     * 📤 Enviar mensagem
     */
    send(data) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    /**
     * 🔔 Mostrar notificação
     */
    showNotification(title, message) {
        // Notificação do navegador
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/favicon.ico'
            });
        }
        
        // Callback customizado
        if (this.onNotification) {
            this.onNotification(title, message);
        }
        
        console.log(`🔔 ${title}: ${message}`);
    }

    /**
     * 🔍 Solicitar atualização manual
     */
    requestUpdate() {
        this.send({ type: 'request_update' });
    }

    /**
     * 📊 Assinar símbolo específico
     */
    subscribeSymbol(symbol) {
        this.send({ 
            type: 'subscribe_symbol', 
            symbol: symbol 
        });
    }

    /**
     * 📊 Cancelar assinatura de símbolo
     */
    unsubscribeSymbol(symbol) {
        this.send({ 
            type: 'unsubscribe_symbol', 
            symbol: symbol 
        });
    }

    /**
     * 🚪 Desconectar
     */
    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Cliente desconectando');
            this.ws = null;
        }
        this.isConnected = false;
    }

    /**
     * 📊 Obter dados atuais
     */
    getCurrentData() {
        return { ...this.data };
    }

    /**
     * 🎯 Configurar callbacks
     */
    setCallbacks(callbacks) {
        this.onConnect = callbacks.onConnect || null;
        this.onDisconnect = callbacks.onDisconnect || null;
        this.onSystemUpdate = callbacks.onSystemUpdate || null;
        this.onUserUpdate = callbacks.onUserUpdate || null;
        this.onNewOperation = callbacks.onNewOperation || null;
        this.onOperationClosed = callbacks.onOperationClosed || null;
        this.onLiveUpdate = callbacks.onLiveUpdate || null;
        this.onError = callbacks.onError || null;
        this.onNotification = callbacks.onNotification || null;
    }
}

// ========== EXEMPLO DE USO ==========

// Inicialização
const dashboard = new DashboardClient('user123', 'João Silva', 'jwt_token_here');

// Configurar callbacks
dashboard.setCallbacks({
    onConnect: () => {
        console.log('🎉 Dashboard conectado!');
        // Atualizar UI para mostrar status online
    },
    
    onDisconnect: () => {
        console.log('😞 Dashboard desconectado');
        // Atualizar UI para mostrar status offline
    },
    
    onLiveUpdate: (data) => {
        console.log('📊 Dados atualizados:', data);
        // Atualizar componentes do dashboard
        updateDashboardUI(data);
    },
    
    onNewOperation: (operation) => {
        console.log('🆕 Nova operação:', operation);
        // Adicionar à lista de operações na UI
        addOperationToUI(operation);
    },
    
    onOperationClosed: (operation) => {
        console.log('🔚 Operação fechada:', operation);
        // Remover da lista e mostrar resultado
        removeOperationFromUI(operation);
    },
    
    onSystemUpdate: (event, data) => {
        console.log('🎛️ Sistema:', event, data);
        // Atualizar status do sistema na UI
    },
    
    onError: (error) => {
        console.error('❌ Erro:', error);
        // Mostrar erro na UI
    },
    
    onNotification: (title, message) => {
        // Mostrar notificação customizada na UI
        showCustomNotification(title, message);
    }
});

// Conectar
dashboard.connect();

// Funções auxiliares para integração com UI (exemplos)
function updateDashboardUI(data) {
    // Atualizar gráficos, estatísticas, etc.
    document.getElementById('balance').textContent = `$${data.user?.profile?.balance || 0}`;
    document.getElementById('profit').textContent = `$${data.user?.profile?.totalProfit || 0}`;
    document.getElementById('operations').textContent = data.user?.profile?.totalOperations || 0;
    document.getElementById('winRate').textContent = `${data.user?.profile?.winRate || 0}%`;
}

function addOperationToUI(operation) {
    // Adicionar nova operação à tabela
    const table = document.getElementById('operationsTable');
    const row = table.insertRow();
    row.innerHTML = `
        <td>${operation.symbol}</td>
        <td>${operation.side}</td>
        <td>$${operation.entryPrice}</td>
        <td>$0.00</td>
        <td>0%</td>
        <td>Aberta</td>
    `;
}

function removeOperationFromUI(operation) {
    // Remover operação da tabela e mostrar resultado
    const profit = operation.finalPnL > 0 ? 'LUCRO' : 'PREJUÍZO';
    console.log(`Operação ${operation.id}: ${profit} de $${Math.abs(operation.finalPnL)}`);
}

function showCustomNotification(title, message) {
    // Implementar notificação customizada na UI
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `<strong>${title}</strong><br>${message}`;
    document.getElementById('notifications').appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Solicitar permissão para notificações
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardClient;
}
