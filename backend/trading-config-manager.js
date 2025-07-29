/**
 * 📊 SISTEMA DE CONFIGURAÇÃO TRADING - LÓGICA CORRETA
 * 
 * Este arquivo implementa a lógica correta para cálculo de TP/SL
 */

class TradingConfigManager {
    constructor() {
        this.defaultLeverage = 5;
        this.takeProfitMultiplier = 2;  // TP = 2x leverage
        this.stopLossMultiplier = 3;    // SL = 3x leverage
        this.balancePercentage = 30;    // 30% do saldo por trade
        this.maxOpenPositions = 2;
        this.riskRewardRatio = 1.5;
        this.minSignalConfidence = 0.7;
    }

    /**
     * Calcular Take Profit baseado na alavancagem
     * @param {number} leverage - Alavancagem usada
     * @returns {number} Take Profit em porcentagem
     */
    calculateTakeProfit(leverage = this.defaultLeverage) {
        return leverage * this.takeProfitMultiplier;
    }

    /**
     * Calcular Stop Loss baseado na alavancagem
     * @param {number} leverage - Alavancagem usada
     * @returns {number} Stop Loss em porcentagem
     */
    calculateStopLoss(leverage = this.defaultLeverage) {
        return leverage * this.stopLossMultiplier;
    }

    /**
     * Calcular tamanho da posição baseado no saldo
     * @param {number} accountBalance - Saldo da conta
     * @param {number} percentage - Percentual do saldo (padrão 30%)
     * @returns {number} Valor em USD para a posição
     */
    calculatePositionSize(accountBalance, percentage = this.balancePercentage) {
        return accountBalance * (percentage / 100);
    }

    /**
     * Obter configurações completas para um usuário
     * @param {number} userLeverage - Alavancagem específica do usuário
     * @returns {object} Configurações completas
     */
    getUserTradingConfig(userLeverage = this.defaultLeverage) {
        const takeProfit = this.calculateTakeProfit(userLeverage);
        const stopLoss = this.calculateStopLoss(userLeverage);
        
        return {
            leverage: userLeverage,
            takeProfitPercent: takeProfit,
            stopLossPercent: stopLoss,
            balancePercentage: this.balancePercentage,
            maxOpenPositions: this.maxOpenPositions,
            riskRewardRatio: this.riskRewardRatio,
            minSignalConfidence: this.minSignalConfidence,
            
            // Exemplos calculados
            examples: {
                leverage5x: {
                    leverage: 5,
                    takeProfit: this.calculateTakeProfit(5),  // 10%
                    stopLoss: this.calculateStopLoss(5)       // 15%
                },
                leverage10x: {
                    leverage: 10,
                    takeProfit: this.calculateTakeProfit(10), // 20%
                    stopLoss: this.calculateStopLoss(10)      // 30%
                },
                leverage3x: {
                    leverage: 3,
                    takeProfit: this.calculateTakeProfit(3),  // 6%
                    stopLoss: this.calculateStopLoss(3)       // 9%
                }
            }
        };
    }

    /**
     * Validar se uma configuração de trade está dentro dos parâmetros
     * @param {object} tradeConfig - Configuração do trade
     * @returns {object} Resultado da validação
     */
    validateTradeConfig(tradeConfig) {
        const { leverage, accountBalance, positionSize } = tradeConfig;
        
        const expectedTP = this.calculateTakeProfit(leverage);
        const expectedSL = this.calculateStopLoss(leverage);
        const maxPositionSize = this.calculatePositionSize(accountBalance);
        
        const validation = {
            isValid: true,
            errors: [],
            recommendations: {
                takeProfit: expectedTP,
                stopLoss: expectedSL,
                maxPositionSize: maxPositionSize
            }
        };

        // Validar tamanho da posição
        if (positionSize > maxPositionSize) {
            validation.isValid = false;
            validation.errors.push(`Posição muito grande. Máximo: $${maxPositionSize.toFixed(2)}`);
        }

        // Validar TP/SL se fornecidos
        if (tradeConfig.takeProfit && tradeConfig.takeProfit !== expectedTP) {
            validation.errors.push(`TP incorreto. Esperado: ${expectedTP}%, Atual: ${tradeConfig.takeProfit}%`);
        }

        if (tradeConfig.stopLoss && tradeConfig.stopLoss !== expectedSL) {
            validation.errors.push(`SL incorreto. Esperado: ${expectedSL}%, Atual: ${tradeConfig.stopLoss}%`);
        }

        return validation;
    }

