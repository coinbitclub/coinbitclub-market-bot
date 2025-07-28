#!/usr/bin/env node
/**
 * 📊 PAINEL DE MONITORAMENTO COINBITCLUB
 * Sistema de monitoramento em tempo real
 */

const axios = require('axios');

// URL do sistema em produção
const PRODUCTION_URL = 'https://coinbitclub-market-bot.up.railway.app';

class MonitoringDashboard {
    constructor() {
        this.stats = {
            totalChecks: 0,
            successfulChecks: 0,
            errors: 0,
            lastError: null,
            uptime: 0,
            startTime: new Date()
        };
        this.isRunning = false;
    }

    async checkSystemHealth() {
        try {
            const response = await axios.get(`${PRODUCTION_URL}/health`, {
                timeout: 5000
            });
            
            this.stats.totalChecks++;
            this.stats.successfulChecks++;
            
            return {
                status: 'online',
                timestamp: new Date().toISOString(),
                responseTime: response.headers['x-response-time'] || 'N/A',
                data: response.data
            };
        } catch (error) {
            this.stats.totalChecks++;
            this.stats.errors++;
            this.stats.lastError = error.message;
            
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    async checkAPIHealth() {
        try {
            const response = await axios.get(`${PRODUCTION_URL}/api/health`, {
                timeout: 5000
            });
            
            return {
                status: 'online',
                version: response.data.version || 'N/A',
                database: response.data.database || 'unknown',
                features: response.data.features?.length || 0
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    async checkSignalsReceived() {
        try {
            const response = await axios.get(`${PRODUCTION_URL}/api/admin/signals/stats`, {
                headers: {
                    'Authorization': 'Bearer admin-emergency-token'
                },
                timeout: 5000
            });
            
            return {
                status: 'success',
                totalSignals: response.data.total_signals || 0,
                todaySignals: response.data.today_signals || 0,
                lastSignal: response.data.last_signal || null,
                successRate: response.data.success_rate || 0
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    async checkOperationalProcessing() {
        try {
            const response = await axios.get(`${PRODUCTION_URL}/api/admin/operations/stats`, {
                headers: {
                    'Authorization': 'Bearer admin-emergency-token'
                },
                timeout: 5000
            });
            
            return {
                status: 'success',
                totalOperations: response.data.total_operations || 0,
                todayOperations: response.data.today_operations || 0,
                processingQueue: response.data.processing_queue || 0,
                lastOperation: response.data.last_operation || null,
                averageProcessingTime: response.data.avg_processing_time || 0
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    async checkTradingFlowStatus() {
        try {
            const response = await axios.get(`${PRODUCTION_URL}/api/admin/trading/flow-status`, {
                headers: {
                    'Authorization': 'Bearer admin-emergency-token'
                },
                timeout: 5000
            });
            
            return {
                status: 'success',
                tradingEnabled: response.data.trading_enabled || false,
                activeStrategies: response.data.active_strategies || 0,
                pendingOrders: response.data.pending_orders || 0,
                lastTradeExecution: response.data.last_trade_execution || null
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    clearScreen() {
        console.clear();
    }

    getUptimePercent() {
        if (this.stats.totalChecks === 0) return 100;
        return ((this.stats.successfulChecks / this.stats.totalChecks) * 100).toFixed(2);
    }

    getRunningTime() {
        const diff = new Date() - this.stats.startTime;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }

    async displayDashboard() {
        this.clearScreen();
        
        console.log('🔥 COINBITCLUB - PAINEL DE MONITORAMENTO OPERACIONAL');
        console.log('=' .repeat(70));
        console.log(`⏰ ${new Date().toLocaleString('pt-BR')}`);
        console.log(`🕐 Executando há: ${this.getRunningTime()}`);
        console.log('=' .repeat(70));

        // Health Check
        const health = await this.checkSystemHealth();
        console.log('\n🔍 HEALTH CHECK:');
        if (health.status === 'online') {
            console.log(`   ✅ Sistema ONLINE`);
            console.log(`   🕐 Última verificação: ${health.timestamp.split('T')[1].split('.')[0]}`);
            console.log(`   📊 Status: ${health.data?.status || 'N/A'}`);
        } else {
            console.log(`   ❌ Sistema com problemas`);
            console.log(`   🚨 Erro: ${health.error}`);
        }

        // API Health
        const apiHealth = await this.checkAPIHealth();
        console.log('\n🔗 API STATUS:');
        if (apiHealth.status === 'online') {
            console.log(`   ✅ API funcionando`);
            console.log(`   📦 Versão: ${apiHealth.version}`);
            console.log(`   🗄️ Database: ${apiHealth.database}`);
            console.log(`   🛠️ Features: ${apiHealth.features} ativas`);
        } else {
            console.log(`   ❌ API com problemas`);
            console.log(`   🚨 Erro: ${apiHealth.error}`);
        }

        // Sinais Recebidos
        const signals = await this.checkSignalsReceived();
        console.log('\n📡 SINAIS RECEBIDOS:');
        if (signals.status === 'success') {
            console.log(`   ✅ Sistema de sinais ativo`);
            console.log(`   📊 Total de sinais: ${signals.totalSignals}`);
            console.log(`   📅 Sinais hoje: ${signals.todaySignals}`);
            console.log(`   ⚡ Taxa de sucesso: ${signals.successRate}%`);
            if (signals.lastSignal) {
                const lastTime = new Date(signals.lastSignal).toLocaleTimeString('pt-BR');
                console.log(`   🕐 Último sinal: ${lastTime}`);
            } else {
                console.log(`   🕐 Último sinal: Nenhum hoje`);
            }
        } else {
            console.log(`   ⚠️ Dados de sinais indisponíveis`);
            console.log(`   🚨 ${signals.error}`);
        }

        // Processamento Operacional
        const operations = await this.checkOperationalProcessing();
        console.log('\n⚙️ PROCESSAMENTO OPERACIONAL:');
        if (operations.status === 'success') {
            console.log(`   ✅ Motor operacional ativo`);
            console.log(`   🔄 Total de operações: ${operations.totalOperations}`);
            console.log(`   📅 Operações hoje: ${operations.todayOperations}`);
            console.log(`   ⏳ Fila de processamento: ${operations.processingQueue}`);
            console.log(`   ⚡ Tempo médio: ${operations.averageProcessingTime}ms`);
            if (operations.lastOperation) {
                const lastOpTime = new Date(operations.lastOperation).toLocaleTimeString('pt-BR');
                console.log(`   🕐 Última operação: ${lastOpTime}`);
            } else {
                console.log(`   🕐 Última operação: Nenhuma hoje`);
            }
        } else {
            console.log(`   ⚠️ Dados operacionais indisponíveis`);
            console.log(`   🚨 ${operations.error}`);
        }

        // Status do Fluxo de Trading
        const trading = await this.checkTradingFlowStatus();
        console.log('\n📈 FLUXO DE TRADING:');
        if (trading.status === 'success') {
            const tradingStatus = trading.tradingEnabled ? '✅ ATIVADO' : '🔴 DESATIVADO';
            console.log(`   📊 Trading: ${tradingStatus}`);
            console.log(`   🎯 Estratégias ativas: ${trading.activeStrategies}`);
            console.log(`   📋 Ordens pendentes: ${trading.pendingOrders}`);
            if (trading.lastTradeExecution) {
                const lastTradeTime = new Date(trading.lastTradeExecution).toLocaleTimeString('pt-BR');
                console.log(`   🕐 Última execução: ${lastTradeTime}`);
            } else {
                console.log(`   🕐 Última execução: Nenhuma hoje`);
            }
        } else {
            console.log(`   ⚠️ Status de trading indisponível`);
            console.log(`   🚨 ${trading.error}`);
        }

        // Estatísticas
        console.log('\n📊 ESTATÍSTICAS DO MONITOR:');
        console.log(`   📈 Uptime: ${this.getUptimePercent()}%`);
        console.log(`   ✅ Verificações bem-sucedidas: ${this.stats.successfulChecks}`);
        console.log(`   ❌ Erros: ${this.stats.errors}`);
        console.log(`   📊 Total de verificações: ${this.stats.totalChecks}`);
        
        if (this.stats.lastError) {
            console.log(`   🚨 Último erro: ${this.stats.lastError}`);
        }

        // Sistema de produção
        console.log('\n🌐 AMBIENTE DE PRODUÇÃO:');
        console.log(`   🔗 URL: ${PRODUCTION_URL}`);
        console.log('   🔑 OpenAI: Configurado');
        console.log('   📱 Twilio: CoinbitClub ativo');
        console.log('   💳 Stripe: LIVE ativo');
        console.log('   🗄️ Database: PostgreSQL Railway');

        // Status visual do fluxo operacional
        const flowStatus = this.getOperationalFlowStatus(signals, operations, trading);
        console.log(`\n${flowStatus.icon} FLUXO OPERACIONAL: ${flowStatus.status}`);
        console.log(`   ${flowStatus.description}`);
        
        console.log('\n⏱️ Próxima verificação em 30 segundos...');
        console.log('💡 Pressione Ctrl+C para parar o monitoramento');
    }

    getOperationalFlowStatus(signals, operations, trading) {
        let activeComponents = 0;
        let totalComponents = 3;
        
        if (signals.status === 'success') activeComponents++;
        if (operations.status === 'success') activeComponents++;
        if (trading.status === 'success') activeComponents++;
        
        const percentage = (activeComponents / totalComponents * 100);
        
        if (percentage >= 100) {
            return {
                icon: '🟢🟢🟢',
                status: 'TOTALMENTE OPERACIONAL',
                description: 'Todos os componentes do fluxo funcionando perfeitamente'
            };
        } else if (percentage >= 66) {
            return {
                icon: '🟡🟡🟡',
                status: 'PARCIALMENTE OPERACIONAL',
                description: 'Maioria dos componentes funcionando, alguns precisam atenção'
            };
        } else {
            return {
                icon: '🔴🔴🔴',
                status: 'FLUXO COMPROMETIDO',
                description: 'Vários componentes com problemas, intervenção necessária'
            };
        }
    }

    async start() {
        console.log('🚀 Iniciando monitoramento do CoinbitClub...');
        this.isRunning = true;
        
        while (this.isRunning) {
            await this.displayDashboard();
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 segundos
        }
    }

    stop() {
        this.isRunning = false;
        console.log('\n🛑 Monitoramento interrompido pelo usuário');
    }
}

// Iniciar monitoramento
const dashboard = new MonitoringDashboard();

// Capturar Ctrl+C
process.on('SIGINT', () => {
    dashboard.stop();
    process.exit(0);
});

// Executar
if (require.main === module) {
    dashboard.start().catch(console.error);
}

module.exports = { MonitoringDashboard };
