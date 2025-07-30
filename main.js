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

// Webhook para receber sinais do TradingView
app.post('/api/webhooks/signal', async (req, res) => {
    try {
        console.log('🔥 TradingView webhook recebido:', JSON.stringify(req.body, null, 2));
        console.log('📊 Headers:', JSON.stringify(req.headers, null, 2));

        // Verificar autenticação (opcional)
        const authToken = req.headers['authorization'];
        const expectedToken = process.env.TRADINGVIEW_WEBHOOK_SECRET;
        
        if (expectedToken && authToken && authToken !== `Bearer ${expectedToken}`) {
            console.log('Token inválido:', authToken, 'esperado:', `Bearer ${expectedToken}`);
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const signalData = req.body;

        // Validar dados obrigatórios
        if (!signalData.symbol || !signalData.action) {
            return res.status(400).json({ error: 'Dados inválidos - symbol e action são obrigatórios' });
        }

        // Salvar o sinal no banco
        const result = await pool.query(`
            INSERT INTO signals (symbol, action, price, quantity, strategy, timeframe, alert_message, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id
        `, [
            signalData.symbol,
            signalData.action,
            signalData.price || null,
            signalData.quantity || null,
            signalData.strategy || null,
            signalData.timeframe || null,
            signalData.alert_message || JSON.stringify(signalData)
        ]);

        console.log('✅ Sinal salvo com ID:', result.rows[0].id);

        return res.status(200).json({
            success: true,
            message: 'Sinal processado com sucesso',
            signalId: result.rows[0].id,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro no webhook TradingView:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Webhook alternativo TradingView (compatibilidade)
app.post('/api/webhooks/tradingview', async (req, res) => {
    try {
        console.log('🔥 TradingView webhook tradingview recebido:', JSON.stringify(req.body, null, 2));
        
        const signalData = req.body;

        // Validar dados obrigatórios
        if (!signalData.symbol || !signalData.action) {
            return res.status(400).json({ error: 'Dados inválidos - symbol e action são obrigatórios' });
        }

        // Salvar o webhook raw
        await pool.query(`
            INSERT INTO raw_webhook (source, payload, received_at)
            VALUES ($1, $2, NOW())
        `, ['tradingview', JSON.stringify(signalData)]);

        // Processar o sinal
        const result = await pool.query(`
            INSERT INTO signals (symbol, action, price, quantity, strategy, timeframe, alert_message, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id
        `, [
            signalData.symbol,
            signalData.action,
            signalData.price || null,
            signalData.quantity || null,
            signalData.strategy || null,
            signalData.timeframe || null,
            signalData.alert_message || JSON.stringify(signalData)
        ]);

        console.log('✅ Sinal TradingView processado com ID:', result.rows[0].id);

        return res.status(200).json({
            success: true,
            message: 'Sinal TradingView processado',
            signalId: result.rows[0].id,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro no webhook TradingView:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Webhook para dominância do Bitcoin
app.post('/api/webhooks/dominance', async (req, res) => {
    try {
        console.log('📈 WEBHOOK DOMINÂNCIA RECEBIDO:', JSON.stringify(req.body, null, 2));
        console.log('📊 Headers:', JSON.stringify(req.headers, null, 2));

        const dominanceData = req.body;

        // Validar dados obrigatórios para dominância
        if (!dominanceData.btc_dominance && !dominanceData.dominance_percent) {
            return res.status(400).json({ 
                error: 'Dados inválidos - btc_dominance ou dominance_percent são obrigatórios' 
            });
        }

        // Criar tabela se não existir
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dominance_data (
                id SERIAL PRIMARY KEY,
                btc_dominance DECIMAL(5,2),
                eth_dominance DECIMAL(5,2),
                total_market_cap BIGINT,
                timestamp_data TIMESTAMP,
                source VARCHAR(50) DEFAULT 'tradingview',
                raw_data JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Salvar dados de dominância
        const result = await pool.query(`
            INSERT INTO dominance_data (
                btc_dominance, 
                eth_dominance, 
                total_market_cap, 
                timestamp_data, 
                source, 
                raw_data, 
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id
        `, [
            dominanceData.btc_dominance || dominanceData.dominance_percent || null,
            dominanceData.eth_dominance || null,
            dominanceData.total_market_cap || null,
            dominanceData.timestamp || new Date().toISOString(),
            dominanceData.source || 'tradingview',
            JSON.stringify(dominanceData)
        ]);

        console.log('✅ Dominância processada com ID:', result.rows[0].id);

        // Também salvar na tabela de sinais para compatibilidade
        await pool.query(`
            INSERT INTO signals (
                symbol, 
                action, 
                price, 
                strategy, 
                timeframe, 
                alert_message, 
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
            'BTC.D',
            'DOMINANCE_UPDATE',
            dominanceData.btc_dominance || dominanceData.dominance_percent,
            'dominance_tracking',
            dominanceData.timeframe || '1h',
            `Bitcoin dominance: ${dominanceData.btc_dominance || dominanceData.dominance_percent}%`
        ]);

        return res.status(200).json({
            success: true,
            message: 'Dominância processada com sucesso',
            dominanceId: result.rows[0].id,
            btc_dominance: dominanceData.btc_dominance || dominanceData.dominance_percent,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro no webhook dominância:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Endpoint para consultar última dominância
app.get('/api/dominance/latest', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                btc_dominance,
                eth_dominance,
                total_market_cap,
                timestamp_data,
                source,
                created_at
            FROM dominance_data 
            ORDER BY created_at DESC 
            LIMIT 1
        `);

        if (result.rows.length === 0) {
            return res.json({
                message: 'Nenhum dado de dominância encontrado',
                btc_dominance: null
            });
        }

        return res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Erro ao consultar dominância:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
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