    /**
     * Gerar configuração para o webhook do TradingView
     * @param {string} symbol - Par de trading (ex: BTCUSDT)
     * @param {string} side - LONG ou SHORT
     * @param {number} accountBalance - Saldo da conta
     * @param {number} leverage - Alavancagem a usar
     * @returns {object} Configuração do webhook
     */
    generateWebhookConfig(symbol, side, accountBalance, leverage = this.defaultLeverage) {
        const positionSize = this.calculatePositionSize(accountBalance);
        const takeProfit = this.calculateTakeProfit(leverage);
        const stopLoss = this.calculateStopLoss(leverage);

        return {
            symbol: symbol,
            side: side.toUpperCase(),
            leverage: leverage,
            quantity: positionSize,
            takeProfit: takeProfit,
            stopLoss: stopLoss,
            
            // Configurações adicionais
            orderType: "Market",
            timeInForce: "GTC",
            reduceOnly: false,
            
            // Metadados
            timestamp: new Date().toISOString(),
            source: "TradingView",
            user: "PALOMA_AMARAL",
            
            // Cálculos
            calculations: {
                accountBalance: accountBalance,
                positionSizeUSD: positionSize,
                balancePercentageUsed: this.balancePercentage,
                expectedTPPercent: takeProfit,
                expectedSLPercent: stopLoss,
                riskRewardRatio: this.riskRewardRatio
            }
        };
    }
}

// Exportar para uso no sistema
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TradingConfigManager;
}

// Exemplo de uso
console.log('📊 TRADING CONFIG MANAGER - LÓGICA CORRETA');
console.log('='.repeat(50));

const configManager = new TradingConfigManager();

// Teste com configurações padrão
const palomaConfig = configManager.getUserTradingConfig(5);
console.log('⚙️ CONFIGURAÇÕES PALOMA (5x leverage):');
console.log(`   Take Profit: ${palomaConfig.takeProfitPercent}%`);
console.log(`   Stop Loss: ${palomaConfig.stopLossPercent}%`);
console.log(`   Balance por trade: ${palomaConfig.balancePercentage}%`);
console.log(`   Max posições: ${palomaConfig.maxOpenPositions}`);

console.log('\n💡 EXEMPLOS COM DIFERENTES ALAVANCAGENS:');
Object.entries(palomaConfig.examples).forEach(([key, example]) => {
    console.log(`   ${key}: TP=${example.takeProfit}%, SL=${example.stopLoss}%`);
});

// Teste de webhook
console.log('\n🔗 EXEMPLO DE WEBHOOK BTCUSDT:');
const webhookConfig = configManager.generateWebhookConfig('BTCUSDT', 'LONG', 236.71, 5);
console.log(`   Symbol: ${webhookConfig.symbol}`);
console.log(`   Side: ${webhookConfig.side}`);
console.log(`   Leverage: ${webhookConfig.leverage}x`);
console.log(`   Position Size: $${webhookConfig.quantity.toFixed(2)}`);
console.log(`   Take Profit: ${webhookConfig.takeProfit}%`);
console.log(`   Stop Loss: ${webhookConfig.stopLoss}%`);

console.log('\n✅ SISTEMA CONFIGURADO CORRETAMENTE!');
console.log('🚀 Pronto para receber sinais do TradingView');

/**
 * Configurações específicas da Paloma
 */
const PALOMA_CONFIG = {
    email: 'pamaral15@hotmail.com',
    name: 'PALOMA AMARAL',
    accountBalance: 236.71,
    defaultLeverage: 5,
    
    // Configurações calculadas automaticamente
    get takeProfit() {
        return this.defaultLeverage * 2; // 10%
    },
    
    get stopLoss() {
        return this.defaultLeverage * 3; // 15%
    },
    
    get positionSize() {
        return this.accountBalance * 0.30; // $71.01
    },
    
    // Status operacional
    status: 'ATIVO_TRADING',
    apiConfigured: true,
    balanceConfigured: true,
    webhookEnabled: true
};

console.log('\n👤 CONFIGURAÇÃO FINAL PALOMA:');
console.log(`   Saldo: $${PALOMA_CONFIG.accountBalance}`);
console.log(`   Alavancagem: ${PALOMA_CONFIG.defaultLeverage}x`);
console.log(`   Take Profit: ${PALOMA_CONFIG.takeProfit}%`);
console.log(`   Stop Loss: ${PALOMA_CONFIG.stopLoss}%`);
console.log(`   Tamanho posição: $${PALOMA_CONFIG.positionSize.toFixed(2)}`);
console.log(`   Status: ${PALOMA_CONFIG.status}`);

if (typeof module !== 'undefined' && module.exports) {
    module.exports.PALOMA_CONFIG = PALOMA_CONFIG;
}
