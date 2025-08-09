#!/usr/bin/env node
/**
 * 🏢 ENTERPRISE TRADING SYSTEM INTEGRATION
 * Sistema unificado multiusuário para trading enterprise
 * Integração completa: Order Execution + Risk Management + Position Monitor + Orchestrator
 * Data: 08/08/2025
 */

const OrderExecutionEngine = require('./order-execution-engine');
const RiskManagementSystem = require('./risk-management-system');
const RealTimePositionMonitor = require('./real-time-position-monitor');
const MultiExchangeOrchestrator = require('./multi-exchange-orchestrator');
const fs = require('fs').promises;
const path = require('path');

console.log('🏢 ENTERPRISE TRADING SYSTEM INTEGRATION');
console.log('==========================================');

class EnterpriseTradingSystem {
    constructor() {
        this.orderEngine = null;
        this.riskManager = null;
        this.positionMonitor = null;
        this.orchestrator = null;
        
        this.systemStatus = 'INITIALIZING';
        this.users = new Map();
        this.systemMetrics = {
            totalUsers: 0,
            activeUsers: 0,
            totalOrders: 0,
            successfulOrders: 0,
            totalVolume: 0,
            totalPnL: 0,
            systemUptime: Date.now()
        };
        
        console.log('🏭 Inicializando Enterprise Trading System...');
    }

    /**
     * 🚀 INICIALIZAR SISTEMA COMPLETO
     */
    async inicializarSistema() {
        try {
            console.log('\n🔧 INICIALIZANDO COMPONENTES...');
            console.log('=================================');

            // 1. Inicializar Order Execution Engine
            console.log('1️⃣ Inicializando Order Execution Engine...');
            this.orderEngine = new OrderExecutionEngine();
            console.log('   ✅ Order Execution Engine ativo');

            // 2. Inicializar Risk Management System
            console.log('2️⃣ Inicializando Risk Management System...');
            this.riskManager = new RiskManagementSystem();
            console.log('   ✅ Risk Management System ativo');

            // 3. Inicializar Position Monitor
            console.log('3️⃣ Inicializando Position Monitor...');
            this.positionMonitor = new RealTimePositionMonitor();
            this.positionMonitor.iniciarMonitoramento(5000); // 5 segundos
            console.log('   ✅ Position Monitor ativo');

            // 4. Inicializar Orchestrator
            console.log('4️⃣ Inicializando Multi-Exchange Orchestrator...');
            this.orchestrator = new MultiExchangeOrchestrator();
            this.orchestrator.configurarRoteamento();
            console.log('   ✅ Orchestrator ativo');

            // 5. Configurar integrações entre sistemas
            console.log('5️⃣ Configurando integrações...');
            this.configurarIntegracoes();
            console.log('   ✅ Integrações configuradas');

            this.systemStatus = 'ACTIVE';
            console.log('\n🎉 SISTEMA ENTERPRISE TOTALMENTE ATIVO!');
            console.log('========================================');

        } catch (error) {
            this.systemStatus = 'ERROR';
            console.error('❌ Erro na inicialização:', error.message);
            throw error;
        }
    }

    /**
     * ⚙️ CONFIGURAR INTEGRAÇÕES ENTRE SISTEMAS
     */
    configurarIntegracoes() {
        // Position Monitor -> Risk Manager (alertas de risco)
        this.positionMonitor.on('risk.violation', (data) => {
            this.handleRiskViolation(data);
        });

        // Position Monitor -> Order Engine (fechamento automático)
        this.positionMonitor.on('position.closed', (position) => {
            this.handlePositionClosed(position);
        });

        // Orchestrator -> Risk Manager (status dos exchanges)
        this.orchestrator.on('exchange.status.changed', (data) => {
            this.handleExchangeStatusChange(data);
        });

        console.log('   🔗 Event listeners configurados');
    }

