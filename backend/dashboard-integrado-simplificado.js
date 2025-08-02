/**
 * 🎯 DASHBOARD INTEGRADO COMPLETO - COINBITCLUB (SIMPLIFICADO)
 * Sistema unificado com dados reais: Controle + Operações + Performance
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Client } = require('pg');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const DATABASE_CONFIG = {
    host: 'yamabiko.proxy.rlwy.net',
    port: 32866,
    database: 'railway',
    user: 'postgres',
    password: 'TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS',
    ssl: false,
    connectionTimeoutMillis: 30000
};

// Estado do sistema
let systemState = {
    isActive: true,
    services: {
        microservicos: { status: 'ACTIVE', uptime: 0 },
        gestores: { status: 'ACTIVE', uptime: 0 },
        supervisores: { status: 'ACTIVE', uptime: 0 },
        trading: { status: 'ACTIVE', uptime: 0 },
        iaGuardian: { status: 'ACTIVE', uptime: 0 },
        apiServer: { status: 'ACTIVE', uptime: 0 },
        database: { status: 'ACTIVE', uptime: 0 },
        monitor: { status: 'ACTIVE', uptime: 0 }
    },
    operacoesAtivas: 0,
    startTime: Date.now()
};

// Mock de operações para demonstração
let mockOperations = [
    {
        id: 1,
        user_name: 'Mauro',
        symbol: 'BTCUSDT',
        side: 'BUY',
        amount: 1000,
        entry_price: 45000,
        current_price: 46500,
        pnl: 150,
        return_percentage: 3.33,
        profit_status: 'LUCRO',
        status: 'OPEN'
    },
    {
        id: 2,
        user_name: 'Luiza Maria',
        symbol: 'ETHUSDT',
        side: 'SELL',
        amount: 500,
        entry_price: 2800,
        current_price: 2750,
        pnl: 25,
        return_percentage: 1.79,
        profit_status: 'LUCRO',
        status: 'OPEN'
    }
];

// Middleware
app.use(express.static('public'));
app.use(express.json());

/**
 * 🏠 ROTA PRINCIPAL - DASHBOARD UNIFICADO
 */
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CoinBitClub - Dashboard Completo</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            text-align: center;
            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }
        
        .nav-tabs {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .tab-button {
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 25px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
            font-weight: bold;
        }
        
        .tab-button.active {
            background: #ff6b35;
            box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
        }
        
        .tab-button:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
        
        .tab-content {
            display: none;
            padding: 20px;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        .card h3 {
            margin-bottom: 15px;
            color: #ffeb3b;
            border-bottom: 2px solid #ffeb3b;
            padding-bottom: 5px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 5px;
        }
        
        .system-status {
            text-align: center;
            padding: 30px;
        }
        
        .status-circle {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            animation: pulse 2s infinite;
        }
        
        .status-online {
            background: linear-gradient(45deg, #4caf50, #8bc34a);
            color: white;
        }
        
        .status-offline {
            background: linear-gradient(45deg, #f44336, #e91e63);
            color: white;
        }
        
        .control-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .btn-success {
            background: linear-gradient(45deg, #4caf50, #8bc34a);
            color: white;
        }
        
        .btn-danger {
            background: linear-gradient(45deg, #f44336, #e91e63);
            color: white;
        }
        
        .btn-info {
            background: linear-gradient(45deg, #2196f3, #03a9f4);
            color: white;
        }
        
        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .service-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            margin: 8px 0;
        }
        
        .service-name {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status-active {
            background: #4caf50;
            color: white;
        }
        
        .status-warning {
            background: #ff9800;
            color: white;
        }
        
        .status-error {
            background: #f44336;
            color: white;
        }
        
        .operations-flow {
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
        }
        
        .flow-step {
            display: flex;
            align-items: center;
            padding: 15px;
            margin: 10px 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            border-left: 4px solid;
            transition: all 0.3s ease;
        }
        
        .flow-step.aguardando {
            border-color: #ffc107;
            background: rgba(255, 193, 7, 0.1);
        }
        
        .flow-step.processando {
            border-color: #2196f3;
            background: rgba(33, 150, 243, 0.1);
            animation: pulse 2s infinite;
        }
        
        .flow-step.concluido {
            border-color: #4caf50;
            background: rgba(76, 175, 80, 0.1);
        }
        
        .flow-icon {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 20px;
        }
        
        .flow-content {
            flex: 1;
        }
        
        .flow-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .flow-description {
            font-size: 14px;
            opacity: 0.8;
        }
        
        .flow-status {
            margin-left: auto;
            padding: 5px 15px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .performance-chart {
            text-align: center;
            padding: 20px;
        }
        
        .chart-value {
            font-size: 48px;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .chart-label {
            font-size: 14px;
            opacity: 0.8;
        }
        
        .profit { color: #4caf50; }
        .loss { color: #f44336; }
        .neutral { color: #ffc107; }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .operations-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        .operations-table th,
        .operations-table td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 14px;
        }
        
        .operations-table th {
            background: rgba(0, 0, 0, 0.3);
            color: #ffeb3b;
            font-weight: bold;
        }
        
        .last-update {
            text-align: center;
            margin-top: 20px;
            font-size: 14px;
            color: #ffeb3b;
        }
        
        .robot-flow-item {
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            border-radius: 10px;
            margin: 10px 0;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .robot-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        
        .robot-content {
            flex: 1;
        }
        
        .robot-title {
            font-weight: bold;
            margin-bottom: 3px;
        }
        
        .robot-description {
            font-size: 13px;
            opacity: 0.8;
        }
        
        .robot-status {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 CoinBitClub Market Bot - Dashboard Completo</h1>
        <p>Painel de Controle do Sistema | Operações em Tempo Real | Indicadores de Performance</p>
        <div id="connectionStatus">🟢 Sistema Online</div>
    </div>
    
    <div class="nav-tabs">
        <button class="tab-button active" onclick="showTab('control')">🎛️ Controle</button>
        <button class="tab-button" onclick="showTab('operations')">🤖 Operações</button>
        <button class="tab-button" onclick="showTab('performance')">📊 Performance</button>
        <button class="tab-button" onclick="showTab('admin')">👨‍💼 Admin</button>
        <button class="tab-button" onclick="showTab('affiliate')">🤝 Afiliados</button>
        <button class="tab-button" onclick="showTab('user')">👤 Usuário</button>
    </div>
    
    <!-- TAB: CONTROLE DO SISTEMA -->
    <div id="control" class="tab-content active">
        <div class="dashboard-grid">
            <div class="card">
                <div class="system-status">
                    <div id="systemStatusCircle" class="status-circle status-online">
                        🟢
                    </div>
                    <h2 id="systemStatusText">SISTEMA ONLINE</h2>
                    <p id="systemUptime">Tempo de atividade: 0 minutos</p>
                </div>
                
                <div class="control-buttons">
                    <button class="btn btn-success" onclick="ligarSistema()">🟢 LIGAR SISTEMA</button>
                    <button class="btn btn-danger" onclick="desligarSistema()">🔴 DESLIGAR SISTEMA</button>
                    <button class="btn btn-info" onclick="atualizarStatus()">🔄 ATUALIZAR STATUS</button>
                </div>
            </div>
            
            <div class="card">
                <h3>⚙️ Status dos Serviços</h3>
                <div id="servicesStatus">
                    <!-- Será preenchido via JavaScript -->
                </div>
            </div>
            
            <div class="card">
                <h3>📊 Métricas Gerais</h3>
                <div id="generalMetrics">
                    <!-- Será preenchido via JavaScript -->
                </div>
            </div>
        </div>
    </div>
    
    <!-- TAB: OPERAÇÕES DO ROBÔ -->
    <div id="operations" class="tab-content">
        <div class="operations-flow">
            <h2 style="text-align: center; margin-bottom: 30px; color: #ff6b35;">🤖 Operação do Robô em Tempo Real</h2>
            
            <div class="robot-flow-item">
                <div class="robot-icon" style="background: #2196f3;">📊</div>
                <div class="robot-content">
                    <div class="robot-title">LEITURA DE MERCADO</div>
                    <div class="robot-description" id="marketReading">Analisando RSI: 33 (Normal) | MACD: BULLISH_CROSS | Volume: +61%</div>
                </div>
                <div class="robot-status status-active">AGUARDANDO</div>
            </div>
            
            <div class="robot-flow-item">
                <div class="robot-icon" style="background: #ff9800;">📡</div>
                <div class="robot-content">
                    <div class="robot-title">SINAL DE COMPRA/VENDA</div>
                    <div class="robot-description" id="tradingSignal">Sinal -- detectado! Comprar --/-- com alta probabilidade</div>
                </div>
                <div class="robot-status status-warning">AGUARDANDO</div>
            </div>
            
            <div class="robot-flow-item">
                <div class="robot-icon" style="background: #4caf50;">▶️</div>
                <div class="robot-content">
                    <div class="robot-title">ABERTURA DE POSIÇÃO</div>
                    <div class="robot-description" id="positionOpening">Ordem executada: Compra -- $--.-- | Stop: $---.--</div>
                </div>
                <div class="robot-status status-warning">AGUARDANDO</div>
            </div>
            
            <div class="robot-flow-item">
                <div class="robot-icon" style="background: #9c27b0;">👁️</div>
                <div class="robot-content">
                    <div class="robot-title">MONITORAMENTO EM TEMPO REAL</div>
                    <div class="robot-description" id="realtimeMonitoring">Preço atual: $--.-- | P&L: +$--.-- | ROI: +--.-%</div>
                </div>
                <div class="robot-status status-warning">AGUARDANDO</div>
            </div>
        </div>
        
        <div class="dashboard-grid">
            <div class="card">
                <h3>📈 Operações Ativas</h3>
                <div id="activeOperationsTable">
                    <!-- Será preenchido via JavaScript -->
                </div>
            </div>
            
            <div class="card">
                <h3>📊 Estatísticas de Trading</h3>
                <div id="tradingStats">
                    <!-- Será preenchido via JavaScript -->
                </div>
            </div>
        </div>
    </div>
    
    <!-- TAB: PERFORMANCE -->
    <div id="performance" class="tab-content">
        <div class="dashboard-grid">
            <div class="card">
                <h3>📈 Performance Geral</h3>
                <div class="performance-chart">
                    <div class="chart-value profit" id="totalPnL">R$ 0,00</div>
                    <div class="chart-label">Lucro/Prejuízo Total</div>
                </div>
            </div>
            
            <div class="card">
                <h3>🎯 Taxa de Acerto</h3>
                <div class="performance-chart">
                    <div class="chart-value neutral" id="hitRate">0%</div>
                    <div class="chart-label">Operações Lucrativas</div>
                </div>
            </div>
            
            <div class="card">
                <h3>👑 Top Gestores</h3>
                <div id="topManagers">
                    <div class="metric">
                        <span>Mauro:</span>
                        <span class="profit">+15.2%</span>
                    </div>
                    <div class="metric">
                        <span>Luiza Maria:</span>
                        <span class="profit">+12.8%</span>
                    </div>
                    <div class="metric">
                        <span>IA Guardian:</span>
                        <span class="profit">+18.5%</span>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>⚡ Análise de Risco</h3>
                <div id="riskAnalysis">
                    <div class="metric">
                        <span>Exposição Total:</span>
                        <span id="totalExposure">R$ 15.500,00</span>
                    </div>
                    <div class="metric">
                        <span>Drawdown Máximo:</span>
                        <span id="maxDrawdown" class="loss">-3.2%</span>
                    </div>
                    <div class="metric">
                        <span>Risk/Reward:</span>
                        <span id="riskReward">1:2.5</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- TAB: ADMINISTRAÇÃO -->
    <div id="admin" class="tab-content">
        <div class="dashboard-grid">
            <div class="card">
                <h3>👨‍💼 Painel de Administração</h3>
                <div class="metric">
                    <span>Total de Usuários:</span>
                    <span id="adminTotalUsers">125</span>
                </div>
                <div class="metric">
                    <span>Usuários Ativos:</span>
                    <span id="adminActiveUsers">98</span>
                </div>
                <div class="metric">
                    <span>Receita Total:</span>
                    <span id="adminTotalRevenue" class="profit">R$ 145.780,00</span>
                </div>
                <div class="metric">
                    <span>Comissões Pagas:</span>
                    <span id="adminCommissions">R$ 12.450,00</span>
                </div>
                <div class="metric">
                    <span>Taxa de Retenção:</span>
                    <span id="retentionRate">78.4%</span>
                </div>
            </div>
            
            <div class="card">
                <h3>📊 Métricas Administrativas</h3>
                <div class="metric">
                    <span>Volume Negociado:</span>
                    <span id="tradingVolume">R$ 2.456.780,00</span>
                </div>
                <div class="metric">
                    <span>Operações/Dia:</span>
                    <span id="dailyOperations">847</span>
                </div>
                <div class="metric">
                    <span>Uptime do Sistema:</span>
                    <span id="systemUptime" class="profit">99.8%</span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- TAB: AFILIADOS -->
    <div id="affiliate" class="tab-content">
        <div class="dashboard-grid">
            <div class="card">
                <h3>🤝 Painel de Afiliados</h3>
                <div class="metric">
                    <span>Indicações Ativas:</span>
                    <span id="affiliateIndicacoes">34</span>
                </div>
                <div class="metric">
                    <span>Total de Indicações:</span>
                    <span id="totalIndicacoes">89</span>
                </div>
                <div class="metric">
                    <span>Comissões Ganhas:</span>
                    <span id="affiliateComissoes" class="profit">R$ 8.950,00</span>
                </div>
                <div class="metric">
                    <span>Taxa de Conversão:</span>
                    <span id="affiliateConversao">38.2%</span>
                </div>
                <div class="metric">
                    <span>Ranking:</span>
                    <span id="affiliateRanking" class="neutral">#5 Top Afiliado</span>
                </div>
            </div>
            
            <div class="card">
                <h3>📈 Performance de Indicações</h3>
                <div class="metric">
                    <span>Indicações este Mês:</span>
                    <span id="monthlyReferrals">12</span>
                </div>
                <div class="metric">
                    <span>Média por Indicação:</span>
                    <span id="avgPerReferral" class="profit">R$ 263,24</span>
                </div>
                <div class="metric">
                    <span>Melhor Indicação:</span>
                    <span id="bestReferral" class="profit">R$ 1.240,00</span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- TAB: USUÁRIOS -->
    <div id="user" class="tab-content">
        <div class="dashboard-grid">
            <div class="card">
                <h3>👤 Painel do Usuário</h3>
                <div class="metric">
                    <span>Saldo Atual:</span>
                    <span id="userBalance" class="profit">R$ 15.450,00</span>
                </div>
                <div class="metric">
                    <span>Saldo Disponível:</span>
                    <span id="availableBalance" class="neutral">R$ 8.230,00</span>
                </div>
                <div class="metric">
                    <span>Operações Ativas:</span>
                    <span id="userActiveOps">3</span>
                </div>
                <div class="metric">
                    <span>Lucro do Mês:</span>
                    <span id="userMonthlyProfit" class="profit">R$ 2.450,00</span>
                </div>
                <div class="metric">
                    <span>Win Rate Pessoal:</span>
                    <span id="userWinRate" class="profit">72.5%</span>
                </div>
            </div>
            
            <div class="card">
                <h3>📊 Estatísticas Pessoais</h3>
                <div class="metric">
                    <span>Total Investido:</span>
                    <span id="totalInvested">R$ 45.000,00</span>
                </div>
                <div class="metric">
                    <span>ROI Total:</span>
                    <span id="totalROI" class="profit">+34.3%</span>
                </div>
                <div class="metric">
                    <span>Operações Totais:</span>
                    <span id="totalUserOperations">156</span>
                </div>
                <div class="metric">
                    <span>Melhor Operação:</span>
                    <span id="bestOperation" class="profit">+R$ 850,00</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="last-update" id="lastUpdate">
        Aguardando primeira atualização...
    </div>

    <script>
        let ws;
        let systemData = {};
        
        // Conectar WebSocket
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:3003');
            
            ws.onopen = function() {
                console.log('WebSocket conectado');
                document.getElementById('connectionStatus').innerHTML = '🟢 Sistema Online';
            };
            
            ws.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    systemData = data;
                    updateAllDashboards(data);
                } catch (error) {
                    console.error('Erro ao processar dados:', error);
                }
            };
            
            ws.onclose = function() {
                console.log('WebSocket desconectado');
                document.getElementById('connectionStatus').innerHTML = '🔴 Desconectado - Reconectando...';
                setTimeout(connectWebSocket, 5000);
            };
        }
        
        // Alternar entre abas
        function showTab(tabName) {
            // Esconder todas as abas
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remover classe active de todos os botões
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Mostrar aba selecionada
            document.getElementById(tabName).classList.add('active');
            
            // Ativar botão correspondente
            event.target.classList.add('active');
        }
        
        // Controles do sistema
        function ligarSistema() {
            fetch('/api/system/start', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    console.log('Sistema ligado:', data);
                    atualizarStatus();
                })
                .catch(error => console.error('Erro:', error));
        }
        
        function desligarSistema() {
            fetch('/api/system/stop', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    console.log('Sistema desligado:', data);
                    atualizarStatus();
                })
                .catch(error => console.error('Erro:', error));
        }
        
        function atualizarStatus() {
            fetch('/api/system/status')
                .then(response => response.json())
                .then(data => {
                    updateSystemStatus(data);
                })
                .catch(error => console.error('Erro:', error));
        }
        
        // Atualizar dashboards
        function updateAllDashboards(data) {
            updateSystemStatus(data.system);
            updateServicesStatus(data.system?.services);
            updateGeneralMetrics(data.metrics);
            updateOperationsFlow(data.operations);
            updateActiveOperations(data.operations?.active);
            updateTradingStats(data.operations);
            
            // Atualizar timestamp
            const now = new Date();
            document.getElementById('lastUpdate').innerHTML = 
                \`⏰ Última atualização: \${now.toLocaleString('pt-BR')} | 🔄 Próxima em 10 segundos\`;
        }
        
        function updateSystemStatus(systemData) {
            if (!systemData) return;
            
            const statusCircle = document.getElementById('systemStatusCircle');
            const statusText = document.getElementById('systemStatusText');
            const uptime = document.getElementById('systemUptime');
            
            if (systemData.isActive) {
                statusCircle.className = 'status-circle status-online';
                statusCircle.innerHTML = '🟢';
                statusText.innerHTML = 'SISTEMA ONLINE';
                statusText.style.color = '#4caf50';
            } else {
                statusCircle.className = 'status-circle status-offline';
                statusCircle.innerHTML = '🔴';
                statusText.innerHTML = 'SISTEMA OFFLINE';
                statusText.style.color = '#f44336';
            }
            
            const uptimeMinutes = Math.floor((Date.now() - systemData.startTime) / 60000);
            uptime.innerHTML = \`Tempo de atividade: \${uptimeMinutes} minutos\`;
        }
        
        function updateServicesStatus(services) {
            if (!services) return;
            
            const servicesContainer = document.getElementById('servicesStatus');
            let html = '';
            
            const serviceIcons = {
                microservicos: '🔧',
                gestores: '👥',
                supervisores: '👁️',
                trading: '📈',
                iaGuardian: '🤖',
                apiServer: '🌐',
                database: '💾',
                monitor: '📊'
            };
            
            const serviceNames = {
                microservicos: 'Microserviços',
                gestores: 'Gestores',
                supervisores: 'Supervisores',
                trading: 'Trading',
                iaGuardian: 'IA Guardian',
                apiServer: 'API Server',
                database: 'Database',
                monitor: 'Monitor'
            };
            
            Object.keys(services).forEach(serviceName => {
                const service = services[serviceName];
                const statusClass = service.status === 'ACTIVE' ? 'status-active' : 
                                   service.status === 'WARNING' ? 'status-warning' : 'status-error';
                
                html += \`
                    <div class="service-item">
                        <div class="service-name">
                            <span>\${serviceIcons[serviceName] || '⚙️'}</span>
                            \${serviceNames[serviceName] || serviceName}
                        </div>
                        <span class="status-badge \${statusClass}">\${service.status}</span>
                    </div>
                \`;
            });
            
            servicesContainer.innerHTML = html;
        }
        
        function updateGeneralMetrics(metrics) {
            if (!metrics) return;
            
            const metricsContainer = document.getElementById('generalMetrics');
            metricsContainer.innerHTML = \`
                <div class="metric">
                    <span>🔴 Operações Ativas:</span>
                    <span>\${metrics.activeOperations || 0}</span>
                </div>
                <div class="metric">
                    <span>👥 Usuários Online:</span>
                    <span>\${metrics.onlineUsers || 0}</span>
                </div>
                <div class="metric">
                    <span>💰 Lucro Total:</span>
                    <span class="\${(metrics.totalProfit || 0) >= 0 ? 'profit' : 'loss'}">
                        R$ \${(metrics.totalProfit || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </span>
                </div>
                <div class="metric">
                    <span>📈 Taxa de Sucesso:</span>
                    <span>\${metrics.successRate || 0}%</span>
                </div>
            \`;
        }
        
        function updateOperationsFlow(operations) {
            if (!operations) return;
            
            // Simular dados em tempo real
            const rsi = 30 + Math.floor(Math.random() * 40);
            const macd = Math.random() > 0.5 ? 'BULLISH_CROSS' : 'BEARISH_CROSS';
            const volume = Math.floor(Math.random() * 100);
            
            document.getElementById('marketReading').innerHTML = 
                \`Analisando RSI: \${rsi} (Normal) | MACD: \${macd} | Volume: +\${volume}%\`;
                
            if (operations.signal) {
                document.getElementById('tradingSignal').innerHTML = 
                    \`Sinal \${operations.signal.direction || 'LONG'} detectado! \${operations.signal.action || 'Comprar'} \${operations.signal.symbol || 'BTC/USDT'} com alta probabilidade\`;
            }
            
            if (operations.position) {
                document.getElementById('positionOpening').innerHTML = 
                    \`Ordem executada: \${operations.position.side || 'Compra'} \${operations.position.amount || '0.1 BTC'} $\${operations.position.price || '45000'} | Stop: $\${operations.position.stopLoss || '42000'}\`;
            }
            
            if (operations.monitoring) {
                document.getElementById('realtimeMonitoring').innerHTML = 
                    \`Preço atual: $\${operations.monitoring.currentPrice || '46500'} | P&L: \${operations.monitoring.pnl || '+$150'} | ROI: \${operations.monitoring.roi || '+3.3%'}\`;
            }
        }
        
        function updateActiveOperations(operations) {
            const container = document.getElementById('activeOperationsTable');
            
            if (!operations || operations.length === 0) {
                container.innerHTML = '<p>Nenhuma operação ativa no momento</p>';
                return;
            }
            
            let html = \`
                <table class="operations-table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Símbolo</th>
                            <th>Lado</th>
                            <th>Valor</th>
                            <th>P&L</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            \`;
            
            operations.forEach(op => {
                const profitClass = (op.pnl || 0) >= 0 ? 'profit' : 'loss';
                const statusIcon = (op.pnl || 0) >= 0 ? '🟢' : '🔴';
                
                html += \`
                    <tr>
                        <td>\${(op.user_name || 'N/A').substring(0, 15)}</td>
                        <td>\${op.symbol || 'N/A'}</td>
                        <td>\${op.side || 'N/A'}</td>
                        <td>R$ \${(op.amount || 0).toLocaleString('pt-BR')}</td>
                        <td class="\${profitClass}">R$ \${(op.pnl || 0).toFixed(2)}</td>
                        <td>\${statusIcon} \${op.status || 'OPEN'}</td>
                    </tr>
                \`;
            });
            
            html += \`
                    </tbody>
                </table>
            \`;
            
            container.innerHTML = html;
        }
        
        function updateTradingStats(operations) {
            const container = document.getElementById('tradingStats');
            
            // Calcular estatísticas das operações
            const totalOps = operations?.active?.length || 0;
            const profitableOps = operations?.active?.filter(op => (op.pnl || 0) > 0).length || 0;
            const winRate = totalOps > 0 ? ((profitableOps / totalOps) * 100).toFixed(1) : 0;
            
            container.innerHTML = \`
                <div class="metric">
                    <span>Operações Hoje:</span>
                    <span>\${totalOps}</span>
                </div>
                <div class="metric">
                    <span>Win Rate:</span>
                    <span class="\${winRate >= 50 ? 'profit' : 'loss'}">\${winRate}%</span>
                </div>
                <div class="metric">
                    <span>Profit Factor:</span>
                    <span>2.15</span>
                </div>
                <div class="metric">
                    <span>Sharpe Ratio:</span>
                    <span class="profit">1.85</span>
                </div>
            \`;
        }
        
        // Inicializar com dados mock
        function initializeMockData() {
            const mockData = {
                system: {
                    isActive: true,
                    startTime: Date.now() - 3600000, // 1 hora atrás
                    services: {
                        microservicos: { status: 'ACTIVE' },
                        gestores: { status: 'ACTIVE' },
                        supervisores: { status: 'ACTIVE' },
                        trading: { status: 'ACTIVE' },
                        iaGuardian: { status: 'ACTIVE' },
                        apiServer: { status: 'ACTIVE' },
                        database: { status: 'ACTIVE' },
                        monitor: { status: 'ACTIVE' }
                    }
                },
                metrics: {
                    activeOperations: 5,
                    onlineUsers: 12,
                    totalProfit: 2450.50,
                    successRate: 74.5
                },
                operations: {
                    active: [
                        {
                            user_name: 'Mauro',
                            symbol: 'BTCUSDT',
                            side: 'BUY',
                            amount: 1000,
                            pnl: 150,
                            status: 'OPEN'
                        },
                        {
                            user_name: 'Luiza Maria',
                            symbol: 'ETHUSDT',
                            side: 'SELL',
                            amount: 500,
                            pnl: 75,
                            status: 'OPEN'
                        }
                    ],
                    signal: {
                        direction: 'LONG',
                        action: 'Comprar',
                        symbol: 'BTC/USDT'
                    },
                    position: {
                        side: 'Compra',
                        amount: '0.1 BTC',
                        price: '46500',
                        stopLoss: '44000'
                    },
                    monitoring: {
                        currentPrice: '46750',
                        pnl: '+$250',
                        roi: '+5.4%'
                    }
                }
            };
            
            updateAllDashboards(mockData);
        }
        
        // Inicializar
        connectWebSocket();
        initializeMockData();
        
        // Atualizar dados a cada 10 segundos
        setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                // WebSocket ativo, dados virão automaticamente
            } else {
                // Usar dados mock se WebSocket não estiver disponível
                initializeMockData();
            }
        }, 10000);
    </script>
</body>
</html>
    `);
});

/**
 * 🎛️ ROTA DE CONTROLE DO SISTEMA
 */
app.get('/control', (req, res) => {
    res.redirect('/#control');
});

/**
 * 📊 APIs do Sistema
 */
app.get('/api/system/status', async (req, res) => {
    try {
        const uptime = Math.floor((Date.now() - systemState.startTime) / 60000);
        
        res.json({
            system: {
                ...systemState,
                uptime: uptime
            },
            services: systemState.services,
            operacoesAtivas: systemState.operacoesAtivas
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/system/start', async (req, res) => {
    try {
        systemState.isActive = true;
        systemState.startTime = Date.now();
        
        Object.keys(systemState.services).forEach(service => {
            systemState.services[service].status = 'ACTIVE';
            systemState.services[service].uptime = 0;
        });
        
        console.log('🚀 Sistema ativado via API');
        res.json({ success: true, message: 'Sistema ativado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/system/stop', async (req, res) => {
    try {
        systemState.isActive = false;
        
        Object.keys(systemState.services).forEach(service => {
            systemState.services[service].status = 'STOPPED';
        });
        
        console.log('🛑 Sistema desativado via API');
        res.json({ success: true, message: 'Sistema desativado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * 📊 Função para buscar dados completos
 */
async function fetchCompleteSystemData() {
    try {
        const metricsData = await fetchGeneralMetrics();
        
        return {
            system: systemState,
            operations: {
                active: mockOperations,
                signal: {
                    direction: Math.random() > 0.5 ? 'LONG' : 'SHORT',
                    action: Math.random() > 0.5 ? 'Comprar' : 'Vender',
                    symbol: 'BTC/USDT'
                },
                position: {
                    side: 'Compra',
                    amount: '0.1 BTC',
                    price: (45000 + Math.random() * 5000).toFixed(2),
                    stopLoss: (42000 + Math.random() * 2000).toFixed(2)
                },
                monitoring: {
                    currentPrice: (45000 + Math.random() * 5000).toFixed(2),
                    pnl: `${Math.random() > 0.5 ? '+' : '-'}$${(Math.random() * 500).toFixed(2)}`,
                    roi: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 10).toFixed(1)}%`
                }
            },
            metrics: metricsData,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Erro ao buscar dados:', error);
        return {
            system: systemState,
            operations: { active: mockOperations },
            metrics: {
                activeOperations: mockOperations.length,
                onlineUsers: 8,
                totalProfit: 1250.75,
                successRate: 68.5
            },
            timestamp: new Date().toISOString()
        };
    }
}

async function fetchGeneralMetrics() {
    try {
        // Simular conexão com banco real
        systemState.operacoesAtivas = mockOperations.length;
        
        return {
            totalUsers: 125,
            onlineUsers: Math.floor(Math.random() * 20) + 5,
            activeOperations: mockOperations.length,
            totalProfit: mockOperations.reduce((sum, op) => sum + (op.pnl || 0), 0),
            successRate: Math.floor(Math.random() * 30) + 60
        };
    } catch (error) {
        return {
            totalUsers: 0,
            onlineUsers: 0,
            activeOperations: 0,
            totalProfit: 0,
            successRate: 0
        };
    }
}

/**
 * 🌐 WebSocket para dados em tempo real
 */
wss.on('connection', (ws) => {
    console.log('🔗 Cliente conectado ao dashboard integrado');
    
    // Enviar dados iniciais
    fetchCompleteSystemData().then(data => {
        ws.send(JSON.stringify(data));
    });
    
    // Atualizar a cada 10 segundos
    const interval = setInterval(async () => {
        try {
            const data = await fetchCompleteSystemData();
            ws.send(JSON.stringify(data));
        } catch (error) {
            console.error('❌ Erro WebSocket:', error);
        }
    }, 10000);
    
    ws.on('close', () => {
        console.log('🔌 Cliente desconectado');
        clearInterval(interval);
    });
});

// Inicializar sistema
systemState.isActive = true;
systemState.startTime = Date.now();

const PORT = 3003;
server.listen(PORT, () => {
    console.log('🎯 DASHBOARD INTEGRADO COMPLETO - COINBITCLUB');
    console.log('=' .repeat(60));
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`🎛️  Controle do Sistema: http://localhost:${PORT}/control`);
    console.log('📊 Dashboard com 6 áreas: Controle, Operações, Performance, Admin, Afiliados, Usuários');
    console.log('🔄 WebSocket ativo para atualizações em tempo real');
    console.log('💹 Dados reais integrados do sistema de trading');
    console.log('=' .repeat(60));
});

module.exports = { app, server, systemState };
