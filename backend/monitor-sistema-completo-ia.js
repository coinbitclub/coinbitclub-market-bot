/**
 * 🚀 MONITOR COMPLETO SISTEMA COINBITCLUB - TEMPO REAL
 * Captura: IA, Decisões, Sinais, CoinStats, Ordens e Status
 */

const axios = require('axios');

const BASE_URL = 'https://coinbitclub-market-bot.up.railway.app';

// 🔑 Configurações CoinStats
const COINSTATS_CONFIG = {
    apiKey: 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=',
    endpoints: {
        markets: 'https://openapiv1.coinstats.app/markets',
        fearGreed: 'https://openapiv1.coinstats.app/insights/fear-and-greed',
        dominance: 'https://openapiv1.coinstats.app/insights/btc-dominance?type=24h'
    }
};

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
    negrito: '\x1b[1m',
    brilhante: '\x1b[1m'
};

// 📊 Estado global do sistema
let systemState = {
    startTime: new Date(),
    totalChecks: 0,
    systemHealth: { status: 'unknown', uptime: 0 },
    signals: { received: 0, processed: 0, lastSignal: null },
    aiReports: { generated: 0, lastReport: null },
    marketData: { fearGreed: null, btcDominance: null, lastUpdate: null },
    decisions: { total: 0, buy: 0, sell: 0, hold: 0, lastDecision: null },
    orders: { executed: 0, pending: 0, failed: 0, lastOrder: null },
    performance: { successRate: 0, avgResponseTime: 0 }
};

/**
 * 🔍 1. VERIFICAR HEALTH DO SISTEMA
 */
async function checkSystemHealth() {
    const startTime = Date.now();
    
    try {
        const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 10000 });
        const responseTime = Date.now() - startTime;
        
        systemState.systemHealth = {
            status: 'online',
            uptime: response.data.uptime || 'N/A',
            memory: response.data.memory || {},
            responseTime,
            timestamp: new Date()
        };
        
        console.log(`${cores.verde}✅ SISTEMA ONLINE${cores.reset} - ${responseTime}ms`);
        console.log(`${cores.ciano}   Uptime: ${systemState.systemHealth.uptime}${cores.reset}`);
        
        return true;
    } catch (error) {
        systemState.systemHealth.status = 'offline';
        console.log(`${cores.vermelho}❌ SISTEMA OFFLINE: ${error.message}${cores.reset}`);
        return false;
    }
}

/**
 * 🤖 2. GERAR RELATÓRIO DE IA
 */
async function generateAIReport() {
    console.log(`\n${cores.azul}${cores.negrito}🤖 GERANDO RELATÓRIO DE IA${cores.reset}`);
    
    try {
        // Simular análise de IA baseada nos dados do mercado
        const marketAnalysis = await analyzeMarketWithAI();
        
        const aiReport = {
            id: `ai_report_${Date.now()}`,
            timestamp: new Date(),
            analysis: marketAnalysis,
            confidence: Math.random() * 0.3 + 0.7, // 70-100%
            recommendation: marketAnalysis.recommendation,
            riskLevel: marketAnalysis.riskLevel
        };
        
        systemState.aiReports.generated++;
        systemState.aiReports.lastReport = aiReport;
        
        console.log(`${cores.verde}✅ Relatório IA gerado${cores.reset}`);
        console.log(`${cores.ciano}   ID: ${aiReport.id}${cores.reset}`);
        console.log(`${cores.amarelo}   Recomendação: ${aiReport.recommendation}${cores.reset}`);
        console.log(`${cores.magenta}   Confiança: ${(aiReport.confidence * 100).toFixed(1)}%${cores.reset}`);
        console.log(`${cores.azul}   Risco: ${aiReport.riskLevel}${cores.reset}`);
        
        return aiReport;
    } catch (error) {
        console.log(`${cores.vermelho}❌ Erro ao gerar relatório IA: ${error.message}${cores.reset}`);
        return null;
    }
}

/**
 * 🧠 Análise de IA simulada
 */
async function analyzeMarketWithAI() {
    const fearGreedValue = systemState.marketData.fearGreed?.value || 50;
    const btcDominance = systemState.marketData.btcDominance?.value || 45;
    
    // Lógica de decisão baseada em indicadores
    let recommendation = 'HOLD';
    let riskLevel = 'MEDIUM';
    let reasoning = [];
    
    if (fearGreedValue < 25) {
        recommendation = 'BUY';
        riskLevel = 'HIGH';
        reasoning.push('Fear extremo - oportunidade de compra');
    } else if (fearGreedValue > 75) {
        recommendation = 'SELL';
        riskLevel = 'HIGH';
        reasoning.push('Greed extremo - risco de correção');
    }
    
    if (btcDominance > 50) {
        reasoning.push('Dominância BTC alta - favorece BTC');
    } else {
        reasoning.push('Dominância BTC baixa - favorece altcoins');
    }
    
    return {
        recommendation,
        riskLevel,
        reasoning,
        indicators: {
            fearGreed: fearGreedValue,
            btcDominance,
            marketSentiment: fearGreedValue > 50 ? 'BULLISH' : 'BEARISH'
        }
    };
}

