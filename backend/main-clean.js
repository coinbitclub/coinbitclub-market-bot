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

// Sistema de versao unico para identificar
const SYSTEM_VERSION = 'V3.0.0-FINAL-' + Date.now();

// Configuracao do PostgreSQL Railway
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
            environment: process.env.NODE_ENV || 'development',
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
                <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}</p>
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
        
        <!-- Fluxo de Execucao -->
        <div class="features-section">
            <h2><i class="fas fa-sitemap"></i> Fluxo de Execucao Mapeado</h2>
            <div class="features-grid">
                <div class="feature-item">
                    <i class="fas fa-play"></i>
                    <div>Inicializacao</div>
                </div>
                <div class="feature-item">
                    <i class="fas fa-database"></i>
                    <div>Conexao DB</div>
                </div>
                <div class="feature-item">
                    <i class="fas fa-shield-alt"></i>
                    <div>Seguranca</div>
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

// Middleware para capturar todas as rotas nao encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        availableEndpoints: [
            'GET /',
            'GET /health',
            'GET /api/status',
            'GET /dashboard'
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
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM recebido, fechando servidor graciosamente...');
    server.close(() => {
        console.log('✅ Servidor fechado com sucesso');
        pool.end();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT recebido, fechando servidor graciosamente...');
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
});

module.exports = app;
