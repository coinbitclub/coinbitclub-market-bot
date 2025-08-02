const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 3016; // Porta livre para API

app.use(express.json());

console.log(`📈 API de Indicadores Real iniciando na porta ${PORT}`);

// Database connection
const pool = new Pool({
    host: 'maglev.proxy.rlwy.net',
    port: 42095,
    database: 'railway',
    user: 'postgres',
    password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv',
    ssl: { rejectUnauthorized: false }
});

// Technical indicators functions
function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calculateSMA(prices, period) {
    if (prices.length < period) return null;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
}

function calculateEMA(prices, period) {
    if (prices.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < prices.length; i++) {
        ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
}

function calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) return null;
    
    const sma = calculateSMA(prices, period);
    const recentPrices = prices.slice(-period);
    
    const variance = recentPrices.reduce((sum, price) => {
        return sum + Math.pow(price - sma, 2);
    }, 0) / period;
    
    const standardDeviation = Math.sqrt(variance);
    
    return {
        upper: sma + (standardDeviation * stdDev),
        middle: sma,
        lower: sma - (standardDeviation * stdDev)
    };
}

// API Routes
app.post('/api/indicators', async (req, res) => {
    try {
        const { symbol, prices, indicators } = req.body;
        
        if (!prices || !Array.isArray(prices) || prices.length === 0) {
            return res.status(400).json({
                error: 'Preços são obrigatórios'
            });
        }
        
        const results = {};
        
        if (!indicators || indicators.includes('rsi')) {
            results.rsi = calculateRSI(prices);
        }
        
        if (!indicators || indicators.includes('sma_20')) {
            results.sma_20 = calculateSMA(prices, 20);
        }
        
        if (!indicators || indicators.includes('sma_50')) {
            results.sma_50 = calculateSMA(prices, 50);
        }
        
        if (!indicators || indicators.includes('ema_12')) {
            results.ema_12 = calculateEMA(prices, 12);
        }
        
        if (!indicators || indicators.includes('ema_26')) {
            results.ema_26 = calculateEMA(prices, 26);
        }
        
        if (!indicators || indicators.includes('bollinger')) {
            results.bollinger = calculateBollingerBands(prices);
        }
        
        // MACD calculation
        if (results.ema_12 && results.ema_26) {
            results.macd = {
                line: results.ema_12 - results.ema_26,
                signal: null,
                histogram: null
            };
        }
        
        res.json({
            symbol: symbol || 'UNKNOWN',
            timestamp: new Date().toISOString(),
            dataPoints: prices.length,
            indicators: results
        });
        
    } catch (error) {
        console.error('❌ Erro ao calcular indicadores:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/indicators/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        
        const result = await pool.query(`
            SELECT entry_price, exit_price, created_at
            FROM operations 
            WHERE symbol = $1 
            ORDER BY created_at DESC 
            LIMIT 100
        `, [symbol.toUpperCase()]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Nenhum dado encontrado',
                symbol: symbol
            });
        }
        
        const prices = result.rows.map(row => 
            parseFloat(row.exit_price || row.entry_price)
        ).reverse();
        
        const indicators = {
            rsi: calculateRSI(prices),
            sma_20: calculateSMA(prices, 20),
            sma_50: calculateSMA(prices, 50),
            ema_12: calculateEMA(prices, 12),
            ema_26: calculateEMA(prices, 26),
            bollinger: calculateBollingerBands(prices)
        };
        
        if (indicators.ema_12 && indicators.ema_26) {
            indicators.macd = {
                line: indicators.ema_12 - indicators.ema_26,
                signal: null,
                histogram: null
            };
        }
        
        res.json({
            symbol: symbol.toUpperCase(),
            timestamp: new Date().toISOString(),
            dataPoints: prices.length,
            lastPrice: prices[prices.length - 1],
            indicators: indicators
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Indicators API Real',
        port: PORT,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/api/indicators', (req, res) => {
    res.json({
        availableIndicators: [
            { name: 'RSI', key: 'rsi', period: 14 },
            { name: 'SMA 20', key: 'sma_20', period: 20 },
            { name: 'SMA 50', key: 'sma_50', period: 50 },
            { name: 'EMA 12', key: 'ema_12', period: 12 },
            { name: 'EMA 26', key: 'ema_26', period: 26 },
            { name: 'Bollinger Bands', key: 'bollinger', period: 20 },
            { name: 'MACD', key: 'macd', period: 'Variable' }
        ],
        usage: {
            post: '/api/indicators - Calcular com dados fornecidos',
            get: '/api/indicators/:symbol - Buscar do banco'
        }
    });
});

app.listen(PORT, () => {
    console.log(`✅ API de Indicadores rodando na porta ${PORT}`);
    console.log(`📊 Endpoint: http://localhost:${PORT}/api/indicators`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando API de Indicadores...');
    pool.end(() => {
        console.log('✅ API encerrada');
        process.exit(0);
    });
});
