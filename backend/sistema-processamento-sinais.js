/**
 * 🤖 SISTEMA DE PROCESSAMENTO DE SINAIS TRADINGVIEW
 * 
 * ESPECIFICAÇÃO COMPLETA:
 * 1. Fear & Greed define direção permitida do mercado
 * 2. TradingView envia sinais para abertura/fechamento
 * 3. IA apenas monitora e processa sinais (SEM AUTONOMIA)
 * 4. Sistema abre operações com 30% do saldo por trade
 * 5. Máximo 2 operações simultâneas
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:LukinhaCBB123@junction.proxy.rlwy.net:15433/railway',
    ssl: { rejectUnauthorized: false }
});

class TradingSignalProcessor {
    constructor() {
        this.validSignals = [
            'SINAL_LONG',
            'SINAL_LONG_FORTE', 
            'SINAL_SHORT',
            'SINAL_SHORT_FORTE',
            'FECHE_LONG',
            'FECHE_SHORT'
        ];
    }

    async processTradingViewSignal(signalData) {
        console.log('📡 PROCESSANDO SINAL TRADINGVIEW');
        console.log('='.repeat(50));
        console.log(`📊 Sinal recebido: ${signalData.signal}`);
        console.log(`💰 Par: ${signalData.symbol}`);
        console.log(`💵 Preço: ${signalData.price}`);
        
        try {
            // 1. Validar sinal
            if (!this.isValidSignal(signalData.signal)) {
                console.log('❌ Sinal inválido - ignorando');
                return { success: false, reason: 'Sinal não reconhecido' };
            }

            // 2. Verificar direção do mercado (Fear & Greed)
            const marketDirection = await this.getMarketDirection();
            console.log(`🎯 Direção do mercado: ${marketDirection.status}`);

            // 3. Processar sinal baseado no tipo
            if (this.isOpenSignal(signalData.signal)) {
                return await this.processOpenSignal(signalData, marketDirection);
            } else if (this.isCloseSignal(signalData.signal)) {
                return await this.processCloseSignal(signalData);
            }

        } catch (error) {
            console.error('❌ Erro ao processar sinal:', error.message);
            return { success: false, reason: error.message };
        }
    }

    isValidSignal(signal) {
        return this.validSignals.includes(signal);
    }

    isOpenSignal(signal) {
        return ['SINAL_LONG', 'SINAL_LONG_FORTE', 'SINAL_SHORT', 'SINAL_SHORT_FORTE'].includes(signal);
    }

    isCloseSignal(signal) {
        return ['FECHE_LONG', 'FECHE_SHORT'].includes(signal);
    }

    async getMarketDirection() {
        try {
            // Buscar Fear & Greed atual
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

            // Determinar direções permitidas
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
            console.log('⚠️ Erro ao obter Fear & Greed, usando fallback equilibrado');
            return {
                value: 50,
                status: 'EQUILIBRADO',
                allowedDirections: ['LONG', 'SHORT'],
                description: 'LONG e SHORT permitidos (fallback)'
            };
        }
    }

    async processOpenSignal(signalData, marketDirection) {
        console.log('📈 PROCESSANDO SINAL DE ABERTURA DE OPERAÇÃO');
        console.log('-'.repeat(40));

        // Determinar direção do sinal
        const signalDirection = signalData.signal.includes('LONG') ? 'LONG' : 'SHORT';
        console.log(`🎯 Direção da operação: ${signalDirection}`);

        // Verificar se direção é permitida pelo Fear & Greed
        if (!marketDirection.allowedDirections.includes(signalDirection)) {
            console.log(`❌ Operações ${signalDirection} não permitidas pelo Fear & Greed`);
            console.log(`📊 Fear & Greed: ${marketDirection.value} - ${marketDirection.description}`);
            return { 
                success: false, 
                reason: `Operações ${signalDirection} bloqueadas pelo Fear & Greed (${marketDirection.value})` 
            };
        }

        // Buscar usuário Paloma
        const userQuery = `
            SELECT id, balance_usd 
            FROM users 
            WHERE name = 'Paloma'
        `;
        
        const userResult = await pool.query(userQuery);
        if (userResult.rows.length === 0) {
            return { success: false, reason: 'Usuário Paloma não encontrado' };
        }

        const user = userResult.rows[0];
        console.log(`👤 Usuário: Paloma (ID: ${user.id})`);
        console.log(`💰 Saldo disponível: $${user.balance_usd} USDT`);

        // Verificar posições abertas
        const openPositionsQuery = `
            SELECT COUNT(*) as count 
            FROM user_operations 
            WHERE user_id = $1 AND status = 'OPEN'
        `;
        
        const positionsResult = await pool.query(openPositionsQuery, [user.id]);
        const openPositions = parseInt(positionsResult.rows[0].count);
        
        console.log(`📊 Posições abertas: ${openPositions}/2`);

        if (openPositions >= 2) {
            console.log('❌ Limite de 2 posições simultâneas atingido');
            return { success: false, reason: 'Limite de posições simultâneas atingido' };
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
        
        let params = {
            leverage_default: 5,
            take_profit_multiplier: 3,
            stop_loss_multiplier: 2,
            balance_percentage: 30,
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

        console.log('💡 PARÂMETROS DA OPERAÇÃO:');
        console.log(`   💰 Valor do trade: $${tradeAmount.toFixed(2)} USDT (${params.balance_percentage}% do saldo)`);
        console.log(`   🎯 Alavancagem: ${leverage}x`);
        console.log(`   📊 Tamanho da posição: $${positionSize.toFixed(2)} USDT`);
        console.log(`   📈 Take Profit: ${tpPercent}%`);
        console.log(`   📉 Stop Loss: ${slPercent}%`);

        // Calcular preços de TP e SL
        const entryPrice = parseFloat(signalData.price);
        let takeProfitPrice, stopLossPrice;

        if (signalDirection === 'LONG') {
            takeProfitPrice = entryPrice * (1 + tpPercent / 100);
            stopLossPrice = entryPrice * (1 - slPercent / 100);
        } else {
            takeProfitPrice = entryPrice * (1 - tpPercent / 100);
            stopLossPrice = entryPrice * (1 + slPercent / 100);
        }

        console.log(`   🎯 Preço de entrada: $${entryPrice}`);
        console.log(`   📈 Take Profit: $${takeProfitPrice.toFixed(2)}`);
        console.log(`   📉 Stop Loss: $${stopLossPrice.toFixed(2)}`);

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
                fear_greed_value,
                created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', 'TRADINGVIEW', $11, $12, NOW()
            ) RETURNING id
        `;

        const signalStrength = signalData.signal.includes('FORTE') ? 'STRONG' : 'NORMAL';
        
        const operationResult = await pool.query(operationQuery, [
            user.id,
            signalData.symbol,
            signalDirection,
            entryPrice,
            positionSize,
            leverage,
            takeProfitPrice,
            stopLossPrice,
            tpPercent,
            slPercent,
            signalStrength,
            marketDirection.value
        ]);

        const operationId = operationResult.rows[0].id;

        console.log(`✅ Operação registrada com ID: ${operationId}`);
        console.log('🚀 SINAL PROCESSADO COM SUCESSO!');

        return {
            success: true,
            operationId: operationId,
            direction: signalDirection,
            amount: tradeAmount,
            leverage: leverage,
            entryPrice: entryPrice,
            takeProfitPrice: takeProfitPrice,
            stopLossPrice: stopLossPrice,
            fearGreedValue: marketDirection.value
        };
    }

    async processCloseSignal(signalData) {
        console.log('🔒 PROCESSANDO SINAL DE FECHAMENTO');
        console.log('-'.repeat(40));

        const closeDirection = signalData.signal === 'FECHE_LONG' ? 'LONG' : 'SHORT';
        console.log(`🎯 Fechando posições: ${closeDirection}`);

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
              AND uo.status = 'OPEN'
              AND uo.side = $1
        `;

        const positionsResult = await pool.query(openPositionsQuery, [closeDirection]);
        
        if (positionsResult.rows.length === 0) {
            console.log(`⚠️ Nenhuma posição ${closeDirection} aberta para fechar`);
            return { success: false, reason: `Nenhuma posição ${closeDirection} aberta` };
        }

        console.log(`📊 Encontradas ${positionsResult.rows.length} posições ${closeDirection} para fechar`);

        const closeResults = [];

        for (const position of positionsResult.rows) {
            try {
                // Atualizar status da operação para CLOSED
                const closeQuery = `
                    UPDATE user_operations 
                    SET 
                        status = 'CLOSED',
                        exit_price = $1,
                        close_reason = 'TRADINGVIEW_SIGNAL',
                        closed_at = NOW()
                    WHERE id = $2
                `;

                await pool.query(closeQuery, [signalData.price, position.id]);

                console.log(`✅ Posição ${position.id} (${position.symbol}) fechada`);
                console.log(`   Entrada: $${position.entry_price}`);
                console.log(`   Saída: $${signalData.price}`);

                closeResults.push({
                    operationId: position.id,
                    symbol: position.symbol,
                    entryPrice: position.entry_price,
                    exitPrice: signalData.price,
                    success: true
                });

            } catch (error) {
                console.error(`❌ Erro ao fechar posição ${position.id}:`, error.message);
                closeResults.push({
                    operationId: position.id,
                    symbol: position.symbol,
                    success: false,
                    error: error.message
                });
            }
        }

        console.log('🔒 SINAIS DE FECHAMENTO PROCESSADOS!');

        return {
            success: true,
            direction: closeDirection,
            closedPositions: closeResults.length,
            details: closeResults
        };
    }

    async monitorOpenPositions() {
        console.log('👁️ MONITORAMENTO DE POSIÇÕES ABERTAS');
        console.log('-'.repeat(40));

        try {
            const openPositionsQuery = `
                SELECT 
                    uo.id,
                    uo.symbol,
                    uo.side,
                    uo.entry_price,
                    uo.take_profit_price,
                    uo.stop_loss_price,
                    uo.quantity,
                    uo.leverage,
                    uo.created_at,
                    u.name
                FROM user_operations uo
                JOIN users u ON uo.user_id = u.id
                WHERE uo.status = 'OPEN'
                ORDER BY uo.created_at DESC
            `;

            const positions = await pool.query(openPositionsQuery);

            if (positions.rows.length === 0) {
                console.log('📊 Nenhuma posição aberta para monitorar');
                return { openPositions: 0, positions: [] };
            }

            console.log(`📊 Monitorando ${positions.rows.length} posições abertas:`);

            positions.rows.forEach((pos, index) => {
                console.log(`\n   ${index + 1}. ${pos.symbol} ${pos.side}`);
                console.log(`      ID: ${pos.id}`);
                console.log(`      Entrada: $${pos.entry_price}`);
                console.log(`      TP: $${pos.take_profit_price}`);
                console.log(`      SL: $${pos.stop_loss_price}`);
                console.log(`      Quantidade: $${pos.quantity}`);
                console.log(`      Alavancagem: ${pos.leverage}x`);
                console.log(`      Aberta: ${pos.created_at}`);
            });

            return {
                openPositions: positions.rows.length,
                positions: positions.rows
            };

        } catch (error) {
            console.error('❌ Erro no monitoramento:', error.message);
            return { openPositions: 0, positions: [], error: error.message };
        }
    }
}

// Exemplo de uso
async function exemploProcessamento() {
    console.log('🧪 EXEMPLO DE PROCESSAMENTO DE SINAIS');
    console.log('='.repeat(60));

    const processor = new TradingSignalProcessor();

    // Exemplo 1: Sinal de abertura LONG
    console.log('\n1️⃣ TESTANDO SINAL LONG:');
    const signalLong = {
        signal: 'SINAL_LONG',
        symbol: 'BTCUSDT',
        price: '50000',
        timestamp: Date.now()
    };

    const resultLong = await processor.processTradingViewSignal(signalLong);
    console.log('Resultado:', resultLong);

    // Exemplo 2: Monitoramento
    console.log('\n2️⃣ MONITORAMENTO:');
    await processor.monitorOpenPositions();

    await pool.end();
}

// Exportar para uso em outros módulos
module.exports = TradingSignalProcessor;

// Executar exemplo se rodado diretamente
if (require.main === module) {
    exemploProcessamento();
}
