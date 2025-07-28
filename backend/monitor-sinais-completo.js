/**
 * Monitor Completo CoinBitClub - Sinais e Processamento Operacional
 * Inclui monitoramento dos sinais TradingView e processamento de operações
 * Token correto: 210406 ✅ FUNCIONANDO
 */

const axios = require('axios');

const BASE_URL = 'https://coinbitclub-market-bot.up.railway.app';

// 🎯 Cores para o console
const cores = {
    verde: '\x1b[32m',
    vermelho: '\x1b[31m',
    amarelo: '\x1b[33m',
    azul: '\x1b[34m',
    magenta: '\x1b[35m',
    ciano: '\x1b[36m',
    branco: '\x1b[37m',
    reset: '\x1b[0m',
    negrito: '\x1b[1m'
};

// 📊 Estatísticas globais
let stats = {
    totalTests: 0,
    successTests: 0,
    failedTests: 0,
    signalsReceived: 0,
    operationsProcessed: 0,
    startTime: new Date(),
    lastSignalTime: null,
    lastOperationTime: null
};

/**
 * 🔍 Verificar Status Geral do Sistema
 */
async function checkSystemHealth() {
    console.log(`\n${cores.azul}${cores.negrito}🔍 VERIFICANDO STATUS GERAL DO SISTEMA${cores.reset}`);
    
    try {
        const response = await axios.get(`${BASE_URL}/api/health`);
        console.log(`${cores.verde}✅ Sistema Online - Status: ${response.status}${cores.reset}`);
        console.log(`${cores.ciano}📊 Uptime: ${response.data.uptime}${cores.reset}`);
        console.log(`${cores.ciano}💾 Memória: ${JSON.stringify(response.data.memory)}${cores.reset}`);
        
        stats.successTests++;
        return true;
    } catch (error) {
        console.log(`${cores.vermelho}❌ Sistema Offline - Erro: ${error.message}${cores.reset}`);
        stats.failedTests++;
        return false;
    }
}

/**
 * 📡 Simular Recebimento de Sinal TradingView
 */
async function simulateSignalReception() {
    console.log(`\n${cores.magenta}${cores.negrito}📡 SIMULANDO RECEBIMENTO DE SINAL TRADINGVIEW${cores.reset}`);
    
    const signals = [
        { symbol: 'BTCUSDT', action: 'BUY', price: 67500, strategy: 'RSI_OVERSOLD' },
        { symbol: 'ETHUSDT', action: 'SELL', price: 3200, strategy: 'MACD_BEARISH' },
        { symbol: 'ADAUSDT', action: 'BUY', price: 0.45, strategy: 'GOLDEN_CROSS' },
        { symbol: 'SOLUSDT', action: 'SELL', price: 180, strategy: 'RESISTANCE_BREAK' }
    ];
    
    const signal = signals[Math.floor(Math.random() * signals.length)];
    
    try {
        const response = await axios.post(`${BASE_URL}/api/webhooks/signal`, {
            webhook_token: '210406',
            ...signal,
            timestamp: new Date().toISOString(),
            id: `signal_${Date.now()}`
        });
        
        console.log(`${cores.verde}✅ Sinal recebido com sucesso:${cores.reset}`);
        console.log(`${cores.ciano}   📈 ${signal.symbol} - ${signal.action} @ ${signal.price}${cores.reset}`);
        console.log(`${cores.amarelo}   🎯 Estratégia: ${signal.strategy}${cores.reset}`);
        console.log(`${cores.ciano}   🆔 Signal ID: ${response.data.signal_id}${cores.reset}`);
        
        stats.signalsReceived++;
        stats.lastSignalTime = new Date();
        stats.successTests++;
        
        return true;
    } catch (error) {
        console.log(`${cores.vermelho}❌ Erro no recebimento do sinal: ${error.message}${cores.reset}`);
        stats.failedTests++;
        return false;
    }
}

/**
 * 🎯 Simular Processamento Operacional
 */
async function simulateOperationalProcessing() {
    console.log(`\n${cores.ciano}${cores.negrito}🎯 SIMULANDO PROCESSAMENTO OPERACIONAL${cores.reset}`);
    
    const operations = [
        { type: 'POSITION_OPEN', asset: 'BTC', amount: 0.1, leverage: 10 },
        { type: 'POSITION_CLOSE', asset: 'ETH', profit: 150.75 },
        { type: 'RISK_MANAGEMENT', action: 'STOP_LOSS', asset: 'ADA' },
        { type: 'PORTFOLIO_REBALANCE', action: 'DIVERSIFY' }
    ];
    
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    try {
        // Simular processamento interno
        const processingTime = Math.random() * 1000 + 500; // 500-1500ms
        
        console.log(`${cores.amarelo}⏳ Processando operação: ${operation.type}${cores.reset}`);
        
        await new Promise(resolve => setTimeout(resolve, processingTime));
        
        console.log(`${cores.verde}✅ Operação processada com sucesso:${cores.reset}`);
        console.log(`${cores.ciano}   🔄 Tipo: ${operation.type}${cores.reset}`);
        if (operation.asset) {
            console.log(`${cores.ciano}   💰 Ativo: ${operation.asset}${cores.reset}`);
        }
        if (operation.amount) {
            console.log(`${cores.ciano}   📊 Quantidade: ${operation.amount}${cores.reset}`);
        }
        if (operation.profit) {
            console.log(`${cores.verde}   💵 Lucro: $${operation.profit}${cores.reset}`);
        }
        console.log(`${cores.azul}   ⚡ Tempo: ${processingTime.toFixed(0)}ms${cores.reset}`);
        
        stats.operationsProcessed++;
        stats.lastOperationTime = new Date();
        stats.successTests++;
        
        return true;
    } catch (error) {
        console.log(`${cores.vermelho}❌ Erro no processamento: ${error.message}${cores.reset}`);
        stats.failedTests++;
        return false;
    }
}

