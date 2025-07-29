/**
 * 🔧 CORREÇÃO FINAL - SISTEMA DE TRADING COM DIREÇÃO DO MERCADO
 * 
 * Implementa a lógica correta:
 * - Take Profit = 2x Alavancagem (5x = 10%)
 * - Stop Loss = 3x Alavancagem (5x = 15%)
 * - Direção do mercado: LONG, SHORT, ou BOTH
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class TradingSystemCorrect {
    constructor() {
        this.defaultConfig = {
            leverage: 5,
            balancePercentage: 30,
            takeProfitMultiplier: 2,    // TP = 2x leverage
            stopLossMultiplier: 3,      // SL = 3x leverage
            maxOpenPositions: 2,
            
            // Direção do mercado
            marketDirection: {
                mode: 'BOTH',           // LONG, SHORT, BOTH
                longEnabled: true,
                shortEnabled: true,
                trendFilter: false,
                sentiment: 'NEUTRAL'    // BULLISH, BEARISH, NEUTRAL
            }
        };
    }

    /**
     * Calcular Take Profit correto
     * @param {number} leverage - Alavancagem
     * @returns {number} Take Profit em porcentagem
     */
    calculateTakeProfit(leverage = 5) {
        return leverage * this.defaultConfig.takeProfitMultiplier;
    }

    /**
     * Calcular Stop Loss correto
     * @param {number} leverage - Alavancagem
     * @returns {number} Stop Loss em porcentagem
     */
    calculateStopLoss(leverage = 5) {
        return leverage * this.defaultConfig.stopLossMultiplier;
    }

    /**
     * Verificar se a direção está permitida
     * @param {string} direction - LONG ou SHORT
     * @param {object} marketConfig - Configuração do mercado
     * @returns {boolean} Se a direção está permitida
     */
    isDirectionAllowed(direction, marketConfig = this.defaultConfig.marketDirection) {
        const dir = direction.toUpperCase();
        
        if (marketConfig.mode === 'BOTH') {
            return marketConfig.longEnabled && dir === 'LONG' || 
                   marketConfig.shortEnabled && dir === 'SHORT';
        }
        
        return marketConfig.mode === dir;
    }

    /**
     * Calcular preços de entrada, TP e SL
     * @param {object} signalData - Dados do sinal
     * @returns {object} Preços calculados
     */
    calculatePrices(signalData) {
        const { 
            entryPrice, 
            direction, 
            leverage = this.defaultConfig.leverage 
        } = signalData;

        const entryPriceNum = parseFloat(entryPrice);
        const takeProfitPercent = this.calculateTakeProfit(leverage);
        const stopLossPercent = this.calculateStopLoss(leverage);

        let takeProfitPrice, stopLossPrice;

        if (direction.toUpperCase() === 'LONG') {
            // LONG: TP acima do preço, SL abaixo
            takeProfitPrice = entryPriceNum * (1 + (takeProfitPercent / 100));
            stopLossPrice = entryPriceNum * (1 - (stopLossPercent / 100));
        } else {
            // SHORT: TP abaixo do preço, SL acima
            takeProfitPrice = entryPriceNum * (1 - (takeProfitPercent / 100));
            stopLossPrice = entryPriceNum * (1 + (stopLossPercent / 100));
        }

        return {
            entryPrice: entryPriceNum,
            takeProfitPrice: takeProfitPrice,
            stopLossPrice: stopLossPrice,
            takeProfitPercent: takeProfitPercent,
            stopLossPercent: stopLossPercent,
            direction: direction.toUpperCase(),
            leverage: leverage
        };
    }

    /**
     * Atualizar configurações da Paloma
     */
    async updatePalomaConfig() {
        try {
            console.log('🔧 ATUALIZANDO CONFIGURAÇÕES CORRETAS DA PALOMA');
            console.log('='.repeat(60));

            // Buscar ID da Paloma
            const palomaQuery = `
                SELECT id, name, email FROM users 
                WHERE email = 'pamaral15@hotmail.com';
            `;
            
            const paloma = await pool.query(palomaQuery);
            const userId = paloma.rows[0].id;
            
            console.log(`✅ Paloma ID: ${userId}`);

            // Atualizar configurações corretas
            const configCorretas = {
                leverage: this.defaultConfig.leverage,
                balance_percentage: this.defaultConfig.balancePercentage,
                take_profit_multiplier: this.defaultConfig.takeProfitMultiplier,
                stop_loss_multiplier: this.defaultConfig.stopLossMultiplier,
                max_open_positions: this.defaultConfig.maxOpenPositions,
                market_direction: this.defaultConfig.marketDirection,
                
                // Cálculos demonstrativos
                calculated_examples: {
                    leverage_5x: {
                        take_profit: this.calculateTakeProfit(5),  // 10%
                        stop_loss: this.calculateStopLoss(5)       // 15%
                    },
                    leverage_10x: {
                        take_profit: this.calculateTakeProfit(10), // 20%
                        stop_loss: this.calculateStopLoss(10)      // 30%
                    }
                }
            };

            console.log('\n📊 CONFIGURAÇÕES CORRETAS:');
            console.log(`   🎯 Alavancagem padrão: ${configCorretas.leverage}x`);
            console.log(`   📈 Take Profit: ${configCorretas.calculated_examples.leverage_5x.take_profit}% (2x leverage)`);
            console.log(`   📉 Stop Loss: ${configCorretas.calculated_examples.leverage_5x.stop_loss}% (3x leverage)`);
            console.log(`   💰 Balance por trade: ${configCorretas.balance_percentage}%`);
            console.log(`   🔄 Max posições: ${configCorretas.max_open_positions}`);

            console.log('\n🎯 DIREÇÃO DO MERCADO:');
            console.log(`   📊 Modo: ${configCorretas.market_direction.mode}`);
            console.log(`   📈 LONG habilitado: ${configCorretas.market_direction.longEnabled}`);
            console.log(`   📉 SHORT habilitado: ${configCorretas.market_direction.shortEnabled}`);
            console.log(`   🌍 Sentimento: ${configCorretas.market_direction.sentiment}`);

            // Salvar no banco (se tabela existir)
            const updateQuery = `
                UPDATE user_trading_params 
                SET 
                    take_profit_percent = $2,
                    stop_loss_percent = $3,
                    max_open_positions = $4,
                    risk_settings = $5,
                    updated_at = NOW()
                WHERE user_id = $1;
            `;

            await pool.query(updateQuery, [
                userId,
                configCorretas.calculated_examples.leverage_5x.take_profit,
                configCorretas.calculated_examples.leverage_5x.stop_loss,
                configCorretas.max_open_positions,
                JSON.stringify(configCorretas)
            ]);

            console.log('\n✅ CONFIGURAÇÕES ATUALIZADAS NO BANCO');

            // Exemplo de sinal
            console.log('\n🧪 EXEMPLO DE CÁLCULO:');
            const exemploSinal = {
                entryPrice: 50000,
                direction: 'LONG',
                leverage: 5
            };

            const precos = this.calculatePrices(exemploSinal);
            console.log(`   Symbol: BTCUSDT`);
            console.log(`   Direction: ${precos.direction}`);
            console.log(`   Entry Price: $${precos.entryPrice}`);
            console.log(`   Take Profit: $${precos.takeProfitPrice.toFixed(2)} (${precos.takeProfitPercent}%)`);
            console.log(`   Stop Loss: $${precos.stopLossPrice.toFixed(2)} (${precos.stopLossPercent}%)`);
            console.log(`   Leverage: ${precos.leverage}x`);

            return configCorretas;

        } catch (error) {
            console.error('❌ Erro:', error.message);
            throw error;
        }
    }

    /**
     * Processar sinal do TradingView
     * @param {object} webhookData - Dados do webhook
     * @returns {object} Dados processados para execução
     */
    processWebhookSignal(webhookData) {
        try {
            const { symbol, direction, price, leverage = 5 } = webhookData;

            // Verificar se direção está permitida
            if (!this.isDirectionAllowed(direction)) {
                return {
                    success: false,
                    error: `Direção ${direction} não permitida. Configuração atual: ${this.defaultConfig.marketDirection.mode}`
                };
            }

            // Calcular preços
            const prices = this.calculatePrices({
                entryPrice: price,
                direction: direction,
                leverage: leverage
            });

            // Retornar dados para execução
            return {
                success: true,
                symbol: symbol,
                direction: prices.direction,
                entryPrice: prices.entryPrice,
                takeProfitPrice: prices.takeProfitPrice,
                stopLossPrice: prices.stopLossPrice,
                leverage: prices.leverage,
                calculations: {
                    takeProfitPercent: prices.takeProfitPercent,
                    stopLossPercent: prices.stopLossPercent,
                    formula: {
                        takeProfit: `${leverage}x leverage × 2 = ${prices.takeProfitPercent}%`,
                        stopLoss: `${leverage}x leverage × 3 = ${prices.stopLossPercent}%`
                    }
                },
                timestamp: new Date().toISOString(),
                user: 'PALOMA_AMARAL'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

async function executarCorrecaoFinal() {
    try {
        console.log('🚀 EXECUTANDO CORREÇÃO FINAL DO SISTEMA');
        console.log('='.repeat(60));

        const trading = new TradingSystemCorrect();
        
        // Atualizar configurações da Paloma
        await trading.updatePalomaConfig();

        console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('\n📋 RESUMO DAS CORREÇÕES:');
        console.log('   ✅ Fórmula TP/SL corrigida: TP = 2x leverage, SL = 3x leverage');
        console.log('   ✅ Direção do mercado implementada: LONG, SHORT, BOTH');
        console.log('   ✅ Configurações da Paloma atualizadas');
        console.log('   ✅ Sistema pronto para trading real');

        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('   1. Configurar webhooks TradingView com nova lógica');
        console.log('   2. Testar sinais LONG e SHORT');
        console.log('   3. Monitorar cálculos de TP/SL em tempo real');
        console.log('   4. Validar direção do mercado nos sinais');

    } catch (error) {
        console.error('❌ Erro na correção:', error.message);
    } finally {
        await pool.end();
    }
}

// Exportar classe para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TradingSystemCorrect;
}

// Executar correção se chamado diretamente
if (require.main === module) {
    executarCorrecaoFinal();
}
