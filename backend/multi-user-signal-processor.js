const { Pool } = require('pg');
const axios = require('axios');
const { OpenAIApi, Configuration } = require('openai');
const SignalHistoryAnalyzer = require('./signal-history-analyzer');
const OrderManager = require('./order-manager');
const MarketDirectionMonitor = require('./market-direction-monitor');
const SignalMetricsMonitor = require('./signal-metrics-monitor');
const ExchangeKeyValidator = require('./exchange-key-validator');
const BTCDominanceAnalyzer = require('./btc-dominance-analyzer');
const RSIOverheatedMonitor = require('./rsi-overheated-monitor');
const DetailedSignalTracker = require('./detailed-signal-tracker');

class MultiUserSignalProcessor {
    constructor() {
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
            ssl: false
        });

        // Inicializar componentes de monitoramento
        this.signalHistory = new SignalHistoryAnalyzer();
        this.orderManager = new OrderManager();
        this.marketMonitor = new MarketDirectionMonitor();
        this.signalMetrics = new SignalMetricsMonitor();
        this.keyValidator = new ExchangeKeyValidator();
        this.btcDominance = new BTCDominanceAnalyzer();
        this.rsiMonitor = new RSIOverheatedMonitor();
        this.detailedTracker = new DetailedSignalTracker();

        // Configurar OpenAI para análise de IA
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
            const configuration = new Configuration({
                apiKey: process.env.OPENAI_API_KEY,
            });
            this.openai = new OpenAIApi(configuration);
            console.log('🤖 OpenAI: Configurado para análise IA');
        } else {
            this.openai = null;
            console.log('⚠️ OpenAI: Não configurado (usando fallback)');
        }

        console.log('🚀 Multi-User Signal Processor iniciado');
        console.log('🤖 IA OpenAI: Modo supervisão ativo');
        console.log('📊 Análise de mercado: Fear & Greed + TOP 100');
        console.log('🧠 Histórico de sinais: ATIVO');
        console.log('📋 TP/SL obrigatórios: ATIVO');
        console.log('📊 Monitoramento de direção: ATIVO');
        console.log('📈 Métricas de sinais: ATIVO');
        console.log('🔐 Validação de chaves: ATIVO');
        console.log('📊 Dominância BTC: ATIVO');
        console.log('📊 Monitor RSI: ATIVO');
        console.log('⭐ PRIORIDADE SINAIS FORTE: ATIVA');
    }

    /**
     * 🧠 COORDENAÇÃO E SUPERVISÃO POR IA
     * A IA analisa, coordena e supervisiona TODO o processo
     * Papel: COORDENAÇÃO E SUPERVISÃO (não autonomia para abrir/fechar)
     * ⭐ PRIORIDADE ESPECIAL PARA SINAIS FORTE
     */
    async processSignal(signalData) {
        const isStrongSignal = signalData.signal && signalData.signal.includes('FORTE');
        
        console.log('🔄 INICIANDO PROCESSO COORDENADO PELA IA');
        console.log('📡 Sinal recebido:', signalData);
        if (isStrongSignal) {
            console.log('⭐ SINAL FORTE DETECTADO - PRIORIDADE ALTA');
        }

        try {
            // ETAPA 1: Obter direção atual do mercado (usando monitor integrado)
            const marketDirection = await this.marketMonitor.getCurrentDirection();
            
            console.log(`📊 Fear & Greed: ${marketDirection.fearGreed.value}/100`);
            console.log(`🧭 Direção permitida: ${marketDirection.allowed}`);
            console.log(`💰 TOP 100: ${marketDirection.top100.percentageUp}% (${marketDirection.top100.trend})`);

            // ETAPA 2: Análises avançadas de mercado
            const [btcAnalysis, rsiAnalysis] = await Promise.all([
                this.btcDominance.analyzeBTCDominanceCorrelation(),
                this.rsiMonitor.analyzeMarketRSI()
            ]);

            console.log(`📊 BTC Dominância: ${btcAnalysis.btcDominance?.btcDominance || 'N/A'}%`);
            console.log(`📈 RSI Mercado: ${rsiAnalysis.marketOverview?.averageRSI || 'N/A'}`);

            // ETAPA 3: Validação de Sinal (janela de 30 segundos + direção + preferência FORTE)
            const signalValidation = this.validateSignal(signalData, marketDirection.allowed, isStrongSignal);
            if (!signalValidation.valid) {
                console.log('❌ Sinal rejeitado:', signalValidation.reason);
                
                // Registrar sinal rejeitado
                await this.signalMetrics.registerSignal(signalData, marketDirection, {
                    shouldExecute: false,
                    reason: signalValidation.reason,
                    btcAnalysis,
                    rsiAnalysis
                });
                
                return { success: false, reason: signalValidation.reason };
            }

            // ETAPA 4: Análise de histórico de sinais (contrarian movement detection)
            const signalHistoryAnalysis = await this.signalHistory.analyzeSignal(
                signalData.ticker, 
                signalData.signal
            );
            
            console.log('🧠 Análise histórica:', signalHistoryAnalysis.recommendation);

            // ETAPA 5: IA COORDENA E SUPERVISIONA O PROCESSO
            const aiDecision = await this.aiCoordinateAndSupervise(
                signalData, 
                marketDirection, 
                signalHistoryAnalysis,
                { btcAnalysis, rsiAnalysis, isStrongSignal }
            );

            // ETAPA 5.5: TRACKING DETALHADO DAS 4 CONDIÇÕES
            const trackingResult = await this.detailedTracker.trackSignalConditions(
                signalData,
                marketDirection, 
                signalHistoryAnalysis,
                aiDecision,
                isStrongSignal
            );

            // ETAPA 6: Registrar métricas do sinal
            const signalMetricsResult = await this.signalMetrics.registerSignal(
                signalData, 
                marketDirection, 
                { ...aiDecision, btcAnalysis, rsiAnalysis, tracking: trackingResult }
            );

            if (!aiDecision.shouldExecute) {
                console.log('🤖 IA decidiu NÃO executar:', aiDecision.reason);
                return { success: false, reason: aiDecision.reason };
            }

            console.log('🤖 IA APROVOU execução:', aiDecision.analysis);
            if (isStrongSignal) {
                console.log('⭐ PROCESSANDO SINAL FORTE COM PRIORIDADE');
            }

            // ETAPA 7: Executar para usuários (coordenado pela IA)
            const userExecutions = await this.executeForAllUsers(signalData, aiDecision);

            return {
                success: true,
                signalId: signalData.id,
                isStrongSignal: isStrongSignal,
                aiDecision: aiDecision,
                marketDirection: marketDirection,
                signalHistory: signalHistoryAnalysis,
                signalMetrics: signalMetricsResult,
                btcAnalysis: btcAnalysis,
                rsiAnalysis: rsiAnalysis,
                executions: userExecutions
            };

        } catch (error) {
            console.error('❌ Erro no processo coordenado pela IA:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 🤖 ETAPA 5: IA COORDENA E SUPERVISIONA TODO O PROCESSO
     * Papel: COORDENAÇÃO E SUPERVISÃO (não abrir/fechar operações)
     * ⭐ PREFERÊNCIA ESPECIAL PARA SINAIS FORTE
     */
    async aiCoordinateAndSupervise(signalData, marketDirection, signalHistoryAnalysis, additionalData = {}) {
        try {
            const { btcAnalysis, rsiAnalysis, isStrongSignal } = additionalData;

            if (!this.openai) {
                console.warn('⚠️ OpenAI não configurado, usando lógica de fallback');
                return this.fallbackDecision(signalData, marketDirection, signalHistoryAnalysis, isStrongSignal, { btcAnalysis, rsiAnalysis });
            }

            const prompt = `
Como IA coordenadora e supervisora do sistema de trading, analise os dados e decida se o sinal deve ser executado:

DADOS DO MERCADO:
- Fear & Greed Index: ${marketDirection.fearGreed.value}/100 (${marketDirection.fearGreed.classification})
- Direção permitida: ${marketDirection.allowed}
- TOP 100 moedas: ${marketDirection.top100.percentageUp}% subindo (${marketDirection.top100.trend})
- Confiança da direção: ${(marketDirection.confidence * 100).toFixed(1)}%
- Market Cap 24h: ${btcAnalysis?.btcDominance?.market_cap_change_24h ? (btcAnalysis.btcDominance.market_cap_change_24h > 0 ? '+' : '') + btcAnalysis.btcDominance.market_cap_change_24h.toFixed(2) + '%' : 'N/A'}

DADOS DO SINAL:
- Sinal: ${signalData.signal}
- Ticker: ${signalData.ticker}
- Fonte: ${signalData.source}
- É SINAL FORTE: ${isStrongSignal ? 'SIM - PRIORIDADE ALTA' : 'NÃO'}

ANÁLISE HISTÓRICA:
- Recomendação: ${signalHistoryAnalysis.recommendation}
- Padrão detectado: ${signalHistoryAnalysis.pattern || 'Nenhum'}
- Histórico de sinais: ${signalHistoryAnalysis.signalCount} sinais recentes

ANÁLISES AVANÇADAS:
- BTC Dominância: ${btcAnalysis?.btcDominance?.btcDominance || 'N/A'}% (${btcAnalysis?.btcDominance?.classification || 'N/A'})
- RSI Médio do Mercado: ${rsiAnalysis?.marketOverview?.averageRSI || 'N/A'}
- Alertas BTC: ${btcAnalysis?.alerts?.length || 0} alertas
- Alertas RSI: ${rsiAnalysis?.alerts?.length || 0} alertas

REGRAS DE NEGÓCIO:
1. IA NÃO tem autonomia para decidir diferente das regras mapeadas
2. IA apenas COORDENA e SUPERVISIONA o processo
3. IA NÃO pode tomar decisões próprias fora das regras
4. PRIORIDADE ESPECIAL para SINAIS FORTE (menor rigidez nos critérios)
5. Considerar volatilidade do mercado para possível fechamento antecipado
6. Alertas de sobrecompra/sobrevenda devem influenciar a decisão
7. VARIAÇÃO MARKET CAP: Valores positivos favorecem LONG, negativos favorecem SHORT

CRITÉRIOS PARA APROVAÇÃO (ATUALIZADOS):
- Sinal deve estar alinhado com direção permitida ✅
- RSI_15 deve estar favorável: <80 para LONG e >30 para SHORT ✅
- Comparativo de sinais anteriores da mesma moeda (análise de padrão LONG/SHORT) ✅
- Para SINAIS FORTE: critérios mais flexíveis ✅
- Métricas de mercado devem estar em condição neutra ou favorável
- Fear & Greed: >70 favorece LONG, <30 favorece SHORT
- Market Cap 24h: >1% favorece LONG, <-1% favorece SHORT

CRITÉRIOS REMOVIDOS/FLEXIBILIZADOS:
- Histórico de sinais (muito restritivo)
- Confiança da direção rígida (flexibilizado)
- Conflitos nas métricas (flexibilizado para permitir mais sinais)

Responda apenas: SIM ou NÃO seguido de uma breve justificativa (máximo 50 palavras).`;

            const response = await this.openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 100,
                temperature: 0.1
            });

            const aiResponse = response.data.choices[0].message.content.trim();
            const shouldExecute = aiResponse.toLowerCase().startsWith('sim');

            return {
                shouldExecute: shouldExecute,
                analysis: aiResponse,
                confidence: marketDirection.confidence,
                isStrongSignal: isStrongSignal,
                factors: {
                    marketDirection: marketDirection.allowed,
                    fearGreed: marketDirection.fearGreed.value,
                    top100Trend: marketDirection.top100.trend,
                    signalHistory: signalHistoryAnalysis.recommendation,
                    btcDominance: btcAnalysis?.btcDominance?.btcDominance,
                    marketRSI: rsiAnalysis?.marketOverview?.averageRSI,
                    marketCapChange24h: btcAnalysis?.btcDominance?.market_cap_change_24h
                }
            };

        } catch (error) {
            console.warn('⚠️ Erro na análise da IA, usando fallback:', error.message);
            return this.fallbackDecision(signalData, marketDirection, signalHistoryAnalysis, isStrongSignal, { btcAnalysis, rsiAnalysis });
        }
    }

    /**
     * 🔄 LÓGICA DE FALLBACK INTELIGENTE COM NOVOS CRITÉRIOS AJUSTADOS
     */
    async fallbackDecision(signalData, marketDirection, signalHistoryAnalysis, isStrongSignal = false, additionalData = {}) {
        const signalDirection = this.getSignalDirection(signalData.signal);
        const { rsiAnalysis } = additionalData;
        
        // NOVOS CRITÉRIOS - Análise de condições favoráveis
        let favorableConditions = 0;
        let totalConditions = 4;
        let detailedAnalysis = [];

        // 1. ✅ Direção do mercado favorável (MANTIDO)
        let condition1 = false;
        if (
            (marketDirection.allowed === 'LONG_E_SHORT') ||
            (marketDirection.allowed === 'SOMENTE_LONG' && signalDirection === 'LONG') ||
            (marketDirection.allowed === 'SOMENTE_SHORT' && signalDirection === 'SHORT') ||
            (marketDirection.allowed === 'PREFERENCIA_LONG' && signalDirection === 'LONG') ||
            (marketDirection.allowed === 'PREFERENCIA_SHORT' && signalDirection === 'SHORT')
        ) {
            favorableConditions++;
            condition1 = true;
            detailedAnalysis.push(`✅ Direção do mercado: ${marketDirection.allowed} → ${signalDirection}`);
        } else {
            detailedAnalysis.push(`❌ Direção do mercado: ${marketDirection.allowed} ≠ ${signalDirection}`);
        }

        // 2. ✅ NOVO: RSI_15 favorável (<80 para LONG, >30 para SHORT)
        let condition2 = false;
        const rsi15 = await this.getRSI15ForTicker(signalData.ticker);
        if (rsi15) {
            if (
                (signalDirection === 'LONG' && rsi15 < 80) ||
                (signalDirection === 'SHORT' && rsi15 > 30)
            ) {
                favorableConditions++;
                condition2 = true;
                detailedAnalysis.push(`✅ RSI_15: ${rsi15.toFixed(1)} (favorável para ${signalDirection})`);
            } else {
                detailedAnalysis.push(`❌ RSI_15: ${rsi15.toFixed(1)} (desfavorável para ${signalDirection})`);
            }
        } else {
            // Se não conseguir obter RSI_15, considera neutro
            favorableConditions++;
            condition2 = true;
            detailedAnalysis.push(`⚠️ RSI_15: Não disponível (considerado neutro)`);
        }

        // 3. ✅ NOVO: Comparativo de sinais anteriores da mesma moeda
        let condition3 = false;
        const coinComparative = await this.analyzeCoinSignalHistory(signalData.ticker, signalDirection);
        if (coinComparative.favorable) {
            favorableConditions++;
            condition3 = true;
            detailedAnalysis.push(`✅ Histórico da moeda: ${coinComparative.reason}`);
        } else {
            detailedAnalysis.push(`❌ Histórico da moeda: ${coinComparative.reason}`);
        }

        // 4. ✅ TOP 100 alinhado (FLEXIBILIZADO - mais permissivo)
        let condition4 = false;
        if (
            (marketDirection.top100.trend === 'BULLISH' && signalDirection === 'LONG') ||
            (marketDirection.top100.trend === 'BEARISH' && signalDirection === 'SHORT') ||
            (marketDirection.top100.trend === 'SIDEWAYS') ||
            // FLEXIBILIZADO: Se TOP 100 está entre 45-55%, considerar neutro
            (marketDirection.top100.percentageUp >= 45 && marketDirection.top100.percentageUp <= 55)
        ) {
            favorableConditions++;
            condition4 = true;
            detailedAnalysis.push(`✅ TOP 100: ${marketDirection.top100.percentageUp}% (${marketDirection.top100.trend})`);
        } else {
            detailedAnalysis.push(`❌ TOP 100: ${marketDirection.top100.percentageUp}% (${marketDirection.top100.trend})`);
        }

        // DECISÃO FINAL - Critérios flexibilizados
        let shouldExecute;
        let requiredConditions;
        
        if (isStrongSignal) {
            // Para sinais FORTE: apenas 2 condições necessárias
            requiredConditions = 2;
            shouldExecute = favorableConditions >= 2;
        } else {
            // Para sinais normais: 3 condições necessárias (antes era 3, mantido)
            requiredConditions = 3;
            shouldExecute = favorableConditions >= 3;
        }

        let reason = '';
        if (shouldExecute) {
            reason = `APROVADO: ${favorableConditions}/${totalConditions} critérios atendidos (mín: ${requiredConditions})`;
            if (isStrongSignal) reason += ' - SINAL FORTE';
        } else {
            reason = `REJEITADO: Apenas ${favorableConditions}/${totalConditions} critérios (mín: ${requiredConditions})`;
            if (isStrongSignal) reason += ' - mesmo sendo SINAL FORTE';
        }

        console.log('🔍 ANÁLISE DETALHADA DOS NOVOS CRITÉRIOS:');
        detailedAnalysis.forEach(analysis => console.log(`   ${analysis}`));
        console.log(`📊 RESULTADO: ${reason}`);

        return {
            shouldExecute: shouldExecute,
            analysis: reason,
            confidence: marketDirection.confidence,
            isStrongSignal: isStrongSignal,
            reason: reason,
            newCriteria: {
                condition1_market_direction: condition1,
                condition2_rsi15: condition2,
                condition3_coin_history: condition3,
                condition4_top100_flexible: condition4,
                favorableConditions: favorableConditions,
                totalConditions: totalConditions,
                requiredConditions: requiredConditions,
                detailedAnalysis: detailedAnalysis
            }
        };
    }

    /**
     * 📊 NOVO: Obter RSI_15 para um ticker específico
     */
    async getRSI15ForTicker(ticker) {
        try {
            // Usar o RSI monitor existente para obter dados específicos do ticker
            const rsiData = await this.rsiMonitor.getRSIForTicker(ticker, 15);
            return rsiData?.rsi || null;
        } catch (error) {
            console.warn(`⚠️ Erro ao obter RSI_15 para ${ticker}:`, error.message);
            return null;
        }
    }

    /**
     * 📈 NOVO: Analisar histórico de sinais da moeda específica
     */
    async analyzeCoinSignalHistory(ticker, signalDirection) {
        try {
            // Buscar últimos 10 sinais desta moeda específica
            const result = await this.pool.query(`
                SELECT signal_type, ai_decision, received_at
                FROM signal_conditions_tracking 
                WHERE ticker = $1 
                ORDER BY received_at DESC 
                LIMIT 10
            `, [ticker]);

            if (result.rows.length === 0) {
                return {
                    favorable: true,
                    reason: 'Primeira análise da moeda (sem histórico)'
                };
            }

            const signals = result.rows;
            const totalSignals = signals.length;
            
            // Analisar sinais da mesma direção
            const sameDirectionSignals = signals.filter(s => 
                this.getSignalDirection(s.signal_type) === signalDirection
            );
            
            const approvedSameDirection = sameDirectionSignals.filter(s => s.ai_decision).length;
            const rejectedSameDirection = sameDirectionSignals.length - approvedSameDirection;
            
            // Analisar sinais da direção oposta
            const oppositeDirection = signalDirection === 'LONG' ? 'SHORT' : 'LONG';
            const oppositeSignals = signals.filter(s => 
                this.getSignalDirection(s.signal_type) === oppositeDirection
            );
            
            const recentOppositeApproved = oppositeSignals
                .filter(s => s.ai_decision)
                .filter(s => {
                    const signalTime = new Date(s.received_at);
                    const now = new Date();
                    const hoursDiff = (now - signalTime) / (1000 * 60 * 60);
                    return hoursDiff <= 4; // Últimas 4 horas
                }).length;

            // LÓGICA DE DECISÃO
            if (recentOppositeApproved >= 2) {
                return {
                    favorable: false,
                    reason: `${recentOppositeApproved} sinais ${oppositeDirection} aprovados nas últimas 4h`
                };
            }

            if (sameDirectionSignals.length >= 3 && rejectedSameDirection >= 2) {
                return {
                    favorable: false,
                    reason: `${rejectedSameDirection}/${sameDirectionSignals.length} sinais ${signalDirection} rejeitados recentemente`
                };
            }

            return {
                favorable: true,
                reason: `Histórico favorável: ${approvedSameDirection}/${sameDirectionSignals.length} ${signalDirection} aprovados`
            };

        } catch (error) {
            console.warn(`⚠️ Erro ao analisar histórico de ${ticker}:`, error.message);
            return {
                favorable: true,
                reason: 'Erro na análise (considerado neutro)'
            };
        }
    }

    /**
     * ✅ ETAPA 3: Validação de Sinal (janela de 30 segundos + prioridade FORTE)
     */
    validateSignal(signalData, allowedDirection, isStrongSignal = false) {
        // Verificar janela de validade (flexível para sinais FORTE)
        const signalTime = new Date(signalData.timestamp || Date.now());
        const now = new Date();
        const timeDifference = (now - signalTime) / 1000; // segundos

        // Sinais FORTE têm janela estendida de 60 segundos
        const maxAge = isStrongSignal ? 60 : 30;
        
        if (timeDifference > maxAge) {
            return {
                valid: false,
                reason: `Sinal expirado (${timeDifference.toFixed(1)}s > ${maxAge}s)${isStrongSignal ? ' - FORTE' : ''}`
            };
        }

        // Filtrar por direção permitida (Fear & Greed) - mais flexível para FORTE
        const signalDirection = this.getSignalDirection(signalData.signal);
        
        // Para sinais FORTE, permitir mesmo com preferência contrária
        if (!isStrongSignal) {
            if (allowedDirection === 'SOMENTE_LONG' && signalDirection === 'SHORT') {
                return {
                    valid: false,
                    reason: 'Sinal SHORT bloqueado (mercado apenas LONG)'
                };
            }
            
            if (allowedDirection === 'SOMENTE_SHORT' && signalDirection === 'LONG') {
                return {
                    valid: false,
                    reason: 'Sinal LONG bloqueado (mercado apenas SHORT)'
                };
            }
        } else {
            // Para sinais FORTE, apenas bloquear se totalmente contrário
            if (allowedDirection === 'SOMENTE_LONG' && signalDirection === 'SHORT') {
                console.log('⭐ SINAL FORTE: Verificando se deve override direção...');
                // Ainda bloquear, mas com aviso especial
                return {
                    valid: false,
                    reason: 'Sinal SHORT FORTE bloqueado (mercado apenas LONG)'
                };
            }
            
            if (allowedDirection === 'SOMENTE_SHORT' && signalDirection === 'LONG') {
                console.log('⭐ SINAL FORTE: Verificando se deve override direção...');
                return {
                    valid: false,
                    reason: 'Sinal LONG FORTE bloqueado (mercado apenas SHORT)'
                };
            }
        }

        return {
            valid: true,
            reason: `Sinal válido e dentro da direção permitida${isStrongSignal ? ' - PRIORIDADE FORTE' : ''}`
        };
    }

    getSignalDirection(signal) {
        const longSignals = ['SINAL_LONG', 'SINAL_LONG_FORTE'];
        const shortSignals = ['SINAL_SHORT', 'SINAL_SHORT_FORTE'];
        
        if (longSignals.includes(signal)) return 'LONG';
        if (shortSignals.includes(signal)) return 'SHORT';
        return 'UNKNOWN';
    }

    /**
     * ⚡ ETAPA 6: Executar para usuários (coordenado pela IA)
     */
    async executeForAllUsers(signalData, aiDecision) {
        try {
            // Buscar usuários ativos
            const activeUsers = await this.getActiveUsers();
            console.log(`👥 ${activeUsers.length} usuários para execução coordenada pela IA`);

            if (activeUsers.length === 0) {
                return { executions: [], message: 'Nenhum usuário ativo encontrado' };
            }

            const executions = [];

            for (const user of activeUsers) {
                try {
                    const userExecution = await this.executeForUser(user, signalData, aiDecision);
                    executions.push(userExecution);
                } catch (error) {
                    console.error(`❌ Erro ao executar para usuário ${user.id}:`, error.message);
                    executions.push({
                        userId: user.id,
                        success: false,
                        error: error.message
                    });
                }
            }

            const successCount = executions.filter(e => e.success).length;
            console.log(`✅ ${successCount}/${executions.length} execuções bem-sucedidas`);

            return {
                executions,
                summary: {
                    total: executions.length,
                    successful: successCount,
                    failed: executions.length - successCount
                }
            };

        } catch (error) {
            console.error('❌ Erro na execução coordenada:', error.message);
            return { error: error.message, executions: [] };
        }
    }

    /**
     * 👥 BUSCAR USUÁRIOS ATIVOS COM VALIDAÇÃO COMPLETA
     */
    async getActiveUsers() {
        try {
            const result = await this.pool.query(`
                SELECT id, email, plan_type, balance_brl, balance_usd, prepaid_balance_usd,
                       admin_credits_brl, admin_credits_usd, custom_config, exchange_config, 
                       is_active, binance_api_key_encrypted, binance_api_secret_encrypted,
                       bybit_api_key_encrypted, bybit_api_secret_encrypted
                FROM users 
                WHERE is_active = true 
                AND (
                    (binance_api_key_encrypted IS NOT NULL AND binance_api_secret_encrypted IS NOT NULL) OR
                    (bybit_api_key_encrypted IS NOT NULL AND bybit_api_secret_encrypted IS NOT NULL)
                )
                AND (balance_brl > 0 OR balance_usd > 0 OR prepaid_balance_usd > 0 OR 
                     admin_credits_brl > 0 OR admin_credits_usd > 0)
                ORDER BY 
                    CASE 
                        WHEN plan_type = 'VIP' THEN 1
                        WHEN plan_type = 'PREMIUM' THEN 2
                        WHEN plan_type = 'BASIC' THEN 3
                        ELSE 4
                    END,
                    id ASC
            `);

            console.log(`🔍 ${result.rows.length} usuários encontrados com chaves e saldos`);
            return result.rows || [];

        } catch (error) {
            console.error('❌ Erro ao buscar usuários:', error.message);
            return [];
        }
    }

    /**
     * 👤 EXECUTAR PARA USUÁRIO ESPECÍFICO COM VALIDAÇÃO COMPLETA
     */
    async executeForUser(user, signalData, aiDecision) {
        try {
            console.log(`🔍 Validando usuário ${user.id} (${user.email})...`);

            // VALIDAÇÃO COMPLETA DO USUÁRIO (chaves, saldos, limites)
            const userValidation = await this.keyValidator.validateUserForTrading(user.id, signalData);
            if (!userValidation.success) {
                console.log(`❌ Usuário ${user.id} rejeitado: ${userValidation.reason}`);
                return {
                    userId: user.id,
                    success: false,
                    reason: userValidation.reason,
                    error: userValidation.error
                };
            }

            console.log(`✅ Usuário ${user.id} validado - Exchange: ${userValidation.exchange}`);
            console.log(`💰 Saldo disponível: ${userValidation.balances.currency} ${userValidation.balances.availableAmount.toFixed(2)}`);

            // Usar OrderManager para criar ordem com TP/SL obrigatórios
            const orderResult = await this.orderManager.createOrder({
                userId: user.id,
                ticker: signalData.ticker,
                signal: signalData.signal,
                userConfig: userValidation.tradingConfig,
                exchangeConfig: {
                    exchange: userValidation.exchange,
                    balances: userValidation.balances
                },
                isStrongSignal: aiDecision.isStrongSignal
            });

            if (!orderResult.success) {
                return {
                    userId: user.id,
                    success: false,
                    reason: orderResult.reason
                };
            }

            // Registrar execução no histórico
            await this.signalHistory.recordSignalExecution(
                signalData.ticker,
                signalData.signal,
                user.id,
                orderResult.orderId
            );

            // Bloquear ticker temporariamente para evitar over-trading
            await this.blockTickerForUser(user.id, signalData.ticker);

            return {
                userId: user.id,
                email: user.email,
                planType: user.plan_type,
                success: true,
                orderId: orderResult.orderId,
                exchange: userValidation.exchange,
                details: orderResult.details,
                balanceUsed: userValidation.balances.currency,
                amountUsed: orderResult.details?.amount || 0
            };

        } catch (error) {
            console.error(`❌ Erro na execução para usuário ${user.id}:`, error.message);
            return {
                userId: user.id,
                success: false,
                error: error.message
            };
        }
    }

    /**
     * ✅ VALIDAR USUÁRIO PARA EXECUÇÃO
     */
    async validateUserForExecution(user, signalData) {
        try {
            // Verificar saldo mínimo
            const minBalanceBRL = parseFloat(process.env.MIN_BALANCE_BRAZIL_BRL) || 100;
            const minBalanceUSD = parseFloat(process.env.MIN_BALANCE_FOREIGN_USD) || 20;
            
            if (user.balance_brl < minBalanceBRL && user.balance_usd < minBalanceUSD) {
                return {
                    valid: false,
                    reason: 'Saldo insuficiente para trading'
                };
            }

            // Verificar máximo de posições ativas
            const maxPositions = parseInt(process.env.MAX_POSITIONS_PER_USER) || 2;
            const activePositions = await this.pool.query(`
                SELECT COUNT(*) as count 
                FROM active_positions 
                WHERE user_id = $1 AND status = 'ACTIVE'
            `, [user.id]);

            if (parseInt(activePositions.rows[0].count) >= maxPositions) {
                return {
                    valid: false,
                    reason: `Máximo de ${maxPositions} posições ativas atingido`
                };
            }

            // Verificar bloqueio de ticker
            const tickerBlockHours = parseInt(process.env.TICKER_BLOCK_HOURS) || 2;
            const blockedTicker = await this.pool.query(`
                SELECT id FROM ticker_blocks 
                WHERE user_id = $1 AND ticker = $2 
                AND expires_at > NOW()
            `, [user.id, signalData.ticker]);

            if (blockedTicker.rows.length > 0) {
                return {
                    valid: false,
                    reason: `Ticker ${signalData.ticker} bloqueado temporariamente`
                };
            }

            return { valid: true };

        } catch (error) {
            console.error('❌ Erro na validação do usuário:', error.message);
            return {
                valid: false,
                reason: 'Erro na validação'
            };
        }
    }

    /**
     * ✅ BLOQUEAR TICKER TEMPORARIAMENTE
     */
    async blockTickerForUser(userId, ticker) {
        try {
            const tickerBlockHours = parseInt(process.env.TICKER_BLOCK_HOURS) || 2;
            await this.pool.query(`
                INSERT INTO ticker_blocks (user_id, ticker, expires_at) 
                VALUES ($1, $2, NOW() + INTERVAL '${tickerBlockHours} hours')
                ON CONFLICT (user_id, ticker) 
                DO UPDATE SET expires_at = NOW() + INTERVAL '${tickerBlockHours} hours'
            `, [userId, ticker]);
            
            console.log(`🔒 Ticker ${ticker} bloqueado para usuário ${userId} por ${tickerBlockHours}h`);
        } catch (error) {
            console.error('❌ Erro ao bloquear ticker:', error.message);
        }
    }
}

module.exports = MultiUserSignalProcessor;