/**
 * 📡 3. CAPTURAR DADOS COINSTATS
 */
async function fetchCoinStatsData() {
    console.log(`\n${cores.magenta}${cores.negrito}📊 COLETANDO DADOS COINSTATS${cores.reset}`);
    
    try {
        // Fear & Greed Index
        const fearGreedResponse = await axios.get(COINSTATS_CONFIG.endpoints.fearGreed, {
            headers: { 'X-API-KEY': COINSTATS_CONFIG.apiKey },
            timeout: 10000
        });
        
        // BTC Dominance
        const dominanceResponse = await axios.get(COINSTATS_CONFIG.endpoints.dominance, {
            headers: { 'X-API-KEY': COINSTATS_CONFIG.apiKey },
            timeout: 10000
        });
        
        systemState.marketData = {
            fearGreed: {
                value: fearGreedResponse.data?.value || 50,
                label: fearGreedResponse.data?.valueClassification || 'Neutral',
                timestamp: new Date()
            },
            btcDominance: {
                value: parseFloat(dominanceResponse.data?.dominance) || 45,
                change24h: dominanceResponse.data?.change24h || 0,
                timestamp: new Date()
            },
            lastUpdate: new Date()
        };
        
        console.log(`${cores.verde}✅ Dados CoinStats atualizados${cores.reset}`);
        console.log(`${cores.amarelo}   Fear & Greed: ${systemState.marketData.fearGreed.value} (${systemState.marketData.fearGreed.label})${cores.reset}`);
        console.log(`${cores.ciano}   BTC Dominance: ${systemState.marketData.btcDominance.value.toFixed(2)}%${cores.reset}`);
        
        return true;
    } catch (error) {
        console.log(`${cores.vermelho}❌ Erro CoinStats: ${error.message}${cores.reset}`);
        return false;
    }
}

/**
 * ⚡ 4. SIMULAR DECISÃO DO SISTEMA
 */
async function makeSystemDecision(aiReport) {
    console.log(`\n${cores.amarelo}${cores.negrito}⚡ PROCESSANDO DECISÃO DO SISTEMA${cores.reset}`);
    
    if (!aiReport) {
        console.log(`${cores.vermelho}❌ Sem relatório de IA para decisão${cores.reset}`);
        return null;
    }
    
    const decision = {
        id: `decision_${Date.now()}`,
        timestamp: new Date(),
        action: aiReport.recommendation,
        confidence: aiReport.confidence,
        reasoning: aiReport.reasoning,
        riskLevel: aiReport.riskLevel,
        parameters: {
            amount: Math.random() * 1000 + 100, // $100-1100
            leverage: Math.random() < 0.3 ? Math.floor(Math.random() * 5) + 2 : 1, // 30% chance de leverage 2-6x
            stopLoss: Math.random() * 5 + 2, // 2-7%
            takeProfit: Math.random() * 10 + 5 // 5-15%
        }
    };
    
    // Atualizar contadores
    systemState.decisions.total++;
    systemState.decisions[decision.action.toLowerCase()]++;
    systemState.decisions.lastDecision = decision;
    
    console.log(`${cores.verde}✅ Decisão tomada: ${decision.action}${cores.reset}`);
    console.log(`${cores.ciano}   Valor: $${decision.parameters.amount.toFixed(2)}${cores.reset}`);
    console.log(`${cores.azul}   Confiança: ${(decision.confidence * 100).toFixed(1)}%${cores.reset}`);
    console.log(`${cores.magenta}   Stop Loss: ${decision.parameters.stopLoss.toFixed(1)}%${cores.reset}`);
    
    return decision;
}

/**
 * 📈 5. SIMULAR EXECUÇÃO DE ORDEM
 */
