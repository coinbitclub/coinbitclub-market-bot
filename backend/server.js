/**
 * 🚀 SERVIDOR PRINCIPAL - COINBITCLUB MARKET BOT V3.0.0
 * API Server com Webhook TradingView e Monitoramento
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Pool de conexão PostgreSQL
const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

console.log('🚀 CoinBitClub Market Bot V3.0.0 - API Server Starting...');

// 📡 WEBHOOK TRADINGVIEW - Receber sinais
app.post('/webhook/tradingview', async (req, res) => {
    try {
        console.log('📡 Webhook TradingView recebido:', new Date().toISOString());
        
        const signal = req.body;
        
        // Validação básica
        if (!signal.symbol || !signal.action) {
            return res.status(400).json({ 
                success: false, 
                error: 'Dados incompletos no sinal' 
            });
        }

        // Inserir sinal no banco
        const insertResult = await pool.query(`
            INSERT INTO trading_signals (
                symbol, action, price, quantity, 
                strategy, timeframe, signal_data,
                received_at, processed, processing_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), false, 'pending')
            RETURNING id
        `, [
            signal.symbol,
            signal.action,
            signal.price || 0,
            signal.quantity || 0,
            signal.strategy || 'webhook',
            signal.timeframe || '1h',
            JSON.stringify(signal)
        ]);

        console.log(`✅ Sinal inserido - ID: ${insertResult.rows[0].id}`);
        console.log(`📊 Símbolo: ${signal.symbol} | Ação: ${signal.action}`);

        res.json({ 
            success: true, 
            signal_id: insertResult.rows[0].id,
            message: 'Sinal recebido com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro no webhook:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// 📊 API MONITORING SIGNALS - Sinais em tempo real
app.get('/api/monitoring/signals', async (req, res) => {
    try {
        const limit = req.query.limit || 50;
        
        const signals = await pool.query(`
            SELECT 
                id, symbol, action, price, quantity,
                strategy, timeframe, processing_status,
                received_at, processed_at,
                EXTRACT(EPOCH FROM (NOW() - received_at)) as age_seconds
            FROM trading_signals 
            ORDER BY received_at DESC 
            LIMIT $1
        `, [limit]);

        // Estatísticas
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE processed = true) as processed,
                COUNT(*) FILTER (WHERE processing_status = 'success') as successful,
                COUNT(*) FILTER (WHERE received_at > NOW() - INTERVAL '1 hour') as last_hour
            FROM trading_signals
        `);

        res.json({
            success: true,
            signals: signals.rows,
            statistics: stats.rows[0],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro API signals:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar sinais' 
        });
    }
});

// 📈 API MONITORING OPERATIONS - Operações ativas
app.get('/api/monitoring/operations', async (req, res) => {
    try {
        const operations = await pool.query(`
            SELECT 
                uo.id, uo.user_id, uo.symbol, uo.side, uo.quantity,
                uo.entry_price, uo.current_price, uo.pnl,
                uo.status, uo.order_id, uo.order_link_id,
                uo.created_at, uo.updated_at,
                u.name as user_name,
                EXTRACT(EPOCH FROM (NOW() - uo.created_at)) as age_seconds
            FROM user_operations uo
            LEFT JOIN users u ON uo.user_id = u.id
            WHERE uo.status IN ('active', 'pending', 'partially_filled')
            ORDER BY uo.created_at DESC
            LIMIT 100
        `);

        // Estatísticas das operações
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_operations,
                COUNT(*) FILTER (WHERE status = 'active') as active,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                SUM(pnl) FILTER (WHERE pnl IS NOT NULL) as total_pnl,
                COUNT(DISTINCT user_id) as active_users
            FROM user_operations
            WHERE status IN ('active', 'pending', 'partially_filled')
        `);

        res.json({
            success: true,
            operations: operations.rows,
            statistics: stats.rows[0],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro API operations:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar operações' 
        });
    }
});

// 👥 API MONITORING USERS - Status dos usuários
app.get('/api/monitoring/users', async (req, res) => {
    try {
        const users = await pool.query(`
            SELECT 
                u.id, u.name, u.email, u.is_active, u.subscription_type,
                u.balance, u.available_balance, u.created_at,
                k.api_key_hash, k.is_active as api_active, k.last_validated,
                COUNT(o.id) as total_operations,
                COUNT(o.id) FILTER (WHERE o.status = 'active') as active_operations
            FROM users u
            LEFT JOIN user_api_keys k ON u.id = k.user_id
            LEFT JOIN user_operations o ON u.id = o.user_id
            WHERE u.is_active = true
            GROUP BY u.id, k.api_key_hash, k.is_active, k.last_validated
            ORDER BY u.created_at DESC
        `);

        res.json({
            success: true,
            users: users.rows,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro API users:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar usuários' 
        });
    }
});

// 💼 API SYSTEM STATUS - Status geral do sistema
app.get('/api/system/status', async (req, res) => {
    try {
        // Verificar conectividade do banco
        const dbTest = await pool.query('SELECT NOW()');
        
        // Estatísticas gerais
        const systemStats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM trading_signals) as total_signals,
                (SELECT COUNT(*) FROM user_operations) as total_operations,
                (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
                (SELECT COUNT(*) FROM user_api_keys WHERE is_active = true) as active_api_keys
        `);

        res.json({
            success: true,
            status: 'operational',
            database: 'connected',
            server_time: new Date().toISOString(),
            statistics: systemStats.rows[0],
            uptime: process.uptime()
        });

    } catch (error) {
        console.error('❌ Erro system status:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erro no sistema' 
        });
    }
});

// 📊 Servir dashboard principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 🔄 Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '3.0.0'
    });
});

// Middleware de erro global
app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado:', err.message);
    res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
    });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`🌐 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`📡 Webhook: http://localhost:${PORT}/webhook/tradingview`);
    console.log(`🔄 Health: http://localhost:${PORT}/health`);
    console.log('✅ Sistema pronto para receber sinais!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Encerrando servidor...');
    server.close(() => {
        pool.end();
        console.log('✅ Servidor encerrado');
        process.exit(0);
    });
});

module.exports = app;
