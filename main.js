const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { Pool } = require('pg');

// Configuração da aplicação
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middlewares de segurança
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '3.0.0-fixed',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'CoinBitClub Market Bot V3 - API Active',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// API de teste do banco
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as timestamp');
        res.json({
            status: 'connected',
            database_time: result.rows[0].timestamp
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Middleware de tratamento de erro
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Middleware 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.originalUrl
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 CoinBitClub Server V3 Started');
    console.log('================================');
    console.log('Port:', PORT);
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Health Check: /health');
    console.log('Database Test: /api/test-db');
    console.log('================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    pool.end(() => {
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    pool.end(() => {
        process.exit(0);
    });
});
