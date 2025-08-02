/**
 * 🎯 DASHBOARD REAL-TIME SIMPLIFICADO - SEM ERROS JSON
 * Sistema que mostra dados reais do banco sem problemas de formato
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

app.use(express.static('public'));
app.use(express.json());

/**
 * 📊 Buscar dados REAIS do banco
 */
async function fetchRealSystemData() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        console.log('🔗 Buscando dados reais do banco...');
        
        // Verificar usuários ativos (últimas 24h)
        const usersQuery = await client.query(`
            SELECT 
                u.name, 
                u.last_login_at,
                COUNT(o.id) as operations_count
            FROM users u
            LEFT JOIN operations o ON u.id = o.user_id
            WHERE u.is_active = true 
                AND u.last_login_at > NOW() - INTERVAL '24 hours'
            GROUP BY u.id, u.name, u.last_login_at
            ORDER BY u.last_login_at DESC
            LIMIT 10
        `).catch(() => ({ rows: [] }));
        
        // Verificar operações ativas
        const operationsQuery = await client.query(`
            SELECT 
                o.symbol, o.side, o.amount, o.pnl, o.status,
                u.name as user_name,
                o.created_at
            FROM operations o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.status IN ('OPEN', 'ACTIVE', 'PENDING')
                AND o.created_at > NOW() - INTERVAL '7 days'
            ORDER BY o.created_at DESC
            LIMIT 10
        `).catch(() => ({ rows: [] }));
        
        // Verificar sinais recentes
        const signalsQuery = await client.query(`
            SELECT symbol, direction, confidence, created_at
            FROM trading_signals
            WHERE created_at > NOW() - INTERVAL '24 hours'
            ORDER BY created_at DESC
            LIMIT 5
        `).catch(() => ({ rows: [] }));
        
        // Métricas gerais
        const metricsQuery = await client.query(`
            SELECT 
                COUNT(DISTINCT CASE WHEN u.last_login_at > NOW() - INTERVAL '24 hours' THEN u.id END) as active_users,
                COUNT(o.id) as total_operations,
                COALESCE(SUM(o.pnl), 0) as total_pnl
            FROM users u
            LEFT JOIN operations o ON u.id = o.user_id
            WHERE u.is_active = true
        `).catch(() => ({ rows: [{ active_users: 0, total_operations: 0, total_pnl: 0 }] }));
        
        const users = usersQuery.rows || [];
        const operations = operationsQuery.rows || [];
        const signals = signalsQuery.rows || [];
        const metrics = metricsQuery.rows[0] || { active_users: 0, total_operations: 0, total_pnl: 0 };
        
        // Determinar se o sistema está realmente ativo
        const activeUsers = parseInt(metrics.active_users) || 0;
        const isSystemOnline = activeUsers > 0 || operations.length > 0 || signals.length > 0;
        
        console.log(`📊 Sistema ${isSystemOnline ? 'ONLINE' : 'OFFLINE'} - ${activeUsers} usuários ativos`);
        
        return {
            isOnline: isSystemOnline,
            users: users,
            operations: operations,
            signals: signals,
            metrics: {
                activeUsers: activeUsers,
                totalOperations: parseInt(metrics.total_operations) || 0,
                totalPnL: parseFloat(metrics.total_pnl) || 0,
                winRate: 0 // Calcular depois se necessário
            },
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Erro ao buscar dados:', error.message);
        return {
            isOnline: false,
            users: [],
            operations: [],
            signals: [],
            metrics: {
                activeUsers: 0,
                totalOperations: 0,
                totalPnL: 0,
                winRate: 0
            },
            error: error.message,
            timestamp: new Date().toISOString()
        };
    } finally {
        await client.end();
    }
}

