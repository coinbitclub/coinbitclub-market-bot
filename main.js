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

        // DETECÇÃO AUTOMÁTICA: CoinBitClub vs Sinal Simples
        console.log('🔍 Detectando tipo de sinal...');
        console.log('📥 Dados recebidos:', JSON.stringify(signalData, null, 2));
        
        // Verificar se é CoinBitClub baseado em campos característicos
        const hasCoinBitClubFields = signalData.diff_btc_ema7 !== undefined || 
                                   signalData.ema9_30 !== undefined ||
                                   signalData.rsi_4h !== undefined ||
                                   (signalData.ticker && signalData.signal && !signalData.action);

        if (hasCoinBitClubFields) {
            console.log('🎯 SINAL COINBITCLUB DETECTADO');
            return await processCoinBitClubSignal(signalData, res);
        } else {
            console.log('📊 SINAL SIMPLES DETECTADO');
            return await processSimpleSignal(signalData, res);
        }

    } catch (error) {
        console.error('❌ Erro no webhook TradingView:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Função para processar sinais do CoinBitClub
async function processCoinBitClubSignal(signalData, res) {
    try {
        console.log('🎯 PROCESSANDO SINAL COINBITCLUB');
        
        // Validar campos obrigatórios do CoinBitClub
        if (!signalData.ticker && !signalData.symbol) {
            return res.status(400).json({ 
                error: 'CoinBitClub: ticker/symbol obrigatório' 
            });
        }

        if (!signalData.signal) {
            return res.status(400).json({ 
                error: 'CoinBitClub: campo signal obrigatório' 
            });
        }

        // Mapear tipos de sinal CoinBitClub para ações
        const signalAction = getCoinBitClubAction(signalData.signal);
        const signalStrength = getCoinBitClubStrength(signalData.signal);

        // Extrair símbolo
        const symbol = signalData.ticker || signalData.symbol;

        console.log(`   📊 Símbolo: ${symbol}`);
        console.log(`   🎯 Sinal: ${signalData.signal}`);
        console.log(`   📈 Ação: ${signalAction}`);
        console.log(`   💪 Força: ${signalStrength}`);
        console.log(`   📊 Diff BTC/EMA7: ${signalData.diff_btc_ema7}%`);
        console.log(`   💰 Preço: ${signalData.close}`);

        // Salvar na tabela signals (estrutura compatível)
        const result = await pool.query(`
            INSERT INTO signals (
                symbol, action, price, quantity, strategy, timeframe, 
                alert_message, processed, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id
        `, [
            symbol,
            signalAction,
            parseFloat(signalData.close) || null,
            null, // quantity não usado no CoinBitClub
            'coinbitclub_v2',
            '30m',
            `${signalData.signal}: ${symbol} (diff: ${signalData.diff_btc_ema7}%)`,
            false
        ]);

        const signalId = result.rows[0].id;
        console.log('✅ Sinal CoinBitClub salvo com ID:', signalId);

        // Tentar salvar dados detalhados (opcional - se falhar, não impede o processamento principal)
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS coinbitclub_signals (
                    id SERIAL PRIMARY KEY,
                    signal_id INTEGER REFERENCES signals(id),
                    symbol VARCHAR(20),
                    signal_type VARCHAR(50),
                    signal_strength VARCHAR(20),
                    diff_btc_ema7 DECIMAL(10,4),
                    ema9_30 DECIMAL(15,8),
                    rsi_4h DECIMAL(5,2),
                    rsi_15 DECIMAL(5,2),
                    momentum_15 DECIMAL(15,8),
                    atr_30 DECIMAL(15,8),
                    atr_pct_30 DECIMAL(5,2),
                    volume_30 DECIMAL(20,8),
                    volume_ma_30 DECIMAL(20,8),
                    crossed_above_ema9 BOOLEAN,
                    crossed_below_ema9 BOOLEAN,
                    golden_cross_30 BOOLEAN,
                    death_cross_30 BOOLEAN,
                    source_time TIMESTAMP,
                    raw_data JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);

            await pool.query(`
                INSERT INTO coinbitclub_signals (
                    signal_id, symbol, signal_type, signal_strength,
                    diff_btc_ema7, ema9_30, rsi_4h, rsi_15, momentum_15,
                    atr_30, atr_pct_30, volume_30, volume_ma_30,
                    crossed_above_ema9, crossed_below_ema9,
                    golden_cross_30, death_cross_30,
                    source_time, raw_data
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                    $14, $15, $16, $17, $18, $19
                )
            `, [
                signalId,
                symbol,
                signalData.signal,
                signalStrength,
                parseFloat(signalData.diff_btc_ema7) || null,
                parseFloat(signalData.ema9_30) || null,
                parseFloat(signalData.rsi_4h) || null,
                parseFloat(signalData.rsi_15) || null,
                parseFloat(signalData.momentum_15) || null,
                parseFloat(signalData.atr_30) || null,
                parseFloat(signalData.atr_pct_30) || null,
                parseFloat(signalData.vol_30) || null,
                parseFloat(signalData.vol_ma_30) || null,
                signalData.cruzou_acima_ema9 === "1",
                signalData.cruzou_abaixo_ema9 === "1",
                signalData.golden_cross_30 === "1",
                signalData.death_cross_30 === "1",
                signalData.time || new Date().toISOString(),
                JSON.stringify(signalData)
            ]);
            
            console.log('✅ Dados detalhados salvos em coinbitclub_signals');
        } catch (detailError) {
            console.log('⚠️ Erro ao salvar dados detalhados (não crítico):', detailError.message);
        }

        return res.status(200).json({
            success: true,
            message: 'Sinal CoinBitClub processado com sucesso',
            signalId: signalId,
            signal_type: signalData.signal,
            action: signalAction,
            strength: signalStrength,
            symbol: symbol,
            diff_btc_ema7: signalData.diff_btc_ema7,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao processar sinal CoinBitClub:', error);
        console.error('Stack trace:', error.stack);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

// Função para processar sinais simples (compatibilidade)
async function processSimpleSignal(signalData, res) {
    try {
        // Validar dados obrigatórios para sinais simples
        if (!signalData.symbol || !signalData.action) {
            return res.status(400).json({ 
                error: 'Dados inválidos - symbol e action são obrigatórios' 
            });
        }

        console.log('📊 PROCESSANDO SINAL SIMPLES:');
        console.log(`   📊 Símbolo: ${signalData.symbol}`);
        console.log(`   📈 Ação: ${signalData.action}`);
        console.log(`   💰 Preço: ${signalData.price || 'N/A'}`);

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
            signalData.strategy || 'simple_signal',
            signalData.timeframe || null,
            signalData.alert_message || JSON.stringify(signalData)
        ]);

        console.log('✅ Sinal simples salvo com ID:', result.rows[0].id);

        return res.status(200).json({
            success: true,
            message: 'Sinal processado com sucesso',
            signalId: result.rows[0].id,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao processar sinal simples:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

// Função para mapear sinais CoinBitClub para ações
function getCoinBitClubAction(signal) {
    switch(signal) {
        case 'SINAL LONG':
        case 'SINAL LONG FORTE':
        case 'CONFIRMAÇÃO LONG':
            return 'BUY';
            
        case 'SINAL SHORT':
        case 'SINAL SHORT FORTE':
        case 'CONFIRMAÇÃO SHORT':
            return 'SELL';
            
        case 'FECHE LONG':
            return 'CLOSE_LONG';
            
        case 'FECHE SHORT':
            return 'CLOSE_SHORT';
            
        default:
            return 'UNKNOWN';
    }
}

// Função para determinar força do sinal
function getCoinBitClubStrength(signal) {
    if (signal.includes('FORTE')) return 'STRONG';
    if (signal.includes('CONFIRMAÇÃO')) return 'CONFIRMATION';
    if (signal.includes('FECHE')) return 'EXIT';
    return 'MEDIUM';
}

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
