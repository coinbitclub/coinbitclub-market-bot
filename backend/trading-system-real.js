#!/usr/bin/env node

const express = require('express');
const { Pool } = require('pg');

console.log(`
🤖 SISTEMA DE TRADING
═══════════════════════════════════════
🎯 Execução automatizada de operações
📈 Trading inteligente CoinBitClub
`);

class TradingSystem {
    constructor() {
        this.app = express();
        this.port = 9003;
        this.isActive = true;
        this.activePositions = new Map();
        
        this.setupDatabase();
        this.startTrading();
        this.setupAPI();
    }

    async setupDatabase() {
        this.pool = new Pool({
            host: 'maglev.proxy.rlwy.net',
            port: 42095,
            database: 'railway',
            user: 'postgres',
            password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv',
            ssl: { rejectUnauthorized: false }
        });

        console.log('🔗 Conexão com banco estabelecida');
    }

    startTrading() {
        console.log('🚀 Sistema de Trading iniciado');
        
        // Processar sinais a cada 30 segundos
        setInterval(() => {
            this.processSignals();
        }, 30000);

        // Verificar posições ativas a cada minuto
        setInterval(() => {
            this.checkActivePositions();
        }, 60000);

        // Log de atividade
        setInterval(() => {
            console.log(`📊 Trading ativo - Posições: ${this.activePositions.size}`);
        }, 300000); // A cada 5 minutos
    }

    async processSignals() {
        try {
            const signals = await this.pool.query(`
                SELECT * FROM signals 
                WHERE status = 'active' 
                AND created_at > NOW() - INTERVAL '1 hour'
                ORDER BY confidence DESC
                LIMIT 5
            `);

            for (const signal of signals.rows) {
                if (signal.confidence > 80 && !this.activePositions.has(signal.symbol)) {
                    await this.executeSignal(signal);
                }
            }

        } catch (error) {
            console.log('⚠️ Erro ao processar sinais:', error.message);
        }
    }

    async executeSignal(signal) {
        try {
            console.log(`🎯 Executando sinal: ${signal.side} ${signal.symbol} @ $${signal.entry_price}`);

            // Simular execução de operação
            const operation = {
                user_id: 1, // ID do usuário padrão
                symbol: signal.symbol,
                side: signal.side.toLowerCase(),
                entry_price: signal.entry_price,
                quantity: 0.01, // Quantidade pequena para teste
                leverage: 1,
                status: 'active',
                signal_id: signal.id,
                exchange: 'bybit',
                environment: 'demo'
            };

            const result = await this.pool.query(`
                INSERT INTO operations (
                    user_id, symbol, side, entry_price, quantity, leverage,
                    status, signal_id, exchange, environment, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                RETURNING id
            `, [
                operation.user_id, operation.symbol, operation.side, operation.entry_price,
                operation.quantity, operation.leverage, operation.status, operation.signal_id,
                operation.exchange, operation.environment
            ]);

            this.activePositions.set(signal.symbol, {
                operationId: result.rows[0].id,
                entryPrice: signal.entry_price,
                targetPrice: signal.target_price,
                stopLoss: signal.stop_loss,
                side: signal.side,
                startTime: Date.now()
            });

            console.log(`✅ Operação criada: ID ${result.rows[0].id}`);

        } catch (error) {
            console.log('❌ Erro ao executar sinal:', error.message);
        }
    }

    async checkActivePositions() {
        for (const [symbol, position] of this.activePositions.entries()) {
            // Simular verificação de preço atual
            const currentPrice = position.entryPrice * (0.95 + Math.random() * 0.1); // ±5% simulado
            
            let shouldClose = false;
            let exitPrice = currentPrice;
            let reason = '';

            // Verificar take profit
            if (position.side === 'BUY' && currentPrice >= position.targetPrice) {
                shouldClose = true;
                exitPrice = position.targetPrice;
                reason = 'Take Profit';
            } else if (position.side === 'SELL' && currentPrice <= position.targetPrice) {
                shouldClose = true;
                exitPrice = position.targetPrice;
                reason = 'Take Profit';
            }

            // Verificar stop loss
            if (position.side === 'BUY' && currentPrice <= position.stopLoss) {
                shouldClose = true;
                exitPrice = position.stopLoss;
                reason = 'Stop Loss';
            } else if (position.side === 'SELL' && currentPrice >= position.stopLoss) {
                shouldClose = true;
                exitPrice = position.stopLoss;
                reason = 'Stop Loss';
            }

            // Verificar timeout (fechar após 1 hora)
            if (Date.now() - position.startTime > 3600000) {
                shouldClose = true;
                reason = 'Timeout';
            }

            if (shouldClose) {
                await this.closePosition(symbol, position, exitPrice, reason);
            }
        }
    }

    async closePosition(symbol, position, exitPrice, reason) {
        try {
            // Calcular lucro
            let profit = 0;
            if (position.side === 'BUY') {
                profit = (exitPrice - position.entryPrice) * 0.01; // Quantidade fixa
            } else {
                profit = (position.entryPrice - exitPrice) * 0.01;
            }

            // Atualizar operação no banco
            await this.pool.query(`
                UPDATE operations 
                SET exit_price = $1, profit = $2, status = 'completed', 
                    closed_at = NOW(), updated_at = NOW()
                WHERE id = $3
            `, [exitPrice, profit, position.operationId]);

            console.log(`🔒 Posição fechada: ${symbol} - ${reason} - Lucro: $${profit.toFixed(4)}`);

            // Remover da lista de posições ativas
            this.activePositions.delete(symbol);

        } catch (error) {
            console.log('❌ Erro ao fechar posição:', error.message);
        }
    }

    setupAPI() {
        this.app.use(express.json());

        this.app.get('/status', (req, res) => {
            res.json({
                status: 'active',
                uptime: process.uptime(),
                activePositions: this.activePositions.size,
                positions: Array.from(this.activePositions.entries()).map(([symbol, pos]) => ({
                    symbol,
                    side: pos.side,
                    entryPrice: pos.entryPrice,
                    uptime: Math.round((Date.now() - pos.startTime) / 1000)
                })),
                timestamp: new Date().toISOString()
            });
        });

        this.app.listen(this.port, () => {
            console.log(`🌐 Trading API ativa na porta ${this.port}`);
        });
    }
}

// Inicializar Trading System
const tradingSystem = new TradingSystem();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando Sistema de Trading...');
    tradingSystem.isActive = false;
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Encerrando Sistema de Trading...');
    tradingSystem.isActive = false;
    process.exit(0);
});
