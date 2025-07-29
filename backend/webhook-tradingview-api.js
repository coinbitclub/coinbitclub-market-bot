/**
 * 🌐 API ENDPOINT PARA WEBHOOKS TRADINGVIEW
 * 
 * Este endpoint recebe os sinais do TradingView conforme o Pine Script
 * e processa as operações automaticamente conforme as especificações.
 */

const express = require('express');
const TradingViewSignalProcessor = require('./processador-sinais-tradingview-real');

const app = express();
app.use(express.json());

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Instância do processador
const signalProcessor = new TradingViewSignalProcessor();

// Endpoint principal para webhooks do TradingView
app.post('/webhook/tradingview', async (req, res) => {
    console.log('🎯 WEBHOOK TRADINGVIEW RECEBIDO');
    console.log('='.repeat(50));
    
    try {
        // Log dos dados recebidos
        console.log('📊 DADOS RECEBIDOS:');
        console.log(JSON.stringify(req.body, null, 2));
        
        // Validação básica
        if (!req.body.signal || !req.body.ticker || !req.body.close) {
            console.log('❌ Dados inválidos recebidos');
            return res.status(400).json({
                success: false,
                error: 'Dados obrigatórios ausentes (signal, ticker, close)'
            });
        }

        // Processar sinal
        const result = await signalProcessor.processWebhookSignal(req.body);
        
        console.log('📊 RESULTADO DO PROCESSAMENTO:');
        console.log(JSON.stringify(result, null, 2));
        
        // Resposta baseada no resultado
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Sinal processado com sucesso',
                data: result
            });
        } else {
            res.status(422).json({
                success: false,
                message: 'Sinal não processado',
                reason: result.reason,
                data: result
            });
        }

    } catch (error) {
        console.error('❌ Erro no webhook:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// Endpoint para testar conectividade
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'TradingView Webhook Processor',
        version: '2.0'
    });
});

// Endpoint para verificar sinais válidos
app.get('/signals/valid', (req, res) => {
    res.json({
        validSignals: [
            'SINAL LONG',
            'SINAL SHORT', 
            'SINAL LONG FORTE',
            'SINAL SHORT FORTE',
            'FECHE LONG',
            'FECHE SHORT',
            'CONFIRMAÇÃO LONG',
            'CONFIRMAÇÃO SHORT'
        ],
        description: 'Sinais aceitos pelo sistema conforme Pine Script'
    });
});

// Endpoint para simular um sinal (para testes)
app.post('/test/signal', async (req, res) => {
    console.log('🧪 TESTE DE SINAL SIMULADO');
    
    const testSignal = {
        ticker: req.body.ticker || 'BTCUSDT',
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        close: req.body.price || '65000',
        ema9_30: '64800',
        rsi_4h: '55',
        rsi_15: '62',
        momentum_15: '0.02',
        atr_30: '1200',
        atr_pct_30: '1.8',
        vol_30: '12000',
        vol_ma_30: '11000',
        diff_btc_ema7: '0.5',
        cruzou_acima_ema9: '1',
        cruzou_abaixo_ema9: '0',
        golden_cross_30: '0',
        death_cross_30: '0',
        signal: req.body.signal || 'SINAL LONG'
    };

    try {
        const result = await signalProcessor.processWebhookSignal(testSignal);
        res.json({
            success: true,
            message: 'Sinal de teste processado',
            testSignal: testSignal,
            result: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            testSignal: testSignal
        });
    }
});

// Endpoint para monitorar posições abertas
app.get('/positions/monitor', async (req, res) => {
    try {
        const monitoring = await signalProcessor.monitorOpenPositions();
        res.json({
            success: true,
            data: monitoring
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Middleware de erro global
app.use((error, req, res, next) => {
    console.error('❌ Erro não tratado:', error);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
    });
});

// 404 para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        availableEndpoints: [
            'POST /webhook/tradingview',
            'GET /health',
            'GET /signals/valid',
            'POST /test/signal',
            'GET /positions/monitor'
        ]
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('🚀 SERVIDOR WEBHOOK TRADINGVIEW INICIADO');
    console.log('='.repeat(50));
    console.log(`📡 Porta: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📋 Health Check: http://localhost:${PORT}/health`);
    console.log(`🎯 Webhook: http://localhost:${PORT}/webhook/tradingview`);
    console.log('');
    console.log('✅ SINAIS ACEITOS:');
    console.log('   • "SINAL LONG" / "SINAL LONG FORTE"');
    console.log('   • "SINAL SHORT" / "SINAL SHORT FORTE"');
    console.log('   • "FECHE LONG" / "FECHE SHORT"');
    console.log('   • "CONFIRMAÇÃO LONG" / "CONFIRMAÇÃO SHORT"');
    console.log('');
    console.log('🎯 PRONTO PARA RECEBER WEBHOOKS DO TRADINGVIEW!');
});

module.exports = app;
