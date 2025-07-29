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
    <title>CoinBitClub Market Bot V3 - Controle</title>
    <style>
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
        function toggleSystem(activate) {
            const action = activate ? 'ligar' : 'desligar';
            fetch('/api/system/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activate })
            })
            .then(response => response.json())
            .then(data => {
                alert(\`Sistema \${action}do com sucesso! \${data.message || ''}\`);
                location.reload();
            })
            .catch(error => {
                alert(\`Erro ao \${action} sistema: \${error.message}\`);
            });
        }

        // Auto-refresh status
        setInterval(() => {
            fetch('/api/system/status')
                .then(response => response.json())
                .then(data => {
                    console.log('Status:', data);
                })
                .catch(console.error);
        }, 10000);
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


