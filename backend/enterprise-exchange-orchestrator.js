#!/usr/bin/env node

/**
 * 🎯 ENTERPRISE EXCHANGE ORCHESTRATOR - VERSÃO CORRIGIDA
 * =====================================================
 * 
 * Orquestrador inteligente que coordena automaticamente todas as operações
 * com exchanges usando chaves válidas da tabela user_api_keys
 */

const { Pool } = require('pg');
const EnterpriseExchangeConnector = require('./enterprise-exchange-connector');

class EnterpriseExchangeOrchestrator {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.connector = new EnterpriseExchangeConnector();
        
        // Estado do orquestrador
        this.orchestratorState = {
            activeUsers: new Map(),
            exchangeHealth: {
                binance_mainnet: { status: 'unknown', lastCheck: null },
                binance_testnet: { status: 'unknown', lastCheck: null },
                bybit_mainnet: { status: 'unknown', lastCheck: null },
                bybit_testnet: { status: 'unknown', lastCheck: null }
            },
            globalStats: {
                totalUsers: 0,
                connectedUsers: 0,
                totalBalance: 0,
                activePositions: 0
            },
            isRunning: false
        };

        // Configurações enterprise
        this.config = {
            healthCheckInterval: 5 * 60 * 1000,    // 5 minutos
            autoRecoveryInterval: 2 * 60 * 1000,   // 2 minutos  
            balanceUpdateInterval: 2 * 60 * 1000   // 2 minutos
        };