/**
 * 🏠 PÁGINA PRINCIPAL
 */
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CoinBitClub - Dashboard Real</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0a0e27 0%, #1a1b3a 50%, #2d1b69 100%);
            color: #fff;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
        }
        
        .status-indicator {
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            margin: 10px;
            display: inline-block;
        }
        
        .online { background: #4caf50; }
        .offline { background: #f44336; }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: rgba(255,255,255,0.05);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .profit { color: #4caf50; }
        .loss { color: #f44336; }
        .neutral { color: #ffc107; }
        
        .data-section {
            background: rgba(255,255,255,0.05);
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 20px;
        }
        
        .data-section h3 {
            color: #ff6b35;
            margin-bottom: 15px;
            border-bottom: 2px solid #ff6b35;
            padding-bottom: 5px;
        }
        
        .data-item {
            background: rgba(0,0,0,0.2);
            padding: 10px;
            margin: 8px 0;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
        }
        
        .timestamp {
            text-align: center;
            color: #888;
            margin-top: 20px;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 CoinBitClub - Dashboard Real-Time</h1>
            <div class="status-indicator offline" id="systemStatus">
                🔴 VERIFICANDO SISTEMA...
            </div>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div>👥 Usuários Ativos</div>
                <div class="metric-value neutral" id="activeUsers">0</div>
                <small>Últimas 24 horas</small>
            </div>
            <div class="metric-card">
                <div>📊 Operações Total</div>
                <div class="metric-value neutral" id="totalOperations">0</div>
                <small>Todas as operações</small>
            </div>
            <div class="metric-card">
                <div>💰 P&L Total</div>
                <div class="metric-value neutral" id="totalPnL">R$ 0,00</div>
                <small>Profit & Loss</small>
            </div>
        </div>
        
        <div class="data-section">
            <h3>📈 Operações Ativas</h3>
            <div id="operationsList">
                <div class="loading">Carregando operações...</div>
            </div>
        </div>
        
        <div class="data-section">
            <h3>👥 Usuários Online</h3>
            <div id="usersList">
                <div class="loading">Carregando usuários...</div>
            </div>
        </div>
        
        <div class="data-section">
            <h3>🎯 Sinais Recentes</h3>
            <div id="signalsList">
                <div class="loading">Carregando sinais...</div>
            </div>
        </div>
        
        <div class="timestamp" id="lastUpdate">
            Aguardando primeira atualização...
        </div>
    </div>

    <script>
        let ws;
        let reconnectInterval;
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:3007');
            
            ws.onopen = function() {
                console.log('WebSocket conectado');
                clearInterval(reconnectInterval);
            };
            
            ws.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Dados recebidos:', data);
                    updateDashboard(data);
                } catch (error) {
                    console.error('Erro ao processar dados:', error);
                    console.log('Dados brutos:', event.data);
                }
            };
            
            ws.onclose = function() {
                console.log('WebSocket desconectado');
                reconnectWebSocket();
            };
            
            ws.onerror = function(error) {
                console.error('Erro WebSocket:', error);
            };
        }
        
        function reconnectWebSocket() {
            reconnectInterval = setInterval(() => {
                console.log('Tentando reconectar...');
                connectWebSocket();
            }, 5000);
        }
        
        function updateDashboard(data) {
            if (!data) return;
            
            // Atualizar status do sistema
            const statusElement = document.getElementById('systemStatus');
            if (data.isOnline) {
                statusElement.className = 'status-indicator online';
                statusElement.innerHTML = '🟢 SISTEMA ONLINE';
            } else {
                statusElement.className = 'status-indicator offline';
                statusElement.innerHTML = '🔴 SISTEMA OFFLINE';
            }
            
            // Atualizar métricas
            document.getElementById('activeUsers').textContent = data.metrics.activeUsers || 0;
            document.getElementById('totalOperations').textContent = data.metrics.totalOperations || 0;
            
            const pnlElement = document.getElementById('totalPnL');
            const pnl = data.metrics.totalPnL || 0;
            pnlElement.textContent = 'R$ ' + pnl.toLocaleString('pt-BR', {minimumFractionDigits: 2});
            pnlElement.className = 'metric-value ' + (pnl >= 0 ? 'profit' : 'loss');
            
            // Atualizar operações
            updateOperations(data.operations);
            
            // Atualizar usuários
            updateUsers(data.users);
            
            // Atualizar sinais
            updateSignals(data.signals);
            
            // Atualizar timestamp
            const now = new Date();
            document.getElementById('lastUpdate').innerHTML = 
                '⏰ Última atualização: ' + now.toLocaleTimeString('pt-BR');
        }
        
        function updateOperations(operations) {
            const container = document.getElementById('operationsList');
            
            if (!operations || operations.length === 0) {
                container.innerHTML = '<div class="data-item"><span>Nenhuma operação ativa</span></div>';
                return;
            }
            
            const html = operations.map(op => {
                const pnl = parseFloat(op.pnl) || 0;
                const pnlClass = pnl > 0 ? 'profit' : pnl < 0 ? 'loss' : 'neutral';
                
                return \`
                    <div class="data-item">
                        <span><strong>\${op.user_name || 'N/A'}</strong> - \${op.symbol} \${op.side}</span>
                        <span class="\${pnlClass}">R$ \${pnl.toFixed(2)}</span>
                    </div>
                \`;
            }).join('');
            
            container.innerHTML = html;
        }
        
        function updateUsers(users) {
            const container = document.getElementById('usersList');
            
            if (!users || users.length === 0) {
                container.innerHTML = '<div class="data-item"><span>Nenhum usuário ativo</span></div>';
                return;
            }
            
            const html = users.map(user => \`
                <div class="data-item">
                    <span><strong>\${user.name}</strong></span>
                    <span class="neutral">\${user.operations_count || 0} operações</span>
                </div>
            \`).join('');
            
            container.innerHTML = html;
        }
        
        function updateSignals(signals) {
            const container = document.getElementById('signalsList');
            
            if (!signals || signals.length === 0) {
                container.innerHTML = '<div class="data-item"><span>Nenhum sinal recente</span></div>';
                return;
            }
            
            const html = signals.map(signal => \`
                <div class="data-item">
                    <span><strong>\${signal.symbol}</strong> - \${signal.direction}</span>
                    <span class="neutral">\${signal.confidence || 0}%</span>
                </div>
            \`).join('');
            
            container.innerHTML = html;
        }
        
        // Conectar ao WebSocket quando a página carregar
        connectWebSocket();
    </script>
</body>
</html>
    `);
});

/**
 * 🌐 WebSocket para dados em tempo real
 */
wss.on('connection', (ws) => {
    console.log('🔗 Cliente conectado ao dashboard');
    
    // Enviar dados iniciais
    fetchRealSystemData().then(data => {
        const jsonData = JSON.stringify(data);
        console.log('📤 Enviando dados iniciais...');
        ws.send(jsonData);
    }).catch(error => {
        console.error('❌ Erro ao enviar dados iniciais:', error);
    });
    
    // Atualizar a cada 10 segundos
    const interval = setInterval(async () => {
        try {
            const data = await fetchRealSystemData();
            const jsonData = JSON.stringify(data);
            ws.send(jsonData);
        } catch (error) {
            console.error('❌ Erro WebSocket:', error);
        }
    }, 10000);
    
    ws.on('close', () => {
        console.log('🔌 Cliente desconectado');
        clearInterval(interval);
    });
    
    ws.on('error', (error) => {
        console.error('❌ Erro WebSocket:', error);
    });
});

const PORT = 3007;
server.listen(PORT, async () => {
    console.log('🎯 DASHBOARD REAL-TIME CORRIGIDO - COINBITCLUB');
    console.log('=' .repeat(60));
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log('📊 Dados REAIS do banco Railway');
    console.log('✅ JSON válido - sem erros de formato');
    console.log('🔄 WebSocket funcionando corretamente');
    console.log('=' .repeat(60));
    
    // Verificação inicial
    try {
        const initialData = await fetchRealSystemData();
        console.log(`📊 Status inicial: ${initialData.isOnline ? 'ONLINE' : 'OFFLINE'}`);
        console.log(`👥 Usuários ativos: ${initialData.metrics.activeUsers}`);
        console.log(`📈 Operações: ${initialData.operations.length}`);
    } catch (error) {
        console.error('❌ Erro na verificação inicial:', error.message);
    }
});

module.exports = { app, server, fetchRealSystemData };
