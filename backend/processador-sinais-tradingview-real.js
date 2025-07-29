/**
 * 🎯 PROCESSADOR DE SINAIS TRADINGVIEW - BASEADO NO PINE SCRIPT REAL
 * 
 * SINAIS ENVIADOS PELO TRADINGVIEW:
 * - "SINAL LONG" (entrada normal)
 * - "SINAL SHORT" (entrada normal) 
 * - "SINAL LONG FORTE" (entrada com alta confiança)
 * - "SINAL SHORT FORTE" (entrada com alta confiança)
 * - "FECHE LONG" (fechamento de posições long)
 * - "FECHE SHORT" (fechamento de posições short)
 * - "CONFIRMAÇÃO LONG" (confirmação de sinal)
 * - "CONFIRMAÇÃO SHORT" (confirmação de sinal)
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:LukinhaCBB123@junction.proxy.rlwy.net:15433/railway',
    ssl: { rejectUnauthorized: false }
});

class TradingViewSignalProcessor {
    constructor() {
        // Sinais válidos conforme Pine Script
        this.validSignals = [
            'SINAL LONG',
            'SINAL SHORT', 
            'SINAL LONG FORTE',
            'SINAL SHORT FORTE',
            'FECHE LONG',
            'FECHE SHORT',
            'CONFIRMAÇÃO LONG',
            'CONFIRMAÇÃO SHORT'
        ];
    }

    async processWebhookSignal(webhookData) {
        console.log('📡 PROCESSANDO WEBHOOK TRADINGVIEW');
        console.log('='.repeat(50));
        
        try {
            // Parse do JSON se necessário
            let signalData = webhookData;
            if (typeof webhookData === 'string') {
                signalData = JSON.parse(webhookData);
            }

            console.log('📊 DADOS RECEBIDOS:');
            console.log(`   Ticker: ${signalData.ticker}`);
            console.log(`   Preço: $${signalData.close}`);
            console.log(`   Sinal: "${signalData.signal}"`);
            console.log(`   Tempo: ${signalData.time}`);
            console.log(`   Diff BTC/EMA7: ${signalData.diff_btc_ema7}%`);
            console.log(`   RSI 4H: ${signalData.rsi_4h}`);
            console.log(`   RSI 15min: ${signalData.rsi_15}`);

            // Registrar sinal recebido no banco
            await this.logReceivedSignal(signalData);

            // Validar sinal
            if (!this.isValidSignal(signalData.signal)) {
                console.log(`❌ Sinal "${signalData.signal}" não reconhecido`);
                return { success: false, reason: 'Sinal não válido' };
            }

            // Verificar Fear & Greed para direção do mercado
            const marketDirection = await this.getMarketDirection();
            console.log(`🎯 Direção do mercado: ${marketDirection.status} (${marketDirection.value})`);

            // Processar baseado no tipo de sinal
            if (this.isEntrySignal(signalData.signal)) {
                return await this.processEntrySignal(signalData, marketDirection);
            } else if (this.isExitSignal(signalData.signal)) {
                return await this.processExitSignal(signalData);
            } else if (this.isConfirmationSignal(signalData.signal)) {
                return await this.processConfirmationSignal(signalData, marketDirection);
            }

        } catch (error) {
            console.error('❌ Erro ao processar webhook:', error.message);
            return { success: false, reason: error.message };
        }
    }

    isValidSignal(signal) {
        return this.validSignals.includes(signal);
    }

    isEntrySignal(signal) {
        return ['SINAL LONG', 'SINAL SHORT', 'SINAL LONG FORTE', 'SINAL SHORT FORTE'].includes(signal);
    }

    isExitSignal(signal) {
        return ['FECHE LONG', 'FECHE SHORT'].includes(signal);
    }

    isConfirmationSignal(signal) {
        return ['CONFIRMAÇÃO LONG', 'CONFIRMAÇÃO SHORT'].includes(signal);
    }

    async logReceivedSignal(signalData) {
        try {
            const logQuery = `
                INSERT INTO trading_signals (
                    source,
                    symbol,
                    action,
                    price,
                    strategy,
                    raw_data,
                    created_at,
                    status
                ) VALUES (
                    'TRADINGVIEW',
                    $1,
                    $2,
                    $3,
                    'COINBITCLUB_V2',
                    $4,
                    NOW(),
                    'RECEIVED'
                ) RETURNING id
            `;

            const result = await pool.query(logQuery, [
                signalData.ticker,
                signalData.signal,
                parseFloat(signalData.close),
                JSON.stringify(signalData)
            ]);

            console.log(`✅ Sinal registrado com ID: ${result.rows[0].id}`);
            return result.rows[0].id;

        } catch (error) {
            console.log('⚠️ Erro ao registrar sinal:', error.message);
            return null;
        }
    }

    async getMarketDirection() {
        try {
            // Buscar Fear & Greed atual do sistema
            const fearGreedQuery = `
                SELECT config_value 
                FROM system_config 
                WHERE config_key = 'fear_greed_current'
            `;
            
            const result = await pool.query(fearGreedQuery);
            let fearGreedValue = 50; // fallback
            
            if (result.rows.length > 0) {
                fearGreedValue = parseInt(result.rows[0].config_value);
            }

            // Determinar direções permitidas conforme especificação
            if (fearGreedValue < 30) {
                return {
                    value: fearGreedValue,
                    status: 'MEDO_EXTREMO',
                    allowedDirections: ['LONG'],
                    description: 'Apenas operações LONG permitidas'
                };
            } else if (fearGreedValue <= 80) {
                return {
                    value: fearGreedValue,
                    status: 'EQUILIBRADO',
                    allowedDirections: ['LONG', 'SHORT'],
                    description: 'LONG e SHORT permitidos'
                };
            } else {
                return {
                    value: fearGreedValue,
                    status: 'GANANCIA_EXTREMA',
                    allowedDirections: ['SHORT'],
                    description: 'Apenas operações SHORT permitidas'
                };
            }

        } catch (error) {
            console.log('⚠️ Erro ao obter Fear & Greed, usando fallback');
            return {
                value: 50,
                status: 'EQUILIBRADO',
                allowedDirections: ['LONG', 'SHORT'],
                description: 'LONG e SHORT permitidos (fallback)'
            };
        }
    }

    async processEntrySignal(signalData, marketDirection) {
        console.log('📈 PROCESSANDO SINAL DE ENTRADA');
        console.log('-'.repeat(40));

        // Determinar direção da operação
        const isLongSignal = signalData.signal.includes('LONG');
        const operationDirection = isLongSignal ? 'LONG' : 'SHORT';
        const signalStrength = signalData.signal.includes('FORTE') ? 'STRONG' : 'NORMAL';

        console.log(`🎯 Direção da operação: ${operationDirection}`);
        console.log(`💪 Força do sinal: ${signalStrength}`);

        // Verificar se direção é permitida pelo Fear & Greed
        if (!marketDirection.allowedDirections.includes(operationDirection)) {
            console.log(`❌ Operações ${operationDirection} bloqueadas pelo Fear & Greed`);
            console.log(`📊 ${marketDirection.description}`);
            
            // Atualizar status do sinal para bloqueado
            await this.updateSignalStatus(signalData, 'BLOCKED_BY_FEAR_GREED');
            
            return { 
                success: false, 
                reason: `Operações ${operationDirection} bloqueadas pelo Fear & Greed (${marketDirection.value})`,
                fearGreedValue: marketDirection.value
            };
        }

        // Buscar usuário Paloma
        const userQuery = `
            SELECT id, balance_usd, name 
            FROM users 
            WHERE name = 'Paloma'
        `;
        
        const userResult = await pool.query(userQuery);
        if (userResult.rows.length === 0) {
            return { success: false, reason: 'Usuário Paloma não encontrado' };
        }

        const user = userResult.rows[0];
        console.log(`👤 Usuário: ${user.name} (ID: ${user.id})`);
        console.log(`💰 Saldo: $${user.balance_usd} USDT`);

        // Verificar posições abertas (máximo 2)
        const openPositionsQuery = `
            SELECT COUNT(*) as count 
            FROM user_operations 
            WHERE user_id = $1 AND status IN ('OPEN', 'PENDING')
        `;
        
        const positionsResult = await pool.query(openPositionsQuery, [user.id]);
        const openPositions = parseInt(positionsResult.rows[0].count);
        
        console.log(`📊 Posições abertas: ${openPositions}/2`);

        if (openPositions >= 2) {
            console.log('❌ Limite de 2 operações simultâneas atingido');
            await this.updateSignalStatus(signalData, 'BLOCKED_MAX_POSITIONS');
            return { success: false, reason: 'Limite de operações simultâneas atingido' };
        }

        // Buscar parâmetros de trading
        const paramsQuery = `
            SELECT 
                leverage_default,
                take_profit_multiplier,
                stop_loss_multiplier,
                balance_percentage,
                leverage_max,
                take_profit_max_multiplier,
                stop_loss_max_multiplier
            FROM usuario_configuracoes 
            WHERE user_id = $1
        `;
        
        const paramsResult = await pool.query(paramsQuery, [user.id]);
        
        // Parâmetros padrão conforme especificação
        let params = {
            leverage_default: 5,
            take_profit_multiplier: 3,  // TP = 3x leverage
            stop_loss_multiplier: 2,    // SL = 2x leverage
            balance_percentage: 30,     // 30% do saldo por operação
            leverage_max: 10,
            take_profit_max_multiplier: 5,
            stop_loss_max_multiplier: 4
        };

        if (paramsResult.rows.length > 0) {
            params = { ...params, ...paramsResult.rows[0] };
        }

        // Calcular valores da operação
        const tradeAmount = (user.balance_usd * params.balance_percentage) / 100;
        const leverage = params.leverage_default;
        const positionSize = tradeAmount * leverage;
        
        // Calcular TP e SL respeitando limites
        let tpPercent = leverage * params.take_profit_multiplier;
        let slPercent = leverage * params.stop_loss_multiplier;
        
        // Aplicar limites máximos
        const maxTpPercent = leverage * params.take_profit_max_multiplier;
        const maxSlPercent = leverage * params.stop_loss_max_multiplier;
        
        if (tpPercent > maxTpPercent) tpPercent = maxTpPercent;
        if (slPercent > maxSlPercent) slPercent = maxSlPercent;

        // Calcular preços de TP e SL
        const entryPrice = parseFloat(signalData.close);
        let takeProfitPrice, stopLossPrice;

        if (operationDirection === 'LONG') {
            takeProfitPrice = entryPrice * (1 + tpPercent / 100);
            stopLossPrice = entryPrice * (1 - slPercent / 100);
        } else {
            takeProfitPrice = entryPrice * (1 - tpPercent / 100);
            stopLossPrice = entryPrice * (1 + slPercent / 100);
        }

        console.log('💡 PARÂMETROS DA OPERAÇÃO:');
        console.log(`   💰 Valor do trade: $${tradeAmount.toFixed(2)} USDT (${params.balance_percentage}%)`);
        console.log(`   🎯 Alavancagem: ${leverage}x`);
        console.log(`   📊 Tamanho da posição: $${positionSize.toFixed(2)} USDT`);
        console.log(`   📈 Take Profit: ${tpPercent}% → $${takeProfitPrice.toFixed(4)}`);
        console.log(`   📉 Stop Loss: ${slPercent}% → $${stopLossPrice.toFixed(4)}`);
        console.log(`   💪 Força do sinal: ${signalStrength}`);

        // Registrar operação no banco
        const operationQuery = `
            INSERT INTO user_operations (
                user_id,
                symbol,
                side,
                entry_price,
                quantity,
                leverage,
                take_profit_price,
                stop_loss_price,
                take_profit_percent,
                stop_loss_percent,
                status,
                signal_source,
                signal_strength,
                signal_data,
                fear_greed_value,
                created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', 'TRADINGVIEW', $11, $12, $13, NOW()
            ) RETURNING id
        `;

        const operationResult = await pool.query(operationQuery, [
            user.id,
            signalData.ticker,
            operationDirection,
            entryPrice,
            positionSize,
            leverage,
            takeProfitPrice,
            stopLossPrice,
            tpPercent,
            slPercent,
            signalStrength,
            JSON.stringify(signalData),
            marketDirection.value
        ]);

        const operationId = operationResult.rows[0].id;

        // Atualizar status do sinal para processado
        await this.updateSignalStatus(signalData, 'PROCESSED');

        console.log(`✅ Operação registrada com ID: ${operationId}`);
        console.log('🚀 SINAL DE ENTRADA PROCESSADO COM SUCESSO!');

        return {
            success: true,
            operationId: operationId,
            direction: operationDirection,
            strength: signalStrength,
            amount: tradeAmount,
            leverage: leverage,
            entryPrice: entryPrice,
            takeProfitPrice: takeProfitPrice,
            stopLossPrice: stopLossPrice,
            fearGreedValue: marketDirection.value
        };
    }

    async processExitSignal(signalData) {
        console.log('🔒 PROCESSANDO SINAL DE FECHAMENTO');
        console.log('-'.repeat(40));

        const closeDirection = signalData.signal === 'FECHE LONG' ? 'LONG' : 'SHORT';
        console.log(`🎯 Fechando operações: ${closeDirection}`);

        // Buscar posições abertas para fechar
        const openPositionsQuery = `
            SELECT 
                uo.id,
                uo.symbol,
                uo.side,
                uo.entry_price,
                uo.quantity,
                uo.leverage,
                u.name
            FROM user_operations uo
            JOIN users u ON uo.user_id = u.id
            WHERE u.name = 'Paloma' 
              AND uo.status IN ('OPEN', 'PENDING')
              AND uo.side = $1
        `;

        const positionsResult = await pool.query(openPositionsQuery, [closeDirection]);
        
        if (positionsResult.rows.length === 0) {
            console.log(`⚠️ Nenhuma operação ${closeDirection} aberta para fechar`);
            await this.updateSignalStatus(signalData, 'NO_POSITIONS_TO_CLOSE');
            return { success: false, reason: `Nenhuma operação ${closeDirection} aberta` };
        }

        console.log(`📊 Encontradas ${positionsResult.rows.length} operações ${closeDirection} para fechar`);

        const closeResults = [];
        const exitPrice = parseFloat(signalData.close);

        for (const position of positionsResult.rows) {
            try {
                // Calcular PnL da operação
                let pnl = 0;
                if (position.side === 'LONG') {
                    pnl = ((exitPrice - position.entry_price) / position.entry_price) * position.quantity;
                } else {
                    pnl = ((position.entry_price - exitPrice) / position.entry_price) * position.quantity;
                }

                // Atualizar operação como fechada
                const closeQuery = `
                    UPDATE user_operations 
                    SET 
                        status = 'CLOSED',
                        exit_price = $1,
                        pnl = $2,
                        close_reason = 'TRADINGVIEW_SIGNAL',
                        signal_exit_data = $3,
                        closed_at = NOW()
                    WHERE id = $4
                `;

                await pool.query(closeQuery, [
                    exitPrice,
                    pnl,
                    JSON.stringify(signalData),
                    position.id
                ]);

                console.log(`✅ Operação ${position.id} (${position.symbol}) fechada`);
                console.log(`   Entrada: $${position.entry_price}`);
                console.log(`   Saída: $${exitPrice}`);
                console.log(`   PnL: $${pnl.toFixed(2)} USDT`);

                closeResults.push({
                    operationId: position.id,
                    symbol: position.symbol,
                    entryPrice: position.entry_price,
                    exitPrice: exitPrice,
                    pnl: pnl,
                    success: true
                });

            } catch (error) {
                console.error(`❌ Erro ao fechar operação ${position.id}:`, error.message);
                closeResults.push({
                    operationId: position.id,
                    symbol: position.symbol,
                    success: false,
                    error: error.message
                });
            }
        }

        // Atualizar status do sinal
        await this.updateSignalStatus(signalData, 'PROCESSED');

        console.log('🔒 SINAL DE FECHAMENTO PROCESSADO!');

        return {
            success: true,
            direction: closeDirection,
            closedPositions: closeResults.length,
            details: closeResults
        };
    }

    async processConfirmationSignal(signalData, marketDirection) {
        console.log('✅ PROCESSANDO SINAL DE CONFIRMAÇÃO');
        console.log('-'.repeat(40));

        const confirmDirection = signalData.signal.includes('LONG') ? 'LONG' : 'SHORT';
        console.log(`🎯 Confirmação para: ${confirmDirection}`);

        // Log da confirmação
        const confirmationQuery = `
            INSERT INTO ai_signals (
                signal_type,
                signal_data,
                market_direction,
                fear_greed_value,
                created_at
            ) VALUES (
                'CONFIRMATION',
                $1,
                $2,
                $3,
                NOW()
            )
        `;

        await pool.query(confirmationQuery, [
            JSON.stringify(signalData),
            confirmDirection,
            marketDirection.value
        ]);

        // Atualizar status do sinal
        await this.updateSignalStatus(signalData, 'CONFIRMED');

        console.log(`✅ Confirmação ${confirmDirection} registrada`);

        return {
            success: true,
            type: 'CONFIRMATION',
            direction: confirmDirection,
            fearGreedValue: marketDirection.value
        };
    }

    async updateSignalStatus(signalData, status) {
        try {
            const updateQuery = `
                UPDATE trading_signals 
                SET status = $1, processed_at = NOW()
                WHERE symbol = $2 
                  AND action = $3 
                  AND created_at >= NOW() - INTERVAL '1 minute'
                ORDER BY created_at DESC 
                LIMIT 1
            `;

            await pool.query(updateQuery, [
                status,
                signalData.ticker,
                signalData.signal
            ]);

        } catch (error) {
            console.log('⚠️ Erro ao atualizar status do sinal:', error.message);
        }
    }
}

// Exemplo de webhook recebido
const exemploWebhook = {
    "ticker": "BTCUSDT",
    "time": "2025-07-29 20:15:00",
    "close": "65432.1",
    "ema9_30": "65234.5",
    "rsi_4h": "55.2",
    "rsi_15": "62.8",
    "momentum_15": "0.024",
    "atr_30": "1250.5",
    "atr_pct_30": "1.91",
    "vol_30": "12580",
    "vol_ma_30": "11420",
    "diff_btc_ema7": "0.52",
    "cruzou_acima_ema9": "1",
    "cruzou_abaixo_ema9": "0",
    "golden_cross_30": "0",
    "death_cross_30": "0",
    "signal": "SINAL LONG"
};

// Função para testar o processamento
async function testarProcessamento() {
    console.log('🧪 TESTE DO PROCESSADOR DE SINAIS TRADINGVIEW');
    console.log('='.repeat(60));

    const processor = new TradingViewSignalProcessor();

    console.log('\n1️⃣ TESTANDO SINAL LONG:');
    const resultLong = await processor.processWebhookSignal(exemploWebhook);
    console.log('Resultado:', resultLong);

    console.log('\n2️⃣ TESTANDO SINAL DE FECHAMENTO:');
    const exemploFechamento = { ...exemploWebhook, signal: "FECHE LONG" };
    const resultClose = await processor.processWebhookSignal(exemploFechamento);
    console.log('Resultado:', resultClose);

    await pool.end();
}

// Exportar para uso como API
module.exports = TradingViewSignalProcessor;

// Executar teste se rodado diretamente
if (require.main === module) {
    testarProcessamento();
}
