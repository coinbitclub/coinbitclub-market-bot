/**
 * 🌐 DASHBOARD WEB TEMPO REAL - COINBITCLUB
 * Interface web com atualizações automáticas via WebSocket
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
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

// Middleware para servir arquivos estáticos
app.use(express.static('public'));

// Rota principal
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CoinbitClub - Monitor Tempo Real</title>
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
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .card h3 {
            margin-bottom: 15px;
            color: #ffeb3b;
            border-bottom: 2px solid #ffeb3b;
            padding-bottom: 5px;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 5px;
        }
        
        .operations-table, .users-table {
            width: 100%;
            margin-top: 20px;
        }
        
        .operations-table table, .users-table table {
            width: 100%;
            border-collapse: collapse;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            overflow: hidden;
        }
        
        .operations-table th, .operations-table td,
        .users-table th, .users-table td {
            padding: 12px 8px;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .operations-table th, .users-table th {
            background: rgba(0, 0, 0, 0.5);
            font-weight: bold;
            color: #ffeb3b;
        }
        
        .profit { color: #4caf50; }
        .loss { color: #f44336; }
        .neutral { color: #ffc107; }
        
        .status-online { color: #4caf50; }
        .status-recent { color: #ffc107; }
        .status-offline { color: #9e9e9e; }
        
        .last-update {
            text-align: center;
            margin-top: 20px;
            font-size: 14px;
            color: #ffeb3b;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            color: #ffeb3b;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .updating {
            animation: pulse 1s infinite;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔴 CoinbitClub - Monitor Tempo Real</h1>
            <p>Operações Abertas | Retornos de Usuários | Métricas do Sistema</p>
            <div id="connectionStatus">🟢 Conectado</div>
        </div>
        
        <div class="dashboard-grid">
            <div class="card">
                <h3>📊 Métricas do Sistema</h3>
                <div id="systemMetrics">
                    <div class="loading">Carregando métricas...</div>
                </div>
            </div>
            
            <div class="card">
                <h3>📈 Dados de Mercado</h3>
                <div id="marketData">
                    <div class="loading">Carregando mercado...</div>
                </div>
            </div>
        </div>
        
        <div class="operations-table">
            <div class="card">
                <h3>🔴 Operações Abertas (Tempo Real)</h3>
                <div id="operationsContainer">
                    <div class="loading">Carregando operações...</div>
                </div>
            </div>
        </div>
        
        <div class="users-table">
            <div class="card">
                <h3>👥 Usuários Ativos e Retornos</h3>
                <div id="usersContainer">
                    <div class="loading">Carregando usuários...</div>
                </div>
            </div>
        </div>
        
        <div class="last-update" id="lastUpdate">
            Aguardando primeira atualização...
        </div>
    </div>

    <script>
        let ws;
        let reconnectInterval;
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:3001');
            
            ws.onopen = function() {
                console.log('WebSocket conectado');
                document.getElementById('connectionStatus').innerHTML = '🟢 Conectado';
                clearInterval(reconnectInterval);
            };
            
            ws.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    updateDashboard(data);
                } catch (error) {
                    console.error('Erro ao processar dados:', error);
                }
            };
            
            ws.onclose = function() {
                console.log('WebSocket desconectado');
                document.getElementById('connectionStatus').innerHTML = '🔴 Desconectado - Reconectando...';
                reconnectWebSocket();
            };
            
            ws.onerror = function(error) {
                console.error('Erro WebSocket:', error);
                document.getElementById('connectionStatus').innerHTML = '⚠️ Erro de conexão';
            };
        }
        
        function reconnectWebSocket() {
            reconnectInterval = setInterval(() => {
                console.log('Tentando reconectar...');
                connectWebSocket();
            }, 5000);
        }
        
        function updateDashboard(data) {
            // Atualizar métricas do sistema
            if (data.metrics) {
                const metricsHtml = \`
                    <div class="metric">
                        <span>👥 Usuários Totais:</span>
                        <span>\${data.metrics.total_users || 0}</span>
                    </div>
                    <div class="metric">
                        <span>🟢 Usuários Ativos (24h):</span>
                        <span>\${data.metrics.active_users_24h || 0}</span>
                    </div>
                    <div class="metric">
                        <span>📈 Operações Totais:</span>
                        <span>\${data.metrics.total_operations || 0}</span>
                    </div>
                    <div class="metric">
                        <span>🔴 Operações Abertas:</span>
                        <span>\${data.metrics.open_operations || 0}</span>
                    </div>
                    <div class="metric">
                        <span>✅ Taxa de Sucesso:</span>
                        <span>\${data.metrics.success_rate || 0}%</span>
                    </div>
                    <div class="metric">
                        <span>💰 Lucro Líquido:</span>
                        <span class="\${parseFloat(data.metrics.net_profit || 0) >= 0 ? 'profit' : 'loss'}">
                            R$ \${data.metrics.net_profit || 0}
                        </span>
                    </div>
                \`;
                document.getElementById('systemMetrics').innerHTML = metricsHtml;
            }
            
            // Atualizar dados de mercado
            if (data.market) {
                const marketHtml = \`
                    <div class="metric">
                        <span>₿ Bitcoin:</span>
                        <span>$\${data.market.btc_price || 'N/A'}</span>
                    </div>
                    <div class="metric">
                        <span>📊 Fear & Greed:</span>
                        <span>\${data.market.fear_greed || 'N/A'}</span>
                    </div>
                    <div class="metric">
                        <span>📈 Dominance BTC:</span>
                        <span>\${data.market.btc_dominance || 'N/A'}%</span>
                    </div>
                \`;
                document.getElementById('marketData').innerHTML = marketHtml;
            }
            
            // Atualizar operações
            if (data.operations && data.operations.length > 0) {
                let operationsHtml = \`
                    <table>
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Símbolo</th>
                                <th>Lado</th>
                                <th>Valor</th>
                                <th>Retorno</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                \`;
                
                data.operations.slice(0, 10).forEach(op => {
                    const profitClass = op.profit_status === 'LUCRO' ? 'profit' : 
                                       op.profit_status === 'PREJUIZO' ? 'loss' : 'neutral';
                    const statusIcon = op.profit_status === 'LUCRO' ? '🟢' : 
                                      op.profit_status === 'PREJUIZO' ? '🔴' : '⚪';
                    
                    operationsHtml += \`
                        <tr>
                            <td>\${(op.user_name || 'N/A').substring(0, 15)}</td>
                            <td>\${op.symbol}</td>
                            <td>\${op.side}</td>
                            <td>R$ \${parseFloat(op.amount || 0).toFixed(0)}</td>
                            <td class="\${profitClass}">\${op.return_percentage || 0}%</td>
                            <td>\${statusIcon} \${op.profit_status || 'N/A'}</td>
                        </tr>
                    \`;
                });
                
                operationsHtml += \`
                        </tbody>
                    </table>
                \`;
                document.getElementById('operationsContainer').innerHTML = operationsHtml;
            } else {
                document.getElementById('operationsContainer').innerHTML = '<p>Nenhuma operação aberta no momento</p>';
            }
            
            // Atualizar usuários
            if (data.users && data.users.length > 0) {
                let usersHtml = \`
                    <table>
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Status</th>
                                <th>Operações</th>
                                <th>Lucro/Prejuízo</th>
                                <th>Atividade</th>
                            </tr>
                        </thead>
                        <tbody>
                \`;
                
                data.users.slice(0, 8).forEach(user => {
                    const netProfit = parseFloat(user.net_profit || 0);
                    const profitClass = netProfit >= 0 ? 'profit' : 'loss';
                    const activityClass = user.activity_status === 'ONLINE' ? 'status-online' : 
                                         user.activity_status === 'RECENTE' ? 'status-recent' : 'status-offline';
                    const activityIcon = user.activity_status === 'ONLINE' ? '🟢' : 
                                        user.activity_status === 'RECENTE' ? '🟡' : '⚪';
                    
                    usersHtml += \`
                        <tr>
                            <td>\${(user.name || 'N/A').substring(0, 15)}</td>
                            <td>\${user.status}</td>
                            <td>\${user.open_operations || 0}/\${user.total_operations || 0}</td>
                            <td class="\${profitClass}">R$ \${netProfit.toFixed(0)}</td>
                            <td class="\${activityClass}">\${activityIcon} \${user.activity_status}</td>
                        </tr>
                    \`;
                });
                
                usersHtml += \`
                        </tbody>
                    </table>
                \`;
                document.getElementById('usersContainer').innerHTML = usersHtml;
            } else {
                document.getElementById('usersContainer').innerHTML = '<p>Nenhum usuário ativo encontrado</p>';
            }
            
            // Atualizar timestamp
            const now = new Date();
            document.getElementById('lastUpdate').innerHTML = 
                \`⏰ Última atualização: \${now.toLocaleString('pt-BR')} | 🔄 Próxima em 10 segundos\`;
                
            // Efeito visual de atualização
            document.body.classList.add('updating');
            setTimeout(() => {
                document.body.classList.remove('updating');
            }, 500);
        }
        
        // Conectar ao WebSocket quando a página carregar
        connectWebSocket();
    </script>
</body>
</html>
    `);
});

/**
 * 📊 Buscar dados do sistema para WebSocket
 */