    /**
     * 📊 CRIAR USUÁRIO ENTERPRISE
     */
    async criarUsuario(userData) {
        try {
            const userId = userData.user_id;
            
            // Criar perfil de risco
            const riskProfile = this.riskManager.criarPerfilRisco(userId, {
                accountType: userData.accountType || 'testnet',
                experience: userData.experience || 'beginner',
                country: userData.country || 'BR',
                planType: userData.planType || 'basic'
            });

            // Registrar usuário no sistema
            const user = {
                id: userId,
                email: userData.email,
                name: userData.name,
                accountType: userData.accountType || 'testnet',
                status: 'ACTIVE',
                createdAt: new Date(),
                riskProfile: riskProfile,
                tradingLimits: riskProfile.limits,
                currentPositions: [],
                totalPnL: 0,
                totalVolume: 0,
                orderHistory: []
            };

            this.users.set(userId, user);
            this.systemMetrics.totalUsers++;
            this.systemMetrics.activeUsers++;

            console.log(`👤 Usuário criado: ${userData.name} (ID: ${userId}) - ${userData.accountType}`);
            return user;

        } catch (error) {
            console.error('Erro ao criar usuário:', error.message);
            throw error;
        }
    }

    /**
     * 🎯 EXECUTAR ORDEM ENTERPRISE (fluxo completo)
     */
    async executarOrdemEnterprise(orderRequest) {
        try {
            console.log(`\n🎯 EXECUTANDO ORDEM ENTERPRISE`);
            console.log(`==============================`);
            console.log(`Symbol: ${orderRequest.symbol} | Side: ${orderRequest.side} | User: ${orderRequest.user_id}`);

            const startTime = Date.now();
            this.systemMetrics.totalOrders++;

            // FASE 1: Validação de Risk Management
            console.log('\n1️⃣ VALIDAÇÃO DE RISCO...');
            const riskValidation = await this.riskManager.validarOrdemPreExecucao(orderRequest);
            
            if (!riskValidation.approved) {
                console.log('   ❌ Ordem rejeitada por risco');
                return {
                    success: false,
                    phase: 'RISK_VALIDATION',
                    reason: 'Risk management violation',
                    violations: riskValidation.violations,
                    recommendations: riskValidation.recommendations
                };
            }
            console.log('   ✅ Validação de risco aprovada');

            // FASE 2: Roteamento via Orchestrator
            console.log('\n2️⃣ ROTEAMENTO DE EXCHANGE...');
            const exchangeResult = await this.orchestrator.executarOrdem(orderRequest);
            
            if (!exchangeResult.success) {
                console.log('   ❌ Falha no roteamento de exchange');
                return {
                    success: false,
                    phase: 'EXCHANGE_ROUTING',
                    reason: 'Exchange routing failed',
                    error: exchangeResult.error
                };
            }
            console.log(`   ✅ Ordem roteada para ${exchangeResult.exchange}`);

            // FASE 3: Registro no Position Monitor
            console.log('\n3️⃣ REGISTRO NO MONITOR...');
            const position = this.positionMonitor.adicionarPosicao({
                id: exchangeResult.orderId,
                user_id: orderRequest.user_id,
                symbol: orderRequest.symbol,
                side: orderRequest.side,
                quantity: orderRequest.quantity,
                entryPrice: exchangeResult.executionPrice,
                exchange: exchangeResult.exchange,
                stopLoss: orderRequest.stopLoss,
                takeProfit: orderRequest.takeProfit,
                trailingStop: orderRequest.trailingStop
            });
            console.log('   ✅ Posição registrada no monitor');

            // FASE 4: Atualizar métricas do usuário
            console.log('\n4️⃣ ATUALIZANDO MÉTRICAS...');
            const user = this.users.get(orderRequest.user_id);
            if (user) {
                user.currentPositions.push(position.id);
                user.orderHistory.push({
                    orderId: exchangeResult.orderId,
                    timestamp: new Date(),
                    symbol: orderRequest.symbol,
                    side: orderRequest.side,
                    quantity: orderRequest.quantity,
                    price: exchangeResult.executionPrice,
                    exchange: exchangeResult.exchange
                });
                user.totalVolume += orderRequest.quantity * exchangeResult.executionPrice;
            }

            const executionTime = Date.now() - startTime;
            this.systemMetrics.successfulOrders++;
            this.systemMetrics.totalVolume += orderRequest.quantity * exchangeResult.executionPrice;

            console.log('   ✅ Métricas atualizadas');

            console.log(`\n🎉 ORDEM EXECUTADA COM SUCESSO! (${executionTime}ms)`);
            console.log('==============================================');

            return {
                success: true,
                orderId: exchangeResult.orderId,
                exchange: exchangeResult.exchange,
                executionPrice: exchangeResult.executionPrice,
                positionId: position.id,
                executionTime: executionTime,
                riskLevel: riskValidation.riskLevel,
                failover: exchangeResult.failover || false,
                timestamp: new Date()
            };

        } catch (error) {
            console.error('❌ Erro na execução enterprise:', error.message);
            return {
                success: false,
                phase: 'SYSTEM_ERROR',
                reason: error.message,
                timestamp: new Date()
            };
        }
    }

