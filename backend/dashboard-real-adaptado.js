const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuração da conexão com Railway PostgreSQL
const pool = new Pool({
  host: 'yamabiko.proxy.rlwy.net',
  port: 42095,
  user: 'postgres',
  password: 'SePUeWLYRrTaQKJbPElIXWdVSpJkOhHh',
  database: 'railway'
});

const PORT = process.env.PORT || 3008;

// Cache para otimização
let systemDataCache = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 30000; // 30 segundos

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Função para buscar dados reais do sistema
async function fetchRealSystemData() {
  try {
    console.log('🔄 Buscando dados reais do sistema...');

    // Verificar cache
    const now = Date.now();
    if (systemDataCache && (now - lastCacheUpdate) < CACHE_DURATION) {
      console.log('📦 Retornando dados do cache');
      return systemDataCache;
    }

    // Buscar usuários ativos
    const usersQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN vip_status = true THEN 1 END) as vip_users,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '24 hours' THEN 1 END) as active_24h,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as active_7d
      FROM users 
      WHERE status = 'active'
    `);

    // Buscar saldos dos usuários
    const balancesQuery = await pool.query(`
      SELECT 
        SUM(total_balance) as total_balance,
        COUNT(DISTINCT user_id) as users_with_balance,
        AVG(total_balance) as avg_balance
      FROM user_balances 
      WHERE total_balance > 0
    `);

    // Buscar chaves API ativas
    const apiKeysQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_keys,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_keys,
        COUNT(CASE WHEN validation_status = 'valid' THEN 1 END) as valid_keys
      FROM user_api_keys
    `);

    // Buscar operações recentes
    const operationsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_operations,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as operations_24h,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as operations_7d
      FROM operations
    `);

    // Buscar sinais recentes
    const signalsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_signals,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as signals_24h,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_signals
      FROM signals
    `);

    // Buscar alertas do sistema
    const alertsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_alerts,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_alerts
      FROM system_alerts
    `);

    // Verificar atividade recente
    const recentActivityQuery = await pool.query(`
      SELECT 
        MAX(last_login) as last_user_login,
        MAX(created_at) as last_operation,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as activity_1h
      FROM (
        SELECT last_login as created_at, last_login FROM users
        UNION ALL
        SELECT created_at, created_at FROM operations WHERE created_at > NOW() - INTERVAL '24 hours'
        UNION ALL
        SELECT created_at, created_at FROM signals WHERE created_at > NOW() - INTERVAL '24 hours'
      ) recent_activity
    `);

    const userData = usersQuery.rows[0];
    const balanceData = balancesQuery.rows[0];
    const apiKeyData = apiKeysQuery.rows[0];
    const operationData = operationsQuery.rows[0];
    const signalData = signalsQuery.rows[0];
    const alertData = alertsQuery.rows[0];
    const activityData = recentActivityQuery.rows[0];

    // Determinar status do sistema
    const lastActivity = new Date(Math.max(
      new Date(activityData.last_user_login || 0),
      new Date(activityData.last_operation || 0)
    ));
    const hoursSinceActivity = (now - lastActivity.getTime()) / (1000 * 60 * 60);
    const isOnline = hoursSinceActivity < 1 && activityData.activity_1h > 0;

    const systemData = {
      timestamp: new Date().toISOString(),
      status: isOnline ? 'ONLINE' : 'OFFLINE',
      lastActivity: lastActivity.toISOString(),
      hoursSinceActivity: Math.round(hoursSinceActivity * 100) / 100,
      
      users: {
        total: parseInt(userData.total_users) || 0,
        vip: parseInt(userData.vip_users) || 0,
        active24h: parseInt(userData.active_24h) || 0,
        active7d: parseInt(userData.active_7d) || 0
      },
      
      balances: {
        total: parseFloat(balanceData.total_balance) || 0,
        usersWithBalance: parseInt(balanceData.users_with_balance) || 0,
        average: parseFloat(balanceData.avg_balance) || 0
      },
      
      apiKeys: {
        total: parseInt(apiKeyData.total_keys) || 0,
        active: parseInt(apiKeyData.active_keys) || 0,
        valid: parseInt(apiKeyData.valid_keys) || 0
      },
      
      operations: {
        total: parseInt(operationData.total_operations) || 0,
        last24h: parseInt(operationData.operations_24h) || 0,
        last7d: parseInt(operationData.operations_7d) || 0
      },
      
      signals: {
        total: parseInt(signalData.total_signals) || 0,
        last24h: parseInt(signalData.signals_24h) || 0,
        active: parseInt(signalData.active_signals) || 0
      },
      
      alerts: {
        total: parseInt(alertData.total_alerts) || 0,
        active: parseInt(alertData.active_alerts) || 0,
        highPriority: parseInt(alertData.high_priority_alerts) || 0
      }
    };

    // Atualizar cache
    systemDataCache = systemData;
    lastCacheUpdate = now;

    console.log('✅ Dados reais obtidos com sucesso:', {
      status: systemData.status,
      users: systemData.users.total,
      operations: systemData.operations.total,
      signals: systemData.signals.total
    });

    return systemData;

  } catch (error) {
    console.error('❌ Erro ao buscar dados do sistema:', error.message);
    
    // Retornar dados de erro em caso de falha
    return {
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      error: error.message,
      users: { total: 0, vip: 0, active24h: 0, active7d: 0 },
      balances: { total: 0, usersWithBalance: 0, average: 0 },
      apiKeys: { total: 0, active: 0, valid: 0 },
      operations: { total: 0, last24h: 0, last7d: 0 },
      signals: { total: 0, last24h: 0, active: 0 },
      alerts: { total: 0, active: 0, highPriority: 0 }
    };
  }
}

// WebSocket para atualizações em tempo real
wss.on('connection', (ws) => {
  console.log('🔌 Cliente conectado via WebSocket');

  // Enviar dados iniciais
  fetchRealSystemData().then(data => {
    ws.send(JSON.stringify({
      type: 'systemData',
      data: data
    }));
  });

  // Atualizar a cada 30 segundos
  const interval = setInterval(async () => {
    try {
      const data = await fetchRealSystemData();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'systemData',
          data: data
        }));
      }
    } catch (error) {
      console.error('❌ Erro ao enviar atualização WebSocket:', error.message);
    }
  }, 30000);

  ws.on('close', () => {
    console.log('🔌 Cliente desconectado');
    clearInterval(interval);
  });

  ws.on('error', (error) => {
    console.error('❌ Erro WebSocket:', error.message);
    clearInterval(interval);
  });
});

// Rota principal do dashboard
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CoinBitClub - Dashboard Real-Time</title>
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
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .status-indicator {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 1.1rem;
            margin-top: 10px;
            animation: pulse 2s infinite;
        }

        .status-online {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
        }

        .status-offline {
            background: linear-gradient(45deg, #f44336, #da190b);
            box-shadow: 0 0 20px rgba(244, 67, 54, 0.5);
        }

        .status-error {
            background: linear-gradient(45deg, #ff9800, #f57c00);
            box-shadow: 0 0 20px rgba(255, 152, 0, 0.5);
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .card-title {
            font-size: 1.2rem;
            margin-bottom: 15px;
            color: #fff;
            border-bottom: 2px solid rgba(255, 255, 255, 0.3);
            padding-bottom: 10px;
        }

        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .metric-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .metric-value {
            font-size: 1.1rem;
            font-weight: bold;
        }

        .last-update {
            text-align: center;
            margin-top: 20px;
            opacity: 0.7;
            font-size: 0.9rem;
        }

        .error-message {
            background: rgba(244, 67, 54, 0.2);
            border: 1px solid rgba(244, 67, 54, 0.5);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }

        .loading {
            text-align: center;
            padding: 40px;
            font-size: 1.2rem;
        }

        .loading::after {
            content: '';
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-left: 10px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 20px;
            background: rgba(0, 0, 0, 0.7);
            font-size: 0.8rem;
        }

        .connected {
            border-left: 4px solid #4CAF50;
        }

        .disconnected {
            border-left: 4px solid #f44336;
        }
    </style>
</head>
<body>
    <div class="connection-status" id="connectionStatus">
        <span id="connectionText">Conectando...</span>
    </div>

    <div class="container">
        <div class="header">
            <h1>🚀 CoinBitClub Market Bot</h1>
            <div class="status-indicator" id="systemStatus">
                CARREGANDO...
            </div>
        </div>

        <div id="content" class="loading">
            Carregando dados do sistema...
        </div>

        <div class="last-update" id="lastUpdate">
            Aguardando dados...
        </div>
    </div>

    <script>
        let ws;
        let reconnectInterval;

        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${PORT}');
            
            ws.onopen = function() {
                console.log('🔌 Conectado ao WebSocket');
                document.getElementById('connectionStatus').className = 'connection-status connected';
                document.getElementById('connectionText').textContent = 'Conectado';
                
                if (reconnectInterval) {
                    clearInterval(reconnectInterval);
                    reconnectInterval = null;
                }
            };

            ws.onmessage = function(event) {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'systemData') {
                        updateDashboard(message.data);
                    }
                } catch (error) {
                    console.error('❌ Erro ao processar mensagem:', error);
                }
            };

            ws.onclose = function() {
                console.log('🔌 Conexão WebSocket fechada');
                document.getElementById('connectionStatus').className = 'connection-status disconnected';
                document.getElementById('connectionText').textContent = 'Desconectado';
                
                // Tentar reconectar a cada 5 segundos
                if (!reconnectInterval) {
                    reconnectInterval = setInterval(connectWebSocket, 5000);
                }
            };

            ws.onerror = function(error) {
                console.error('❌ Erro WebSocket:', error);
            };
        }

        function updateDashboard(data) {
            console.log('📊 Atualizando dashboard:', data);

            // Atualizar status do sistema
            const statusElement = document.getElementById('systemStatus');
            statusElement.textContent = data.status;
            statusElement.className = 'status-indicator status-' + data.status.toLowerCase();

            // Atualizar conteúdo
            const content = document.getElementById('content');
            
            if (data.status === 'ERROR') {
                content.innerHTML = \`
                    <div class="error-message">
                        <h3>⚠️ Erro no Sistema</h3>
                        <p>\${data.error}</p>
                        <p>Tentando reconectar...</p>
                    </div>
                \`;
            } else {
                content.innerHTML = \`
                    <div class="grid">
                        <div class="card">
                            <div class="card-title">👥 Usuários</div>
                            <div class="metric">
                                <span class="metric-label">Total:</span>
                                <span class="metric-value">\${data.users.total}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">VIP:</span>
                                <span class="metric-value">\${data.users.vip}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Ativos 24h:</span>
                                <span class="metric-value">\${data.users.active24h}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Ativos 7d:</span>
                                <span class="metric-value">\${data.users.active7d}</span>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-title">💰 Saldos</div>
                            <div class="metric">
                                <span class="metric-label">Total:</span>
                                <span class="metric-value">$\${data.balances.total.toFixed(2)}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Usuários c/ Saldo:</span>
                                <span class="metric-value">\${data.balances.usersWithBalance}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Média:</span>
                                <span class="metric-value">$\${data.balances.average.toFixed(2)}</span>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-title">🔑 API Keys</div>
                            <div class="metric">
                                <span class="metric-label">Total:</span>
                                <span class="metric-value">\${data.apiKeys.total}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Ativas:</span>
                                <span class="metric-value">\${data.apiKeys.active}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Válidas:</span>
                                <span class="metric-value">\${data.apiKeys.valid}</span>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-title">📈 Operações</div>
                            <div class="metric">
                                <span class="metric-label">Total:</span>
                                <span class="metric-value">\${data.operations.total}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Últimas 24h:</span>
                                <span class="metric-value">\${data.operations.last24h}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Últimos 7d:</span>
                                <span class="metric-value">\${data.operations.last7d}</span>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-title">📡 Sinais</div>
                            <div class="metric">
                                <span class="metric-label">Total:</span>
                                <span class="metric-value">\${data.signals.total}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Últimas 24h:</span>
                                <span class="metric-value">\${data.signals.last24h}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Ativos:</span>
                                <span class="metric-value">\${data.signals.active}</span>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-title">⚠️ Alertas</div>
                            <div class="metric">
                                <span class="metric-label">Total:</span>
                                <span class="metric-value">\${data.alerts.total}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Ativos:</span>
                                <span class="metric-value">\${data.alerts.active}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Alta Prioridade:</span>
                                <span class="metric-value">\${data.alerts.highPriority}</span>
                            </div>
                        </div>
                    </div>
                \`;
            }

            // Atualizar timestamp
            const lastUpdate = document.getElementById('lastUpdate');
            const updateTime = new Date(data.timestamp).toLocaleString('pt-BR');
            lastUpdate.textContent = \`Última atualização: \${updateTime}\`;
            
            if (data.lastActivity && data.hoursSinceActivity !== undefined) {
                const activityTime = new Date(data.lastActivity).toLocaleString('pt-BR');
                lastUpdate.innerHTML += \`<br>Última atividade: \${activityTime} (há \${data.hoursSinceActivity}h)\`;
            }
        }

        // Conectar ao WebSocket
        connectWebSocket();
    </script>
</body>
</html>
  `);
});

// Rota de API para dados JSON
app.get('/api/system-data', async (req, res) => {
  try {
    const data = await fetchRealSystemData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Dashboard CoinBitClub rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/system-data`);
  
  // Teste inicial da conexão
  fetchRealSystemData().then(data => {
    console.log('✅ Conexão com banco de dados testada com sucesso');
    console.log(`📈 Sistema: ${data.status} | Usuários: ${data.users.total}`);
  }).catch(error => {
    console.error('❌ Erro ao testar conexão:', error.message);
  });
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await pool.end();
  process.exit(0);
});
