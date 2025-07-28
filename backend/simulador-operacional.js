#!/usr/bin/env node
/**
 * 📊 ENDPOINTS DE MONITORAMENTO OPERACIONAL
 * Adiciona endpoints para monitorar sinais e operações em tempo real
 */

// Simulação de dados operacionais para demonstração
const operationalData = {
    signals: {
        total_signals: 0,
        today_signals: 0,
        last_signal: null,
        success_rate: 0,
        signals_history: []
    },
    operations: {
        total_operations: 0,
        today_operations: 0,
        processing_queue: 0,
        last_operation: null,
        avg_processing_time: 0,
        operations_history: []
    },
    trading: {
        trading_enabled: false,
        active_strategies: 0,
        pending_orders: 0,
        last_trade_execution: null
    }
};

// Função para simular recebimento de sinal
function simulateSignalReceived(signalData = {}) {
    const now = new Date();
    const signal = {
        id: `signal_${Date.now()}`,
        timestamp: now.toISOString(),
        type: signalData.type || 'BUY',
        symbol: signalData.symbol || 'BTCUSDT',
        price: signalData.price || Math.random() * 50000 + 20000,
        source: signalData.source || 'TradingView',
        processed: false,
        ...signalData
    };

    operationalData.signals.total_signals++;
    
    // Verificar se é de hoje
    const today = new Date().toDateString();
    if (now.toDateString() === today) {
        operationalData.signals.today_signals++;
    }
    
    operationalData.signals.last_signal = now.toISOString();
    operationalData.signals.signals_history.unshift(signal);
    
    // Manter apenas os últimos 50 sinais
    if (operationalData.signals.signals_history.length > 50) {
        operationalData.signals.signals_history = operationalData.signals.signals_history.slice(0, 50);
    }
    
    // Simular processamento
    setTimeout(() => {
        simulateOperationProcessing(signal);
    }, Math.random() * 2000 + 500);
    
    console.log(`📡 SINAL RECEBIDO: ${signal.type} ${signal.symbol} @ ${signal.price}`);
    return signal;
}

// Função para simular processamento de operação
function simulateOperationProcessing(signal) {
    const now = new Date();
    const processingTime = Math.random() * 1000 + 200;
    
    const operation = {
        id: `op_${Date.now()}`,
        signal_id: signal.id,
        timestamp: now.toISOString(),
        type: 'SIGNAL_PROCESSING',
        status: 'COMPLETED',
        processing_time: Math.round(processingTime),
        result: 'SUCCESS'
    };

    operationalData.operations.total_operations++;
    
    // Verificar se é de hoje
    const today = new Date().toDateString();
    if (now.toDateString() === today) {
        operationalData.operations.today_operations++;
    }
    
    operationalData.operations.last_operation = now.toISOString();
    operationalData.operations.operations_history.unshift(operation);
    
    // Calcular tempo médio de processamento
    const recentOps = operationalData.operations.operations_history.slice(0, 10);
    const avgTime = recentOps.reduce((sum, op) => sum + op.processing_time, 0) / recentOps.length;
    operationalData.operations.avg_processing_time = Math.round(avgTime);
    
    // Manter apenas as últimas 50 operações
    if (operationalData.operations.operations_history.length > 50) {
        operationalData.operations.operations_history = operationalData.operations.operations_history.slice(0, 50);
    }
    
    // Marcar sinal como processado
    const signalIndex = operationalData.signals.signals_history.findIndex(s => s.id === signal.id);
    if (signalIndex !== -1) {
        operationalData.signals.signals_history[signalIndex].processed = true;
    }
    
    console.log(`⚙️ OPERAÇÃO PROCESSADA: ${operation.id} em ${processingTime}ms`);
    return operation;
}

// Função para simular atividade de trading
function simulateTradingActivity() {
    // Ativar trading aleatoriamente
    operationalData.trading.trading_enabled = Math.random() > 0.3;
    operationalData.trading.active_strategies = Math.floor(Math.random() * 5) + 1;
    operationalData.trading.pending_orders = Math.floor(Math.random() * 10);
    
    if (operationalData.trading.trading_enabled && Math.random() > 0.7) {
        operationalData.trading.last_trade_execution = new Date().toISOString();
        console.log(`📈 TRADE EXECUTADO: ${new Date().toLocaleTimeString('pt-BR')}`);
    }
}

