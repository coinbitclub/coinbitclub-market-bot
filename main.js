// ============================================================================
// 🚀 COINBITCLUB MARKET BOT V3 - ULTRA ROBUST VERSION
// ============================================================================
const express = require('express');
const { Pool } = require('pg');

const app = express();

// ============ BASIC MIDDLEWARE (NO EXTERNAL DEPS) ============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Basic logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// ============ DATABASE CONFIGURATION ============
let dbPool = null;
let dbConnected = false;

const connectionOptions = [
    // PRIORIDADE ÚNICA: Somente a variável oficial do Railway
    process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL
].filter(Boolean);

async function initDatabase() {
    console.log('🔄 Iniciando conexão com banco de dados...');
    console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
    
    // Verificação crítica: só usar DATABASE_URL do Railway
    const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;
    
    if (!databaseUrl) {
        console.log('❌ CRÍTICO: DATABASE_URL não encontrada nas variáveis do Railway!');
        console.log('� Configure DATABASE_URL no Railway Dashboard');
        return;
    }
    
    console.log(`📋 DATABASE_URL encontrada: ${databaseUrl.substring(0, 50)}...`);
    
    try {
        console.log('� Conectando ao banco com variável oficial do Railway...');
        
        const pool = new Pool({
            connectionString: databaseUrl,
            ssl: {
                rejectUnauthorized: false
            },
            max: 3,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        });

        const client = await pool.connect();
        const result = await client.query('SELECT NOW(), version(), current_database()');
        
        // Test signals table specifically
        const signalsTest = await client.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_name = 'signals'
        `);
        
        client.release();

        dbPool = pool;
        dbConnected = true;
        
        console.log(`✅ BANCO CONECTADO COM SUCESSO!`);
        console.log(`   📊 PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);
        console.log(`   🗄️  Database: ${result.rows[0].current_database}`);
        console.log(`   🕒 Server Time: ${result.rows[0].now}`);
        console.log(`   📋 Signals Table: ${signalsTest.rows[0].count > 0 ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`   🎯 Railway DATABASE_URL funcionando perfeitamente!`);
        return;

    } catch (error) {
        console.log(`❌ FALHA na conexão: ${error.message}`);
        console.log(`   🔍 Error Code: ${error.code || 'unknown'}`);
        console.log('⚠️  Funcionando SEM banco de dados (modo degradado)');
    }
}

// ============ DATABASE UTILITIES ============
async function safeDbQuery(query, params = []) {
    if (!dbConnected || !dbPool) {
        return null;
    }
    
    try {
        return await dbPool.query(query, params);
    } catch (error) {
        console.log(`⚠️ DB Error: ${error.message}`);
        return null;
    }
}

async function saveSignal(data) {
    const result = await safeDbQuery(`
        INSERT INTO signals (ticker, action, price, timestamp, raw_data) 
        VALUES ($1, $2, $3, NOW(), $4) 
        RETURNING id`,
        [data.ticker, data.action, data.price, JSON.stringify(data.raw)]
    );
    return result?.rows[0]?.id || null;
}

// ============ ENDPOINTS ============

// Simple ping endpoint for testing
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// Ultra-simple health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
        database: dbConnected ? 'connected' : 'disconnected',
        version: '3.1.0-robust'
    });
});

// Status endpoint
app.get('/api/status', async (req, res) => {
    let signalCount = 0;
    if (dbConnected) {
        const result = await safeDbQuery('SELECT COUNT(*) as total FROM signals');
        signalCount = result?.rows[0]?.total || 0;
    }

    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
        memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        database: {
            connected: dbConnected,
            signals_count: signalCount
        },
        environment: process.env.NODE_ENV || 'development',
        node_version: process.version
    });
});

// Main webhook endpoint
app.post('/api/webhooks/signal', async (req, res) => {
    const startTime = Date.now();
    
    try {
        console.log('🎯 WEBHOOK RECEBIDO:', JSON.stringify(req.body));
        
        const signalData = {
            ticker: req.body.ticker || req.body.symbol || 'UNKNOWN',
            action: req.body.action || req.body.signal || 'UNKNOWN',
            price: parseFloat(req.body.price || req.body.close || 0),
            raw: req.body
        };

        const savedId = await saveSignal(signalData);

        res.status(200).json({
            success: true,
            message: 'Signal received successfully',
            timestamp: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime,
            data: signalData,
            saved_id: savedId,
            database_status: dbConnected ? 'saved' : 'not_saved'
        });
        
        console.log(`✅ Response sent in ${Date.now() - startTime}ms`);
        
    } catch (error) {
        console.error('💥 Webhook error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// CoinBitClub webhook
app.post('/webhook/coinbitclub', async (req, res) => {
    const startTime = Date.now();
    
    const signalData = {
        ticker: req.body.ticker || 'UNKNOWN',
        action: req.body.signal || 'UNKNOWN',
        price: parseFloat(req.body.close || req.body.price || 0),
        raw: req.body
    };

    const savedId = await saveSignal(signalData);

    res.status(200).json({
        success: true,
        message: 'CoinBitClub signal received',
        timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
        data: signalData,
        saved_id: savedId
    });
});

// Get signals
app.get('/api/signals', async (req, res) => {
    if (!dbConnected) {
        return res.status(503).json({
            error: 'Database not available'
        });
    }

    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const result = await safeDbQuery(`
        SELECT id, ticker, action, price, timestamp, created_at
        FROM signals 
        ORDER BY created_at DESC 
        LIMIT $1
    `, [limit]);

    if (!result) {
        return res.status(500).json({ error: 'Query failed' });
    }

    res.json({
        success: true,
        signals: result.rows,
        count: result.rows.length
    });
});

// Catch all
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('❌ Error:', error.message);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// ============ SERVER STARTUP ============
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        console.log('🚀 Starting CoinBitClub Market Bot V3...');
        console.log(`🌐 PORT from environment: ${process.env.PORT || 'undefined'}`);
        console.log(`🌐 Using PORT: ${PORT}`);
        
        // Initialize database (non-blocking)
        initDatabase().catch(err => {
            console.log('⚠️ Database init failed, continuing without DB');
        });

        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log('='.repeat(60));
            console.log(`🚀 CoinBitClub Market Bot V3 - ROBUST`);
            console.log(`🌐 Port: ${PORT}`);
            console.log(`🌐 Listening on: 0.0.0.0:${PORT}`);
            console.log(`⏰ Started: ${new Date().toISOString()}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('='.repeat(60));
            console.log('📡 Available endpoints:');
            console.log('   - GET  /health');
            console.log('   - GET  /api/status');
            console.log('   - POST /api/webhooks/signal');
            console.log('   - POST /webhook/coinbitclub');
            console.log('   - GET  /api/signals');
            console.log('='.repeat(60));
            console.log('✅ READY TO RECEIVE WEBHOOKS!');
            console.log('🔥 Server successfully bound to port and accepting connections');
        });

        // Add error handling for server
        server.on('error', (err) => {
            console.error('💥 Server error:', err);
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use`);
            }
            process.exit(1);
        });

        // Graceful shutdown
        process.on('SIGINT', () => shutdown(server));
        process.on('SIGTERM', () => shutdown(server));

        return server;

    } catch (error) {
        console.error('💥 Failed to start server:', error);
        process.exit(1);
    }
}

function shutdown(server) {
    console.log('\n🛑 Shutting down gracefully...');
    server.close(() => {
        if (dbPool) {
            dbPool.end();
        }
        console.log('✅ Server closed');
        process.exit(0);
    });
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection:', reason);
    process.exit(1);
});

// Start the server
startServer();

module.exports = app;
