#!/usr/bin/env node

/**
 * 📊 EXCHANGE MANAGER - COINBITCLUB IA MONITORING
 * Gerenciador de exchanges para integração com IA de Monitoramento
 * Conforme configuração de IP fixo da Seção 4.1 da especificação
 */

class ExchangeManager {
    constructor() {
        // Configuração de IP fixo conforme Seção 4.1 da especificação
        this.config = {
            binance: {
                apiKey: process.env.BINANCE_API_KEY,
                secretKey: process.env.BINANCE_SECRET_KEY,
                baseURL: 'https://api.binance.com',
                allowedIPs: ['132.255.160.140'] // IP fixo Railway Prod
            },
            bybit: {
                apiKey: process.env.BYBIT_API_KEY,
                secretKey: process.env.BYBIT_SECRET_KEY,
                baseURL: 'https://api.bybit.com',
                allowedIPs: ['132.255.160.140'] // IP fixo Railway Prod
            }
        };
        
        this.activeExchange = process.env.DEFAULT_EXCHANGE || 'binance';
        
        console.log(`📊 Exchange Manager iniciado - Exchange ativo: ${this.activeExchange}`);
    }
    
    // 📊 Obter posições ativas
    async getActivePositions() {
        try {
            console.log('📊 Obtendo posições ativas...');
            
            // Simular consulta às posições (implementar integração real)
            const positions = [
                {
                    symbol: 'BTCUSDT',
                    side: 'LONG',
                    size: 0.001,
                    entryPrice: 43500.00,
                    markPrice: 43750.00,
                    pnl: 0.25,
                    margin: 10.00
                },
                {
                    symbol: 'ETHUSDT', 
                    side: 'SHORT',
                    size: 0.01,
                    entryPrice: 2650.00,
                    markPrice: 2630.00,
                    pnl: 0.20,
                    margin: 5.00
                }
            ];
            
            console.log(`✅ ${positions.length} posições ativas encontradas`);
            return positions;
            
        } catch (error) {
            console.error('❌ Erro ao obter posições:', error.message);
            throw error;
        }
    }
    
    // 🔄 Fechar posição específica
    async closePosition(positionData) {
        try {
            const { symbol, side, quantity, type = 'MARKET' } = positionData;
            
            console.log(`🔄 Fechando posição: ${symbol} ${side} ${quantity}`);
            
            // Simular fechamento de posição (implementar integração real)
            const orderResult = {
                orderId: `close_${Date.now()}`,
                symbol: symbol,
                side: side,
                quantity: quantity,
                type: type,
                status: 'FILLED',
                executedQty: quantity,
                price: this.getCurrentPrice(symbol),
                timestamp: new Date().toISOString()
            };
            
            console.log(`✅ Posição fechada: Ordem ${orderResult.orderId}`);
            
            // Log para sistema de eventos
            await this.logTradeAction('close_position', orderResult);
            
            return orderResult;
            
        } catch (error) {
            console.error('❌ Erro ao fechar posição:', error.message);
            throw error;
        }
    }
    
    // 💰 Fechar todas as posições (usado pela IA)
    async closeAllPositions(direction = 'ALL') {
        try {
            console.log(`🔄 Fechando todas as posições: ${direction}`);
            
            const activePositions = await this.getActivePositions();
            
            // Filtrar por direção se especificada
            let positionsToClose = activePositions;
            if (direction !== 'ALL') {
                positionsToClose = activePositions.filter(position => 
                    position.side.toUpperCase() === direction.toUpperCase()
                );
            }
            
            console.log(`🎯 Posições a fechar: ${positionsToClose.length}`);
            
            const results = [];
            
            for (const position of positionsToClose) {
                try {
                    const closeResult = await this.closePosition({
                        symbol: position.symbol,
                        side: position.side === 'LONG' ? 'SELL' : 'BUY', // Ordem inversa
                        quantity: position.size,
                        type: 'MARKET'
                    });
                    
                    results.push({
                        ...closeResult,
                        originalPosition: position,
                        status: 'success'
                    });
                    
                } catch (error) {
                    results.push({
                        symbol: position.symbol,
                        side: position.side,
                        error: error.message,
                        status: 'failed'
                    });
                }
            }
            
            const successful = results.filter(r => r.status === 'success').length;
            const failed = results.filter(r => r.status === 'failed').length;
            
            console.log(`📊 Resumo: ${successful} sucessos, ${failed} falhas`);
            
            return {
                direction: direction,
                totalPositions: activePositions.length,
                positionsToClose: positionsToClose.length,
                successful: successful,
                failed: failed,
                results: results,
                closedOrders: results.filter(r => r.status === 'success').map(r => r.orderId)
            };
            
        } catch (error) {
            console.error('❌ Erro ao fechar todas as posições:', error.message);
            throw error;
        }
    }
    
