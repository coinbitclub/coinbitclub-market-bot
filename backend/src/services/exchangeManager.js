/**
 * 🔄 EXCHANGE MANAGER
 */
const BinanceConnector = require('../exchanges/binanceConnector');

class ExchangeManager {
    constructor() {
        this.exchanges = new Map();
    }

    addExchange(userId, exchangeName, credentials) {
        const key = userId + '_' + exchangeName;
        let connector = new BinanceConnector(credentials.apiKey, credentials.apiSecret, credentials.testnet);
        
        this.exchanges.set(key, { userId, exchangeName, connector, addedAt: new Date().toISOString() });
        return { success: true, key };
    }

    async executeOrder(userId, exchangeName, orderData) {
        const key = userId + '_' + exchangeName;
        const exchange = this.exchanges.get(key);

        if (!exchange) {
            return { success: false, error: 'Exchange não configurada' };
        }

        const result = await exchange.connector.createOrder(
            orderData.symbol, orderData.side, orderData.type, orderData.quantity, orderData.price
        );

        console.log('📊 Ordem executada:', result);
        return { success: result.success, userId, exchangeName, orderData: result, executedAt: new Date().toISOString() };
    }
}

const exchangeManager = new ExchangeManager();
module.exports = exchangeManager;