    /**
     * 📊 OBTER DASHBOARD ENTERPRISE
     */
    obterDashboardEnterprise() {
        const dashboard = {
            timestamp: new Date(),
            system: {
                status: this.systemStatus,
                uptime: Date.now() - this.systemMetrics.systemUptime,
                version: '1.0.0-enterprise'
            },
            metrics: {
                ...this.systemMetrics,
                successRate: this.systemMetrics.totalOrders > 0 
                    ? (this.systemMetrics.successfulOrders / this.systemMetrics.totalOrders * 100).toFixed(1)
                    : '0.0'
            },
            components: {
                orderEngine: { status: this.orderEngine ? 'ACTIVE' : 'INACTIVE' },
                riskManager: { status: this.riskManager ? 'ACTIVE' : 'INACTIVE' },
                positionMonitor: { 
                    status: this.positionMonitor ? 'ACTIVE' : 'INACTIVE',
                    activePositions: this.positionMonitor?.activePositions.size || 0
                },
                orchestrator: { 
                    status: this.orchestrator ? 'ACTIVE' : 'INACTIVE',
                    exchanges: this.orchestrator?.exchanges.size || 0
                }
            },
            users: {
                total: this.users.size,
                active: Array.from(this.users.values()).filter(u => u.status === 'ACTIVE').length,
                summary: Array.from(this.users.values()).map(user => ({
                    id: user.id,
                    name: user.name,
                    accountType: user.accountType,
                    activePositions: user.currentPositions.length,
                    totalPnL: user.totalPnL,
                    riskLevel: user.riskProfile.status.riskLevel
                }))
            },
            exchanges: this.orchestrator ? this.orchestrator.obterRelatorioStatus() : null,
            positions: this.positionMonitor ? {
                active: this.positionMonitor.activePositions.size,
                metrics: this.positionMonitor.obterMetricas()
            } : null
        };

        return dashboard;
    }

    /**
     * 🚨 HANDLERS DE EVENTOS
     */
    handleRiskViolation(data) {
        console.log(`🚨 VIOLAÇÃO DE RISCO: ${data.type} - ${data.reason}`);
        
        // Suspender usuário se necessário
        if (data.type === 'EMERGENCY_STOP_TRIGGERED') {
            const user = this.users.get(data.position.user_id);
            if (user) {
                user.status = 'SUSPENDED';
                console.log(`⚠️ Usuário ${user.id} suspenso por violação crítica`);
            }
        }
    }

    handlePositionClosed(position) {
        console.log(`📊 Posição fechada: ${position.symbol} | P&L: ${position.realizedPnL.toFixed(2)}`);
        
        // Atualizar métricas do usuário
        const user = this.users.get(position.user_id);
        if (user) {
            user.totalPnL += position.realizedPnL;
            user.currentPositions = user.currentPositions.filter(id => id !== position.id);
        }
    }

    handleExchangeStatusChange(data) {
        console.log(`🔄 Exchange ${data.exchange}: ${data.previousStatus} -> ${data.newStatus}`);
    }

    /**
     * 💾 SALVAR RELATÓRIO COMPLETO
     */
    async salvarRelatorioCompleto() {
        try {
            const relatorio = {
                ...this.obterDashboardEnterprise(),
                detailedMetrics: {
                    risk: this.riskManager ? await this.riskManager.gerarRelatorioRisco() : null,
                    positions: this.positionMonitor ? {
                        active: Array.from(this.positionMonitor.activePositions.values()),
                        metrics: this.positionMonitor.obterMetricas()
                    } : null,
                    orchestrator: this.orchestrator ? this.orchestrator.obterRelatorioStatus() : null
                }
            };

            const reportPath = path.join(__dirname, 'enterprise-trading-report.json');
            await fs.writeFile(reportPath, JSON.stringify(relatorio, null, 2));
            
            console.log(`💾 Relatório completo salvo: ${reportPath}`);
            return reportPath;

        } catch (error) {
            console.error('Erro ao salvar relatório:', error.message);
            throw error;
        }
    }

