const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3009;

// Configuração de conexão direta - Railway PostgreSQL
const DATABASE_URL = 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway';

const poolConfig = {
  connectionString: DATABASE_URL,
  ssl: false,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 8000,
  max: 3,
  min: 1
};

let activePool = null;
let connectionAttempts = 0;
let lastConnectionTest = 0;

// Cache para otimização
let systemDataCache = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 45000; // 45 segundos

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Função simplificada para estabelecer conexão
async function establishConnection() {
  console.log(`🔄 Tentativa de conexão #${++connectionAttempts}...`);
  
  try {
    // Se há um pool ativo anterior, encerra
    if (activePool) {
      await activePool.end().catch(() => {});
    }
    
    // Criar novo pool
    activePool = new Pool(poolConfig);
    
    // Teste de conexão
    const client = await activePool.connect();
    await client.query('SELECT 1');
    client.release();
    
    console.log('✅ Railway PostgreSQL: Conexão estabelecida com sucesso!');
    lastConnectionTest = Date.now();
    
    return true;
    
  } catch (error) {
    console.log(`❌ Erro na conexão: ${error.message}`);
    if (activePool) {
      await activePool.end().catch(() => {});
      activePool = null;
    }
    return false;
  }
}

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

    // Verificar se precisa reconectar (a cada 5 minutos)
    if (!activePool || (now - lastConnectionTest) > 300000) {
      console.log('🔄 Verificando conexão...');
      await establishConnection();
    }

    if (!activePool) {
      throw new Error('Nenhuma conexão disponível');
    }

    console.log(`🌐 Usando conexão: Railway PostgreSQL`);

    // Buscar dados com timeout
    const queryTimeout = 10000; // 10 segundos
    
    const queries = await Promise.allSettled([
      // Usuários
      Promise.race([
        activePool.query(`
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN vip_status = true THEN 1 END) as vip_users,
            COUNT(CASE WHEN last_login > NOW() - INTERVAL '24 hours' THEN 1 END) as active_24h,
            COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as active_7d
          FROM users 
          WHERE status = 'active'
        `),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), queryTimeout))
      ]),
      
      // Saldos
      Promise.race([
        activePool.query(`
          SELECT 
            COALESCE(SUM(total_balance), 0) as total_balance,
            COUNT(DISTINCT user_id) as users_with_balance,
            COALESCE(AVG(total_balance), 0) as avg_balance
          FROM user_balances 
          WHERE total_balance > 0
        `),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), queryTimeout))
      ]),
      
      // API Keys
      Promise.race([
        activePool.query(`
          SELECT 
            COUNT(*) as total_keys,
            COUNT(CASE WHEN is_active = true THEN 1 END) as active_keys,
            COUNT(CASE WHEN validation_status = 'valid' THEN 1 END) as valid_keys
          FROM user_api_keys
        `),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), queryTimeout))
      ]),
      
      // Operações
      Promise.race([
        activePool.query(`
          SELECT 
            COUNT(*) as total_operations,
            COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as operations_24h,
            COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as operations_7d
          FROM operations
        `),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), queryTimeout))
      ]),
      
      // Sinais
      Promise.race([
        activePool.query(`
          SELECT 
            COUNT(*) as total_signals,
            COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as signals_24h,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_signals
          FROM signals
        `),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), queryTimeout))
      ])
    ]);

    // Processar resultados
    const defaultData = { rows: [{}] };
    const userData = queries[0].status === 'fulfilled' ? queries[0].value : defaultData;
    const balanceData = queries[1].status === 'fulfilled' ? queries[1].value : defaultData;
    const apiKeyData = queries[2].status === 'fulfilled' ? queries[2].value : defaultData;
    const operationData = queries[3].status === 'fulfilled' ? queries[3].value : defaultData;
    const signalData = queries[4].status === 'fulfilled' ? queries[4].value : defaultData;

    // Verificar atividade recente
    let isOnline = false;
    let lastActivity = new Date(0);
    let hoursSinceActivity = 999;

    try {
      const activityQuery = await Promise.race([
        activePool.query(`
          SELECT 
            COALESCE(MAX(last_login), '1970-01-01'::timestamp) as last_user_login,
            COUNT(CASE WHEN last_login > NOW() - INTERVAL '1 hour' THEN 1 END) as activity_1h
          FROM users
        `),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Activity query timeout')), 5000))
      ]);

      if (activityQuery.rows[0]) {
        lastActivity = new Date(activityQuery.rows[0].last_user_login);
        hoursSinceActivity = (now - lastActivity.getTime()) / (1000 * 60 * 60);
        isOnline = hoursSinceActivity < 2 && activityQuery.rows[0].activity_1h > 0;
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar atividade:', error.message);
    }

    const systemData = {
      timestamp: new Date().toISOString(),
      status: activePool ? (isOnline ? 'ONLINE' : 'OFFLINE') : 'ERROR',
      lastActivity: lastActivity.toISOString(),
      hoursSinceActivity: Math.round(hoursSinceActivity * 100) / 100,
      connectionName: 'Railway PostgreSQL',
      connectionAttempts: connectionAttempts,
      
      users: {
        total: parseInt(userData.rows[0]?.total_users) || 0,
        vip: parseInt(userData.rows[0]?.vip_users) || 0,
        active24h: parseInt(userData.rows[0]?.active_24h) || 0,
        active7d: parseInt(userData.rows[0]?.active_7d) || 0
      },
      
      balances: {
        total: parseFloat(balanceData.rows[0]?.total_balance) || 0,
        usersWithBalance: parseInt(balanceData.rows[0]?.users_with_balance) || 0,
        average: parseFloat(balanceData.rows[0]?.avg_balance) || 0
      },
      
      apiKeys: {
        total: parseInt(apiKeyData.rows[0]?.total_keys) || 0,
        active: parseInt(apiKeyData.rows[0]?.active_keys) || 0,
        valid: parseInt(apiKeyData.rows[0]?.valid_keys) || 0
      },
      
      operations: {
        total: parseInt(operationData.rows[0]?.total_operations) || 0,
        last24h: parseInt(operationData.rows[0]?.operations_24h) || 0,
        last7d: parseInt(operationData.rows[0]?.operations_7d) || 0
      },
      
      signals: {
        total: parseInt(signalData.rows[0]?.total_signals) || 0,
        last24h: parseInt(signalData.rows[0]?.signals_24h) || 0,
        active: parseInt(signalData.rows[0]?.active_signals) || 0
      },
      
      alerts: {
        total: 0,
        active: 0,
        highPriority: 0
      }
    };

    // Atualizar cache
    systemDataCache = systemData;
    lastCacheUpdate = now;

    console.log('✅ Dados reais obtidos com sucesso:', {
      status: systemData.status,
      connection: systemData.connectionName,
      users: systemData.users.total,
      operations: systemData.operations.total
    });

    return systemData;

  } catch (error) {
    console.error('❌ Erro ao buscar dados do sistema:', error.message);
    
    // Em caso de erro, tentar reconectar
    if (error.message.includes('ECONNRESET') || error.message.includes('timeout')) {
      console.log('🔄 Tentando reconectar devido ao erro...');
      activePool = null;
      await establishConnection();
    }
    
    // Retornar dados de erro
    return {
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      error: error.message,
      connectionName: 'Railway PostgreSQL',
      connectionAttempts: connectionAttempts,
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

  // Atualizar a cada 45 segundos
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
  }, 45000);

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
    <title>CoinBitClub - Dashboard Robusto</title>
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
            background: linear-gradient(45deg, #ff9800, #f57c00);
            box-shadow: 0 0 20px rgba(255, 152, 0, 0.5);
        }

        .status-error {
            background: linear-gradient(45deg, #f44336, #da190b);
            box-shadow: 0 0 20px rgba(244, 67, 54, 0.5);
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        .connection-info {
            text-align: center;
            margin-bottom: 20px;
            opacity: 0.8;
            font-size: 0.9rem;
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

        <div class="connection-info" id="connectionInfo">
            Estabelecendo conexão...
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
            ws = new WebSocket('ws://localhost:3015');
            
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

            // Atualizar informações de conexão
            const connectionInfo = document.getElementById('connectionInfo');
            connectionInfo.innerHTML = \`
                Conexão: \${data.connectionName || 'N/A'} | 
                Tentativas: \${data.connectionAttempts || 0} | 
                Última atividade: há \${data.hoursSinceActivity || 0}h
            \`;

            // Atualizar conteúdo
            const content = document.getElementById('content');
            
            if (data.status === 'ERROR') {
                content.innerHTML = \`
                    <div class="error-message">
                        <h3>⚠️ Erro no Sistema</h3>
                        <p>\${data.error}</p>
                        <p>Conexão: \${data.connectionName}</p>
                        <p>Tentativas: \${data.connectionAttempts}</p>
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
                            <div class="card-title">⚠️ Sistema</div>
                            <div class="metric">
                                <span class="metric-label">Status:</span>
                                <span class="metric-value">\${data.status}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Conexão:</span>
                                <span class="metric-value">\${data.connectionName}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Tentativas:</span>
                                <span class="metric-value">\${data.connectionAttempts}</span>
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

// Endpoint para trigger de broadcast
app.get('/api/trigger-broadcast', async (req, res) => {
    console.log('📞 Solicitação de broadcast recebida via GET');
    
    try {
        // Capturar dados do sistema
        const systemData = await fetchRealSystemData();
        console.log('📊 Dados capturados:', {
            usuarios: systemData.users?.total || 0,
            operacoes: systemData.operations?.total || 0,
            status: systemData.status
        });
        
        // Fazer broadcast imediato
        setTimeout(() => {
            broadcastToWebSocketClients(systemData);
        }, 100); // Delay menor
        
        res.json({ success: true, message: 'Broadcast realizado' });
    } catch (error) {
        console.error('❌ Erro no trigger-broadcast:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Inicializar conexão ao iniciar
async function initialize() {
  console.log(`🚀 Dashboard CoinBitClub Robusto iniciando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/system-data`);
  
  // Estabelecer conexão inicial
  const connected = await establishConnection();
  
  if (connected) {
    console.log('✅ Sistema inicializado com sucesso');
    
    // Teste inicial
    const testData = await fetchRealSystemData();
    console.log(`📈 Status inicial: ${testData.status} | Conexão: ${testData.connectionName}`);
    
    // Iniciar broadcast de dados para WebSocket
    startWebSocketBroadcast();
  } else {
    console.log('⚠️ Sistema iniciado mas sem conexão ativa');
  }
}

// Função para broadcast individual de dados para WebSocket
function broadcastToWebSocketClients(systemData) {
  try {
    // Enviar dados para WebSocket Server usando http nativo
    const http = require('http');
    const postData = JSON.stringify({
      type: 'systemData',
      data: systemData
    });
    
    const options = {
      hostname: 'localhost',
      port: 3015,
      path: '/api/broadcast',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`📊 Dados enviados para ${result.clientCount} clientes WebSocket`);
        } catch (error) {
          console.log('📊 Dados enviados para WebSocket');
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Erro ao enviar dados para WebSocket:', error.message);
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Erro ao preparar dados para WebSocket:', error.message);
  }
}

// Função para enviar dados para WebSocket automaticamente
async function startWebSocketBroadcast() {
  console.log('📡 Iniciando broadcast automático para WebSocket...');
  
  async function broadcastData() {
    try {
      const systemData = await fetchRealSystemData();
      
      // Enviar dados para WebSocket Server usando http nativo
      const http = require('http');
      const postData = JSON.stringify({
        type: 'systemData',
        data: systemData
      });
      
      const options = {
        hostname: 'localhost',
        port: 3015,
        path: '/api/broadcast',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log(`📊 Dados enviados para ${result.clientCount} clientes WebSocket`);
          } catch (error) {
            console.log('📊 Dados enviados para WebSocket');
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Erro ao enviar dados para WebSocket:', error.message);
      });
      
      req.write(postData);
      req.end();
      
    } catch (error) {
      console.error('❌ Erro ao preparar dados para WebSocket:', error.message);
    }
  }
  
  // Enviar dados a cada 45 segundos
  setInterval(broadcastData, 45000);
  
  // Enviar dados imediatamente
  broadcastData();
}

// Iniciar servidor
server.listen(PORT, () => {
  initialize();
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  if (activePool) {
    await activePool.end();
  }
  process.exit(0);
});
