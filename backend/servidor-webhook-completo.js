/**
 * 🌐 SERVIDOR WEBHOOK COMPLETO INTEGRADO
 * 
 * CARACTERÍSTICAS:
 * - Express server para TradingView webhooks
 * - Integração total com IA Guardian
 * - Processamento completo de sinais
 * - Monitoramento e logs detalhados
 * - Health checks para todos componentes
 */

const express = require('express');
const cors = require('cors');
const SistemaIntegradoCompleto = require('./sistema-integrado-completo');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Sistema integrado
let sistemaCompleto = null;

// Middleware de logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// 🚀 INICIALIZAÇÃO DO SISTEMA
async function inicializarSistemaCompleto() {
    console.log('🌟 INICIALIZANDO SERVIDOR WEBHOOK INTEGRADO');
    console.log('='.repeat(60));
    
    try {
        sistemaCompleto = new SistemaIntegradoCompleto();
        const result = await sistemaCompleto.iniciarSistemaCompleto();
        
        if (result.success) {
            console.log('✅ Sistema integrado inicializado com sucesso');
            return true;
        } else {
            console.log('❌ Falha na inicialização:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro crítico na inicialização:', error.message);
        return false;
    }
}

// 📡 WEBHOOK TRADINGVIEW - ENDPOINT PRINCIPAL
app.post('/webhook/tradingview', async (req, res) => {
    const timestamp = new Date().toISOString();
    console.log('\n🔔 WEBHOOK RECEBIDO DO TRADINGVIEW');
    console.log('='.repeat(50));
    console.log('📅 Timestamp:', timestamp);
    console.log('📊 Dados recebidos:', JSON.stringify(req.body, null, 2));

    try {
        // Verificar se sistema está ativo
        if (!sistemaCompleto || !sistemaCompleto.isActive) {
            console.log('❌ Sistema não está ativo');
            return res.status(503).json({
                success: false,
                error: 'Sistema não está ativo',
                timestamp
            });
        }

        // Validar dados do webhook
        const { action, symbol, price, message } = req.body;
        
        if (!action || !symbol) {
            console.log('❌ Dados inválidos no webhook');
            return res.status(400).json({
                success: false,
                error: 'Dados inválidos: action e symbol são obrigatórios',
                timestamp
            });
        }

        console.log(`🎯 Ação: ${action}`);
        console.log(`💱 Symbol: ${symbol}`);
        console.log(`💰 Preço: ${price || 'N/A'}`);

        // Processar sinal completo através do sistema integrado
        const resultado = await sistemaCompleto.processarSinalCompleto({
            action,
            symbol,
            price,
            message,
            source: 'TradingView',
            timestamp
        });

        console.log('\n📋 RESULTADO DO PROCESSAMENTO:');
        console.log(JSON.stringify(resultado, null, 2));

        // Resposta ao TradingView
        const response = {
            success: resultado.success,
            message: resultado.success ? 'Sinal processado com sucesso' : 'Falha no processamento',
            details: resultado,
            timestamp,
            processed_by: 'CoinBitClub IA System'
        };

        console.log('\n✅ RESPOSTA ENVIADA AO TRADINGVIEW');
        res.status(200).json(response);

        // Log final
        console.log(`\n${resultado.success ? '✅' : '❌'} WEBHOOK PROCESSADO`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('\n❌ ERRO NO PROCESSAMENTO DO WEBHOOK:', error.message);
        console.error('Stack:', error.stack);

        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            details: error.message,
            timestamp
        });
    }
});

