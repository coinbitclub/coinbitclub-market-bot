/**
 * 🚀 SERVIDOR PRINCIPAL - COINBITCLUB MARKET BOT V3.0.0
 * API Server com Webhook TradingView e Monitoramento
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

// Importar controlador do sistema
const SystemController = require('./controlador-sistema-web');

const app = express();
const PORT = process.env.PORT || 3000;

// Instanciar controlador do sistema
const systemController = new SystemController();

// Pool de conexão PostgreSQL
const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

console.log('🚀 CoinBitClub Market Bot V3.0.0 - API Server Starting...');

// 🎛️ Configurar rotas do controlador do sistema
systemController.setupRoutes(app);

// 🎛️ Servir painel de controle do sistema
app.get('/control', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'system-control.html'));
});

// 📊 Servir monitor de operações
app.get('/operations', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'operations-monitor.html'));
});

// 🤖 Servir operações em tempo real (como landing page)
app.get('/live', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'real-time-operations.html'));
});

// 📡 Servir monitor de sinais e decisões
app.get('/signals', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signal-monitor.html'));
});

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

// 📊 API OPERATIONS METRICS - Métricas do monitor de operações
app.get('/api/operations/metrics', async (req, res) => {
    try {
        console.log('📊 Buscando métricas de operações...');
        
        // Métricas de hoje
        const hoje = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'ABERTA') as operacoes_abertas,
                COUNT(*) FILTER (WHERE status = 'FECHADA' AND DATE(fechada_em) = CURRENT_DATE) as operacoes_fechadas,
                COUNT(*) FILTER (WHERE status = 'FECHADA' AND DATE(fechada_em) = CURRENT_DATE AND pnl > 0) as operacoes_lucrativas,
                COUNT(*) FILTER (WHERE status = 'FECHADA' AND DATE(fechada_em) = CURRENT_DATE AND pnl <= 0) as operacoes_prejuizo,
                COALESCE(SUM(pnl) FILTER (WHERE status = 'FECHADA' AND DATE(fechada_em) = CURRENT_DATE), 0) as pnl_total
            FROM live_operations
        `);

        // Métricas históricas
        const historico = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'FECHADA') as total_fechadas,
                COUNT(*) FILTER (WHERE status = 'FECHADA' AND pnl > 0) as total_lucrativas,
                COUNT(*) as total_operacoes,
                COALESCE(SUM(pnl) FILTER (WHERE status = 'FECHADA'), 0) as pnl_historico
            FROM live_operations
        `);

        const hj = hoje.rows[0];
        const hist = historico.rows[0];

        // Calcular taxas de sucesso
        const taxaSucessoHoje = hj.operacoes_fechadas > 0 
            ? Math.round((hj.operacoes_lucrativas / hj.operacoes_fechadas) * 100) 
            : 0;

        const taxaSucessoHistorica = hist.total_fechadas > 0 
            ? Math.round((hist.total_lucrativas / hist.total_fechadas) * 100) 
            : 0;

        // Função para classificar taxa de sucesso
        const classificarTaxa = (taxa) => {
            if (taxa >= 80) return { nivel: 'EXCELENTE', cor: 'verde' };
            if (taxa >= 60) return { nivel: 'BOM', cor: 'azul' };
            if (taxa >= 40) return { nivel: 'REGULAR', cor: 'amarelo' };
            return { nivel: 'RUIM', cor: 'vermelho' };
        };

        const metricas = {
            hoje: {
                operacoesAbertas: parseInt(hj.operacoes_abertas),
                operacoesFechadas: parseInt(hj.operacoes_fechadas),
                operacoesLucrativas: parseInt(hj.operacoes_lucrativas),
                operacoesPrejuizo: parseInt(hj.operacoes_prejuizo),
                pnlTotal: parseFloat(hj.pnl_total),
                taxaSucesso: taxaSucessoHoje,
                classificacao: classificarTaxa(taxaSucessoHoje)
            },
            historico: {
                totalOperacoes: parseInt(hist.total_operacoes),
                totalFechadas: parseInt(hist.total_fechadas),
                totalLucrativas: parseInt(hist.total_lucrativas),
                pnlHistorico: parseFloat(hist.pnl_historico),
                taxaSucesso: taxaSucessoHistorica,
                classificacao: classificarTaxa(taxaSucessoHistorica)
            }
        };

        console.log('✅ Métricas calculadas:', metricas);

        res.json({
            success: true,
            data: metricas,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao buscar métricas:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar métricas de operações' 
        });
    }
});

// 🔓 API OPERATIONS OPEN - Operações abertas
app.get('/api/operations/open', async (req, res) => {
    try {
        console.log('🔓 Buscando operações abertas...');
        
        const operacoes = await pool.query(`
            SELECT 
                lo.id, lo.user_id, lo.symbol, lo.tipo as side,
                lo.quantidade as quantity, lo.preco_entrada as entry_price, 
                lo.preco_saida as current_price, lo.pnl_atual as pnl_unrealized,
                lo.status, lo.order_id, lo.aberta_em as created_at, 
                lo.updated_at, u.name as user_name,
                EXTRACT(EPOCH FROM (NOW() - lo.aberta_em))/60 as minutes_open,
                CASE 
                    WHEN lo.preco_saida IS NOT NULL AND lo.preco_entrada IS NOT NULL THEN
                        CASE 
                            WHEN lo.tipo = 'LONG' THEN 
                                (lo.preco_saida - lo.preco_entrada) * lo.quantidade
                            WHEN lo.tipo = 'SHORT' THEN 
                                (lo.preco_entrada - lo.preco_saida) * lo.quantidade
                            ELSE 0
                        END
                    ELSE COALESCE(lo.pnl_atual, 0)
                END as pnl_unrealized_calc
            FROM live_operations lo
            LEFT JOIN users u ON lo.user_id = u.id
            WHERE lo.status = 'ABERTA'
            ORDER BY lo.aberta_em DESC
            LIMIT 50
        `);

        console.log(`✅ Encontradas ${operacoes.rows.length} operações abertas`);

        res.json({
            success: true,
            data: operacoes.rows,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao buscar operações abertas:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar operações abertas' 
        });
    }
});

// 📚 API OPERATIONS HISTORY - Histórico de operações
app.get('/api/operations/history', async (req, res) => {
    try {
        console.log('📚 Buscando histórico de operações...');
        
        const limit = req.query.limit || 20;
        
        const operacoes = await pool.query(`
            SELECT 
                lo.id, lo.user_id, lo.symbol, lo.tipo as side,
                lo.quantidade as quantity, lo.preco_entrada as entry_price, 
                lo.pnl, lo.status, lo.order_id, lo.aberta_em as created_at, 
                lo.fechada_em as closed_at, u.name as user_name,
                EXTRACT(EPOCH FROM (lo.fechada_em - lo.aberta_em))/60 as duration_minutes,
                lo.pnl as pnl_realized
            FROM live_operations lo
            LEFT JOIN users u ON lo.user_id = u.id
            WHERE lo.status = 'FECHADA'
            ORDER BY lo.fechada_em DESC
            LIMIT $1
        `, [limit]);

        console.log(`✅ Encontradas ${operacoes.rows.length} operações no histórico`);

        res.json({
            success: true,
            data: operacoes.rows,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar histórico de operações' 
        });
    }
});

// 📊 API MARKET INDICATORS - Indicadores técnicos em tempo real
app.get('/api/market/indicators', async (req, res) => {
    try {
        const symbol = req.query.symbol || 'BTCUSDT';
        
        // Simular indicadores técnicos realistas
        const indicators = {
            symbol: symbol,
            timestamp: new Date().toISOString(),
            price: {
                current: Math.random() * 5000 + 60000, // 60k-65k
                change24h: (Math.random() - 0.5) * 0.1, // -5% a +5%
                volume24h: Math.random() * 1000000000 + 500000000 // Volume alto
            },
            technical: {
                rsi: {
                    value: Math.floor(Math.random() * 40) + 30, // 30-70
                    signal: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
                    strength: Math.random() > 0.7 ? 'STRONG' : 'MODERATE'
                },
                macd: {
                    value: (Math.random() - 0.5) * 100,
                    signal: Math.random() > 0.6 ? 'BULLISH_CROSS' : 'NEUTRAL',
                    histogram: (Math.random() - 0.5) * 50
                },
                bollinger: {
                    upper: 0,
                    middle: 0,
                    lower: 0,
                    position: Math.random() > 0.5 ? 'UPPER' : 'LOWER'
                },
                ema: {
                    ema20: 0,
                    ema50: 0,
                    trend: Math.random() > 0.5 ? 'UPTREND' : 'DOWNTREND'
                }
            },
            sentiment: {
                fearGreedIndex: Math.floor(Math.random() * 100),
                marketSentiment: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
                confidence: Math.random() > 0.7 ? 'HIGH' : 'MODERATE'
            },
            signals: {
                direction: Math.random() > 0.5 ? 'LONG' : 'SHORT',
                strength: Math.floor(Math.random() * 5) + 1, // 1-5
                probability: Math.floor(Math.random() * 30) + 70, // 70-100%
                entry_price: 0,
                stop_loss: 0,
                take_profit: 0
            }
        };

        // Calcular preços baseados no preço atual
        const currentPrice = indicators.price.current;
        indicators.technical.bollinger.middle = currentPrice;
        indicators.technical.bollinger.upper = currentPrice * 1.02;
        indicators.technical.bollinger.lower = currentPrice * 0.98;
        indicators.technical.ema.ema20 = currentPrice * 0.995;
        indicators.technical.ema.ema50 = currentPrice * 0.99;

        // Calcular sinais de entrada
        if (indicators.signals.direction === 'LONG') {
            indicators.signals.entry_price = currentPrice;
            indicators.signals.stop_loss = currentPrice * 0.97;
            indicators.signals.take_profit = currentPrice * 1.05;
        } else {
            indicators.signals.entry_price = currentPrice;
            indicators.signals.stop_loss = currentPrice * 1.03;
            indicators.signals.take_profit = currentPrice * 0.95;
        }

        res.json({
            success: true,
            data: indicators,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao buscar indicadores:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar indicadores de mercado' 
        });
    }
});

// 🤖 API LIVE OPERATION STATUS - Status da operação atual
app.get('/api/live/operation-status', async (req, res) => {
    try {
        // Buscar operação mais recente
        const lastOperation = await pool.query(`
            SELECT 
                lo.*, u.name as user_name,
                EXTRACT(EPOCH FROM (NOW() - lo.aberta_em))/60 as minutes_running
            FROM live_operations lo
            LEFT JOIN users u ON lo.user_id = u.id
            ORDER BY lo.aberta_em DESC
            LIMIT 1
        `);

        // Simular status de operação em tempo real
        const operationStatus = {
            currentCycle: Math.floor(Date.now() / 300000) % 100 + 1, // Novo ciclo a cada 5min
            isActive: true,
            currentStep: Math.floor(Math.random() * 7) + 1, // 1-7
            steps: {
                marketReading: {
                    status: 'completed',
                    duration: 15,
                    data: {
                        rsi: Math.floor(Math.random() * 40) + 30,
                        macd: Math.random() > 0.5 ? 'BULLISH_CROSS' : 'BEARISH_CROSS',
                        volume: Math.floor(Math.random() * 60) + 20
                    }
                },
                signalDetection: {
                    status: Math.random() > 0.3 ? 'completed' : 'executing',
                    duration: 8,
                    data: {
                        direction: Math.random() > 0.5 ? 'LONG' : 'SHORT',
                        symbol: 'BTC/USDT',
                        confidence: Math.floor(Math.random() * 30) + 70
                    }
                },
                positionOpening: {
                    status: Math.random() > 0.6 ? 'completed' : 'pending',
                    duration: 12,
                    data: lastOperation.rows[0] || null
                },
                monitoring: {
                    status: lastOperation.rows.length > 0 ? 'executing' : 'pending',
                    duration: null, // Contínuo
                    data: lastOperation.rows[0] ? {
                        currentPrice: (Math.random() * 5000 + 60000).toFixed(2),
                        pnl: ((Math.random() - 0.3) * 1000).toFixed(2),
                        roi: ((Math.random() - 0.3) * 10).toFixed(2)
                    } : null
                }
            },
            performance: {
                todayOperations: Math.floor(Math.random() * 10) + 5,
                successRate: Math.floor(Math.random() * 40) + 60,
                totalPnL: ((Math.random() - 0.2) * 1000).toFixed(2),
                avgDuration: Math.floor(Math.random() * 60) + 30
            }
        };

        res.json({
            success: true,
            data: operationStatus,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao buscar status da operação:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar status da operação' 
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

// 🎛️ Servir painel de controle do sistema
app.get('/control', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'system-control.html'));
});

// � Servir monitor de sinais e decisões
app.get('/signals', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signal-monitor.html'));
});

// �📊 Servir dashboard administrativo
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
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