        console.log('🎯 Enterprise Exchange Orchestrator inicializado');
    }

    /**
     * 🚀 INICIAR ORQUESTRADOR ENTERPRISE
     */
    async start() {
        if (this.orchestratorState.isRunning) {
            console.log('⚠️ Orquestrador já está rodando');
            return;
        }

        console.log('🚀 INICIANDO ORQUESTRADOR ENTERPRISE...');
        console.log('=====================================');

        try {
            const result = await this.initialize();
            console.log('✅ ORQUESTRADOR ENTERPRISE INICIADO COM SUCESSO');
            return result;

        } catch (error) {
            console.error('❌ Erro ao iniciar orquestrador enterprise:', error.message);
            throw error;
        }
    }

    /**
     * 🚀 INICIALIZAÇÃO COMPLETA
     */
    async initialize() {
        try {
            console.log('\n🎯 INICIALIZANDO ENTERPRISE EXCHANGE ORCHESTRATOR');
            console.log('================================================');

            await this.loadActiveUsers();
            await this.connectAllExchanges();
            await this.updateGlobalStatistics();
            
            this.startContinuousMonitoring();
            this.startAutoRecovery();
            this.startBalanceMonitoring();

            this.orchestratorState.isRunning = true;
            console.log('\n✅ ORCHESTRATOR ENTERPRISE TOTALMENTE OPERACIONAL');
            
            return {
                success: true,
                totalUsers: this.orchestratorState.globalStats.totalUsers,
                connectedUsers: this.orchestratorState.globalStats.connectedUsers
            };

        } catch (error) {
            console.error('❌ Erro na inicialização do orchestrator:', error.message);
            throw error;
        }
    }

    /**
     * 👥 CARREGAMENTO DE USUÁRIOS ATIVOS
     */
    async loadActiveUsers() {
        console.log('\n👥 Carregando usuários ativos...');

        try {
            // 🔄 BUSCAR USUÁRIOS COM CHAVES VÁLIDAS NA TABELA user_api_keys
            const result = await this.pool.query(`
                SELECT DISTINCT
                    u.id, u.username, u.email, u.plan_type, u.is_active,
                    u.exchange_auto_trading, u.exchange_testnet_mode,
                    k.exchange, k.api_key, k.api_secret, k.validation_status
                FROM users u 
                JOIN user_api_keys k ON u.id = k.user_id 
                WHERE u.is_active = true 
                AND k.is_active = true
                AND k.validation_status = 'working'
                ORDER BY u.id, k.exchange
            `);

            // 🔄 AGRUPAR USUÁRIOS POR ID E ORGANIZAR SUAS CHAVES
            const usersMap = new Map();
            
            for (const row of result.rows) {
                if (!usersMap.has(row.id)) {
                    usersMap.set(row.id, {
                        id: row.id,
                        username: row.username,
                        email: row.email,
                        plan_type: row.plan_type,
                        is_active: row.is_active,
                        exchange_auto_trading: row.exchange_auto_trading,
                        exchange_testnet_mode: row.exchange_testnet_mode,
                        exchanges: new Map(),
                        connections: new Map(),
                        lastHealthCheck: null,
                        balanceHistory: [],
                        status: 'pending_connection'
                    });
                }
                
                // Adicionar chaves da exchange
                const user = usersMap.get(row.id);
                user.exchanges.set(row.exchange, {
                    api_key: row.api_key,
                    api_secret: row.api_secret,
                    validation_status: row.validation_status
                });
            }

            // Transferir para activeUsers
            this.orchestratorState.globalStats.totalUsers = usersMap.size;
            
            for (const [userId, userData] of usersMap) {
                this.orchestratorState.activeUsers.set(userId, userData);
                console.log(`👤 Usuário carregado: ${userId} (${userData.username || userData.email})`);
                
                // Log das exchanges disponíveis
                for (const [exchange, keys] of userData.exchanges) {
                    console.log(`   📈 ${exchange.toUpperCase()}: ${keys.validation_status}`);
                }
            }

            console.log(`✅ ${usersMap.size} usuários carregados com ${result.rows.length} chaves válidas`);

        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error.message);
            throw error;
        }
    }

    /**
     * 🔗 CONECTAR TODAS AS EXCHANGES
     */
    async connectAllExchanges() {
        console.log('\n🔗 Conectando exchanges para todos os usuários...');

        let successfulConnections = 0;

        for (const [userId, userData] of this.orchestratorState.activeUsers) {
            console.log(`\n🔌 Conectando usuário ${userId}...`);

            try {
                // Conectar cada exchange disponível para este usuário
                for (const [exchangeName, exchangeKeys] of userData.exchanges) {
                    console.log(`  🔗 Testando conexão ${exchangeName.toUpperCase()}...`);
                    
                    const connection = await this.connector.connectAndValidateExchange(
                        userId,
                        exchangeKeys.api_key,
                        exchangeKeys.api_secret,
                        exchangeName
                    );

                    if (connection.success) {
                        userData.connections.set(exchangeName, connection);
                        console.log(`  ✅ ${exchangeName.toUpperCase()}: ${connection.exchangeName}`);
                        successfulConnections++;
                    } else {
                        console.log(`  ❌ ${exchangeName.toUpperCase()}: ${connection.error}`);
                    }
                }

                // Atualizar status do usuário
                if (userData.connections.size > 0) {
                    userData.status = 'connected';
                    console.log(`  ✅ Usuário ${userId} conectado com ${userData.connections.size} exchange(s)`);
                } else {
                    userData.status = 'connection_failed';
                    console.log(`  ❌ Usuário ${userId} falhou em todas as conexões`);
                }

            } catch (error) {
                userData.status = 'error';
                console.log(`  ❌ Erro ao conectar usuário ${userId}: ${error.message}`);
            }
        }

        console.log(`\n✅ Total de conexões bem-sucedidas: ${successfulConnections}`);
        this.orchestratorState.globalStats.connectedUsers = Array.from(this.orchestratorState.activeUsers.values())
            .filter(user => user.status === 'connected').length;

        return { successfulConnections, totalUsers: this.orchestratorState.globalStats.totalUsers };
    }

    /**
     * 📊 ATUALIZAR ESTATÍSTICAS GLOBAIS
     */
    async updateGlobalStatistics() {
        try {
            // Contar usuários conectados
            this.orchestratorState.globalStats.connectedUsers = 
                Array.from(this.orchestratorState.activeUsers.values())
                    .filter(user => user.status === 'connected').length;

            console.log(`📊 Estatísticas atualizadas: ${this.orchestratorState.globalStats.connectedUsers}/${this.orchestratorState.globalStats.totalUsers} usuários conectados`);

        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas:', error.message);
        }
    }

    /**
     * 🔄 MONITORAMENTO CONTÍNUO
     */
    startContinuousMonitoring() {
        console.log('🔄 Iniciando monitoramento contínuo...');
        
        setInterval(async () => {
            try {
                await this.performHealthCheckAllExchanges();
                await this.updateGlobalStatistics();
            } catch (error) {
                console.error('❌ Erro no monitoramento:', error.message);
            }
        }, this.config.healthCheckInterval);
    }

    /**
     * 🏥 VERIFICAÇÃO DE SAÚDE DAS EXCHANGES
     */
    async performHealthCheckAllExchanges() {
        console.log('\n🏥 Verificando saúde de todas as exchanges...');

        for (const [userId, userData] of this.orchestratorState.activeUsers) {
            if (userData.status === 'connected') {
                for (const [exchangeName, connection] of userData.connections) {
                    try {
                        await this.checkExchangeHealth(connection.exchange, connection.environment);
                        userData.lastHealthCheck = new Date();
                    } catch (error) {
                        console.log(`⚠️ Health check falhou para ${exchangeName} do usuário ${userId}: ${error.message}`);
                        userData.status = 'connection_failed';
                    }
                }
            }
        }
    }

    /**
     * 🔧 AUTO-RECOVERY
     */
    startAutoRecovery() {
        console.log('🔧 Iniciando sistema de auto-recovery...');
        
        setInterval(async () => {
            try {
                await this.performAutoRecovery();
            } catch (error) {
                console.error('❌ Erro no auto-recovery:', error.message);
            }
        }, this.config.autoRecoveryInterval);
    }

    /**
     * 🛠️ EXECUTAR AUTO-RECOVERY
     */
    async performAutoRecovery() {
        console.log('\n🛠️ Executando auto-recovery...');

        let recoveryAttempts = 0;

        for (const [userId, userData] of this.orchestratorState.activeUsers) {
            if (userData.status === 'connection_failed' || userData.status === 'error') {
                console.log(`🛠️ Tentando recovery para usuário ${userId}...`);

                try {
                    // Limpar conexões antigas
                    userData.connections.clear();

                    // Tentar reconectar cada exchange
                    for (const [exchangeName, exchangeKeys] of userData.exchanges) {
                        const connection = await this.connector.connectAndValidateExchange(
                            userId,
                            exchangeKeys.api_key,
                            exchangeKeys.api_secret,
                            exchangeName
                        );

                        if (connection.success) {
                            userData.connections.set(exchangeName, connection);
                            console.log(`  ✅ Recovery ${exchangeName.toUpperCase()}: ${connection.exchangeName}`);
                        }
                    }

                    // Atualizar status
                    if (userData.connections.size > 0) {
                        userData.status = 'connected';
                        console.log(`  ✅ Recovery bem-sucedido para usuário ${userId}`);
                        recoveryAttempts++;
                    }

                } catch (error) {
                    console.log(`  ❌ Recovery falhou para usuário ${userId}: ${error.message}`);
                }
            }
        }

        if (recoveryAttempts > 0) {
            console.log(`🛠️ Auto-recovery concluído: ${recoveryAttempts} conexões recuperadas`);
            await this.updateGlobalStatistics();
        }
    }

    /**
     * 💰 MONITORAMENTO DE SALDOS
     */
    startBalanceMonitoring() {
        console.log('💰 Iniciando monitoramento de saldos...');
        
        setInterval(async () => {
            try {
                await this.updateAllUserBalances();
            } catch (error) {
                console.error('❌ Erro no monitoramento de saldos:', error.message);
            }
        }, this.config.balanceUpdateInterval);
    }

    /**
     * 📊 ATUALIZAR SALDOS DE TODOS OS USUÁRIOS
     */
    async updateAllUserBalances() {
        for (const [userId, userData] of this.orchestratorState.activeUsers) {
            if (userData.status === 'connected') {
                for (const [exchangeName, connection] of userData.connections) {
                    try {
                        const balances = await connection.exchange.fetchBalance();
                        
                        // Salvar no histórico
                        userData.balanceHistory.push({
                            timestamp: new Date(),
                            exchange: exchangeName,
                            balances: balances
                        });

                        // Manter apenas os últimos 10 registros
                        if (userData.balanceHistory.length > 10) {
                            userData.balanceHistory = userData.balanceHistory.slice(-10);
                        }

                    } catch (error) {
                        console.log(`⚠️ Erro ao atualizar saldo ${exchangeName} do usuário ${userId}: ${error.message}`);
                    }
                }
            }
        }
    }

    /**
     * 🎯 OBTER USUÁRIO PARA TRADING
     */
    async getUserForTrading(userId) {
        const userData = this.orchestratorState.activeUsers.get(userId);
        
        if (!userData) {
            return {
                success: false,
                error: 'USER_NOT_FOUND',
                message: 'Usuário não encontrado no orquestrador'
            };
        }

        if (userData.status !== 'connected' || userData.connections.size === 0) {
            return {
                success: false,
                error: 'USER_NOT_CONNECTED',
                message: 'Usuário não possui conexões ativas'
            };
        }

        // Retornar todas as conexões disponíveis
        const availableExchanges = Array.from(userData.connections.entries()).map(([name, connection]) => ({
            name: name,
            exchange: connection.exchange,
            environment: connection.environment
        }));

        return {
            success: true,
            user: userData,
            exchanges: availableExchanges,
            totalConnections: userData.connections.size
        };
    }

    /**
     * 📊 OBTER ESTATÍSTICAS DO SISTEMA
     */
    getSystemStats() {
        return {
            ...this.orchestratorState.globalStats,
            isRunning: this.orchestratorState.isRunning,
            exchangeHealth: this.orchestratorState.exchangeHealth,
            users: Array.from(this.orchestratorState.activeUsers.entries()).map(([id, userData]) => ({
                id: id,
                username: userData.username,
                email: userData.email,
                status: userData.status,
                exchanges: Array.from(userData.exchanges.keys()),
                connections: Array.from(userData.connections.keys()),
                lastHealthCheck: userData.lastHealthCheck
            }))
        };
    }

    /**
     * 🏥 VERIFICAR SAÚDE DE UMA EXCHANGE
     */
    async checkExchangeHealth(exchange, environment) {
        try {
            await exchange.fetchTicker('BTC/USDT');
            return { healthy: true, timestamp: new Date() };
        } catch (error) {
            throw new Error(`Exchange health check failed: ${error.message}`);
        }
    }

    /**
     * 🔌 DESCONECTAR TUDO
     */
    async shutdown() {
        console.log('🔌 Desconectando Enterprise Exchange Orchestrator...');
        
        this.orchestratorState.isRunning = false;
        
        for (const [userId, userData] of this.orchestratorState.activeUsers) {
            userData.connections.clear();
        }
        
        await this.pool.end();
        console.log('✅ Orchestrator desconectado');
    }
}

module.exports = EnterpriseExchangeOrchestrator;