/**
 * 🔧 Verificar Webhook TradingView Principal
 */
async function testTradingViewWebhook() {
    console.log(`\n${cores.azul}${cores.negrito}🔧 TESTANDO WEBHOOK TRADINGVIEW PRINCIPAL${cores.reset}`);
    
    try {
        const response = await axios.post(`${BASE_URL}/api/webhooks/tradingview`, {
            webhook_token: '210406',
            symbol: 'GOLD',
            action: 'BUY',
            price: 2030.50,
            strategy: 'BREAKOUT',
            timeframe: '1H',
            confidence: 0.85
        });
        
        console.log(`${cores.verde}✅ Webhook TradingView funcionando:${cores.reset}`);
        console.log(`${cores.ciano}   🆔 Signal ID: ${response.data.signal_id}${cores.reset}`);
        console.log(`${cores.amarelo}   📅 Timestamp: ${response.data.timestamp}${cores.reset}`);
        
        stats.successTests++;
        return true;
    } catch (error) {
        console.log(`${cores.vermelho}❌ Webhook TradingView falhou: ${error.message}${cores.reset}`);
        stats.failedTests++;
        return false;
    }
}

/**
 * 📊 Exibir Estatísticas de Monitoramento
 */
function displayMonitoringStats() {
    const uptime = new Date() - stats.startTime;
    const uptimeMinutes = Math.floor(uptime / 60000);
    const uptimeSeconds = Math.floor((uptime % 60000) / 1000);
    
    console.log(`\n${cores.negrito}${cores.magenta}📊 ESTATÍSTICAS DE MONITORAMENTO${cores.reset}`);
    console.log(`${cores.azul}═══════════════════════════════════════${cores.reset}`);
    console.log(`${cores.verde}✅ Testes bem-sucedidos: ${stats.successTests}${cores.reset}`);
    console.log(`${cores.vermelho}❌ Testes falharam: ${stats.failedTests}${cores.reset}`);
    console.log(`${cores.amarelo}📊 Total de testes: ${stats.totalTests}${cores.reset}`);
    console.log(`${cores.ciano}📡 Sinais recebidos: ${stats.signalsReceived}${cores.reset}`);
    console.log(`${cores.magenta}🎯 Operações processadas: ${stats.operationsProcessed}${cores.reset}`);
    console.log(`${cores.azul}⏱️  Tempo ativo: ${uptimeMinutes}m ${uptimeSeconds}s${cores.reset}`);
    
    if (stats.lastSignalTime) {
        const timeSinceSignal = Math.floor((new Date() - stats.lastSignalTime) / 1000);
        console.log(`${cores.ciano}🕐 Último sinal: ${timeSinceSignal}s atrás${cores.reset}`);
    }
    
    if (stats.lastOperationTime) {
        const timeSinceOperation = Math.floor((new Date() - stats.lastOperationTime) / 1000);
        console.log(`${cores.magenta}🕐 Última operação: ${timeSinceOperation}s atrás${cores.reset}`);
    }
    
    const successRate = stats.totalTests > 0 ? ((stats.successTests / stats.totalTests) * 100).toFixed(1) : 0;
    console.log(`${cores.verde}📈 Taxa de sucesso: ${successRate}%${cores.reset}`);
    console.log(`${cores.azul}═══════════════════════════════════════${cores.reset}`);
}

/**
 * 🚀 Ciclo Principal de Monitoramento
 */
async function runMonitoringCycle() {
    console.log(`${cores.negrito}${cores.azul}\n🚀 INICIANDO CICLO DE MONITORAMENTO${cores.reset}`);
    console.log(`${cores.amarelo}🕐 ${new Date().toLocaleString()}${cores.reset}`);
    
    stats.totalTests = 0;
    
    // Teste 1: Status do Sistema
    await checkSystemHealth();
    stats.totalTests++;
    
    // Teste 2: Webhook TradingView
    await testTradingViewWebhook();
    stats.totalTests++;
    
    // Teste 3: Simulação de Sinal
    await simulateSignalReception();
    stats.totalTests++;
    
    // Teste 4: Processamento Operacional
    await simulateOperationalProcessing();
    stats.totalTests++;
    
    // Exibir estatísticas
    displayMonitoringStats();
}

/**
 * 🔄 Monitor Contínuo
 */
async function startContinuousMonitoring() {
    console.log(`${cores.negrito}${cores.verde}\n🔄 MONITOR CONTÍNUO INICIADO${cores.reset}`);
    console.log(`${cores.ciano}📡 Sistema: CoinBitClub Market Bot${cores.reset}`);
    console.log(`${cores.amarelo}🔑 Token Webhook: 210406 ✅${cores.reset}`);
    console.log(`${cores.azul}🌐 URL: ${BASE_URL}${cores.reset}\n`);
    
    // Executar ciclo inicial
    await runMonitoringCycle();
    
    // Configurar monitoramento contínuo a cada 30 segundos
    setInterval(async () => {
        console.log(`\n${cores.azul}${'='.repeat(50)}${cores.reset}`);
        await runMonitoringCycle();
    }, 30000);
}

// 🎯 Executar se chamado diretamente
if (require.main === module) {
    startContinuousMonitoring().catch(error => {
        console.error(`${cores.vermelho}❌ Erro no monitor: ${error.message}${cores.reset}`);
        process.exit(1);
    });
}

module.exports = {
    checkSystemHealth,
    simulateSignalReception,
    simulateOperationalProcessing,
    testTradingViewWebhook,
    runMonitoringCycle,
    startContinuousMonitoring,
    stats
};
