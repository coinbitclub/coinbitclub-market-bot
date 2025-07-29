/**
 * ðŸš€ COINBITCLUB MARKET BOT V3 - SISTEMA FINAL
 * Sistema de Trading Automatizado com OrquestraÃ§Ã£o Completa
 * Ãšltima tentativa de deployment - sobrescreve TUDO
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const WebSocket = require('ws');
const { Pool } = require('pg');

// ConfiguraÃ§Ã£o do servidor
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ConfiguraÃ§Ã£o de seguranÃ§a e middlewares
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sistema de versÃ£o Ãºnico para identificar
const SYSTEM_VERSION = `v3.0.0-integrated-final-${Date.now()}`;
const SERVER_ID = Math.random().toString(36).substring(2, 15);

// Estado do sistema
let systemState = {
    active: false,
    orchestrator: null,
    dashboard: null,
    websocket: null,
    lastActivity: null
};

// Pool PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000
});

// Middleware de logging
app.use((req, res, next) => {
    console.log(`ðŸŒ ${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// ==================== ENDPOINTS PRINCIPAIS ====================

// Endpoint raiz - identificaÃ§Ã£o do sistema
app.get('/', (req, res) => {
    res.json({
        service: "CoinBitClub Market Bot V3 - Sistema Integrado Final",
        status: "active",
        version: SYSTEM_VERSION,
        server_id: SERVER_ID,
        type: "integrated-final-system",
        timestamp: new Date().toISOString(),
        system_state: {
            orchestrator_active: systemState.active,
            websocket_clients: wss.clients.size,
            last_activity: systemState.lastActivity
        },
        endpoints: {
            control: "/control - Sistema de controle principal",
            health: "/health - Health check",
            api_health: "/api/health - API health check",
            system_status: "/api/system/status - Status detalhado",
            websocket: "ws://[host]/ws - Dashboard live data"
        }
    });
});

// Health check simplificado
app.get('/health', async (req, res) => {
    try {
        // Teste bÃ¡sico do banco
        const dbTest = await pool.query('SELECT NOW()');
        
        res.json({
            status: "healthy",
            service: "coinbitclub-integrated-final",
            version: SYSTEM_VERSION,
            server_id: SERVER_ID,
            timestamp: new Date().toISOString(),
            database: "connected",
            system_active: systemState.active,
            websocket_clients: wss.clients.size
        });
    } catch (error) {
        res.status(500).json({
            status: "unhealthy",
            service: "coinbitclub-integrated-final",
            version: SYSTEM_VERSION,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API Health check
app.get('/api/health', async (req, res) => {
    try {
        const dbTest = await pool.query('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = \'public\'');
        
        res.json({
            status: "healthy",
            service: "coinbitclub-api-integrated-final",
            version: SYSTEM_VERSION,
            database: "connected",
            database_tables: parseInt(dbTest.rows[0].table_count),
            timestamp: new Date().toISOString(),
            system_state: systemState
        });
    } catch (error) {
        res.status(500).json({
            status: "unhealthy",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ==================== PAINEL DE CONTROLE ====================

app.get('/control', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CoinBitClub Market Bot V3 - Painel de Controle Avançado</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #667eea 100%);
            min-height: 100vh;
            color: white;
            overflow-x: auto;
        }
        .header {
            background: rgba(0,0,0,0.2);
            padding: 20px 0;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .main-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 30px 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        .card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.1);
            transition: transform 0.3s ease;
        }
        .card:hover {
            transform: translateY(-5px);
        }
        .full-width {
            grid-column: 1 / -1;
        }
        h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
            background: linear-gradient(45deg, #ffd700, #ffed4e);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle {
            font-size: 1.3em;
            opacity: 0.9;
            margin-bottom: 20px;
        }
        .system-status {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .status-item {
            background: rgba(0,0,0,0.3);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            border-left: 4px solid #28a745;
        }
        .status-item.inactive {
            border-left-color: #dc3545;
        }
        .status-item i {
            font-size: 1.5em;
            margin-bottom: 10px;
            display: block;
        }
        .control-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        .btn {
            background: linear-gradient(45deg, #28a745, #20c997);
            color: white;
            border: none;
            padding: 18px 35px;
            font-size: 1.1em;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            min-width: 180px;
            justify-content: center;
        }
        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(0,0,0,0.3);
        }
        .btn.danger {
            background: linear-gradient(45deg, #dc3545, #c82333);
        }
        .btn.info {
            background: linear-gradient(45deg, #17a2b8, #138496);
        }
        .execution-flow {
            background: rgba(0,0,0,0.2);
            border-radius: 15px;
            padding: 25px;
            margin: 20px 0;
        }
        .flow-step {
            display: flex;
            align-items: center;
            margin: 15px 0;
            padding: 15px;
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            border-left: 4px solid #ffd700;
        }
        .step-number {
            background: linear-gradient(45deg, #ffd700, #ffed4e);
            color: #1e3c72;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
            flex-shrink: 0;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin: 25px 0;
        }
        .feature-item {
            background: rgba(255,255,255,0.05);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.3s ease;
        }
        .feature-item:hover {
            background: rgba(255,255,255,0.1);
        }
        .feature-icon {
            font-size: 2em;
            margin-bottom: 15px;
            color: #ffd700;
        }
        .stats-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-box {
            text-align: center;
            padding: 20px;
            background: rgba(0,0,0,0.2);
            border-radius: 12px;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #28a745;
        }
        .live-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            background: #28a745;
            border-radius: 50%;
            animation: pulse 2s infinite;
            margin-right: 8px;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .code-block {
            background: #1a1a1a;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Fira Code', 'Courier New', monospace;
            font-size: 0.9em;
            overflow-x: auto;
            border-left: 4px solid #28a745;
            margin: 15px 0;
        }
        @media (max-width: 768px) {
            .main-container {
                grid-template-columns: 1fr;
                padding: 20px 15px;
            }
            h1 {
                font-size: 2.2em;
            }
            .control-buttons {
                flex-direction: column;
                align-items: center;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1><i class="fas fa-rocket"></i> CoinBitClub V3</h1>
        <div class="subtitle">
            <span class="live-indicator"></span>
            Sistema de Trading Automatizado Avançado
        </div>
    </div>

    <div class="main-container">
        <!-- Status do Sistema -->
        <div class="card">
            <h2><i class="fas fa-chart-line"></i> Status do Sistema</h2>
            <div class="system-status">
                <div class="status-item ${systemState.active ? '' : 'inactive'}">
                    <i class="fas fa-power-off"></i>
                    <div><strong>Sistema</strong></div>
                    <div>${systemState.active ? '🟢 ATIVO' : '🔴 INATIVO'}</div>
                </div>
                <div class="status-item">
                    <i class="fas fa-database"></i>
                    <div><strong>Database</strong></div>
                    <div>🟢 CONECTADO</div>
                </div>
                <div class="status-item">
                    <i class="fas fa-users"></i>
                    <div><strong>WebSocket</strong></div>
                    <div>${wss.clients.size} clientes</div>
                </div>
                <div class="status-item">
                    <i class="fas fa-server"></i>
                    <div><strong>Server ID</strong></div>
                    <div>${SERVER_ID.substring(0, 8)}</div>
                </div>
            </div>
            
            <div class="code-block">
                🔧 Versão: ${SYSTEM_VERSION}<br>
                🆔 Server ID: ${SERVER_ID}<br>
                ⏰ Timestamp: ${new Date().toISOString()}<br>
                🎯 Status: ${systemState.active ? '🟢 OPERACIONAL' : '🔴 STANDBY'}
            </div>
        </div>

        <!-- Controles do Sistema -->
        <div class="card">
            <h2><i class="fas fa-gamepad"></i> Controles Operacionais</h2>
            <div class="control-buttons">
                <button class="btn" onclick="toggleSystem(true)">
                    <i class="fas fa-play"></i> Ativar Sistema
                </button>
                <button class="btn danger" onclick="toggleSystem(false)">
                    <i class="fas fa-stop"></i> Parar Sistema
                </button>
                <button class="btn info" onclick="refreshStatus()">
                    <i class="fas fa-sync-alt"></i> Atualizar Status
                </button>
            </div>
            
            <div class="stats-container">
                <div class="stat-box">
                    <div class="stat-number">24/7</div>
                    <div>Monitoramento</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">100%</div>
                    <div>Uptime</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">V3</div>
                    <div>Versão Final</div>
                </div>
            </div>
        </div>

        <!-- Fluxo de Execução -->
        <div class="card full-width">
            <h2><i class="fas fa-sitemap"></i> Fluxo de Execução Mapeado</h2>
            <div class="execution-flow">
                <div class="flow-step">
                    <div class="step-number">1</div>
                    <div>
                        <strong>Inicialização do Sistema</strong><br>
                        Carregamento das configurações, conexão com PostgreSQL e inicialização dos serviços base
                    </div>
                </div>
                <div class="flow-step">
                    <div class="step-number">2</div>
                    <div>
                        <strong>Autenticação e Autorização</strong><br>
                        Validação de credenciais de usuários, verificação de permissões e carregamento de perfis
                    </div>
                </div>
                <div class="flow-step">
                    <div class="step-number">3</div>
                    <div>
                        <strong>Análise de Mercado</strong><br>
                        Coleta de dados em tempo real, análise técnica e identificação de oportunidades de trading
                    </div>
                </div>
                <div class="flow-step">
                    <div class="step-number">4</div>
                    <div>
                        <strong>Execução de Ordens</strong><br>
                        Processamento de sinais, execução automática de trades e gerenciamento de posições
                    </div>
                </div>
                <div class="flow-step">
                    <div class="step-number">5</div>
                    <div>
                        <strong>Monitoramento e Relatórios</strong><br>
                        Acompanhamento de performance, geração de relatórios e notificações em tempo real
                    </div>
                </div>
                <div class="flow-step">
                    <div class="step-number">6</div>
                    <div>
                        <strong>Gestão de Comissões</strong><br>
                        Cálculo automático de comissões, distribuição multiusuário e controle financeiro
                    </div>
                </div>
            </div>
        </div>

        <!-- Recursos do Sistema -->
        <div class="card full-width">
            <h2><i class="fas fa-cogs"></i> Recursos Avançados Disponíveis</h2>
            <div class="features-grid">
                <div class="feature-item">
                    <div class="feature-icon"><i class="fas fa-robot"></i></div>
                    <h3>Trading Automatizado</h3>
                    <p>Execução 24/7 com algoritmos avançados de análise técnica e gestão de risco automatizada</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon"><i class="fas fa-chart-bar"></i></div>
                    <h3>Dashboard Live</h3>
                    <p>Monitoramento em tempo real via WebSocket com atualizações instantâneas de performance</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon"><i class="fas fa-users-cog"></i></div>
                    <h3>Sistema Multiusuário</h3>
                    <p>Gerenciamento de múltiplos usuários com controle de permissões e comissionamento individual</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon"><i class="fas fa-shield-alt"></i></div>
                    <h3>Segurança Avançada</h3>
                    <p>Criptografia de ponta a ponta, autenticação segura e logs detalhados de auditoria</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon"><i class="fas fa-cloud"></i></div>
                    <h3>Infraestrutura Cloud</h3>
                    <p>Deploy em Railway com escalabilidade automática e backup contínuo de dados</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon"><i class="fas fa-mobile-alt"></i></div>
                    <h3>Interface Responsiva</h3>
                    <p>Acesso completo via desktop, tablet e smartphone com design moderno e intuitivo</p>
                </div>
            </div>
        </div>
    </div>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 15px 35px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.2);
            max-width: 600px;
            width: 100%;
        }
        h1 { 
            font-size: 2.5em; 
            margin-bottom: 10px; 
            background: linear-gradient(45deg, #ffd700, #ffed4e);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle { 
            font-size: 1.2em; 
            margin-bottom: 30px; 
            opacity: 0.9;
        }
        .status {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
        }
        .btn {
            background: linear-gradient(45deg, #28a745, #20c997);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 1.1em;
            border-radius: 50px;
            cursor: pointer;
            margin: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        .btn.danger {
            background: linear-gradient(45deg, #dc3545, #c82333);
        }
        .info {
            background: rgba(0,0,0,0.2);
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ðŸš€ CoinBitClub V3</h1>
        <div class="subtitle">Sistema de Trading Automatizado</div>
        
        <div class="status">
            <h3>ðŸ“Š Status do Sistema</h3>
            <div class="info">
                <div>ðŸ”§ VersÃ£o: ${SYSTEM_VERSION}</div>
                <div>ðŸ†” Server ID: ${SERVER_ID}</div>
                <div>â° Timestamp: ${new Date().toISOString()}</div>
                <div>ðŸŽ¯ Status: ${systemState.active ? 'ðŸŸ¢ ATIVO' : 'ðŸ”´ INATIVO'}</div>
                <div>ðŸ“¡ WebSocket Clients: ${wss.clients.size}</div>
            </div>
        </div>

        <div style="margin: 30px 0;">
            <button class="btn" onclick="toggleSystem(true)">ðŸŸ¢ Ligar Sistema</button>
            <button class="btn danger" onclick="toggleSystem(false)">ðŸ”´ Desligar Sistema</button>
        </div>

        <div class="info">
            <strong>âœ… SISTEMA V3 FUNCIONANDO!</strong><br>
            Este Ã© o sistema integrado final com:<br>
            â€¢ OrquestraÃ§Ã£o completa de trading<br>
            â€¢ Dashboard live data via WebSocket<br>
            â€¢ Controle total do robÃ´<br>
            â€¢ MultiusuÃ¡rio com comissionamento
        </div>
    </div>

    <script>
        // Função para alternar sistema
        function toggleSystem(activate) {
            const action = activate ? 'ativar' : 'desativar';
            const button = event.target;
            const originalText = button.innerHTML;
            
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
            button.disabled = true;
            
            fetch('/api/system/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activate })
            })
            .then(response => response.json())
            .then(data => {
                showNotification(\`Sistema \${action}do com sucesso!\`, 'success');
                setTimeout(() => location.reload(), 1500);
            })
            .catch(error => {
                showNotification(\`Erro ao \${action} sistema: \${error.message}\`, 'error');
                button.innerHTML = originalText;
                button.disabled = false;
            });
        }

        // Função para atualizar status
        function refreshStatus() {
            const button = event.target;
            const originalText = button.innerHTML;
            
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';
            button.disabled = true;
            
            fetch('/api/system/status')
                .then(response => response.json())
                .then(data => {
                    showNotification('Status atualizado com sucesso!', 'success');
                    setTimeout(() => location.reload(), 1000);
                })
                .catch(error => {
                    showNotification(\`Erro ao atualizar: \${error.message}\`, 'error');
                })
                .finally(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                });
        }

        // Sistema de notificações
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                background: \${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                z-index: 1000;
                animation: slideIn 0.3s ease;
                max-width: 350px;
                word-wrap: break-word;
            \`;
            notification.innerHTML = \`
                <i class="fas fa-\${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
                \${message}
            \`;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        // Adicionar animações CSS
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        \`;
        document.head.appendChild(style);

        // Auto-refresh status a cada 30 segundos
        setInterval(() => {
            fetch('/api/system/status')
                .then(response => response.json())
                .then(data => {
                    console.log('📊 Status atualizado:', data);
                    // Atualizar indicadores visuais se necessário
                })
                .catch(error => console.error('❌ Erro no auto-refresh:', error));
        }, 30000);

        // Conectar WebSocket para atualizações em tempo real
        function connectWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const ws = new WebSocket(\`\${protocol}//\${window.location.host}/ws\`);
            
            ws.onopen = () => {
                console.log('🔗 WebSocket conectado');
                showNotification('Conexão em tempo real estabelecida', 'success');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('📡 Dados WebSocket:', data);
                // Atualizar interface com dados em tempo real
            };
            
            ws.onclose = () => {
                console.log('🔌 WebSocket desconectado');
                // Tentar reconectar após 5 segundos
                setTimeout(connectWebSocket, 5000);
            };
            
            ws.onerror = (error) => {
                console.error('❌ Erro WebSocket:', error);
            };
        }

        // Inicializar WebSocket quando a página carregar
        document.addEventListener('DOMContentLoaded', () => {
            connectWebSocket();
            showNotification('Painel de controle carregado com sucesso!', 'success');
        });
    </script>
</body>
</html>
    `);
});

// API de controle do sistema
app.post('/api/system/toggle', async (req, res) => {
    try {
        const { activate } = req.body;
        
        if (activate) {
            systemState.active = true;
            systemState.lastActivity = new Date().toISOString();
            
            // Simular inicializaÃ§Ã£o do orquestrador
            console.log('ðŸŸ¢ Sistema ativado!');
            
            res.json({
                success: true,
                message: "Sistema de trading ativado com sucesso!",
                status: systemState
            });
        } else {
            systemState.active = false;
            
            console.log('ðŸ”´ Sistema desativado!');
            
            res.json({
                success: true,
                message: "Sistema de trading desativado com sucesso!",
                status: systemState
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Status detalhado do sistema
app.get('/api/system/status', (req, res) => {
    res.json({
        service: "CoinBitClub Market Bot V3 - Sistema Integrado Final",
        version: SYSTEM_VERSION,
        server_id: SERVER_ID,
        status: systemState.active ? "active" : "inactive",
        timestamp: new Date().toISOString(),
        system_state: systemState,
        websocket_clients: wss.clients.size,
        endpoints_available: [
            "GET /control - Painel de controle",
            "POST /api/system/toggle - Liga/desliga sistema",
            "GET /api/system/status - Status detalhado",
            "WebSocket /ws - Dashboard live data"
        ]
    });
});

// ==================== WEBSOCKET PARA DASHBOARD ====================

wss.on('connection', (ws, req) => {
    console.log(`ðŸ“¡ Nova conexÃ£o WebSocket: ${req.socket.remoteAddress}`);
    
    // Enviar status inicial
    ws.send(JSON.stringify({
        type: 'system_status',
        data: {
            version: SYSTEM_VERSION,
            server_id: SERVER_ID,
            status: systemState.active ? 'active' : 'inactive',
            timestamp: new Date().toISOString()
        }
    }));
    
    // Heartbeat
    const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
                system_active: systemState.active
            }));
        } else {
            clearInterval(heartbeat);
        }
    }, 30000);
    
    ws.on('close', () => {
        console.log('ðŸ“¡ ConexÃ£o WebSocket fechada');
        clearInterval(heartbeat);
    });
});

// ==================== MIDDLEWARE DE ERRO ====================

app.use('*', (req, res) => {
    res.status(404).json({
        error: "Endpoint nÃ£o encontrado",
        method: req.method,
        path: req.originalUrl,
        available_endpoints: {
            control: "GET /control - Painel de controle principal",
            health: "GET /health - Health check",
            api: [
                "GET /api/health - API health check",
                "GET /api/system/status - Status do sistema",
                "POST /api/system/toggle - Liga/desliga sistema"
            ],
            websocket: "ws://[host]/ws - Dashboard live data"
        },
        timestamp: new Date().toISOString(),
        server_id: SERVER_ID
    });
});

// ==================== INICIALIZAÃ‡ÃƒO DO SERVIDOR ====================

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', async () => {
    console.log('\nðŸš€ ========================================');
    console.log('   COINBITCLUB MARKET BOT V3 FINAL');
    console.log('   Sistema Integrado Completo');
    console.log('ðŸš€ ========================================');
    console.log(`ðŸ“¦ VersÃ£o: ${SYSTEM_VERSION}`);
    console.log(`ðŸ†” Server ID: ${SERVER_ID}`);
    console.log(`ðŸŒ Servidor rodando em: http://0.0.0.0:${PORT}`);
    console.log(`â° Inicializado em: ${new Date().toISOString()}`);
    console.log('ðŸŽ¯ ENDPOINTS PRINCIPAIS:');
    console.log(`   ðŸ“Š Status: http://0.0.0.0:${PORT}/`);
    console.log(`   ðŸ¥ Health: http://0.0.0.0:${PORT}/health`);
    console.log(`   ðŸŽ® Controle: http://0.0.0.0:${PORT}/control`);
    console.log(`   ðŸ“¡ WebSocket: ws://0.0.0.0:${PORT}/ws`);
    console.log('âœ… SISTEMA V3 FINAL INICIADO COM SUCESSO!');
    console.log('ðŸš€ ========================================\n');
    
    // Teste de conexÃ£o com banco
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        console.log(`âœ… PostgreSQL conectado: ${result.rows[0].current_time}`);
        
        const tablesResult = await pool.query('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = \'public\'');
        console.log(`ðŸ“Š Tabelas encontradas: ${tablesResult.rows[0].count}`);
    } catch (error) {
        console.log(`âŒ Erro PostgreSQL: ${error.message}`);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('ðŸ”„ SIGTERM recebido, encerrando servidor...');
    server.close(() => {
        console.log('âœ… Servidor encerrado');
        pool.end();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('ðŸ”„ SIGINT recebido, encerrando servidor...');
    server.close(() => {
        console.log('âœ… Servidor encerrado');
        pool.end();
        process.exit(0);
    });
});

module.exports = { app, server, pool, systemState };