// 🔍 HEALTH CHECK COMPLETO
app.get('/health', async (req, res) => {
    console.log('🔍 HEALTH CHECK SOLICITADO');
    
    try {
        const systemStatus = sistemaCompleto ? await sistemaCompleto.statusSistema() : null;
        
        const healthData = {
            server: 'online',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            sistema_integrado: systemStatus,
            endpoints: {
                webhook: '/webhook/tradingview',
                health: '/health',
                status: '/status'
            }
        };

        console.log('✅ Health check completo:', JSON.stringify(healthData, null, 2));
        res.status(200).json(healthData);
        
    } catch (error) {
        console.error('❌ Erro no health check:', error.message);
        res.status(500).json({
            server: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 📊 STATUS DETALHADO DO SISTEMA
app.get('/status', async (req, res) => {
    console.log('📊 STATUS DETALHADO SOLICITADO');
    
    try {
        if (!sistemaCompleto) {
            return res.status(503).json({
                status: 'Sistema não inicializado',
                timestamp: new Date().toISOString()
            });
        }

        const status = await sistemaCompleto.statusSistema();
        
        // Adicionar informações extras
        const detailedStatus = {
            ...status,
            server: {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                uptime_seconds: process.uptime(),
                memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
            },
            database: {
                url: process.env.DATABASE_URL ? 'Configurado' : 'Não configurado',
                ssl: 'Habilitado'
            }
        };

        res.status(200).json(detailedStatus);
        
    } catch (error) {
        console.error('❌ Erro no status:', error.message);
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 🧪 ENDPOINT DE TESTE
app.post('/test/signal', async (req, res) => {
    console.log('\n🧪 TESTE DE SINAL SOLICITADO');
    
    const testSignal = {
        action: req.body.action || 'SINAL_LONG',
        symbol: req.body.symbol || 'BTCUSDT',
        price: req.body.price || 45000,
        message: 'Sinal de teste',
        source: 'TEST',
        timestamp: new Date().toISOString()
    };

    console.log('📊 Sinal de teste:', JSON.stringify(testSignal, null, 2));

    try {
        if (!sistemaCompleto || !sistemaCompleto.isActive) {
            return res.status(503).json({
                success: false,
                error: 'Sistema não está ativo',
                timestamp: testSignal.timestamp
            });
        }

        const resultado = await sistemaCompleto.processarSinalCompleto(testSignal);
        
        res.status(200).json({
            success: true,
            test_signal: testSignal,
            result: resultado,
            timestamp: testSignal.timestamp
        });

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: testSignal.timestamp
        });
    }
});

// 📈 ENDPOINT PARA OBTER FEAR & GREED ATUAL
app.get('/fear-greed', async (req, res) => {
    console.log('📈 FEAR & GREED SOLICITADO');
    
    try {
        if (!sistemaCompleto || !sistemaCompleto.iaGuardian) {
            return res.status(503).json({
                error: 'Sistema não disponível',
                timestamp: new Date().toISOString()
            });
        }

        const fearGreedData = await sistemaCompleto.iaGuardian.obterFearGreedInteligente();
        
        res.status(200).json({
            fear_greed: fearGreedData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao obter Fear & Greed:', error.message);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 🚫 ENDPOINT PARA PARAR SISTEMA
app.post('/admin/stop', async (req, res) => {
    console.log('\n🛑 SOLICITAÇÃO DE PARADA DO SISTEMA');
    
    try {
        if (sistemaCompleto) {
            await sistemaCompleto.pararSistema();
            sistemaCompleto = null;
        }
        
        res.status(200).json({
            success: true,
            message: 'Sistema parado com sucesso',
            timestamp: new Date().toISOString()
        });

        // Parar servidor após resposta
        setTimeout(() => {
            console.log('🛑 Parando servidor...');
            process.exit(0);
        }, 1000);

    } catch (error) {
        console.error('❌ Erro ao parar sistema:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 🎯 MIDDLEWARE DE ERRO GLOBAL
app.use((error, req, res, next) => {
    console.error('❌ ERRO GLOBAL:', error.message);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
    });
});

// 🔍 ROTA 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado',
        available_endpoints: [
            'POST /webhook/tradingview',
            'GET /health',
            'GET /status',
            'POST /test/signal',
            'GET /fear-greed',
            'POST /admin/stop'
        ],
        timestamp: new Date().toISOString()
    });
});

// 🚀 INICIALIZAÇÃO DO SERVIDOR
async function startServer() {
    console.log('🌟 INICIANDO SERVIDOR WEBHOOK COINBITCLUB');
    console.log('='.repeat(60));
    console.log('📅 Data:', new Date().toISOString());
    console.log('🌍 Porta:', PORT);
    console.log('');

    // Inicializar sistema integrado
    const sistemaInicializado = await inicializarSistemaCompleto();
    
    if (!sistemaInicializado) {
        console.log('❌ Falha crítica: Sistema não pode ser inicializado');
        process.exit(1);
    }

    // Iniciar servidor Express
    const server = app.listen(PORT, () => {
        console.log('\n🎉 SERVIDOR WEBHOOK ATIVO!');
        console.log('='.repeat(60));
        console.log(`📡 URL: http://localhost:${PORT}`);
        console.log('📋 Endpoints disponíveis:');
        console.log('   📊 POST /webhook/tradingview - Receber sinais');
        console.log('   🔍 GET  /health - Health check');
        console.log('   📈 GET  /status - Status detalhado');
        console.log('   🧪 POST /test/signal - Teste de sinal');
        console.log('   📊 GET  /fear-greed - Fear & Greed atual');
        console.log('   🛑 POST /admin/stop - Parar sistema');
        console.log('');
        console.log('✅ PRONTO PARA RECEBER WEBHOOKS DO TRADINGVIEW!');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Recebido SIGTERM, parando servidor...');
        server.close(async () => {
            if (sistemaCompleto) {
                await sistemaCompleto.pararSistema();
            }
            process.exit(0);
        });
    });

    process.on('SIGINT', async () => {
        console.log('\n🛑 Recebido SIGINT, parando servidor...');
        server.close(async () => {
            if (sistemaCompleto) {
                await sistemaCompleto.pararSistema();
            }
            process.exit(0);
        });
    });

    return server;
}

// Executar se chamado diretamente
if (require.main === module) {
    startServer().catch(error => {
        console.error('❌ Erro crítico ao iniciar servidor:', error.message);
        process.exit(1);
    });
}

module.exports = app;