async function fetchSystemData() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        // Operações abertas
        const operationsQuery = `
            SELECT 
                o.id, o.symbol, o.side, o.amount, o.entry_price, o.current_price, o.pnl,
                u.name as user_name,
                CASE 
                    WHEN o.side = 'BUY' AND o.current_price IS NOT NULL THEN 
                        ROUND(((o.current_price - o.entry_price) / o.entry_price * 100), 2)
                    WHEN o.side = 'SELL' AND o.current_price IS NOT NULL THEN 
                        ROUND(((o.entry_price - o.current_price) / o.entry_price * 100), 2)
                    ELSE 0
                END as return_percentage,
                CASE 
                    WHEN o.pnl > 0 THEN 'LUCRO'
                    WHEN o.pnl < 0 THEN 'PREJUIZO'
                    ELSE 'NEUTRO'
                END as profit_status
            FROM operations o
            JOIN users u ON o.user_id = u.id
            WHERE o.status IN ('OPEN', 'ACTIVE', 'PENDING')
            ORDER BY o.created_at DESC
            LIMIT 15;
        `;
        
        // Usuários ativos
        const usersQuery = `
            SELECT 
                u.name, u.status,
                COUNT(o.id) as total_operations,
                COUNT(CASE WHEN o.status IN ('OPEN', 'ACTIVE') THEN 1 END) as open_operations,
                ROUND(SUM(o.pnl), 2) as net_profit,
                CASE 
                    WHEN u.last_login_at > NOW() - INTERVAL '1 hour' THEN 'ONLINE'
                    WHEN u.last_login_at > NOW() - INTERVAL '24 hours' THEN 'RECENTE'
                    ELSE 'OFFLINE'
                END as activity_status
            FROM users u
            LEFT JOIN operations o ON u.id = o.user_id
            WHERE u.is_active = true
            GROUP BY u.id, u.name, u.status, u.last_login_at
            ORDER BY u.last_login_at DESC NULLS LAST
            LIMIT 10;
        `;
        
        // Métricas gerais
        const metricsQuery = `
            SELECT 
                COUNT(DISTINCT u.id) as total_users,
                COUNT(DISTINCT CASE WHEN u.last_login_at > NOW() - INTERVAL '24 hours' THEN u.id END) as active_users_24h,
                COUNT(o.id) as total_operations,
                COUNT(CASE WHEN o.status IN ('OPEN', 'ACTIVE') THEN 1 END) as open_operations,
                ROUND(
                    CASE 
                        WHEN COUNT(CASE WHEN o.status IN ('CLOSED', 'COMPLETED') THEN 1 END) > 0 THEN
                            (COUNT(CASE WHEN o.pnl > 0 THEN 1 END)::FLOAT / 
                             COUNT(CASE WHEN o.status IN ('CLOSED', 'COMPLETED') THEN 1 END)::FLOAT * 100)
                        ELSE 0
                    END, 2
                ) as success_rate,
                ROUND(SUM(o.pnl), 2) as net_profit
            FROM users u
            LEFT JOIN operations o ON u.id = o.user_id
            WHERE u.is_active = true;
        `;
        
        const [operationsResult, usersResult, metricsResult] = await Promise.all([
            client.query(operationsQuery),
            client.query(usersQuery),
            client.query(metricsQuery)
        ]);
        
        return {
            operations: operationsResult.rows,
            users: usersResult.rows,
            metrics: metricsResult.rows[0],
            market: {
                btc_price: 'Carregando...',
                fear_greed: 'Carregando...',
                btc_dominance: 'Carregando...'
            },
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Erro ao buscar dados:', error.message);
        return {
            operations: [],
            users: [],
            metrics: {},
            market: {},
            timestamp: new Date().toISOString()
        };
    } finally {
        await client.end();
    }
}

/**
 * 🌐 Configurar WebSocket para atualizações em tempo real
 */
wss.on('connection', (ws) => {
    console.log('🔗 Cliente conectado ao dashboard web');
    
    // Enviar dados iniciais
    fetchSystemData().then(data => {
        ws.send(JSON.stringify(data));
    });
    
    // Enviar atualizações a cada 10 segundos
    const interval = setInterval(async () => {
        try {
            const data = await fetchSystemData();
            ws.send(JSON.stringify(data));
        } catch (error) {
            console.error('❌ Erro ao enviar dados WebSocket:', error.message);
        }
    }, 10000);
    
    ws.on('close', () => {
        console.log('🔌 Cliente desconectado do dashboard');
        clearInterval(interval);
    });
});

// Iniciar servidor
const PORT = 3001;
server.listen(PORT, () => {
    console.log('🌐 DASHBOARD WEB TEMPO REAL - COINBITCLUB');
    console.log('=' .repeat(50));
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log('📊 Dashboard com atualizações em tempo real');
    console.log('🔄 WebSocket ativo para dados dinâmicos');
    console.log('💹 Operações, usuários e métricas ao vivo');
    console.log('=' .repeat(50));
});

module.exports = { app, server, fetchSystemData };