async function executeOrder(decision) {
    console.log(`\n${cores.ciano}${cores.negrito}📈 EXECUTANDO ORDEM${cores.reset}`);
    
    if (!decision) {
        console.log(`${cores.vermelho}❌ Sem decisão para executar${cores.reset}`);
        return null;
    }
    
    // Simular tempo de execução
    const executionTime = Math.random() * 2000 + 500; // 500ms-2500ms
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // Simular sucesso/falha (95% sucesso)
    const success = Math.random() > 0.05;
    
    const order = {
        id: `order_${Date.now()}`,
        timestamp: new Date(),
        decisionId: decision.id,
        action: decision.action,
        status: success ? 'EXECUTED' : 'FAILED',
        amount: decision.parameters.amount,
        executionTime,
        price: Math.random() * 50000 + 30000, // $30k-80k simulado
        fees: decision.parameters.amount * 0.001 // 0.1% fee
    };
    
    if (success) {
        systemState.orders.executed++;
        console.log(`${cores.verde}✅ Ordem executada com sucesso${cores.reset}`);
        console.log(`${cores.ciano}   ID: ${order.id}${cores.reset}`);
        console.log(`${cores.amarelo}   Preço: $${order.price.toFixed(2)}${cores.reset}`);
        console.log(`${cores.azul}   Tempo: ${order.executionTime.toFixed(0)}ms${cores.reset}`);
    } else {
        systemState.orders.failed++;
        console.log(`${cores.vermelho}❌ Falha na execução da ordem${cores.reset}`);
    }
    
    systemState.orders.lastOrder = order;
    return order;
}

/**
 * 📡 6. SIMULAR RECEBIMENTO DE SINAL TRADINGVIEW
 */
async function simulateSignalReception() {
    console.log(`\n${cores.verde}${cores.negrito}📡 SIMULANDO SINAL TRADINGVIEW${cores.reset}`);
    
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
        
        systemState.signals.received++;
        systemState.signals.processed++;
        systemState.signals.lastSignal = {
            ...signal,
            id: response.data.signal_id,
            timestamp: new Date()
        };
        
        console.log(`${cores.verde}✅ Sinal recebido e processado${cores.reset}`);
        console.log(`${cores.ciano}   ${signal.symbol} - ${signal.action} @ $${signal.price}${cores.reset}`);
        console.log(`${cores.amarelo}   Estratégia: ${signal.strategy}${cores.reset}`);
        
        return signal;
    } catch (error) {
        console.log(`${cores.vermelho}❌ Erro no sinal: ${error.message}${cores.reset}`);
        return null;
    }
}

/**
 * 📊 7. EXIBIR DASHBOARD COMPLETO
 */
function displaySystemDashboard() {
    const uptime = Math.floor((new Date() - systemState.startTime) / 1000);
    const uptimeMinutes = Math.floor(uptime / 60);
    const uptimeSeconds = uptime % 60;
    
    console.log(`\n${cores.negrito}${cores.azul}════════════════════════════════════════════════════════════════${cores.reset}`);
    console.log(`${cores.negrito}${cores.azul}📊 DASHBOARD SISTEMA COINBITCLUB - TEMPO REAL${cores.reset}`);
    console.log(`${cores.negrito}${cores.azul}════════════════════════════════════════════════════════════════${cores.reset}`);
    
    // Status do Sistema
    console.log(`\n${cores.negrito}🔧 STATUS DO SISTEMA:${cores.reset}`);
    console.log(`${cores.verde}   ✅ Sistema: ${systemState.systemHealth.status.toUpperCase()}${cores.reset}`);
    console.log(`${cores.ciano}   ⏱️  Uptime: ${uptimeMinutes}m ${uptimeSeconds}s${cores.reset}`);
    console.log(`${cores.amarelo}   📊 Verificações: ${systemState.totalChecks}${cores.reset}`);
    
    // Dados de Mercado
    console.log(`\n${cores.negrito}📈 DADOS DE MERCADO (COINSTATS):${cores.reset}`);
    if (systemState.marketData.fearGreed) {
        console.log(`${cores.amarelo}   😨 Fear & Greed: ${systemState.marketData.fearGreed.value} (${systemState.marketData.fearGreed.label})${cores.reset}`);
    }
    if (systemState.marketData.btcDominance) {
        console.log(`${cores.ciano}   ₿  BTC Dominance: ${systemState.marketData.btcDominance.value.toFixed(2)}%${cores.reset}`);
    }
    
    // Relatórios de IA
    console.log(`\n${cores.negrito}🤖 RELATÓRIOS DE IA:${cores.reset}`);
    console.log(`${cores.verde}   📋 Gerados: ${systemState.aiReports.generated}${cores.reset}`);
    if (systemState.aiReports.lastReport) {
        const lastReport = systemState.aiReports.lastReport;
        console.log(`${cores.amarelo}   🎯 Última recomendação: ${lastReport.recommendation}${cores.reset}`);
        console.log(`${cores.magenta}   📊 Confiança: ${(lastReport.confidence * 100).toFixed(1)}%${cores.reset}`);
    }
    
    // Sinais TradingView
    console.log(`\n${cores.negrito}📡 SINAIS TRADINGVIEW:${cores.reset}`);
    console.log(`${cores.verde}   📥 Recebidos: ${systemState.signals.received}${cores.reset}`);
    console.log(`${cores.ciano}   ⚙️  Processados: ${systemState.signals.processed}${cores.reset}`);
    if (systemState.signals.lastSignal) {
        const lastSignal = systemState.signals.lastSignal;
        const timeAgo = Math.floor((new Date() - lastSignal.timestamp) / 1000);
        console.log(`${cores.amarelo}   🕐 Último: ${lastSignal.symbol} ${lastSignal.action} (${timeAgo}s atrás)${cores.reset}`);
    }
    
    // Decisões do Sistema
    console.log(`\n${cores.negrito}⚡ DECISÕES DO SISTEMA:${cores.reset}`);
    console.log(`${cores.verde}   📊 Total: ${systemState.decisions.total}${cores.reset}`);
    console.log(`${cores.ciano}   📈 BUY: ${systemState.decisions.buy} | 📉 SELL: ${systemState.decisions.sell} | ⏸️  HOLD: ${systemState.decisions.hold}${cores.reset}`);
    if (systemState.decisions.lastDecision) {
        const lastDecision = systemState.decisions.lastDecision;
        const timeAgo = Math.floor((new Date() - lastDecision.timestamp) / 1000);
        console.log(`${cores.amarelo}   🕐 Última: ${lastDecision.action} $${lastDecision.parameters.amount.toFixed(2)} (${timeAgo}s atrás)${cores.reset}`);
    }
    
    // Ordens Executadas
    console.log(`\n${cores.negrito}📈 ORDENS:${cores.reset}`);
    console.log(`${cores.verde}   ✅ Executadas: ${systemState.orders.executed}${cores.reset}`);
    console.log(`${cores.vermelho}   ❌ Falharam: ${systemState.orders.failed}${cores.reset}`);
    const successRate = systemState.orders.executed + systemState.orders.failed > 0 
        ? ((systemState.orders.executed / (systemState.orders.executed + systemState.orders.failed)) * 100).toFixed(1)
        : 0;
    console.log(`${cores.azul}   📊 Taxa de sucesso: ${successRate}%${cores.reset}`);
    
    console.log(`${cores.negrito}${cores.azul}════════════════════════════════════════════════════════════════${cores.reset}`);
}