// Endpoints para o sistema
const endpoints = {
    '/api/admin/signals/stats': () => {
        const successfulSignals = operationalData.signals.signals_history.filter(s => s.processed).length;
        const successRate = operationalData.signals.total_signals > 0 ? 
            (successfulSignals / operationalData.signals.total_signals * 100).toFixed(1) : 0;
        
        return {
            total_signals: operationalData.signals.total_signals,
            today_signals: operationalData.signals.today_signals,
            last_signal: operationalData.signals.last_signal,
            success_rate: parseFloat(successRate),
            recent_signals: operationalData.signals.signals_history.slice(0, 5)
        };
    },
    
    '/api/admin/operations/stats': () => {
        return {
            total_operations: operationalData.operations.total_operations,
            today_operations: operationalData.operations.today_operations,
            processing_queue: Math.floor(Math.random() * 3), // Simular fila dinâmica
            last_operation: operationalData.operations.last_operation,
            avg_processing_time: operationalData.operations.avg_processing_time,
            recent_operations: operationalData.operations.operations_history.slice(0, 5)
        };
    },
    
    '/api/admin/trading/flow-status': () => {
        return {
            trading_enabled: operationalData.trading.trading_enabled,
            active_strategies: operationalData.trading.active_strategies,
            pending_orders: operationalData.trading.pending_orders,
            last_trade_execution: operationalData.trading.last_trade_execution
        };
    }
};

// Simulador automático
function startSimulation() {
    console.log('🚀 INICIANDO SIMULAÇÃO OPERACIONAL COINBITCLUB');
    console.log('=' .repeat(60));
    
    // Simular sinais a cada 30-120 segundos
    setInterval(() => {
        if (Math.random() > 0.4) { // 60% chance
            const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT'];
            const types = ['BUY', 'SELL'];
            
            simulateSignalReceived({
                type: types[Math.floor(Math.random() * types.length)],
                symbol: symbols[Math.floor(Math.random() * symbols.length)],
                source: Math.random() > 0.5 ? 'TradingView' : 'Custom Strategy'
            });
        }
    }, Math.random() * 90000 + 30000); // 30-120 segundos
    
    // Simular atividade de trading a cada 60 segundos
    setInterval(() => {
        simulateTradingActivity();
    }, 60000);
    
    // Simular alguns sinais iniciais
    setTimeout(() => simulateSignalReceived({ type: 'BUY', symbol: 'BTCUSDT' }), 2000);
    setTimeout(() => simulateSignalReceived({ type: 'SELL', symbol: 'ETHUSDT' }), 5000);
    setTimeout(() => simulateSignalReceived({ type: 'BUY', symbol: 'ADAUSDT' }), 8000);
    
    console.log('✅ Simulação ativa - dados operacionais sendo gerados...');
    console.log('📡 Sinais serão gerados automaticamente');
    console.log('⚙️ Operações serão processadas automaticamente');
    console.log('📈 Atividade de trading será simulada');
}

// Função para integrar com Express
function addMonitoringEndpoints(app) {
    Object.keys(endpoints).forEach(path => {
        app.get(path, (req, res) => {
            try {
                const data = endpoints[path]();
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    });
    
    console.log('📊 Endpoints de monitoramento adicionados:');
    Object.keys(endpoints).forEach(path => {
        console.log(`   GET ${path}`);
    });
}

// Executar se chamado diretamente
if (require.main === module) {
    startSimulation();
    
    // Manter o processo rodando
    setInterval(() => {
        const stats = endpoints['/api/admin/signals/stats']();
        console.log(`📊 Stats: ${stats.total_signals} sinais, ${stats.today_signals} hoje, taxa: ${stats.success_rate}%`);
    }, 30000);
}

module.exports = {
    simulateSignalReceived,
    simulateOperationProcessing,
    simulateTradingActivity,
    addMonitoringEndpoints,
    startSimulation,
    operationalData,
    endpoints
};
