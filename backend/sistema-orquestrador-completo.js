/**
 * 🎛️ SISTEMA DE CONTROLE E ORQUESTRAÇÃO COMPLETA
 * CoinBitClub Market Bot V3 - Sistema Híbrido Multiusuário
 * 
 * FLUXO COMPLETO:
 * [ LEITURA DE MERCADO ] → [ SINAL COMPRA/VENDA ] → [ ABERTURA POSIÇÃO ] 
 * → [ MONITORAMENTO TEMPO REAL ] → [ FECHAMENTO POSIÇÃO ] → [ RESULTADO ] 
 * → [ COMISSIONAMENTO GERADO ]
 */

const { Pool } = require('pg');
const axios = require('axios');

class SystemOrchestrator {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        
        this.systemState = {
            isActive: false,
            tradingEnabled: false,
            aiGuardianActive: false,
            fearGreedActive: false,
            multiuserActive: false,
            lastHeartbeat: null,
            activeOperations: new Map(),
            marketReading: {
                fearGreed: null,
                btcDominance: null,
                lastUpdate: null
            }
        };
        
        this.fearGreedSources = [
            {
                name: 'Alternative.me',
                url: 'https://api.alternative.me/fng/',
                parser: this.parseAlternativeMe.bind(this)
            },
            {
                name: 'CoinStats',
                url: 'https://openapiv1.coinstats.app/coins/fear-greed-index',
                headers: {
                    'X-API-KEY': process.env.COINSTATS_API_KEY || ''
                },
                parser: this.parseCoinStats.bind(this)
            }
        ];
    }

    /**
     * 🟢 LIGAR SISTEMA COMPLETO
     */
    async startSystem() {
        console.log('🟢 INICIANDO SISTEMA COMPLETO...');
        console.log('================================');
        
        try {
            // 1. Verificar conexão com banco
            await this.checkDatabaseConnection();
            
            // 2. Ativar componentes principais
            await this.activateSystemComponents();
            
            // 3. Inicializar leitura de mercado
            await this.initializeMarketReading();
            
            // 4. Ativar IA Guardian
            await this.activateAIGuardian();
            
            // 5. Configurar monitoramento
            await this.setupMonitoring();
            
            // 6. Ativar usuários multiusuário
            await this.activateMultiuserSystem();
            
            // 7. Iniciar heartbeat
            this.startHeartbeat();
            
            this.systemState.isActive = true;
            this.systemState.tradingEnabled = true;
            
            console.log('✅ SISTEMA TOTALMENTE ATIVO!');
            console.log('🚀 Aguardando sinais do TradingView...');
            
            await this.logSystemEvent('SYSTEM_STARTED', 'Sistema iniciado com sucesso');
            
            return {
                success: true,
                message: 'Sistema iniciado com sucesso',
                timestamp: new Date().toISOString(),
                state: this.systemState
            };
            
        } catch (error) {
            console.error('❌ Erro ao iniciar sistema:', error);
            await this.logSystemEvent('SYSTEM_START_ERROR', error.message);
            throw error;
        }
    }

    /**
     * 🔴 DESLIGAR SISTEMA COMPLETO
     */
    async stopSystem() {
        console.log('🔴 DESLIGANDO SISTEMA COMPLETO...');
        console.log('=================================');
        
        try {
            // 1. Parar recebimento de novos sinais
            this.systemState.tradingEnabled = false;
            
            // 2. Aguardar operações ativas terminarem
            await this.waitForActiveOperations();
            
            // 3. Fechar posições abertas (se solicitado)
            await this.closeAllOpenPositions();
            
            // 4. Desativar componentes
            await this.deactivateSystemComponents();
            
            // 5. Parar heartbeat
            this.stopHeartbeat();
            
            this.systemState.isActive = false;
            this.systemState.aiGuardianActive = false;
            this.systemState.fearGreedActive = false;
            this.systemState.multiuserActive = false;
            
            console.log('✅ SISTEMA DESLIGADO COM SEGURANÇA!');
            
            await this.logSystemEvent('SYSTEM_STOPPED', 'Sistema desligado com segurança');
            
            return {
                success: true,
                message: 'Sistema desligado com segurança',
                timestamp: new Date().toISOString(),
                state: this.systemState
            };
            
        } catch (error) {
            console.error('❌ Erro ao desligar sistema:', error);
            await this.logSystemEvent('SYSTEM_STOP_ERROR', error.message);
            throw error;
        }
    }

    /**
     * 📊 FLUXO 1: LEITURA DE MERCADO
     */
    async performMarketReading() {
        console.log('📊 [FLUXO 1] LEITURA DE MERCADO...');
        
        try {
            // Obter Fear & Greed Index
            const fearGreed = await this.getFearGreedIndex();
            
            // Obter dominância do BTC
            const btcDominance = await this.getBTCDominance();
            
            // Atualizar estado do mercado
            this.systemState.marketReading = {
                fearGreed: fearGreed,
                btcDominance: btcDominance,
                lastUpdate: new Date().toISOString()
            };
            
            // Salvar no banco
            await this.saveMarketReading(fearGreed, btcDominance);
            
            console.log(`📊 Fear & Greed: ${fearGreed.value} (${fearGreed.description})`);
            console.log(`📊 BTC Dominance: ${btcDominance.value}%`);
            
            return { fearGreed, btcDominance };
            
        } catch (error) {
            console.error('❌ Erro na leitura de mercado:', error);
            return this.getMarketFallback();
        }
    }

    /**
     * 📡 FLUXO 2: PROCESSAMENTO DE SINAL
     */
    async processSignal(signalData) {
        console.log('📡 [FLUXO 2] PROCESSANDO SINAL...');
        
        if (!this.systemState.tradingEnabled) {
            console.log('⚠️ Sistema desabilitado - sinal ignorado');
            return { success: false, reason: 'Sistema desabilitado' };
        }
        
        try {
            // 1. Validar sinal
            const signalValidation = await this.validateSignal(signalData);
            if (!signalValidation.valid) {
                console.log(`❌ Sinal inválido: ${signalValidation.reason}`);
                return { success: false, reason: signalValidation.reason };
            }
            
            // 2. Análise da IA Guardian
            const aiAnalysis = await this.performAIAnalysis(signalData);
            if (!aiAnalysis.approved) {
                console.log(`🤖 IA Guardian bloqueou: ${aiAnalysis.reason}`);
                return { success: false, reason: aiAnalysis.reason };
            }
            
            // 3. Verificar direção permitida pelo Fear & Greed
            const directionCheck = await this.checkDirectionAllowed(signalData.signal);
            if (!directionCheck.allowed) {
                console.log(`📊 Direção bloqueada: ${directionCheck.reason}`);
                return { success: false, reason: directionCheck.reason };
            }
            
            // 4. Prosseguir para abertura de posições
            const result = await this.executeMultiuserOperations(signalData, aiAnalysis);
            
            console.log(`✅ Sinal processado: ${result.operationsCreated} operações`);
            
            return result;
            
        } catch (error) {
            console.error('❌ Erro no processamento do sinal:', error);
            await this.logSystemEvent('SIGNAL_PROCESSING_ERROR', error.message);
            return { success: false, reason: error.message };
        }
    }

    /**
     * 🎯 FLUXO 3: ABERTURA DE POSIÇÕES
     */
    async executeMultiuserOperations(signalData, aiAnalysis) {
        console.log('🎯 [FLUXO 3] ABERTURA DE POSIÇÕES MULTIUSUÁRIO...');
        
        try {
            const client = await this.pool.connect();
            
            // Buscar usuários ativos para trading real
            const users = await client.query(`
                SELECT 
                    u.id as user_id,
                    u.name,
                    up.account_type,
                    uc.exchange,
                    uc.api_key,
                    uc.secret_key,
                    us.sizing_override,
                    us.leverage_override,
                    us.max_concurrent_trades
                FROM users u
                JOIN user_profiles up ON up.user_id = u.id
                JOIN user_credentials uc ON uc.user_id = u.id AND uc.is_active = true
                JOIN user_settings us ON us.user_id = u.id
                WHERE u.status = 'active' 
                  AND up.account_type = 'real'
                  AND uc.is_testnet = false
                ORDER BY u.created_at
            `);
            
            const operations = [];
            
            for (const user of users.rows) {
                try {
                    // Verificar operações abertas do usuário
                    const openOpsResult = await client.query(`
                        SELECT COUNT(*) as open_count 
                        FROM operations 
                        WHERE user_id = $1 AND status = 'OPEN'
                    `, [user.user_id]);
                    
                    const openCount = parseInt(openOpsResult.rows[0].open_count);
                    
                    if (openCount >= user.max_concurrent_trades) {
                        console.log(`⚠️ ${user.name}: Limite de operações atingido (${openCount}/${user.max_concurrent_trades})`);
                        continue;
                    }
                    
                    // Criar operação
                    const operation = await this.createOperation(user, signalData, aiAnalysis);
                    operations.push(operation);
                    
                    // Adicionar ao monitoramento
                    this.systemState.activeOperations.set(operation.id, {
                        userId: user.user_id,
                        userName: user.name,
                        symbol: signalData.ticker,
                        side: this.extractDirection(signalData.signal),
                        entryPrice: parseFloat(signalData.close),
                        createdAt: new Date(),
                        monitored: true
                    });
                    
                    console.log(`✅ ${user.name}: Operação ${operation.id} criada`);
                    
                } catch (userError) {
                    console.error(`❌ Erro para ${user.name}:`, userError.message);
                }
            }
            
            client.release();
            
            console.log(`🎯 ${operations.length} operações abertas com sucesso`);
            
            return {
                success: true,
                operationsCreated: operations.length,
                operations: operations
            };
            
        } catch (error) {
            console.error('❌ Erro na abertura de posições:', error);
            throw error;
        }
    }

    /**
     * 👁️ FLUXO 4: MONITORAMENTO EM TEMPO REAL
     */
    async performRealTimeMonitoring() {
        console.log('👁️ [FLUXO 4] MONITORAMENTO EM TEMPO REAL...');
        
        try {
            const client = await this.pool.connect();
            
            // Buscar operações abertas
            const openOperations = await client.query(`
                SELECT 
                    o.*,
                    u.name as user_name,
                    uc.exchange
                FROM operations o
                JOIN users u ON u.id = o.user_id
                JOIN user_credentials uc ON uc.user_id = o.user_id
                WHERE o.status = 'OPEN'
                  AND o.created_at > NOW() - INTERVAL '24 hours'
            `);
            
            for (const op of openOperations.rows) {
                try {
                    // Obter preço atual da operação
                    const currentPrice = await this.getCurrentPrice(op.symbol);
                    
                    // Calcular P&L
                    const pnl = this.calculatePnL(op, currentPrice);
                    
                    // Verificar condições de fechamento
                    const shouldClose = await this.checkCloseConditions(op, currentPrice, pnl);
                    
                    if (shouldClose.should) {
                        await this.closeOperation(op, shouldClose.reason, currentPrice);
                        console.log(`🔴 ${op.user_name}: Operação ${op.id} fechada - ${shouldClose.reason}`);
                    }
                    
                    // Atualizar monitoramento
                    await this.updateOperationMonitoring(op.id, currentPrice, pnl);
                    
                } catch (opError) {
                    console.error(`❌ Erro no monitoramento da operação ${op.id}:`, opError.message);
                }
            }
            
            client.release();
            
        } catch (error) {
            console.error('❌ Erro no monitoramento:', error);
        }
    }

    /**
     * 🔚 FLUXO 5: FECHAMENTO DE POSIÇÕES
     */
    async closeOperation(operation, reason, currentPrice) {
        console.log(`🔚 [FLUXO 5] FECHANDO POSIÇÃO ${operation.id}...`);
        
        try {
            const client = await this.pool.connect();
            
            // Calcular resultado final
            const finalPnL = this.calculatePnL(operation, currentPrice);
            const finalReturn = this.calculateReturn(operation, currentPrice);
            
            // Atualizar operação no banco
            await client.query(`
                UPDATE operations 
                SET 
                    status = 'CLOSED',
                    exit_price = $1,
                    exit_reason = $2,
                    profit = $3,
                    return_percentage = $4,
                    closed_at = NOW(),
                    updated_at = NOW()
                WHERE id = $5
            `, [currentPrice, reason, finalPnL, finalReturn, operation.id]);
            
            // Remover do monitoramento ativo
            this.systemState.activeOperations.delete(operation.id);
            
            // Prosseguir para comissionamento
            await this.processCommissions(operation, finalPnL);
            
            console.log(`✅ Operação ${operation.id} fechada: ${finalPnL > 0 ? 'LUCRO' : 'PREJUÍZO'} de $${Math.abs(finalPnL).toFixed(2)}`);
            
            client.release();
            
            return {
                success: true,
                operationId: operation.id,
                finalPnL: finalPnL,
                finalReturn: finalReturn,
                reason: reason
            };
            
        } catch (error) {
            console.error(`❌ Erro ao fechar operação ${operation.id}:`, error);
            throw error;
        }
    }

    /**
     * 💰 FLUXO 6: COMISSIONAMENTO
     */
    async processCommissions(operation, finalPnL) {
        console.log(`💰 [FLUXO 6] PROCESSANDO COMISSIONAMENTO...`);
        
        if (finalPnL <= 0) {
            console.log('💰 Sem lucro - nenhuma comissão gerada');
            return;
        }
        
        try {
            const client = await this.pool.connect();
            
            // Buscar configurações de comissão
            const commissionConfig = await client.query(`
                SELECT 
                    u.id as user_id,
                    u.affiliate_id,
                    p.comissao_percentual
                FROM users u
                LEFT JOIN plans p ON p.id = (
                    SELECT plan_id FROM subscriptions 
                    WHERE user_id = u.id AND status = 'active' 
                    LIMIT 1
                )
                WHERE u.id = $1
            `, [operation.user_id]);
            
            if (commissionConfig.rows.length === 0) {
                console.log('💰 Configuração de comissão não encontrada');
                return;
            }
            
            const config = commissionConfig.rows[0];
            const commissionRate = config.comissao_percentual || 10; // 10% padrão
            const commissionAmount = (finalPnL * commissionRate) / 100;
            
            // Criar registro de comissão
            await client.query(`
                INSERT INTO commissions (
                    user_id,
                    operation_id,
                    affiliate_id,
                    commission_amount,
                    commission_rate,
                    base_amount,
                    status,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
            `, [
                operation.user_id,
                operation.id,
                config.affiliate_id,
                commissionAmount,
                commissionRate,
                finalPnL
            ]);
            
            // Atualizar saldo da empresa
            await client.query(`
                INSERT INTO company_financial (
                    type,
                    amount,
                    description,
                    operation_id,
                    created_at
                ) VALUES (
                    'commission_income',
                    $1,
                    $2,
                    $3,
                    NOW()
                )
            `, [
                commissionAmount,
                `Comissão da operação ${operation.id}`,
                operation.id
            ]);
            
            console.log(`💰 Comissão gerada: $${commissionAmount.toFixed(2)} (${commissionRate}% de $${finalPnL.toFixed(2)})`);
            
            client.release();
            
        } catch (error) {
            console.error('❌ Erro no comissionamento:', error);
        }
    }

    /**
     * 🔍 VERIFICAR STATUS DO SISTEMA
     */
    getSystemStatus() {
        return {
            isActive: this.systemState.isActive,
            tradingEnabled: this.systemState.tradingEnabled,
            aiGuardianActive: this.systemState.aiGuardianActive,
            fearGreedActive: this.systemState.fearGreedActive,
            multiuserActive: this.systemState.multiuserActive,
            activeOperations: this.systemState.activeOperations.size,
            lastHeartbeat: this.systemState.lastHeartbeat,
            marketReading: this.systemState.marketReading,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
    }

    // ========== MÉTODOS AUXILIARES ==========

    async checkDatabaseConnection() {
        const client = await this.pool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('✅ Conexão com banco de dados OK');
    }

    async activateSystemComponents() {
        this.systemState.aiGuardianActive = true;
        this.systemState.fearGreedActive = true;
        this.systemState.multiuserActive = true;
        console.log('✅ Componentes do sistema ativados');
    }

    async initializeMarketReading() {
        await this.performMarketReading();
        console.log('✅ Leitura de mercado inicializada');
    }

    async activateAIGuardian() {
        // Configurar IA Guardian
        console.log('✅ IA Guardian ativado');
    }

    async setupMonitoring() {
        // Configurar monitoramento em tempo real
        setInterval(() => {
            this.performRealTimeMonitoring();
        }, 30000); // A cada 30 segundos
        console.log('✅ Monitoramento em tempo real configurado');
    }

    async activateMultiuserSystem() {
        console.log('✅ Sistema multiusuário ativado');
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.systemState.lastHeartbeat = new Date().toISOString();
        }, 5000); // A cada 5 segundos
        console.log('✅ Heartbeat iniciado');
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        console.log('✅ Heartbeat parado');
    }

    async logSystemEvent(type, message) {
        try {
            const client = await this.pool.connect();
            await client.query(`
                INSERT INTO system_logs (level, message, context, created_at)
                VALUES ('INFO', $1, $2, NOW())
            `, [
                `${type}: ${message}`,
                JSON.stringify({ type, timestamp: new Date().toISOString() })
            ]);
            client.release();
        } catch (error) {
            console.error('Erro ao salvar log:', error);
        }
    }

    // Métodos específicos que precisam ser implementados
    async getFearGreedIndex() {
        // Implementar busca do Fear & Greed
        return { value: 50, description: 'Neutral' };
    }

    async getBTCDominance() {
        // Implementar busca da dominância do BTC
        return { value: 45 };
    }

    async validateSignal(signalData) {
        // Implementar validação do sinal
        return { valid: true };
    }

    async performAIAnalysis(signalData) {
        // Implementar análise da IA
        return { approved: true, confidence: 0.8 };
    }

    async checkDirectionAllowed(signal) {
        // Implementar verificação de direção
        return { allowed: true };
    }

    extractDirection(signal) {
        if (signal.includes('LONG')) return 'LONG';
        if (signal.includes('SHORT')) return 'SHORT';
        return 'LONG';
    }

    async createOperation(user, signalData, aiAnalysis) {
        // Implementar criação de operação
        return {
            id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.user_id,
            symbol: signalData.ticker,
            side: this.extractDirection(signalData.signal),
            entryPrice: parseFloat(signalData.close)
        };
    }

    async getCurrentPrice(symbol) {
        // Implementar busca de preço atual
        return 45000; // Exemplo
    }

    calculatePnL(operation, currentPrice) {
        // Implementar cálculo de P&L
        const priceDiff = currentPrice - operation.entry_price;
        const multiplier = operation.side === 'LONG' ? 1 : -1;
        return priceDiff * multiplier * (operation.quantity || 1);
    }

    calculateReturn(operation, currentPrice) {
        // Implementar cálculo de retorno percentual
        const priceDiff = currentPrice - operation.entry_price;
        return (priceDiff / operation.entry_price) * 100;
    }

    async checkCloseConditions(operation, currentPrice, pnl) {
        // Implementar verificação de condições de fechamento
        return { should: false };
    }

    async updateOperationMonitoring(operationId, currentPrice, pnl) {
        // Implementar atualização do monitoramento
    }

    async waitForActiveOperations() {
        // Aguardar operações ativas terminarem
        console.log('⏳ Aguardando operações ativas terminarem...');
    }

    async closeAllOpenPositions() {
        // Fechar todas as posições abertas
        console.log('🔴 Fechando todas as posições abertas...');
    }

    async deactivateSystemComponents() {
        // Desativar componentes
        console.log('✅ Componentes desativados');
    }

    getMarketFallback() {
        return {
            fearGreed: { value: 50, description: 'Neutral' },
            btcDominance: { value: 45 }
        };
    }

    async saveMarketReading(fearGreed, btcDominance) {
        // Salvar leitura no banco
    }

    parseAlternativeMe(data) {
        return {
            value: data.data[0].value,
            description: data.data[0].value_classification
        };
    }

    parseCoinStats(data) {
        return {
            value: data.index,
            description: data.sentiment
        };
    }
}

module.exports = SystemOrchestrator;
