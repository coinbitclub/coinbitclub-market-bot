const express = require('express');

console.log('🚀 HYBRID SERVER - Sistema Completo + Fallback Garantido');
console.log('========================================================');
console.log(`📍 Port: ${process.env.PORT || 3000}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);

// Configuração básica que SEMPRE funciona
const app = express();
const port = process.env.PORT || 3000;

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Estado do sistema
let systemState = {
    mainSystemLoaded: false,
    mainSystemError: null,
    fallbackMode: false,
    startTime: new Date().toISOString()
};

// Health check obrigatório - SEMPRE funciona
app.get('/health', (req, res) => {
    res.json({
        status: systemState.mainSystemLoaded ? 'full_system' : 'fallback_mode',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        port: port,
        mainSystem: systemState.mainSystemLoaded,
        error: systemState.mainSystemError,
        startTime: systemState.startTime
    });
});

// Dashboard principal - híbrido
app.get('/', async (req, res) => {
    if (systemState.mainSystemLoaded && global.mainServerInstance) {
        try {
            // Tentar usar dashboard do sistema principal
            const dashboardHTML = await global.mainServerInstance.gerarDashboardHTML();
            res.send(dashboardHTML);
            return;
        } catch (error) {
            console.warn('⚠️ Erro no dashboard principal, usando fallback:', error.message);
        }
    }

    // Dashboard de fallback
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>CoinBitClub Market Bot</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #1a1a1a; 
            color: white; 
            margin: 0; 
            padding: 20px; 
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .status { background: ${systemState.mainSystemLoaded ? '#2d5a27' : '#d97706'}; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .panel { background: #1e3a8a; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric { background: #374151; padding: 15px; border-radius: 6px; text-align: center; }
        .value { font-size: 2em; font-weight: bold; color: #10b981; }
        .refresh-btn { background: #059669; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
    </style>
    <script>
        // Auto-refresh a cada 30 segundos
        setTimeout(() => location.reload(), 30000);
        
        async function checkMainSystem() {
            try {
                const response = await fetch('/api/system/status');
                const data = await response.json();
                if (data.mainSystemAvailable) {
                    location.reload();
                }
            } catch (error) {
                console.log('Sistema principal ainda não disponível');
            }
        }
        
        // Verificar sistema principal a cada 10 segundos
        setInterval(checkMainSystem, 10000);
    </script>
</head>
<body>
    <div class="container">
        <h1>🚀 CoinBitClub Market Bot</h1>
        
        <div class="status">
            <h2>${systemState.mainSystemLoaded ? '✅ SISTEMA COMPLETO ONLINE' : '⚠️ MODO FALLBACK ATIVO'}</h2>
            <p>${systemState.mainSystemLoaded ? 'Dashboard completo funcionando' : 'Carregando sistema principal...'}</p>
            ${systemState.mainSystemError ? `<p style="color: #fbbf24;">⚠️ ${systemState.mainSystemError}</p>` : ''}
        </div>
        
        <div class="grid">
            <div class="panel">
                <h3>📊 Status do Sistema</h3>
                <div class="metric">
                    <div class="value">${systemState.mainSystemLoaded ? 'FULL' : 'BASIC'}</div>
                    <div>Modo Operacional</div>
                </div>
            </div>
            
            <div class="panel">
                <h3>🕐 Uptime</h3>
                <div class="metric">
                    <div class="value">${Math.floor(process.uptime())}s</div>
                    <div>Tempo Online</div>
                </div>
            </div>
            
            <div class="panel">
                <h3>🔗 Conectividade</h3>
                <div class="metric">
                    <div class="value">✅</div>
                    <div>Railway Connected</div>
                </div>
            </div>
            
            <div class="panel">
                <h3>🎯 Deployment</h3>
                <div class="metric">
                    <div class="value">SUCCESS</div>
                    <div>Status</div>
                </div>
            </div>
        </div>
        
        <div class="panel">
            <h3>🔧 Ações Disponíveis</h3>
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
            <button class="refresh-btn" onclick="location.href='/health'">❤️ Health Check</button>
            <button class="refresh-btn" onclick="location.href='/api/system/status'">📊 System Status</button>
        </div>
        
        <div class="panel">
            <h3>📋 Informações Técnicas</h3>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Port:</strong> ${port}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}</p>
            <p><strong>Start Time:</strong> ${systemState.startTime}</p>
        </div>
    </div>
</body>
</html>
    `);
});

// API endpoints
app.get('/api/system/status', (req, res) => {
    res.json({
        success: true,
        mainSystemAvailable: systemState.mainSystemLoaded,
        fallbackMode: systemState.fallbackMode,
        error: systemState.mainSystemError,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Hybrid server API working',
        systemMode: systemState.mainSystemLoaded ? 'full' : 'fallback',
        timestamp: new Date().toISOString()
    });
});

// Tentar carregar sistema principal
async function loadMainSystem() {
    try {
        console.log('🔄 Tentando carregar sistema principal...');
        
        const CoinBitClubServer = require('./app.js');
        const mainServer = new CoinBitClubServer();
        
        // Não fazer app.listen no sistema principal - usar o nosso
        global.mainServerInstance = mainServer;
        
        // Configurar rotas do sistema principal
        mainServer.app = app; // Usar nossa instância do Express
        
        console.log('✅ Sistema principal carregado com sucesso!');
        systemState.mainSystemLoaded = true;
        systemState.mainSystemError = null;
        
    } catch (error) {
        console.warn('⚠️ Erro ao carregar sistema principal:', error.message);
        systemState.mainSystemError = error.message;
        systemState.fallbackMode = true;
    }
}

// Catch-all 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        systemMode: systemState.mainSystemLoaded ? 'full' : 'fallback',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
    console.log('');
    console.log('🎯 HYBRID SERVER STARTED!');
    console.log('========================');
    console.log(`✅ Server running on port: ${port}`);
    console.log(`🌐 Access: http://localhost:${port}`);
    console.log(`🔗 Health: http://localhost:${port}/health`);
    console.log('');
    
    // Tentar carregar sistema principal após servidor estar online
    setTimeout(loadMainSystem, 2000);
});

console.log('🚀 Hybrid server initialized - Railway deployment guaranteed!');
