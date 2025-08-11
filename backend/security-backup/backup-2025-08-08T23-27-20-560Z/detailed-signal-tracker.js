/**
 * 🔍 MONITOR DETALHADO DE CONDIÇÕES DOS SINAIS
 * Sistema para acompanhamento completo das 4 condições da IA
 * 
 * AS 4 CONDIÇÕES ANALISADAS:
 * 1. Direção do mercado favorável
 * 2. TOP 100 alinhado com o sinal
 * 3. Confiança adequada (>0.4 normal, >0.3 FORTE)
 * 4. Histórico não contrário
 */

const { Pool } = require('pg');

class DetailedSignalTracker {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
            ssl: { rejectUnauthorized: false }
        });
        
        console.log('🔍 Detailed Signal Tracker inicializado');
        this.initializeDatabase();
    }

    async initializeDatabase() {
        try {
            // Criar tabela para tracking detalhado
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS signal_conditions_tracking (
                    id SERIAL PRIMARY KEY,
                    signal_id TEXT,
                    signal_type TEXT,
                    ticker TEXT,
                    source TEXT,
                    received_at TIMESTAMP DEFAULT NOW(),
                    
                    -- AS 4 CONDIÇÕES ATUALIZADAS
                    condition_1_market_direction BOOLEAN DEFAULT FALSE,
                    condition_1_details TEXT,
                    
                    condition_2_rsi15_favorable BOOLEAN DEFAULT FALSE,
                    condition_2_details TEXT,
                    
                    condition_3_coin_history_favorable BOOLEAN DEFAULT FALSE,
                    condition_3_details TEXT,
                    
                    condition_4_top100_flexible BOOLEAN DEFAULT FALSE,
                    condition_4_details TEXT,
                    
                    -- RESULTADO FINAL
                    total_favorable_conditions INTEGER DEFAULT 0,
                    is_strong_signal BOOLEAN DEFAULT FALSE,
                    ai_decision BOOLEAN DEFAULT FALSE,
                    ai_reason TEXT,
                    
                    -- DADOS CONTEXTUAIS
                    market_direction TEXT,
                    fear_greed_value INTEGER,
                    top100_percentage NUMERIC,
                    confidence_score NUMERIC,
                    
                    processed_at TIMESTAMP DEFAULT NOW()
                )
            `);
            
            console.log('✅ Tabela de tracking detalhado criada');
        } catch (error) {
            console.error('❌ Erro ao criar tabela de tracking:', error.message);
        }
    }

    /**
     * 📊 REGISTRAR ANÁLISE DETALHADA DAS 4 CONDIÇÕES
     */
    async trackSignalConditions(signalData, marketDirection, signalHistoryAnalysis, aiDecision, isStrongSignal = false) {
        try {
            const signalDirection = this.getSignalDirection(signalData.signal);
            
            // ANALISAR CADA UMA DAS 4 CONDIÇÕES
            const conditions = this.analyzeAllConditions(
                signalData, 
                marketDirection, 
                signalHistoryAnalysis, 
                signalDirection, 
                isStrongSignal
            );
            
            // Salvar no banco
            const result = await this.pool.query(`
                INSERT INTO signal_conditions_tracking (
                    signal_id, signal_type, ticker, source,
                    condition_1_market_direction, condition_1_details,
                    condition_2_top100_aligned, condition_2_details,
                    condition_3_confidence_adequate, condition_3_details,
                    condition_4_history_favorable, condition_4_details,
                    total_favorable_conditions, is_strong_signal, ai_decision, ai_reason,
                    market_direction, fear_greed_value, top100_percentage, confidence_score
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                RETURNING id
            `, [
                signalData.timestamp || Date.now(),
                signalData.signal,
                signalData.ticker,
                signalData.source,
                conditions.condition1.result,
                conditions.condition1.details,
                conditions.condition2.result,
                conditions.condition2.details,
                conditions.condition3.result,
                conditions.condition3.details,
                conditions.condition4.result,
                conditions.condition4.details,
                conditions.totalFavorable,
                isStrongSignal,
                aiDecision.shouldExecute,
                aiDecision.analysis || aiDecision.reason,
                marketDirection.allowed,
                marketDirection.fearGreed.value,
                marketDirection.top100.percentageUp,
                marketDirection.confidence
            ]);

            // Log detalhado no console
            this.logDetailedAnalysis(signalData, conditions, aiDecision, isStrongSignal);
            
            return {
                trackingId: result.rows[0].id,
                conditions: conditions,
                totalFavorable: conditions.totalFavorable,
                decision: aiDecision.shouldExecute
            };

        } catch (error) {
            console.error('❌ Erro ao rastrear condições do sinal:', error.message);
            return null;
        }
    }

    /**
     * 🔍 ANALISAR TODAS AS 4 CONDIÇÕES
     */
    analyzeAllConditions(signalData, marketDirection, signalHistoryAnalysis, signalDirection, isStrongSignal) {
        let totalFavorable = 0;

        // CONDIÇÃO 1: Direção do mercado favorável
        const condition1 = this.analyzeCondition1(marketDirection, signalDirection);
        if (condition1.result) totalFavorable++;

        // CONDIÇÃO 2: TOP 100 alinhado
        const condition2 = this.analyzeCondition2(marketDirection, signalDirection);
        if (condition2.result) totalFavorable++;

        // CONDIÇÃO 3: Confiança adequada
        const condition3 = this.analyzeCondition3(marketDirection, isStrongSignal);
        if (condition3.result) totalFavorable++;

        // CONDIÇÃO 4: Histórico não contrário
        const condition4 = this.analyzeCondition4(signalHistoryAnalysis);
        if (condition4.result) totalFavorable++;

        return {
            condition1,
            condition2,
            condition3,
            condition4,
            totalFavorable
        };
    }

    /**
     * 1️⃣ CONDIÇÃO 1: Direção do mercado favorável
     */
    analyzeCondition1(marketDirection, signalDirection) {
        const allowed = marketDirection.allowed;
        let result = false;
        let details = '';

        if (allowed === 'LONG_E_SHORT') {
            result = true;
            details = `✅ Mercado permite ambas direções (${allowed})`;
        } else if (allowed === 'SOMENTE_LONG' && signalDirection === 'LONG') {
            result = true;
            details = `✅ Mercado permite apenas LONG e sinal é ${signalDirection}`;
        } else if (allowed === 'SOMENTE_SHORT' && signalDirection === 'SHORT') {
            result = true;
            details = `✅ Mercado permite apenas SHORT e sinal é ${signalDirection}`;
        } else if (allowed === 'PREFERENCIA_LONG' && signalDirection === 'LONG') {
            result = true;
            details = `✅ Mercado prefere LONG e sinal é ${signalDirection}`;
        } else if (allowed === 'PREFERENCIA_SHORT' && signalDirection === 'SHORT') {
            result = true;
            details = `✅ Mercado prefere SHORT e sinal é ${signalDirection}`;
        } else {
            result = false;
            details = `❌ Mercado: ${allowed}, Sinal: ${signalDirection} - Não alinhados`;
        }

        return { result, details };
    }

    /**
     * 2️⃣ CONDIÇÃO 2: TOP 100 alinhado
     */
    analyzeCondition2(marketDirection, signalDirection) {
        const top100Trend = marketDirection.top100.trend;
        let result = false;
        let details = '';

        if (top100Trend === 'BULLISH' && signalDirection === 'LONG') {
            result = true;
            details = `✅ TOP 100 BULLISH (${marketDirection.top100.percentageUp}%) e sinal LONG`;
        } else if (top100Trend === 'BEARISH' && signalDirection === 'SHORT') {
            result = true;
            details = `✅ TOP 100 BEARISH (${marketDirection.top100.percentageUp}%) e sinal SHORT`;
        } else if (top100Trend === 'SIDEWAYS') {
            result = true;
            details = `✅ TOP 100 SIDEWAYS (${marketDirection.top100.percentageUp}%) - Neutro para qualquer direção`;
        } else {
            result = false;
            details = `❌ TOP 100 ${top100Trend} (${marketDirection.top100.percentageUp}%) não alinhado com sinal ${signalDirection}`;
        }

        return { result, details };
    }

    /**
     * 3️⃣ CONDIÇÃO 3: Confiança adequada
     */
    analyzeCondition3(marketDirection, isStrongSignal) {
        const confidence = marketDirection.confidence;
        const threshold = isStrongSignal ? 0.3 : 0.4;
        
        const result = confidence > threshold;
        
        let details = '';
        if (result) {
            details = `✅ Confiança ${(confidence * 100).toFixed(1)}% > ${(threshold * 100)}%`;
            if (isStrongSignal) details += ' (SINAL FORTE - critério flexível)';
        } else {
            details = `❌ Confiança ${(confidence * 100).toFixed(1)}% ≤ ${(threshold * 100)}%`;
            if (isStrongSignal) details += ' (SINAL FORTE mas ainda insuficiente)';
        }

        return { result, details };
    }

    /**
     * 4️⃣ CONDIÇÃO 4: Histórico não contrário
     */
    analyzeCondition4(signalHistoryAnalysis) {
        const recommendation = signalHistoryAnalysis.recommendation;
        const result = recommendation !== 'REJECT';
        
        let details = '';
        if (result) {
            details = `✅ Histórico favorável: ${recommendation}`;
        } else {
            details = `❌ Histórico contrário: ${recommendation}`;
        }

        return { result, details };
    }

    /**
     * 📝 LOG DETALHADO NO CONSOLE
     */
    logDetailedAnalysis(signalData, conditions, aiDecision, isStrongSignal) {
        console.log('\n🔍 ===== ANÁLISE DETALHADA DAS 4 CONDIÇÕES =====');
        console.log(`📡 Sinal: ${signalData.signal} ${signalData.ticker} (${signalData.source})`);
        console.log(`⭐ Tipo: ${isStrongSignal ? 'SINAL FORTE' : 'SINAL NORMAL'}`);
        console.log('');
        
        console.log('🔍 CONDIÇÕES ANALISADAS:');
        console.log(`1️⃣ Direção do Mercado: ${conditions.condition1.result ? '✅' : '❌'}`);
        console.log(`   ${conditions.condition1.details}`);
        console.log('');
        
        console.log(`2️⃣ TOP 100 Alinhado: ${conditions.condition2.result ? '✅' : '❌'}`);
        console.log(`   ${conditions.condition2.details}`);
        console.log('');
        
        console.log(`3️⃣ Confiança Adequada: ${conditions.condition3.result ? '✅' : '❌'}`);
        console.log(`   ${conditions.condition3.details}`);
        console.log('');
        
        console.log(`4️⃣ Histórico Favorável: ${conditions.condition4.result ? '✅' : '❌'}`);
        console.log(`   ${conditions.condition4.details}`);
        console.log('');
        
        const required = isStrongSignal ? 2 : 3;
        console.log(`📊 RESULTADO: ${conditions.totalFavorable}/4 condições favoráveis`);
        console.log(`🎯 Necessário: ${required}/4 para ${isStrongSignal ? 'SINAL FORTE' : 'SINAL NORMAL'}`);
        console.log(`🤖 DECISÃO IA: ${aiDecision.shouldExecute ? '✅ APROVADO' : '❌ REJEITADO'}`);
        console.log(`💬 Motivo: ${aiDecision.analysis || aiDecision.reason}`);
        console.log('============================================\n');
    }

    /**
     * 🧭 DETERMINAR DIREÇÃO DO SINAL
     */
    getSignalDirection(signal) {
        const upperSignal = signal.toUpperCase();
        
        // Palavras-chave para LONG (compra)
        if (upperSignal.includes('COMPRA') || 
            upperSignal.includes('BUY') || 
            upperSignal.includes('LONG') || 
            upperSignal.includes('LONGA') ||
            upperSignal.includes('CALL') || 
            upperSignal.includes('UP')) {
            return 'LONG';
        }
        
        // Palavras-chave para SHORT (venda)
        if (upperSignal.includes('VENDA') || 
            upperSignal.includes('SELL') || 
            upperSignal.includes('SHORT') || 
            upperSignal.includes('CURTA') ||
            upperSignal.includes('PUT') || 
            upperSignal.includes('DOWN')) {
            return 'SHORT';
        }
        
        return 'UNKNOWN';
    }

    /**
     * 📊 OBTER ESTATÍSTICAS DETALHADAS
     */
    async getDetailedStats() {
        try {
            const stats = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_signals,
                    COUNT(CASE WHEN ai_decision = true THEN 1 END) as approved_signals,
                    AVG(total_favorable_conditions) as avg_conditions,
                    COUNT(CASE WHEN condition_1_market_direction = true THEN 1 END) as condition1_success,
                    COUNT(CASE WHEN condition_2_top100_aligned = true THEN 1 END) as condition2_success,
                    COUNT(CASE WHEN condition_3_confidence_adequate = true THEN 1 END) as condition3_success,
                    COUNT(CASE WHEN condition_4_history_favorable = true THEN 1 END) as condition4_success,
                    COUNT(CASE WHEN is_strong_signal = true THEN 1 END) as strong_signals
                FROM signal_conditions_tracking 
                WHERE received_at >= NOW() - INTERVAL '24 hours'
            `);

            return stats.rows[0];
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error.message);
            return null;
        }
    }

    /**
     * 📋 OBTER HISTÓRICO DETALHADO
     */
    async getDetailedHistory(limit = 10) {
        try {
            const history = await this.pool.query(`
                SELECT * FROM signal_conditions_tracking 
                ORDER BY received_at DESC 
                LIMIT $1
            `, [limit]);

            return history.rows;
        } catch (error) {
            console.error('❌ Erro ao obter histórico:', error.message);
            return [];
        }
    }
}

module.exports = DetailedSignalTracker;
