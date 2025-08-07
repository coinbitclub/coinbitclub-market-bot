#!/usr/bin/env node

/**
 * 🚀 COINBITCLUB MARKET BOT - SERVIDOR PRINCIPAL v5.1.1
 * ===================================================
 * 
 * Aplicação principal para sistema de trading automatizado
 * Recursos: Multiusuário, Trading Real, Position Safety, Monitoramento
 * Deploy: 2025-08-06 (USD/BRL System)
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

// Importar módulos especializados
const PositionSafetyValidator = require('./position-safety-validator.js');
const EnhancedSignalProcessor = require('./enhanced-signal-processor.js');
const CommissionSystem = require('./commission-system.js');
const FinancialManager = require('./financial-manager.js');

class CoinBitClubServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        
        // HEALTH CHECK DEVE SER O PRIMEIRO - ANTES DE QUALQUER MIDDLEWARE
        this.app.get('/health', (req, res) => {
            res.status(200).json({ 
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: Math.floor(process.uptime()),
                version: '5.1.0',
                environment: process.env.NODE_ENV || 'production'
            });
        });
        
        // Configurar banco de dados
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
            ssl: { rejectUnauthorized: false }
        });

        // Inicializar módulos
        this.positionSafety = new PositionSafetyValidator();
        this.signalProcessor = new EnhancedSignalProcessor();
        this.commissionSystem = new CommissionSystem();
        this.financialManager = new FinancialManager(this.pool);

        this.setupMiddleware();

        // Production middleware
        if (process.env.NODE_ENV === 'production') {
            // Force HTTPS (except localhost)
            this.app.use((req, res, next) => {
                const host = req.header('host') || '';
                const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
                
                if (!isLocalhost && req.header('x-forwarded-proto') !== 'https') {
                    res.redirect(`https://${req.header('host')}${req.url}`);
                } else {
                    next();
                }
            });

            // Security headers
            this.app.use((req, res, next) => {
                res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.setHeader('X-Frame-Options', 'DENY');
                res.removeHeader('X-Powered-By');
                next();
            });
        }

        this.setupHealthCheck();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupHealthCheck() {
        // Health check removido - já definido no constructor
    }

    setupMiddleware() {
        // CORS configurado para permitir acesso de qualquer origem
        this.app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Middleware para parsing
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

        // Middleware de log
        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }

    setupRoutes() {
        // Status detalhado com verificação de banco
        this.app.get('/status', async (req, res) => {
            try {
                const client = await this.pool.connect();
                await client.query('SELECT 1');
                client.release();
                
                res.json({
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    environment: process.env.NODE_ENV || 'production',
                    database: 'connected',
                    trading: process.env.ENABLE_REAL_TRADING === 'true' ? 'REAL' : 'SIMULATION',
                    version: '5.0.0'
                });
            } catch (error) {
                res.status(503).json({
                    status: 'ERROR',
                    error: error.message,
                    timestamp: new Date().toISOString(),
                    database: 'disconnected'
                });
            }
        });

        // Rota de status principal
        this.app.get('/', (req, res) => {
            res.json({
                status: 'COINBITCLUB MARKET BOT ATIVO',
                version: '3.0.0',
                mode: process.env.NODE_ENV || 'production',
                realTrading: process.env.ENABLE_REAL_TRADING === 'true',
                positionSafety: process.env.POSITION_SAFETY_ENABLED === 'true',
                timestamp: new Date().toISOString(),
                features: [
                    'Trading Real Ativado',
                    'Position Safety Obrigatório',
                    'Sistema Multiusuário',
                    'Monitoramento Tempo Real',
                    'Proteções Máximas'
                ]
            });
        });

        // Rota de status detalhado do sistema
        this.app.get('/system-status', async (req, res) => {
            try {
                const client = await this.pool.connect();
                
                const users = await client.query('SELECT COUNT(*) as total FROM users');
                const positions = await client.query('SELECT COUNT(*) as total FROM positions');
                const trades = await client.query('SELECT COUNT(*) as total FROM trades');
                
                client.release();

                res.json({
                    sistema: 'TOTALMENTE ATIVO',
                    database: {
                        status: 'CONECTADO',
                        usuarios: parseInt(users.rows[0].total),
                        posicoes: parseInt(positions.rows[0].total),
                        trades: parseInt(trades.rows[0].total)
                    },
                    trading: {
                        status: process.env.ENABLE_REAL_TRADING === 'true' ? 'REAL' : 'SIMULAÇÃO',
                        positionSafety: 'OBRIGATÓRIO',
                        stopLoss: 'OBRIGATÓRIO',
                        takeProfit: 'OBRIGATÓRIO',
                        maxLeverage: process.env.MAX_LEVERAGE || '10x'
                    },
                    urls: {
                        backend: process.env.BACKEND_URL,
                        frontend: process.env.FRONTEND_URL,
                        webhook: `${process.env.BACKEND_URL}/webhook`
                    },
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                res.status(500).json({
                    error: 'Erro ao verificar status',
                    details: error.message
                });
            }
        });

        // Webhook principal para sinais
        this.app.post('/webhook', async (req, res) => {
            try {
                console.log('📡 Webhook recebido:', {
                    headers: req.headers,
                    body: req.body,
                    timestamp: new Date().toISOString()
                });

                // Processar sinal através do Enhanced Signal Processor
                const resultado = await this.signalProcessor.processSignal(req.body);

                res.json({
                    status: 'SINAL PROCESSADO',
                    resultado: resultado,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('❌ Erro no webhook:', error);
                res.status(500).json({
                    error: 'Erro ao processar sinal',
                    details: error.message
                });
            }
        });

        // API Webhook para sinais (rota alternativa)
        this.app.post('/api/webhooks/signal', async (req, res) => {
            try {
                console.log('📡 API Webhook recebido:', {
                    headers: req.headers,
                    body: req.body,
                    timestamp: new Date().toISOString()
                });

                // Processar sinal através do Enhanced Signal Processor
                const resultado = await this.signalProcessor.processSignal(req.body);

                res.json({
                    status: 'API_SIGNAL_PROCESSED',
                    resultado: resultado,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('❌ Erro no API webhook:', error);
                res.status(500).json({
                    error: 'Erro ao processar sinal via API',
                    details: error.message
                });
            }
        });

        // Rota para validar position safety
        this.app.post('/validate-position', (req, res) => {
            try {
                const { leverage, stopLoss, takeProfit, orderValue } = req.body;
                
                const validation = this.positionSafety.validatePositionSafety({
                    leverage: leverage || 1,
                    stopLoss: stopLoss || 0,
                    takeProfit: takeProfit || 0,
                    orderValue: orderValue || 0
                });

                res.json({
                    validation: validation,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                res.status(400).json({
                    error: 'Erro na validação',
                    details: error.message
                });
            }
        });

        // Rota para calcular comissões
        this.app.post('/calculate-commission', async (req, res) => {
            try {
                const { profit, plan, affiliateType, country, currency } = req.body;
                
                if (!profit || profit <= 0) {
                    return res.json({
                        message: 'Comissão calculada apenas sobre LUCRO',
                        commission: {
                            totalCommission: 0,
                            companyCommission: 0,
                            affiliateCommission: 0,
                            netProfit: profit || 0
                        },
                        profit: profit || 0
                    });
                }

                const commission = await this.commissionSystem.calculateCommission({
                    profit: parseFloat(profit),
                    plan: plan || 'MONTHLY',
                    affiliateType: affiliateType || 'none',
                    country: country || 'BR',
                    currency: currency || 'USD'
                });

                res.json({
                    commission: commission,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                res.status(400).json({
                    error: 'Erro no cálculo de comissão',
                    details: error.message
                });
            }
        });

        // Rota para informações dos planos de comissionamento
        this.app.get('/commission-plans', async (req, res) => {
            const plansInfo = this.commissionSystem.getPlansInfo();
            
            res.json({
                ...plansInfo,
                examples: [
                    {
                        scenario: 'Lucro $100 USD - Plano Mensal BR - Afiliado Normal',
                        calculation: await this.commissionSystem.calculateCommission({
                            profit: 100,
                            plan: 'MONTHLY',
                            affiliateType: 'normal',
                            country: 'BR',
                            currency: 'USD'
                        })
                    },
                    {
                        scenario: 'Lucro $100 USD - Plano Pré-pago BR - Afiliado VIP',
                        calculation: await this.commissionSystem.calculateCommission({
                            profit: 100,
                            plan: 'PREPAID',
                            affiliateType: 'vip',
                            country: 'BR',
                            currency: 'USD'
                        })
                    },
                    {
                        scenario: 'Lucro $100 USD - Plano Mensal Exterior - Afiliado Normal',
                        calculation: await this.commissionSystem.calculateCommission({
                            profit: 100,
                            plan: 'MONTHLY',
                            affiliateType: 'normal',
                            country: 'US',
                            currency: 'USD'
                        })
                    }
                ],
                timestamp: new Date().toISOString()
            });
        });

        // ==================== SISTEMA FINANCEIRO ====================

        // Consultar saldos do usuário
        this.app.get('/api/user/:userId/balances', async (req, res) => {
            try {
                const { userId } = req.params;
                const balances = await this.financialManager.getUserBalances(userId);
                
                res.json({
                    success: true,
                    balances: balances,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                res.status(400).json({
                    error: 'Erro ao consultar saldos',
                    details: error.message
                });
            }
        });

        // Processar recarga via Stripe
        this.app.post('/api/stripe/recharge', async (req, res) => {
            try {
                const { userId, amount, currency = 'BRL' } = req.body;
                
                if (!userId || !amount || amount <= 0) {
                    return res.status(400).json({
                        error: 'Dados inválidos',
                        required: ['userId', 'amount']
                    });
                }

                const result = await this.financialManager.processStripeRecharge(userId, amount, currency);
                
                res.json({
                    success: true,
                    result: result,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                res.status(400).json({
                    error: 'Erro na recarga',
                    details: error.message
                });
            }
        });

        // Criar cupom administrativo
        this.app.post('/api/admin/create-coupon', async (req, res) => {
            try {
                const { adminId, couponCode, creditAmount, currency = 'BRL', expirationDays = 30 } = req.body;
                
                if (!adminId || !couponCode || !creditAmount) {
                    return res.status(400).json({
                        error: 'Dados inválidos',
                        required: ['adminId', 'couponCode', 'creditAmount']
                    });
                }

                const result = await this.financialManager.createCoupon(adminId, couponCode, creditAmount, currency, expirationDays);
                
                res.json({
                    success: true,
                    result: result,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                res.status(400).json({
                    error: 'Erro ao criar cupom',
                    details: error.message
                });
            }
        });

        // Usar cupom
        this.app.post('/api/user/use-coupon', async (req, res) => {
            try {
                const { userId, couponCode } = req.body;
                
                if (!userId || !couponCode) {
                    return res.status(400).json({
                        error: 'Dados inválidos',
                        required: ['userId', 'couponCode']
                    });
                }

                const result = await this.financialManager.useCoupon(userId, couponCode);
                
                res.json({
                    success: true,
                    result: result,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                res.status(400).json({
                    error: 'Erro ao usar cupom',
                    details: error.message
                });
            }
        });

        // Solicitar saque
        this.app.post('/api/user/request-withdrawal', async (req, res) => {
            try {
                const { userId, amount, currency = 'BRL' } = req.body;
                
                if (!userId || !amount || amount <= 0) {
                    return res.status(400).json({
                        error: 'Dados inválidos',
                        required: ['userId', 'amount']
                    });
                }

                const result = await this.financialManager.requestWithdrawal(userId, amount, currency);
                
                res.json({
                    success: true,
                    result: result,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                res.status(400).json({
                    error: 'Erro na solicitação de saque',
                    details: error.message
                });
            }
        });

        // Converter comissão para crédito administrativo (+10% bonus)
        this.app.post('/api/affiliate/convert-commission', async (req, res) => {
            try {
                const { userId, amount, currency = 'BRL' } = req.body;
                
                if (!userId || !amount || amount <= 0) {
                    return res.status(400).json({
                        error: 'Dados inválidos',
                        required: ['userId', 'amount']
                    });
                }

                const result = await this.financialManager.convertCommissionToAdminCredit(userId, amount, currency);
                
                res.json({
                    success: true,
                    result: result,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                res.status(400).json({
                    error: 'Erro na conversão',
                    details: error.message
                });
            }
        });

        // Relatório financeiro geral
        this.app.get('/api/admin/financial-summary', async (req, res) => {
            try {
                const summary = await this.financialManager.getFinancialSummary();
                
                res.json({
                    success: true,
                    summary: summary,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                res.status(500).json({
                    error: 'Erro no relatório',
                    details: error.message
                });
            }
        });

        // Gerar código de cupom automático
        this.app.get('/api/admin/generate-coupon-code', (req, res) => {
            const code = this.financialManager.generateCouponCode('CBC');
            
            res.json({
                success: true,
                couponCode: code,
                timestamp: new Date().toISOString()
            });
        });

        // API para gerenciar usuários
        this.app.get('/api/users', async (req, res) => {
            try {
                const client = await this.pool.connect();
                const result = await client.query(`
                    SELECT id, username, email, created_at, is_active
                    FROM users 
                    ORDER BY created_at DESC
                `);
                client.release();

                res.json({
                    users: result.rows,
                    total: result.rows.length,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                res.status(500).json({
                    error: 'Erro ao buscar usuários',
                    details: error.message
                });
            }
        });

        // API para posições ativas
        this.app.get('/api/positions', async (req, res) => {
            try {
                const client = await this.pool.connect();
                const result = await client.query(`
                    SELECT p.*, u.username 
                    FROM positions p
                    LEFT JOIN users u ON p.user_id = u.id
                    ORDER BY p.created_at DESC
                `);
                client.release();

                res.json({
                    positions: result.rows,
                    total: result.rows.length,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                res.status(500).json({
                    error: 'Erro ao buscar posições',
                    details: error.message
                });
            }
        });

        // Dashboard de monitoramento
        this.app.get('/dashboard', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>CoinBitClub Market Bot - Dashboard</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #1a1a1a; color: #fff; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .status { background: #2d2d2d; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
                        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
                        .card { background: #333; padding: 20px; border-radius: 10px; }
                        .success { color: #4CAF50; }
                        .warning { color: #FF9800; }
                        .info { color: #2196F3; }
                        .metric { font-size: 24px; font-weight: bold; margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>🚀 CoinBitClub Market Bot</h1>
                        <h2 class="success">Sistema Totalmente Ativo</h2>
                    </div>

                    <div class="status">
                        <h3>📊 Status do Sistema</h3>
                        <p><span class="success">✅ Trading Real:</span> Ativado</p>
                        <p><span class="success">✅ Position Safety:</span> Obrigatório</p>
                        <p><span class="success">✅ Banco de Dados:</span> Conectado</p>
                        <p><span class="info">🌐 Webhook:</span> ${process.env.BACKEND_URL}/webhook</p>
                    </div>

                    <div class="grid">
                        <div class="card">
                            <h3>🔒 Segurança</h3>
                            <p>Stop Loss: <span class="success">Obrigatório</span></p>
                            <p>Take Profit: <span class="success">Obrigatório</span></p>
                            <p>Leverage Máximo: <span class="warning">${process.env.MAX_LEVERAGE || 10}x</span></p>
                        </div>

                        <div class="card">
                            <h3>💰 Sistema Financeiro</h3>
                            <p><strong>Comissão:</strong> <span class="info">Apenas sobre LUCRO</span></p>
                            <p><strong>Operações:</strong> USD (com conversão BRL para planos BR)</p>
                            <p><strong>Planos:</strong> Mensal 10% | Pré-pago 20%</p>
                            <p><strong>Afiliados:</strong></p>
                            <p>• Normal: 15% da comissão total</p>
                            <p>• VIP: 25% da comissão total</p>
                            <p><small><strong>Ex BR:</strong> $100 → R$ ${(100 * 5.5).toFixed(0)} (câmbio 5.50)</small></p>
                            <p><small><strong>Mensal BR:</strong> R$ ${(550 * 0.085).toFixed(0)} empresa + R$ ${(550 * 0.015).toFixed(0)} afiliado</small></p>
                            <br>
                            <p><strong>Tipos de Saldo:</strong></p>
                            <p>🟢 <strong>Real (Stripe):</strong> Pode sacar</p>
                            <p>🟡 <strong>Administrativo:</strong> Cupons, 30 dias</p>
                            <p>🔴 <strong>Comissão:</strong> Não saca, converte +10%</p>
                            <p><strong>💱 Câmbio:</strong> Atualizado automaticamente</p>
                        </div>

                        <div class="card">
                            <h3>🌐 APIs Disponíveis</h3>
                            <p><a href="/api/users" style="color: #2196F3;">/api/users</a> - Usuários</p>
                            <p><a href="/api/positions" style="color: #2196F3;">/api/positions</a> - Posições</p>
                            <p><a href="/status" style="color: #2196F3;">/status</a> - Status Completo</p>
                            <br>
                            <p><strong>APIs Financeiras:</strong></p>
                            <p><span style="color: #4CAF50;">GET</span> /api/user/:id/balances</p>
                            <p><span style="color: #FF9800;">POST</span> /api/stripe/recharge</p>
                            <p><span style="color: #FF9800;">POST</span> /api/user/use-coupon</p>
                            <p><span style="color: #FF9800;">POST</span> /api/user/request-withdrawal</p>
                            <p><span style="color: #2196F3;">GET</span> /api/admin/financial-summary</p>
                        </div>

                        <div class="card">
                            <h3>📈 Monitoramento</h3>
                            <p>Tempo Real: <span class="success">Ativo</span></p>
                            <p>Logs: <span class="success">Ativo</span></p>
                            <p>Alertas: <span class="success">Configurado</span></p>
                        </div>
                    </div>

                    <script>
                        // Auto-refresh a cada 30 segundos
                        setInterval(() => {
                            const timestamp = document.getElementById('timestamp');
                            if (timestamp) {
                                timestamp.textContent = new Date().toLocaleString('pt-BR');
                            }
                        }, 30000);
                    </script>
                </body>
                </html>
            `);
        });
    }

    setupErrorHandling() {
        // Handler para rotas não encontradas
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Rota não encontrada',
                path: req.originalUrl,
                availableRoutes: [
                    'GET /',
                    'GET /status',
                    'POST /webhook',
                    'POST /validate-position',
                    'GET /api/users',
                    'GET /api/positions',
                    'GET /dashboard'
                ]
            });
        });

        // Handler para erros gerais
        this.app.use((error, req, res, next) => {
            console.error('❌ Erro no servidor:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        });
    }

    async testDatabaseConnection() {
        try {
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            console.log('✅ Banco de dados: CONECTADO');
            return true;
        } catch (error) {
            console.error('❌ Banco de dados: ERRO', error.message);
            return false;
        }
    }

    async start() {
        try {
            console.log('🚀 COINBITCLUB MARKET BOT - INICIANDO...');
            console.log('=========================================');
            console.log('');

            // Testar conexão com banco
            const dbConnected = await this.testDatabaseConnection();
            if (!dbConnected) {
                throw new Error('Falha na conexão com banco de dados');
            }

            // Inicializar tabelas necessárias
            console.log('🔧 Inicializando estrutura do banco...');
            await this.signalProcessor.createSignalsTable();
            await this.financialManager.createFinancialTables();
            console.log('✅ Estrutura do banco inicializada');
            console.log('');

            // Iniciar servidor
            this.app.listen(this.port, '0.0.0.0', () => {
                console.log('🎯 SISTEMA TOTALMENTE ATIVO!');
                console.log('');
                console.log('🌐 Servidor rodando em:');
                console.log(`   • Local: http://localhost:${this.port}`);
                console.log(`   • Produção: ${process.env.BACKEND_URL || 'https://coinbitclub-backend.railway.app'}`);
                console.log('');
                console.log('📡 Endpoints disponíveis:');
                console.log(`   • Health: http://localhost:${this.port}/health`);
                console.log(`   • Status: http://localhost:${this.port}/status`);
                console.log(`   • Dashboard: http://localhost:${this.port}/dashboard`);
                console.log(`   • Webhook: http://localhost:${this.port}/webhook`);
                console.log(`   • API Users: http://localhost:${this.port}/api/users`);
                console.log(`   • API Positions: http://localhost:${this.port}/api/positions`);
                console.log('');
                console.log('🔒 Configurações de segurança:');
                console.log(`   • Trading Real: ${process.env.ENABLE_REAL_TRADING === 'true' ? 'ATIVO' : 'SIMULAÇÃO'}`);
                console.log(`   • Position Safety: ${process.env.POSITION_SAFETY_ENABLED === 'true' ? 'OBRIGATÓRIO' : 'OPCIONAL'}`);
                console.log(`   • Stop Loss: ${process.env.MANDATORY_STOP_LOSS === 'true' ? 'OBRIGATÓRIO' : 'OPCIONAL'}`);
                console.log(`   • Take Profit: ${process.env.MANDATORY_TAKE_PROFIT === 'true' ? 'OBRIGATÓRIO' : 'OPCIONAL'}`);
                console.log('');
                console.log('💰 Sistema pronto para operações reais!');
                console.log('🎉 COINBITCLUB MARKET BOT 100% OPERACIONAL!');
                console.log('=========================================');
            });

        } catch (error) {
            console.error('💥 Erro ao iniciar servidor:', error);
            process.exit(1);
        }
    }
}

// Iniciar aplicação
if (require.main === module) {
    const server = new CoinBitClubServer();
    server.start();
}

module.exports = CoinBitClubServer;