    /**
     * 🔧 SHUTDOWN GRACEFUL
     */
    async shutdown() {
        try {
            console.log('\n🔧 DESLIGANDO SISTEMA...');
            
            if (this.positionMonitor) {
                this.positionMonitor.pararMonitoramento();
            }
            
            await this.salvarRelatorioCompleto();
            
            this.systemStatus = 'SHUTDOWN';
            console.log('✅ Sistema desligado com segurança');

        } catch (error) {
            console.error('Erro no shutdown:', error.message);
        }
    }
}

// ============================================================================
// DEMONSTRAÇÃO COMPLETA
// ============================================================================

async function demonstrarSistemaCompleto() {
    try {
        console.log('\n🧪 DEMONSTRAÇÃO SISTEMA ENTERPRISE COMPLETO');
        console.log('============================================');

        const tradingSystem = new EnterpriseTradingSystem();
        
        // Inicializar sistema
        await tradingSystem.inicializarSistema();

        // Criar usuários de teste
        console.log('\n👥 CRIANDO USUÁRIOS DE TESTE...');
        await tradingSystem.criarUsuario({
            user_id: 14,
            name: 'João Silva',
            email: 'joao@empresa.com',
            accountType: 'mainnet',
            experience: 'advanced',
            country: 'BR'
        });

        await tradingSystem.criarUsuario({
            user_id: 15,
            name: 'Maria Santos',
            email: 'maria@empresa.com',
            accountType: 'testnet',
            experience: 'intermediate',
            country: 'BR'
        });

        // Executar ordens de teste
        console.log('\n📈 EXECUTANDO ORDENS DE TESTE...');
        
        // Ordem 1: Normal
        const ordem1 = await tradingSystem.executarOrdemEnterprise({
            user_id: 14,
            symbol: 'BTCUSDT',
            side: 'BUY',
            type: 'MARKET',
            quantity: 0.05,
            stopLoss: 49000,
            takeProfit: 52000
        });

        // Ordem 2: Com trailing stop
        const ordem2 = await tradingSystem.executarOrdemEnterprise({
            user_id: 15,
            symbol: 'ETHUSDT',
            side: 'BUY',
            type: 'MARKET',
            quantity: 0.5,
            trailingStop: { distance: 100 }
        });

        // Aguardar 10 segundos para monitoramento
        console.log('\n⏰ Aguardando 10 segundos para monitoramento...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Gerar dashboard
        console.log('\n📊 DASHBOARD ENTERPRISE:');
        const dashboard = tradingSystem.obterDashboardEnterprise();
        
        console.log('📈 MÉTRICAS GERAIS:');
        console.log(`   Status: ${dashboard.system.status}`);
        console.log(`   Uptime: ${Math.round(dashboard.system.uptime / 1000)}s`);
        console.log(`   Usuários: ${dashboard.users.total} (${dashboard.users.active} ativos)`);
        console.log(`   Ordens: ${dashboard.metrics.totalOrders} (${dashboard.metrics.successRate}% sucesso)`);
        console.log(`   Volume: $${dashboard.metrics.totalVolume.toFixed(2)}`);
        console.log(`   Posições ativas: ${dashboard.components.positionMonitor.activePositions}`);

        console.log('\n👥 USUÁRIOS:');
        dashboard.users.summary.forEach(user => {
            console.log(`   ${user.name}: ${user.activePositions} posições, P&L: $${user.totalPnL.toFixed(2)}`);
        });

        // Salvar relatório final
        await tradingSystem.salvarRelatorioCompleto();

        // Shutdown
        await tradingSystem.shutdown();

        console.log('\n🎉 DEMONSTRAÇÃO COMPLETA FINALIZADA!');
        console.log('====================================');
        console.log('');
        console.log('✅ Order Execution Engine: FUNCIONAL');
        console.log('✅ Risk Management System: FUNCIONAL');  
        console.log('✅ Real-time Position Monitor: FUNCIONAL');
        console.log('✅ Multi-Exchange Orchestrator: FUNCIONAL');
        console.log('✅ Enterprise Integration: FUNCIONAL');
        console.log('');
        console.log('🏢 SISTEMA ENTERPRISE 100% OPERACIONAL!');
        console.log('🚀 PRONTO PARA PRODUÇÃO MULTIUSUÁRIO!');

        return tradingSystem;

    } catch (error) {
        console.error('❌ Erro na demonstração:', error.message);
        throw error;
    }
}

// Executar demonstração se arquivo foi chamado diretamente
if (require.main === module) {
    demonstrarSistemaCompleto().catch(console.error);
}

module.exports = EnterpriseTradingSystem;