    // 📈 Obter preço atual (simulado)
    getCurrentPrice(symbol) {
        // Simular preços atuais (implementar integração real com API)
        const prices = {
            'BTCUSDT': 43750.00,
            'ETHUSDT': 2630.00,
            'ADAUSDT': 0.485,
            'SOLUSDT': 102.50,
            'DOGEUSDT': 0.085
        };
        
        return prices[symbol] || 1.0;
    }
    
    // 📊 Obter dados de mercado
    async getMarketData() {
        try {
            // Simular dados de mercado (implementar integração real)
            const marketData = {
                timestamp: Date.now(),
                btcPrice: this.getCurrentPrice('BTCUSDT'),
                ethPrice: this.getCurrentPrice('ETHUSDT'),
                volume: Math.random() * 1000000 + 500000,
                avgVolume: 800000,
                priceChange5min: (Math.random() - 0.5) * 0.1, // -5% a +5%
                priceChange1h: (Math.random() - 0.5) * 0.2,   // -10% a +10%
                fearGreedIndex: Math.floor(Math.random() * 100),
                btcDominance: 42.5 + (Math.random() - 0.5) * 5,
                totalMarketCap: 2.1e12, // 2.1 trilhões
                volatility: Math.random() * 0.1 // 0-10%
            };
            
            console.log('📊 Dados de mercado obtidos');
            return marketData;
            
        } catch (error) {
            console.error('❌ Erro ao obter dados de mercado:', error.message);
            throw error;
        }
    }
    
    // 🔍 Verificar conectividade com exchange
    async testConnection() {
        try {
            console.log(`🔍 Testando conexão com ${this.activeExchange}...`);
            
            // Simular teste de conexão (implementar ping real)
            const connectionTest = {
                exchange: this.activeExchange,
                status: 'connected',
                latency: Math.floor(Math.random() * 100) + 20, // 20-120ms
                serverTime: new Date().toISOString(),
                ipAllowed: true // Assumir IP fixo configurado
            };
            
            console.log(`✅ Conexão OK - Latência: ${connectionTest.latency}ms`);
            return connectionTest;
            
        } catch (error) {
            console.error('❌ Erro na conexão:', error.message);
            throw error;
        }
    }
    
    // 📝 Log de ações de trading
    async logTradeAction(action, data) {
        try {
            const logEntry = {
                action: action,
                exchange: this.activeExchange,
                data: data,
                timestamp: new Date().toISOString(),
                ip: await this.getCurrentIP()
            };
            
            console.log(`📝 Log de trading: ${action}`);
            
            // Aqui salvaria no sistema de eventos da IA
            // await saveSystemEvent({ ... });
            
        } catch (error) {
            console.error('Erro ao salvar log de trading:', error);
        }
    }
    
    // 🌐 Obter IP atual (para verificar IP fixo)
    async getCurrentIP() {
        try {
            const axios = require('axios');
            const response = await axios.get('https://api.ipify.org?format=json', {
                timeout: 5000
            });
            
            return response.data.ip;
            
        } catch (error) {
            console.log('Não foi possível obter IP externo');
            return 'unknown';
        }
    }
    
    // 🔧 Verificar configuração de IP fixo
    async validateIPConfiguration() {
        try {
            const currentIP = await this.getCurrentIP();
            const allowedIPs = this.config[this.activeExchange].allowedIPs;
            
            const isIPAllowed = allowedIPs.includes(currentIP);
            
            const validation = {
                current_ip: currentIP,
                allowed_ips: allowedIPs,
                is_allowed: isIPAllowed,
                exchange: this.activeExchange,
                timestamp: new Date().toISOString()
            };
            
            if (isIPAllowed) {
                console.log(`✅ IP fixo configurado corretamente: ${currentIP}`);
            } else {
                console.log(`⚠️ IP atual não está na whitelist: ${currentIP}`);
                console.log(`📋 IPs permitidos: ${allowedIPs.join(', ')}`);
            }
            
            return validation;
            
        } catch (error) {
            console.error('❌ Erro na validação de IP:', error.message);
            throw error;
        }
    }
    
    // 📊 Obter estatísticas do exchange
    getExchangeStats() {
        return {
            active_exchange: this.activeExchange,
            config: this.config[this.activeExchange],
            uptime: process.uptime(),
            last_connection_test: null // Implementar cache
        };
    }
}

module.exports = ExchangeManager;
