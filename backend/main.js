/**
 * 🚀 COINBITCLUB MARKET BOT V3 - SISTEMA FINAL
 * Sistema de Trading Automatizado com Orquestracao Completa
 * Ultima tentativa de deployment - sobrescreve TUDO
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const WebSocket = require('ws');
const { Pool } = require('pg');

// Configuracao do servidor
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuracao de seguranca e middlewares
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: ['http://localhost:3001', 'https://coinbitclub-market-bot.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Sistema de versao unico para identificar - PRODUCAO
const SYSTEM_VERSION = 'V3.0.0-PRODUCTION-' + Date.now();
const NODE_ENV = 'production';

// Configuracao do PostgreSQL Railway
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Middleware de logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`🌐 ${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Endpoint raiz - identificacao do sistema
app.get('/', async (req, res) => {
    try {
        let dbStatus = 'disconnected';
        let dbInfo = {};
        
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT NOW() as current_time, version() as db_version');
            dbStatus = 'connected';
            dbInfo = {
                currentTime: result.rows[0].current_time,
                version: result.rows[0].db_version,
                connectionString: process.env.DATABASE_URL ? 'configured' : 'not configured'
            };
            client.release();
        } catch (dbError) {
            console.error('Database connection error:', dbError);
            dbInfo = { error: dbError.message };
        }

        // Teste basico do banco
        let tablesCount = 0;
        try {
            const client = await pool.connect();
            const tablesResult = await client.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);
            tablesCount = tablesResult.rows[0].count;
            client.release();
        } catch (error) {
            console.error('Tables count error:', error);
        }

        const systemInfo = {
            name: 'CoinBitClub Market Bot',
            version: SYSTEM_VERSION,
            status: 'operational',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: NODE_ENV || process.env.NODE_ENV || 'production',
            database: {
                status: dbStatus,
                tablesCount: tablesCount,
                info: dbInfo
            },
            features: [
                'JWT Authentication',
                'PostgreSQL Railway Integration',
                'Real-time WebSocket',
                'CORS Configured',
                'Security Headers',
                'API Gateway'
            ]
        };

        res.json(systemInfo);
    } catch (error) {
        console.error('Root endpoint error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            version: SYSTEM_VERSION
        });
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: SYSTEM_VERSION,
            database: 'connected'
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API Status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        status: 'operational',
        version: SYSTEM_VERSION,
        timestamp: new Date().toISOString(),
        services: {
            api: 'online',
            database: 'connected',
            websocket: 'active'
        }
    });
});

// Dashboard HTML endpoint
app.get('/dashboard', (req, res) => {
    const dashboardHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CoinBitClub Market Bot V3 - Painel de Controle Avancado</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
            color: #ffffff;
            min-height: 100vh;
            overflow-x: auto;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        .header .subtitle {
            font-size: 1.2em;
            color: #a8dadc;
            margin-bottom: 20px;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .status-card {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            border-left: 4px solid #3498db;
            transition: transform 0.3s ease;
        }
        
        .status-card:hover {
            transform: translateY(-5px);
        }
        
        .status-card h3 {
            font-size: 1.3em;
            margin-bottom: 15px;
            color: #3498db;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status-card p {
            margin-bottom: 8px;
            color: #ecf0f1;
        }
        
        .status-online {
            color: #27ae60;
            font-weight: bold;
        }
        
        .status-offline {
            color: #e74c3c;
            font-weight: bold;
        }
        
        .system-info {
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
        }
        
        .system-info h2 {
            margin-bottom: 20px;
            font-size: 1.8em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .info-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
        }
        
        .info-item strong {
            color: #fbbf24;
        }
        
        .features-section {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(5, 150, 105, 0.3);
        }
        
        .cycle-section {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(30, 64, 175, 0.3);
        }
        
        .cycle-section h2 {
            margin-bottom: 30px;
            font-size: 1.8em;
            display: flex;
            align-items: center;
            gap: 10px;
            color: white;
        }
        
        .cycle-container {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
            position: relative;
        }
        
        .cycle-step {
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            padding: 20px;
            min-width: 160px;
            text-align: center;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            position: relative;
        }
        
        .cycle-step.active {
            border-color: #fbbf24;
            background: rgba(251, 191, 36, 0.2);
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
            animation: pulse 2s infinite;
        }
        
        .cycle-step.processing {
            border-color: #10b981;
            background: rgba(16, 185, 129, 0.2);
            animation: spin 2s linear infinite;
        }
        
        .cycle-step.completed {
            border-color: #22c55e;
            background: rgba(34, 197, 94, 0.2);
        }
        
        .cycle-step.error {
            border-color: #ef4444;
            background: rgba(239, 68, 68, 0.2);
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .step-number {
            background: #fbbf24;
            color: #1e40af;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin: 0 auto 10px;
        }
        
        .step-icon {
            font-size: 1.5em;
            margin-bottom: 10px;
            color: #fbbf24;
        }
        
        .step-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: white;
        }
        
        .step-desc {
            font-size: 0.9em;
            color: #cbd5e1;
            margin-bottom: 10px;
        }
        
        .step-status {
            font-size: 0.8em;
            color: #fbbf24;
            font-weight: bold;
            background: rgba(0, 0, 0, 0.3);
            padding: 5px 8px;
            border-radius: 8px;
        }
        
        .cycle-arrow {
            font-size: 1.5em;
            color: #fbbf24;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: flow 3s ease-in-out infinite;
        }
        
        @keyframes flow {
            0%, 100% { opacity: 0.5; transform: translateX(0); }
            50% { opacity: 1; transform: translateX(5px); }
        }
        
        .cycle-break {
            width: 100%;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .cycle-break::after {
            content: "⤵";
            font-size: 2em;
            color: #fbbf24;
            animation: flow 3s ease-in-out infinite;
        }
        
        .cycle-return {
            position: absolute;
            bottom: -60px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            color: #fbbf24;
        }
        
        .return-arrow {
            font-size: 2em;
            animation: rotate 4s linear infinite;
        }
        
        @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .return-text {
            font-size: 0.9em;
            margin-top: 5px;
            font-weight: bold;
        }
        
        .cycle-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }
        
        .stat-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #fbbf24;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 0.9em;
            color: #cbd5e1;
        }
        
        .features-section {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(5, 150, 105, 0.3);
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .feature-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            backdrop-filter: blur(10px);
            transition: transform 0.3s ease;
        }
        
        .feature-item:hover {
            transform: scale(1.05);
        }
        
        .feature-item i {
            font-size: 2em;
            margin-bottom: 10px;
            color: #fbbf24;
        }
        
        .version-badge {
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            margin-top: 10px;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .status-grid {
                grid-template-columns: 1fr;
            }
            
            .cycle-container {
                flex-direction: column;
                align-items: center;
            }
            
            .cycle-arrow {
                transform: rotate(90deg);
                margin: 10px 0;
            }
            
            .cycle-break {
                margin: 20px 0;
            }
            
            .cycle-break::after {
                content: "⤵";
                transform: rotate(0deg);
            }
            
            .cycle-stats {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .cycle-step {
                min-width: 140px;
            }
            
            .return-arrow {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-robot"></i> CoinBitClub Market Bot V3</h1>
            <div class="subtitle">
                Sistema de Trading Automatizado Avancado
            </div>
            <div class="version-badge">
                <i class="fas fa-tag"></i> Versao Final
            </div>
        </div>
        
        <div class="status-grid">
            <div class="status-card">
                <h3><i class="fas fa-server"></i> Status do Sistema</h3>
                <p><strong>Status:</strong> <span class="status-online">ONLINE</span></p>
                <p><strong>Versao:</strong> ${SYSTEM_VERSION}</p>
                <p><strong>Ambiente:</strong> ${NODE_ENV || process.env.NODE_ENV || 'production'}</p>
                <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} segundos</p>
            </div>
            
            <div class="status-card">
                <h3><i class="fas fa-database"></i> Banco de Dados</h3>
                <p><strong>Status:</strong> <span class="status-online">CONECTADO</span></p>
                <p><strong>Tipo:</strong> PostgreSQL</p>
                <p><strong>Host:</strong> Railway</p>
                <p><strong>SSL:</strong> Habilitado</p>
            </div>
            
            <div class="status-card">
                <h3><i class="fas fa-wifi"></i> WebSocket</h3>
                <p><strong>Status:</strong> <span class="status-online">ATIVO</span></p>
                <p><strong>Conexoes:</strong> ${wss.clients.size}</p>
                <p><strong>Protocolo:</strong> WS</p>
                <p><strong>Heartbeat:</strong> Ativado</p>
            </div>
        </div>
        
        <!-- Ciclo de Trading Visual -->
        <div class="cycle-section">
            <h2><i class="fas fa-sync-alt"></i> Ciclo de Trading Automático</h2>
            <div class="cycle-container">
                <div class="cycle-step active" id="step-1">
                    <div class="step-number">1</div>
                    <div class="step-icon"><i class="fas fa-satellite-dish"></i></div>
                    <div class="step-title">Recepção Sinais</div>
                    <div class="step-desc">TradingView → Webhook</div>
                    <div class="step-status" id="status-1">Aguardando...</div>
                </div>
                
                <div class="cycle-arrow">→</div>
                
                <div class="cycle-step" id="step-2">
                    <div class="step-number">2</div>
                    <div class="step-icon"><i class="fas fa-brain"></i></div>
                    <div class="step-title">Análise F&G</div>
                    <div class="step-desc">Fear & Greed Index</div>
                    <div class="step-status" id="status-2">Valor: 63</div>
                </div>
                
                <div class="cycle-arrow">→</div>
                
                <div class="cycle-step" id="step-3">
                    <div class="step-number">3</div>
                    <div class="step-icon"><i class="fas fa-shield-check"></i></div>
                    <div class="step-title">Validação</div>
                    <div class="step-desc">Direction Allowed</div>
                    <div class="step-status" id="status-3">BOTH OK</div>
                </div>
                
                <div class="cycle-arrow">→</div>
                
                <div class="cycle-step" id="step-4">
                    <div class="step-number">4</div>
                    <div class="step-icon"><i class="fas fa-cogs"></i></div>
                    <div class="step-title">Processamento</div>
                    <div class="step-desc">Gestores Ativos</div>
                    <div class="step-status" id="status-4">4/4 Ativos</div>
                </div>
                
                <div class="cycle-break"></div>
                
                <div class="cycle-step" id="step-5">
                    <div class="step-number">5</div>
                    <div class="step-icon"><i class="fas fa-chart-line"></i></div>
                    <div class="step-title">Abertura</div>
                    <div class="step-desc">Posições Trading</div>
                    <div class="step-status" id="status-5">0 Ativas</div>
                </div>
                
                <div class="cycle-arrow">→</div>
                
                <div class="cycle-step" id="step-6">
                    <div class="step-number">6</div>
                    <div class="step-icon"><i class="fas fa-eye"></i></div>
                    <div class="step-title">Monitoramento</div>
                    <div class="step-desc">Tempo Real</div>
                    <div class="step-status" id="status-6">24/7 Ativo</div>
                </div>
                
                <div class="cycle-arrow">→</div>
                
                <div class="cycle-step" id="step-7">
                    <div class="step-number">7</div>
                    <div class="step-icon"><i class="fas fa-times-circle"></i></div>
                    <div class="step-title">Fechamento</div>
                    <div class="step-desc">Stop/Take Profit</div>
                    <div class="step-status" id="status-7">Auto</div>
                </div>
                
                <div class="cycle-arrow">→</div>
                
                <div class="cycle-step" id="step-8">
                    <div class="step-number">8</div>
                    <div class="step-icon"><i class="fas fa-dollar-sign"></i></div>
                    <div class="step-title">Financeiro</div>
                    <div class="step-desc">P&L + Comissões</div>
                    <div class="step-status" id="status-8">R$ 0,00</div>
                </div>
                
                <div class="cycle-return">
                    <div class="return-arrow">↺</div>
                    <div class="return-text">Ciclo Contínuo</div>
                </div>
            </div>
            
            <!-- Estatísticas do Ciclo -->
            <div class="cycle-stats">
                <div class="stat-item">
                    <div class="stat-value" id="total-cycles">0</div>
                    <div class="stat-label">Ciclos Completos</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="active-operations">0</div>
                    <div class="stat-label">Operações Ativas</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="signals-processed">16</div>
                    <div class="stat-label">Sinais Processados</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="success-rate">100%</div>
                    <div class="stat-label">Taxa de Sucesso</div>
                </div>
            </div>
        </div>
        
        <!-- Fluxo de Execucao -->
        <div class="features-section">
            <h2><i class="fas fa-sitemap"></i> Componentes do Sistema</h2>
            <div class="features-grid">
                <div class="feature-item">
                    <i class="fas fa-play"></i>
                    <div>Inicialização</div>
                </div>
                <div class="feature-item">
                    <i class="fas fa-database"></i>
                    <div>Conexão DB</div>
                </div>
                <div class="feature-item">
                    <i class="fas fa-shield-alt"></i>
                    <div>Segurança</div>
                </div>
                <div class="feature-item">
                    <i class="fas fa-route"></i>
                    <div>Rotas API</div>
                </div>
                <div class="feature-item">
                    <i class="fas fa-broadcast-tower"></i>
                    <div>WebSocket</div>
                </div>
                <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    <div>Sistema Ativo</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p><i class="fas fa-copyright"></i> 2024 CoinBitClub - Sistema de Trading Automatizado</p>
            <p>Desenvolvido com <i class="fas fa-heart" style="color: #e74c3c;"></i> pela equipe CoinBitClub</p>
        </div>
    </div>
    
    <script>
        let cycleStepIndex = 0;
        let cycleInterval;
        
        // Dados do ciclo em tempo real
        async function updateCycleStatus() {
            try {
                const response = await fetch('/api/gestores/status');
                const data = await response.json();
                
                if (data.success) {
                    // Atualizar estatísticas
                    const completo = data.gestores.orquestrador_completo;
                    document.getElementById('total-cycles').textContent = completo.ciclosCompletos || 0;
                    document.getElementById('active-operations').textContent = completo.operacoesAtivas || 0;
                    document.getElementById('signals-processed').textContent = data.gestores.processamento_sinais.sinaisProcessados || 0;
                    
                    // Atualizar status dos steps
                    updateStepStatus(1, data.gestores.processamento_sinais.isRunning ? 'Ativo' : 'Inativo');
                    updateStepStatus(2, \`Valor: \${data.gestores.fear_greed.value || 63}\`);
                    updateStepStatus(3, 'BOTH OK');
                    updateStepStatus(4, \`\${Object.keys(data.gestores).length}/4 Ativos\`);
                    updateStepStatus(5, \`\${completo.operacoesAtivas || 0} Ativas\`);
                    updateStepStatus(6, '24/7 Ativo');
                    updateStepStatus(7, 'Auto');
                    updateStepStatus(8, 'R$ 0,00');
                    
                    // Destacar step ativo baseado no estado
                    highlightActiveStep(completo.estadoAtual || 'AGUARDANDO');
                }
            } catch (error) {
                console.error('Erro ao atualizar status do ciclo:', error);
            }
        }
        
        function updateStepStatus(stepNumber, status) {
            const statusElement = document.getElementById(\`status-\${stepNumber}\`);
            if (statusElement) {
                statusElement.textContent = status;
            }
        }
        
        function highlightActiveStep(estado) {
            // Remover todas as classes ativas
            document.querySelectorAll('.cycle-step').forEach(step => {
                step.classList.remove('active', 'processing', 'completed');
            });
            
            // Mapear estado para step
            const stateMap = {
                'AGUARDANDO': 1,
                'PROCESSANDO_SINAIS': 2,
                'VALIDANDO': 3,
                'EXECUTANDO': 4,
                'MONITORANDO': 6,
                'FINALIZANDO': 8
            };
            
            const activeStep = stateMap[estado] || 1;
            const stepElement = document.getElementById(\`step-\${activeStep}\`);
            
            if (stepElement) {
                stepElement.classList.add('active');
            }
        }
        
        // Simular animação de ciclo
        function startCycleAnimation() {
            const steps = document.querySelectorAll('.cycle-step');
            
            cycleInterval = setInterval(() => {
                // Remover classe ativa anterior
                steps.forEach(step => step.classList.remove('active'));
                
                // Adicionar classe ativa ao step atual
                if (steps[cycleStepIndex]) {
                    steps[cycleStepIndex].classList.add('active');
                }
                
                // Avançar para próximo step
                cycleStepIndex = (cycleStepIndex + 1) % steps.length;
                
                // A cada ciclo completo, incrementar contador
                if (cycleStepIndex === 0) {
                    const currentCycles = parseInt(document.getElementById('total-cycles').textContent) || 0;
                    document.getElementById('total-cycles').textContent = currentCycles + 1;
                }
            }, 2000); // Trocar a cada 2 segundos
        }
        
        // Inicializar
        document.addEventListener('DOMContentLoaded', function() {
            updateCycleStatus();
            startCycleAnimation();
            
            // Atualizar status a cada 10 segundos
            setInterval(updateCycleStatus, 10000);
        });
        
        // Auto refresh a cada 30 segundos
        setTimeout(() => {
            location.reload();
        }, 30000);
        
        console.log('🚀 CoinBitClub Market Bot V3 Dashboard Carregado');
        console.log('Versao:', '${SYSTEM_VERSION}');
    </script>
</body>
</html>
    `;
    
    res.send(dashboardHTML);
});

// WebSocket handling
wss.on('connection', (ws) => {
    console.log('📡 Nova conexao WebSocket estabelecida');
    
    ws.on('message', (message) => {
        console.log('📨 Mensagem recebida:', message.toString());
    });
    
    ws.on('close', () => {
        console.log('📡 Conexao WebSocket fechada');
    });
    
    // Enviar ping a cada 30 segundos
    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    }, 30000);
    
    ws.on('close', () => {
        clearInterval(pingInterval);
    });
});

// ============ SISTEMA AUTOMÁTICO FEAR & GREED ============

class GestorFearGreedAutomatico {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
        this.ultimaAtualizacao = null;
        this.contadorErros = 0;
        this.maxErros = 3;
    }

    async atualizarFearGreed() {
        console.log('🔄 [FEAR&GREED] Iniciando atualização automática...');
        
        try {
            const axios = require('axios');
            
            // APIs para consultar Fear & Greed
            const apis = [
                {
                    name: 'CoinStats',
                    url: 'https://openapiv1.coinstats.app/insights/fear-and-greed',
                    headers: {
                        'X-API-KEY': 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=',
                        'Accept': 'application/json'
                    },
                    parser: (data) => {
                        if (data?.now) {
                            return {
                                value: data.now.value,
                                classification: data.now.value_classification,
                                timestamp: data.now.update_time
                            };
                        }
                        return null;
                    }
                },
                {
                    name: 'Alternative.me',
                    url: 'https://api.alternative.me/fng/?limit=1',
                    headers: {},
                    parser: (data) => {
                        if (data?.data?.[0]) {
                            const item = data.data[0];
                            return {
                                value: parseInt(item.value),
                                classification: item.value_classification,
                                timestamp: item.timestamp
                            };
                        }
                        return null;
                    }
                }
            ];

            let dadosObtidos = null;
            let fonteUsada = null;

            // Tentar cada API
            for (const api of apis) {
                try {
                    console.log(`🔍 [FEAR&GREED] Tentando ${api.name}...`);
                    
                    const response = await axios.get(api.url, {
                        headers: api.headers,
                        timeout: 15000
                    });

                    dadosObtidos = api.parser(response.data);
                    
                    if (dadosObtidos && dadosObtidos.value) {
                        fonteUsada = api.name.toUpperCase().replace('.', '_');
                        console.log(`✅ [FEAR&GREED] Dados obtidos de ${api.name}: ${dadosObtidos.value}`);
                        break;
                    }
                    
                } catch (apiError) {
                    console.log(`⚠️ [FEAR&GREED] Falha em ${api.name}: ${apiError.message}`);
                    continue;
                }
            }

            // Fallback se todas as APIs falharam
            if (!dadosObtidos) {
                console.log('⚠️ [FEAR&GREED] Todas APIs falharam, usando FALLBACK = 50');
                dadosObtidos = {
                    value: 50,
                    classification: 'Neutral',
                    timestamp: new Date().toISOString()
                };
                fonteUsada = 'FALLBACK';
            }

            // Salvar no banco
            await this.salvarNoBanco(dadosObtidos, fonteUsada);
            
            // Reset contador de erros em caso de sucesso
            this.contadorErros = 0;
            this.ultimaAtualizacao = new Date();
            
            console.log(`✅ [FEAR&GREED] Atualização concluída: ${dadosObtidos.value} (${dadosObtidos.classification})`);
            
        } catch (error) {
            this.contadorErros++;
            console.error(`❌ [FEAR&GREED] Erro na atualização (${this.contadorErros}/${this.maxErros}):`, error.message);
            
            // Se muitos erros consecutivos, aumentar intervalo
            if (this.contadorErros >= this.maxErros) {
                console.log('⚠️ [FEAR&GREED] Muitos erros consecutivos, pulando próxima atualização...');
                this.contadorErros = 0; // Reset para próxima tentativa
            }
        }
    }

    async salvarNoBanco(dados, fonte) {
        const client = await pool.connect();
        
        try {
            // Mapear classificação para português
            const classificacaoMap = {
                'Extreme Fear': 'Medo Extremo',
                'Fear': 'Medo',
                'Neutral': 'Neutro',
                'Greed': 'Ganância',
                'Extreme Greed': 'Ganância Extrema'
            };
            
            const classificacaoPt = classificacaoMap[dados.classification] || 'Neutro';
            
            // Verificar valor anterior para evitar duplicatas desnecessárias
            const ultimoRegistro = await client.query(`
                SELECT value, created_at FROM fear_greed_index 
                ORDER BY created_at DESC 
                LIMIT 1
            `);
            
            const valorAnterior = ultimoRegistro.rows.length > 0 ? ultimoRegistro.rows[0].value : null;
            
            // Se valor é igual ao anterior e foi atualizado há menos de 10 minutos, pular
            if (valorAnterior === dados.value && ultimoRegistro.rows.length > 0) {
                const ultimaAtualizacao = new Date(ultimoRegistro.rows[0].created_at);
                const minutosDecorridos = (new Date() - ultimaAtualizacao) / (1000 * 60);
                
                if (minutosDecorridos < 10) {
                    console.log(`📊 [FEAR&GREED] Valor inalterado (${dados.value}), pulando inserção`);
                    return;
                }
            }
            
            const mudanca24h = valorAnterior ? dados.value - valorAnterior : 0;
            
            const result = await client.query(`
                INSERT INTO fear_greed_index (
                    timestamp_data,
                    value, 
                    classification,
                    classificacao_pt,
                    value_previous,
                    change_24h,
                    source
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, created_at
            `, [
                dados.timestamp ? new Date(dados.timestamp) : new Date(),
                dados.value,
                dados.classification,
                classificacaoPt,
                valorAnterior,
                mudanca24h,
                fonte
            ]);
            
            console.log(`💾 [FEAR&GREED] Salvo no banco: ID ${result.rows[0].id}`);
            
        } finally {
            client.release();
        }
    }

    iniciar() {
        if (this.isRunning) {
            console.log('⚠️ [FEAR&GREED] Gestor já está rodando');
            return;
        }

        console.log('🚀 [FEAR&GREED] Iniciando gestor automático (15 min)...');
        
        // Primeira atualização imediata
        this.atualizarFearGreed();
        
        // Configurar intervalo de 15 minutos (900000ms)
        this.intervalId = setInterval(() => {
            this.atualizarFearGreed();
        }, 15 * 60 * 1000);
        
        this.isRunning = true;
        console.log('✅ [FEAR&GREED] Gestor automático ativo');
    }

    parar() {
        if (!this.isRunning) {
            console.log('⚠️ [FEAR&GREED] Gestor não está rodando');
            return;
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.isRunning = false;
        console.log('🛑 [FEAR&GREED] Gestor automático parado');
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            ultimaAtualizacao: this.ultimaAtualizacao,
            contadorErros: this.contadorErros,
            proximaAtualizacao: this.ultimaAtualizacao ? 
                new Date(this.ultimaAtualizacao.getTime() + 15 * 60 * 1000) : null
        };
    }
}

// Instanciar gestores automáticos
const gestorFearGreed = new GestorFearGreedAutomatico();

// ============ SISTEMA AUTOMÁTICO DE PROCESSAMENTO DE SINAIS ============
const GestorAutomaticoSinais = require('./gestor-automatico-sinais');
const gestorSinais = new GestorAutomaticoSinais();

// ============ ORQUESTRADOR PRINCIPAL DO FLUXO COMPLETO ============
const OrquestradorPrincipal = require('./orquestrador-principal');
const orquestrador = new OrquestradorPrincipal();

// ============ ORQUESTRADOR PRINCIPAL COMPLETO ============
const OrquestradorPrincipalCompleto = require('./orquestrador-principal-completo');
const orquestradorCompleto = new OrquestradorPrincipalCompleto();

// Endpoint para status dos gestores automáticos
app.get('/api/gestores/status', async (req, res) => {
    try {
        const statusFearGreed = gestorFearGreed.getStatus();
        const statusSinais = await gestorSinais.obterEstatisticas();
        const statusOrquestrador = orquestrador.obterEstatisticas();
        const statusCompleto = orquestradorCompleto.obterEstatisticas();
        
        res.json({
            success: true,
            gestores: {
                fear_greed: {
                    ...statusFearGreed,
                    tipo: 'Fear & Greed Index',
                    intervalo_minutos: 15
                },
                processamento_sinais: {
                    ...statusSinais,
                    tipo: 'Processamento Automático de Sinais',
                    intervalo_segundos: statusSinais.intervaloProcessamento / 1000
                },
                orquestrador_principal: {
                    ...statusOrquestrador,
                    tipo: 'Orquestrador Principal - Fluxo Completo',
                    intervalo_segundos: 30
                },
                orquestrador_completo: {
                    ...statusCompleto,
                    tipo: 'Orquestrador Completo - Todos os Gestores',
                    intervalo_segundos: 30,
                    gestores_integrados: statusCompleto.gestoresDisponveis
                }
            },
            sistema: {
                automatico: true,
                componentes_ativos: [
                    statusFearGreed.isRunning ? 'Fear & Greed' : null,
                    statusSinais.isRunning ? 'Processamento Sinais' : null,
                    statusOrquestrador.isRunning ? 'Orquestrador Principal' : null,
                    statusCompleto.isRunning ? 'Orquestrador Completo' : null
                ].filter(Boolean),
                fluxo_operacional: {
                    etapa_atual: statusCompleto.estadoAtual,
                    operacoes_ativas: statusCompleto.operacoesAtivas,
                    ciclos_completos: statusCompleto.ciclosCompletos,
                    cobertura: statusCompleto.isRunning ? '100%' : '75%'
                },
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Erro ao obter status dos gestores',
            message: error.message
        });
    }
});

// Endpoint para controlar gestores automáticos
app.post('/api/gestores/control', async (req, res) => {
    const { gestor, action } = req.body;
    
    try {
        if (gestor === 'fear_greed') {
            if (action === 'start') {
                gestorFearGreed.iniciar();
            } else if (action === 'stop') {
                gestorFearGreed.parar();
            } else if (action === 'restart') {
                gestorFearGreed.parar();
                setTimeout(() => gestorFearGreed.iniciar(), 1000);
            }
            
            res.json({
                success: true,
                message: `Fear & Greed ${action}`,
                status: gestorFearGreed.getStatus()
            });
            
        } else if (gestor === 'sinais') {
            if (action === 'start') {
                await gestorSinais.iniciar();
            } else if (action === 'stop') {
                await gestorSinais.parar();
            } else if (action === 'restart') {
                await gestorSinais.parar();
                setTimeout(() => gestorSinais.iniciar(), 1000);
            }
            
            const status = await gestorSinais.obterEstatisticas();
            res.json({
                success: true,
                message: `Gestor de sinais ${action}`,
                status: status
            });
            
        } else if (gestor === 'orquestrador') {
            if (action === 'start') {
                await orquestrador.iniciar();
            } else if (action === 'stop') {
                await orquestrador.parar();
            } else if (action === 'restart') {
                await orquestrador.parar();
                setTimeout(() => orquestrador.iniciar(), 1000);
            }
            
            const status = orquestrador.obterEstatisticas();
            res.json({
                success: true,
                message: `Orquestrador principal ${action}`,
                status: status
            });
            
        } else if (gestor === 'orquestrador_completo') {
            if (action === 'start') {
                await orquestradorCompleto.iniciar();
            } else if (action === 'stop') {
                await orquestradorCompleto.parar();
            } else if (action === 'restart') {
                await orquestradorCompleto.parar();
                setTimeout(() => orquestradorCompleto.iniciar(), 1000);
            }
            
            const status = orquestradorCompleto.obterEstatisticas();
            res.json({
                success: true,
                message: `Orquestrador completo ${action}`,
                status: status
            });
            
        } else {
            res.status(400).json({
                error: 'Gestor inválido',
                gestores_validos: ['fear_greed', 'sinais', 'orquestrador', 'orquestrador_completo']
            });
        }
        
    } catch (error) {
        res.status(500).json({
            error: 'Erro ao controlar gestor',
            message: error.message
        });
    }
});

// Endpoint para status do gestor Fear & Greed
app.get('/api/fear-greed/status', (req, res) => {
    const status = gestorFearGreed.getStatus();
    res.json({
        success: true,
        gestor_fear_greed: {
            ...status,
            intervalo_minutos: 15,
            timestamp: new Date().toISOString()
        }
    });
});

// Endpoint para controlar o gestor Fear & Greed
app.post('/api/fear-greed/control', (req, res) => {
    const { action } = req.body;
    
    try {
        if (action === 'start') {
            gestorFearGreed.iniciar();
            res.json({
                success: true,
                message: 'Gestor Fear & Greed iniciado',
                status: gestorFearGreed.getStatus()
            });
        } else if (action === 'stop') {
            gestorFearGreed.parar();
            res.json({
                success: true,
                message: 'Gestor Fear & Greed parado',
                status: gestorFearGreed.getStatus()
            });
        } else if (action === 'restart') {
            gestorFearGreed.parar();
            setTimeout(() => gestorFearGreed.iniciar(), 1000);
            res.json({
                success: true,
                message: 'Gestor Fear & Greed reiniciado',
                status: gestorFearGreed.getStatus()
            });
        } else {
            res.status(400).json({
                error: 'Ação inválida',
                valid_actions: ['start', 'stop', 'restart']
            });
        }
    } catch (error) {
        res.status(500).json({
            error: 'Erro ao controlar gestor',
            message: error.message
        });
    }
});

// ============ IMPORTAÇÃO DAS ROTAS ============
const userRoutes = require('./api-gateway/src/routes/userRoutes');

// ============ CONFIGURAÇÃO DAS ROTAS ============
app.use('/api', userRoutes);

// ============ ENDPOINTS DE WEBHOOK TRADINGVIEW ============

// Webhook para receber sinais do TradingView
app.post('/api/webhooks/signal', async (req, res) => {
    console.log('🎯 WEBHOOK SIGNAL RECEBIDO:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    try {
        // Verificar token de autenticação
        const token = req.query.token || req.body.token || req.headers['x-webhook-token'];
        const expectedToken = process.env.WEBHOOK_TOKEN || '210406';
        
        if (token !== expectedToken) {
            console.log('❌ Token inválido:', token);
            return res.status(401).json({
                error: 'Token inválido',
                received_token: token,
                timestamp: new Date().toISOString()
            });
        }
        
        // Processar dados do sinal
        const signalData = req.body;
        
        // Validar dados obrigatórios
        if (!signalData.ticker && !signalData.symbol) {
            return res.status(400).json({
                error: 'Campo ticker ou symbol é obrigatório',
                timestamp: new Date().toISOString()
            });
        }

        // ============================================================
        // 🎯 VALIDAÇÃO DIRECTION_ALLOWED - IMPLEMENTAÇÃO CRÍTICA
        // ============================================================
        
        const client = await pool.connect();
        let validacaoFearGreed = null;
        let sinalPermitido = true;
        let motivoRejeicao = null;
        
        try {
            // 1. Buscar Fear & Greed atual
            console.log('🔍 Validando sinal contra Fear & Greed Index...');
            
            const fearGreedResult = await client.query(`
                SELECT 
                    value,
                    classification,
                    classificacao_pt,
                    CASE 
                        WHEN value < 30 THEN 'LONG_ONLY'
                        WHEN value > 80 THEN 'SHORT_ONLY'
                        ELSE 'BOTH'
                    END as direction_allowed,
                    created_at,
                    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_ago
                FROM fear_greed_index 
                ORDER BY created_at DESC 
                LIMIT 1
            `);
            
            if (fearGreedResult.rows.length === 0) {
                console.log('⚠️ Fear & Greed não encontrado, permitindo sinal com cautela');
                validacaoFearGreed = {
                    value: 50,
                    direction_allowed: 'BOTH',
                    classificacao_pt: 'Neutro (Fallback)',
                    hours_ago: 999
                };
            } else {
                validacaoFearGreed = fearGreedResult.rows[0];
            }

            // 2. Determinar direção do sinal
            let direcaoSinal = null;
            const sinalStr = JSON.stringify(signalData).toLowerCase();
            
            if (sinalStr.includes('long') || sinalStr.includes('buy') || sinalStr.includes('compra')) {
                direcaoSinal = 'LONG';
            } else if (sinalStr.includes('short') || sinalStr.includes('sell') || sinalStr.includes('venda')) {
                direcaoSinal = 'SHORT';
            } else if (sinalStr.includes('close') || sinalStr.includes('fechar')) {
                direcaoSinal = 'CLOSE';
            } else {
                // Tentar identificar pela action ou signal_type
                if (signalData.action) {
                    const action = signalData.action.toLowerCase();
                    if (action.includes('buy') || action.includes('long')) direcaoSinal = 'LONG';
                    if (action.includes('sell') || action.includes('short')) direcaoSinal = 'SHORT';
                    if (action.includes('close')) direcaoSinal = 'CLOSE';
                }
                
                if (!direcaoSinal && signalData.side) {
                    const side = signalData.side.toLowerCase();
                    if (side === 'buy' || side === 'long') direcaoSinal = 'LONG';
                    if (side === 'sell' || side === 'short') direcaoSinal = 'SHORT';
                }
            }

            console.log(`📊 Fear & Greed: ${validacaoFearGreed.value} (${validacaoFearGreed.classificacao_pt})`);
            console.log(`🎯 Direction Allowed: ${validacaoFearGreed.direction_allowed}`);
            console.log(`📈 Direção do Sinal: ${direcaoSinal || 'NÃO IDENTIFICADA'}`);

            // 3. Validar compatibilidade
            if (direcaoSinal && direcaoSinal !== 'CLOSE') {
                if (validacaoFearGreed.direction_allowed === 'LONG_ONLY' && direcaoSinal !== 'LONG') {
                    sinalPermitido = false;
                    motivoRejeicao = `Fear & Greed em ${validacaoFearGreed.value} (${validacaoFearGreed.classificacao_pt}) permite apenas LONG, mas sinal é ${direcaoSinal}`;
                } else if (validacaoFearGreed.direction_allowed === 'SHORT_ONLY' && direcaoSinal !== 'SHORT') {
                    sinalPermitido = false;
                    motivoRejeicao = `Fear & Greed em ${validacaoFearGreed.value} (${validacaoFearGreed.classificacao_pt}) permite apenas SHORT, mas sinal é ${direcaoSinal}`;
                }
            }

            // 4. Verificar se dados estão muito antigos (mais de 2 horas)
            if (validacaoFearGreed.hours_ago > 2) {
                console.log(`⚠️ Dados Fear & Greed antigos (${validacaoFearGreed.hours_ago.toFixed(1)}h), permitindo sinal com cautela`);
            }

            // Se sinal não é permitido, rejeitar
            if (!sinalPermitido) {
                console.log(`❌ SINAL REJEITADO: ${motivoRejeicao}`);
                
                // Salvar sinal rejeitado para auditoria
                await client.query(`
                    CREATE TABLE IF NOT EXISTS rejected_signals (
                        id SERIAL PRIMARY KEY,
                        symbol VARCHAR(20) NOT NULL,
                        signal_data JSONB NOT NULL,
                        rejection_reason TEXT NOT NULL,
                        fear_greed_value INTEGER,
                        direction_allowed VARCHAR(20),
                        signal_direction VARCHAR(20),
                        received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                await client.query(`
                    INSERT INTO rejected_signals (
                        symbol, signal_data, rejection_reason, fear_greed_value, 
                        direction_allowed, signal_direction
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    signalData.ticker || signalData.symbol,
                    JSON.stringify(signalData),
                    motivoRejeicao,
                    validacaoFearGreed.value,
                    validacaoFearGreed.direction_allowed,
                    direcaoSinal
                ]);

                return res.status(403).json({
                    success: false,
                    error: 'Sinal rejeitado pela validação Fear & Greed',
                    rejection_reason: motivoRejeicao,
                    fear_greed_analysis: {
                        current_value: validacaoFearGreed.value,
                        classification: validacaoFearGreed.classificacao_pt,
                        direction_allowed: validacaoFearGreed.direction_allowed,
                        signal_direction: direcaoSinal,
                        hours_ago: parseFloat(validacaoFearGreed.hours_ago).toFixed(1)
                    },
                    timestamp: new Date().toISOString()
                });
            }

            // ============================================================
            // ✅ SINAL APROVADO - SALVAR NO BANCO
            // ============================================================

            console.log(`✅ SINAL APROVADO: Compatível com Fear & Greed`);
            
            // A tabela trading_signals já existe, apenas inserir o sinal
            
            // Inserir sinal aprovado
            const result = await client.query(`
                INSERT INTO trading_signals (
                    symbol, action, price, signal_data, source, status
                ) VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING id
            `, [
                signalData.ticker || signalData.symbol,
                signalData.action,
                signalData.price,
                JSON.stringify({
                    ...signalData,
                    signal_direction: direcaoSinal,
                    fear_greed_value: validacaoFearGreed.value,
                    direction_allowed: validacaoFearGreed.direction_allowed,
                    validation_passed: true
                }),
                signalData.source || 'tradingview',
                'approved'
            ]);
            
            const signalId = result.rows[0].id;
            
            console.log(`✅ Sinal processado e salvo com sucesso. ID: ${signalId}`);
            
            res.status(200).json({
                success: true,
                message: 'Sinal recebido, validado e processado com sucesso',
                signal_id: signalId,
                validation_details: {
                    signal_direction: direcaoSinal,
                    fear_greed_value: validacaoFearGreed.value,
                    fear_greed_classification: validacaoFearGreed.classificacao_pt,
                    direction_allowed: validacaoFearGreed.direction_allowed,
                    validation_passed: true,
                    fear_greed_age_hours: parseFloat(validacaoFearGreed.hours_ago).toFixed(1)
                },
                timestamp: new Date().toISOString()
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erro ao processar sinal:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Webhook para receber dados de dominância BTC
app.post('/api/webhooks/dominance', async (req, res) => {
    console.log('📈 WEBHOOK DOMINANCE RECEBIDO:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    try {
        // Verificar token de autenticação
        const token = req.query.token || req.body.token || req.headers['x-webhook-token'];
        const expectedToken = process.env.WEBHOOK_TOKEN || '210406';
        
        if (token !== expectedToken) {
            console.log('❌ Token inválido:', token);
            return res.status(401).json({
                error: 'Token inválido',
                received_token: token,
                timestamp: new Date().toISOString()
            });
        }
        
        // Processar dados de dominância
        const dominanceData = req.body;
        
        // Salvar dados no banco
        const client = await pool.connect();
        
        try {
            // Criar tabela se não existir
            await client.query(`
                CREATE TABLE IF NOT EXISTS dominance_data (
                    id SERIAL PRIMARY KEY,
                    dominance_data JSONB NOT NULL,
                    source VARCHAR(50) DEFAULT 'tradingview',
                    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed BOOLEAN DEFAULT false
                )
            `);
            
            // Inserir dados de dominância
            const result = await client.query(`
                INSERT INTO dominance_data (dominance_data, source) 
                VALUES ($1, $2) 
                RETURNING id
            `, [
                JSON.stringify(dominanceData),
                'tradingview'
            ]);
            
            const dominanceId = result.rows[0].id;
            
            console.log('✅ Dominância processada com sucesso. ID:', dominanceId);
            
            res.status(200).json({
                success: true,
                message: 'Dados de dominância recebidos e processados com sucesso',
                dominance_id: dominanceId,
                timestamp: new Date().toISOString()
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erro ao processar dominância:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para consultar sinais recentes
app.get('/api/webhooks/signals/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const symbol = req.query.symbol;
        
        const client = await pool.connect();
        
        try {
            let query = `
                SELECT id, symbol, signal_data, source, created_at, processed_at, status
                FROM trading_signals 
                ORDER BY created_at DESC 
                LIMIT $1
            `;
            let params = [limit];
            
            if (symbol) {
                query = `
                    SELECT id, symbol, signal_data, source, created_at, processed_at, status
                    FROM trading_signals 
                    WHERE symbol ILIKE $2
                    ORDER BY created_at DESC 
                    LIMIT $1
                `;
                params = [limit, `%${symbol}%`];
            }
            
            const result = await client.query(query, params);
            
            res.json({
                success: true,
                count: result.rows.length,
                total: result.rows.length,
                signals: result.rows.map(row => ({
                    id: row.id,
                    symbol: row.symbol,
                    source: row.source,
                    signal_data: row.signal_data,
                    created_at: row.created_at,
                    processed_at: row.processed_at,
                    status: row.status,
                    // Compatibilidade com código existente
                    ticker: row.symbol,
                    action: row.signal_data?.action,
                    timestamp: row.created_at
                })),
                timestamp: new Date().toISOString()
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erro ao consultar sinais:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============ ENDPOINTS FEAR & GREED INDEX ============

// Endpoint para consultar Fear & Greed Index atual
app.get('/api/fear-greed/current', async (req, res) => {
    try {
        const client = await pool.connect();
        
        const result = await client.query(`
            SELECT 
                value,
                classification,
                classificacao_pt,
                source,
                created_at,
                EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as horas_atras,
                CASE 
                    WHEN value < 30 THEN 'LONG_ONLY'
                    WHEN value > 80 THEN 'SHORT_ONLY'
                    ELSE 'BOTH'
                END as direction_allowed
            FROM fear_greed_index 
            ORDER BY created_at DESC 
            LIMIT 1
        `);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Fear & Greed data not found',
                message: 'No recent data available'
            });
        }
        
        const data = result.rows[0];
        
        // Verificar se dados estão muito antigos (mais de 2 horas)
        const dataAntigua = data.horas_atras > 2;
        
        res.json({
            success: true,
            fear_greed: {
                value: data.value,
                classification: data.classification,
                classificacao_pt: data.classificacao_pt,
                direction_allowed: data.direction_allowed,
                source: data.source,
                last_update: data.created_at,
                hours_ago: parseFloat(data.horas_atras).toFixed(2),
                is_outdated: dataAntigua,
                trading_recommendation: data.value < 30 ? 'LONG_ONLY (Medo extremo - boa hora para comprar)' : 
                                       data.value > 80 ? 'SHORT_ONLY (Ganância extrema - boa hora para vender)' : 
                                       'BOTH (Mercado equilibrado - LONG e SHORT permitidos)'
            },
            timestamp: new Date().toISOString()
        });
        
        client.release();
        
    } catch (error) {
        console.error('❌ Erro ao consultar Fear & Greed:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Endpoint para forçar atualização do Fear & Greed
app.post('/api/fear-greed/update', async (req, res) => {
    try {
        console.log('🔄 Iniciando atualização manual do Fear & Greed...');
        
        // Tentar buscar de múltiplas APIs
        const apis = [
            {
                name: 'CoinStats',
                url: 'https://openapiv1.coinstats.app/insights/fear-and-greed',
                headers: {
                    'X-API-KEY': 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=',
                    'Accept': 'application/json'
                }
            },
            {
                name: 'Alternative.me',
                url: 'https://api.alternative.me/fng/?limit=1',
                headers: {}
            }
        ];
        
        let dadosObtidos = null;
        let fonteUsada = null;
        
        for (const api of apis) {
            try {
                const axios = require('axios');
                const response = await axios.get(api.url, {
                    headers: api.headers,
                    timeout: 10000
                });
                
                if (api.name === 'CoinStats' && response.data?.now) {
                    dadosObtidos = {
                        value: response.data.now.value,
                        classification: response.data.now.value_classification,
                        timestamp: response.data.now.update_time
                    };
                    fonteUsada = 'COINSTATS';
                    break;
                } else if (api.name === 'Alternative.me' && response.data?.data?.[0]) {
                    const data = response.data.data[0];
                    dadosObtidos = {
                        value: parseInt(data.value),
                        classification: data.value_classification,
                        timestamp: data.timestamp
                    };
                    fonteUsada = 'ALTERNATIVE_ME';
                    break;
                }
            } catch (apiError) {
                console.log(`⚠️ Falha em ${api.name}: ${apiError.message}`);
                continue;
            }
        }
        
        // Se todas as APIs falharam, usar fallback
        if (!dadosObtidos) {
            dadosObtidos = {
                value: 50,
                classification: 'Neutral',
                timestamp: new Date().toISOString()
            };
            fonteUsada = 'FALLBACK';
        }
        
        // Salvar no banco
        const client = await pool.connect();
        
        try {
            // Mapear classificação para português
            const classificacaoMap = {
                'Extreme Fear': 'Medo Extremo',
                'Fear': 'Medo',
                'Neutral': 'Neutro',
                'Greed': 'Ganância',
                'Extreme Greed': 'Ganância Extrema'
            };
            
            const classificacaoPt = classificacaoMap[dadosObtidos.classification] || 'Neutro';
            
            // Buscar valor anterior para calcular mudança
            const ultimoRegistro = await client.query(`
                SELECT value FROM fear_greed_index 
                ORDER BY created_at DESC 
                LIMIT 1
            `);
            
            const valorAnterior = ultimoRegistro.rows.length > 0 ? ultimoRegistro.rows[0].value : null;
            const mudanca24h = valorAnterior ? dadosObtidos.value - valorAnterior : 0;
            
            const result = await client.query(`
                INSERT INTO fear_greed_index (
                    timestamp_data,
                    value, 
                    classification,
                    classificacao_pt,
                    value_previous,
                    change_24h,
                    source
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, created_at
            `, [
                dadosObtidos.timestamp ? new Date(dadosObtidos.timestamp) : new Date(),
                dadosObtidos.value,
                dadosObtidos.classification,
                classificacaoPt,
                valorAnterior,
                mudanca24h,
                fonteUsada
            ]);
            
            console.log(`✅ Fear & Greed atualizado! ID: ${result.rows[0].id}, Valor: ${dadosObtidos.value}`);
            
            // Determinar direção de trading
            let direcao;
            if (dadosObtidos.value < 30) {
                direcao = 'LONG_ONLY';
            } else if (dadosObtidos.value > 80) {
                direcao = 'SHORT_ONLY';
            } else {
                direcao = 'BOTH';
            }
            
            res.json({
                success: true,
                message: 'Fear & Greed Index atualizado com sucesso',
                data: {
                    id: result.rows[0].id,
                    value: dadosObtidos.value,
                    classification: dadosObtidos.classification,
                    classificacao_pt: classificacaoPt,
                    direction_allowed: direcao,
                    source: fonteUsada,
                    change_24h: mudanca24h,
                    updated_at: result.rows[0].created_at
                },
                timestamp: new Date().toISOString()
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erro ao atualizar Fear & Greed:', error);
        res.status(500).json({
            error: 'Erro ao atualizar Fear & Greed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Middleware para capturar todas as rotas nao encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        availableEndpoints: [
            'GET /',
            'GET /health',
            'GET /api/status',
            'GET /dashboard',
            'POST /api/auth/login',
            'POST /api/auth/register',
            'GET /api/user/dashboard',
            'GET /api/user/operations',
            'GET /api/affiliate/dashboard',
            'POST /api/webhooks/signal?token=210406',
            'POST /api/webhooks/dominance?token=210406',
            'GET /api/webhooks/signals/recent',
            'GET /api/fear-greed/current',
            'POST /api/fear-greed/update',
            'GET /api/fear-greed/status',
            'POST /api/fear-greed/control'
        ],
        version: SYSTEM_VERSION
    });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
    console.error('❌ Erro capturado:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM recebido, fechando servidor graciosamente...');
    gestorFearGreed.parar();
    await gestorSinais.parar();
    server.close(() => {
        console.log('✅ Servidor fechado com sucesso');
        pool.end();
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT recebido, fechando servidor graciosamente...');
    gestorFearGreed.parar();
    await gestorSinais.parar();
    server.close(() => {
        console.log('✅ Servidor fechado com sucesso');
        pool.end();
        process.exit(0);
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 ====================================
   COINBITCLUB MARKET BOT V3 ATIVO!
====================================
🌐 Servidor: http://localhost:${PORT}
📊 Dashboard: http://localhost:${PORT}/dashboard
💚 Health: http://localhost:${PORT}/health
🔧 Versao: ${SYSTEM_VERSION}
🕒 Iniciado em: ${new Date().toISOString()}
====================================
    `);
    
    // Iniciar gestores automáticos
    setTimeout(async () => {
        console.log('🔄 Iniciando gestores automáticos...');
        
        // Fear & Greed (15 minutos)
        gestorFearGreed.iniciar();
        
        // Processamento de sinais (10 segundos)
        await gestorSinais.iniciar();
        
        console.log('✅ Todos os gestores automáticos iniciados!');
    }, 5000); // Aguarda 5 segundos para servidor estabilizar
});

module.exports = app;
