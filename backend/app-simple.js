/**
 * 🚀 COINBITCLUB MARKET BOT - VERSÃO SIMPLIFICADA PARA TESTE
 * =========================================================
 */

console.log('🚀 Iniciando CoinBitClub Market Bot - Versão Simplificada...');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();

class SimpleCoinBitClubServer {
    constructor() {
        console.log('🔧 Constructor iniciado...');
        this.app = express();
        this.port = process.env.PORT || 3000;
        
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'process.env.DATABASE_URL',
            ssl: { rejectUnauthorized: false }
        });

        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        console.log('🔧 Configurando middlewares...');
        
        this.app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
            next();
        });
        
        console.log('✅ Middlewares configurados');
    }

    setupRoutes() {
        console.log('🔧 Configurando rotas...');

        // Health Check
        this.app.get('/health', (req, res) => {
            res.status(200).json({ 
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: Math.floor(process.uptime()),
                version: '5.1.0',
                environment: process.env.NODE_ENV || 'development'
            });
        });
        console.log('✅ Rota /health configurada');

        // Status
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
                    version: '5.1.0'
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
        console.log('✅ Rota /status configurada');

        // Dashboard Summary
        this.app.get('/api/dashboard/summary', async (req, res) => {
            try {
                res.json({
                    success: true,
                    summary: {
                        totalUsers: 12,
                        totalBalance: '15000.00',
                        currency: 'USD',
                        totalCommissions: '150.00',
                        activePlans: {
                            monthly: 8,
                            prepaid: 4
                        }
                    },
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });
        console.log('✅ Rota /api/dashboard/summary configurada');

        // Users API
        this.app.get('/api/users', async (req, res) => {
            try {
                res.json({
                    users: [
                        { id: 1, username: 'user1', email: 'user1@example.com', balance: 1000 },
                        { id: 2, username: 'user2', email: 'user2@example.com', balance: 2000 }
                    ],
                    totalUsers: 2,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });
        console.log('✅ Rota /api/users configurada');

        // Exchanges Status
        this.app.get('/api/exchanges/status', async (req, res) => {
            try {
                res.json({
                    exchanges: [
                        { name: 'Binance', status: 'connected', latency: '45ms' },
                        { name: 'Bybit', status: 'connected', latency: '38ms' }
                    ],
                    totalExchanges: 2,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });
        console.log('✅ Rota /api/exchanges/status configurada');

        // Root
        this.app.get('/', (req, res) => {
            res.json({
                message: 'CoinBitClub Market Bot API',
                version: '5.1.0',
                status: 'operational',
                timestamp: new Date().toISOString(),
                availableEndpoints: [
                    'GET /health',
                    'GET /status', 
                    'GET /api/dashboard/summary',
                    'GET /api/users',
                    'GET /api/exchanges/status'
                ]
            });
        });
        console.log('✅ Rota / configurada');

        // 404 Handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Rota não encontrada',
                path: req.originalUrl,
                availableRoutes: [
                    'GET /',
                    'GET /health',
                    'GET /status',
                    'GET /api/dashboard/summary',
                    'GET /api/users',
                    'GET /api/exchanges/status'
                ]
            });
        });
        console.log('✅ Handler 404 configurado');

        console.log('✅ Todas as rotas configuradas com sucesso');
    }

    async start() {
        try {
            console.log('🚀 Iniciando servidor...');
            
            this.app.listen(this.port, '0.0.0.0', () => {
                console.log('');
                console.log('🎯 SERVIDOR ATIVO!');
                console.log('==================');
                console.log(`🌐 URL: http://localhost:${this.port}`);
                console.log(`📊 Health: http://localhost:${this.port}/health`);
                console.log(`📈 Status: http://localhost:${this.port}/status`);
                console.log(`🚀 Dashboard: http://localhost:${this.port}/api/dashboard/summary`);
                console.log('==================');
                console.log('');
            });
        } catch (error) {
            console.error('❌ Erro ao iniciar servidor:', error);
        }
    }
}

// Inicializar servidor
const server = new SimpleCoinBitClubServer();
server.start();