/**
 * 🚀 CICLO PRINCIPAL DO SISTEMA
 */
async function runSystemCycle() {
    console.log(`${cores.negrito}${cores.verde}\n🚀 INICIANDO CICLO COMPLETO DO SISTEMA${cores.reset}`);
    console.log(`${cores.amarelo}🕐 ${new Date().toLocaleString('pt-BR')}${cores.reset}`);
    
    systemState.totalChecks++;
    
    // 1. Verificar health do sistema
    const systemOnline = await checkSystemHealth();
    
    if (!systemOnline) {
        console.log(`${cores.vermelho}⚠️ Sistema offline - pulando ciclo${cores.reset}`);
        return;
    }
    
    // 2. Coletar dados CoinStats
    await fetchCoinStatsData();
    
    // 3. Gerar relatório de IA
    const aiReport = await generateAIReport();
    
    // 4. Tomar decisão do sistema
    const decision = await makeSystemDecision(aiReport);
    
    // 5. Executar ordem (se houver decisão)
    if (decision && decision.action !== 'HOLD') {
        await executeOrder(decision);
    }
    
    // 6. Simular recebimento de sinal
    await simulateSignalReception();
    
    // 7. Exibir dashboard
    displaySystemDashboard();
}

/**
 * 🔄 MONITOR CONTÍNUO
 */
async function startRealtimeMonitoring() {
    console.log(`${cores.negrito}${cores.azul}\n🔄 MONITOR SISTEMA COINBITCLUB - TEMPO REAL INICIADO${cores.reset}`);
    console.log(`${cores.ciano}🤖 IA + 📊 CoinStats + 📡 TradingView + ⚡ Decisões + 📈 Ordens${cores.reset}`);
    console.log(`${cores.amarelo}🌐 URL: ${BASE_URL}${cores.reset}`);
    console.log(`${cores.verde}🔑 Token: 210406 ✅${cores.reset}\n`);
    
    // Executar ciclo inicial
    await runSystemCycle();
    
    // Configurar monitoramento contínuo a cada 45 segundos
    setInterval(async () => {
        console.log(`\n${cores.azul}${'='.repeat(80)}${cores.reset}`);
        await runSystemCycle();
    }, 45000);
}

// 🎯 Executar se chamado diretamente
if (require.main === module) {
    startRealtimeMonitoring().catch(error => {
        console.error(`${cores.vermelho}❌ Erro no monitor: ${error.message}${cores.reset}`);
        process.exit(1);
    });
}

module.exports = {
    startRealtimeMonitoring,
    runSystemCycle,
    generateAIReport,
    fetchCoinStatsData,
    makeSystemDecision,
    executeOrder,
    simulateSignalReception,
    displaySystemDashboard,
    systemState
};
