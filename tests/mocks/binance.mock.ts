// Mock implementation for Binance API
export class BinanceMock {
  private isTestnet: boolean = true;
  private mockBalances: Record<string, number> = {
    'USDT': 1000,
    'BTC': 0.5,
    'ETH': 10
  };

  private mockPrices: Record<string, number> = {
    'BTCUSDT': 45000,
    'ETHUSDT': 3000,
    'ADAUSDT': 0.5
  };

  constructor(apiKey?: string, apiSecret?: string, testnet: boolean = true) {
    this.isTestnet = testnet;
  }

  // Mock account info
  async account() {
    return {
      accountType: "SPOT",
      balances: Object.entries(this.mockBalances).map(([asset, free]) => ({
        asset,
        free: free.toString(),
        locked: "0.00000000"
      })),
      buyerCommission: 0,
      canDeposit: true,
      canTrade: true,
      canWithdraw: true,
      makerCommission: 10,
      permissions: ["SPOT"],
      sellerCommission: 0,
      takerCommission: 10,
      updateTime: Date.now()
    };
  }

  // Mock price ticker
  async prices(symbol?: string) {
    if (symbol) {
      return {
        symbol,
        price: this.mockPrices[symbol] || "0.00000000"
      };
    }

    return Object.entries(this.mockPrices).map(([symbol, price]) => ({
      symbol,
      price: price.toString()
    }));
  }

  // Mock order creation
  async order(options: any) {
    const orderId = Math.floor(Math.random() * 1000000);
    const timestamp = Date.now();
    
    return {
      symbol: options.symbol,
      orderId,
      orderListId: -1,
      clientOrderId: options.newClientOrderId || `test_${orderId}`,
      transactTime: timestamp,
      price: options.price || "0.00000000",
      origQty: options.quantity,
      executedQty: options.quantity,
      cummulativeQuoteQty: options.quantity,
      status: "FILLED",
      timeInForce: options.timeInForce || "GTC",
      type: options.type || "MARKET",
      side: options.side,
      workingTime: timestamp,
      selfTradePreventionMode: "NONE",
      fills: [{
        price: options.price || this.mockPrices[options.symbol]?.toString() || "0.00000000",
        qty: options.quantity,
        commission: "0.001",
        commissionAsset: "USDT",
        tradeId: Math.floor(Math.random() * 10000)
      }]
    };
  }

  // Mock order status
  async getOrder(symbol: string, orderId: number) {
    return {
      symbol,
      orderId,
      orderListId: -1,
      clientOrderId: `test_${orderId}`,
      price: this.mockPrices[symbol]?.toString() || "0.00000000",
      origQty: "1.00000000",
      executedQty: "1.00000000",
      cummulativeQuoteQty: "1.00000000",
      status: "FILLED",
      timeInForce: "GTC",
      type: "MARKET",
      side: "BUY",
      stopPrice: "0.00000000",
      icebergQty: "0.00000000",
      time: Date.now(),
      updateTime: Date.now(),
      isWorking: false,
      origQuoteOrderQty: "0.00000000"
    };
  }

  // Mock cancel order
  async cancelOrder(symbol: string, orderId: number) {
    return {
      symbol,
      origClientOrderId: `test_${orderId}`,
      orderId,
      orderListId: -1,
      clientOrderId: `cancel_${orderId}`,
      price: "0.00000000",
      origQty: "1.00000000",
      executedQty: "0.00000000",
      cummulativeQuoteQty: "0.00000000",
      status: "CANCELED",
      timeInForce: "GTC",
      type: "LIMIT",
      side: "BUY"
    };
  }

  // Mock exchange info
  async exchangeInfo() {
    return {
      timezone: "UTC",
      serverTime: Date.now(),
      rateLimits: [
        {
          rateLimitType: "REQUEST_WEIGHT",
          interval: "MINUTE",
          intervalNum: 1,
          limit: 1200
        }
      ],
      symbols: [
        {
          symbol: "BTCUSDT",
          status: "TRADING",
          baseAsset: "BTC",
          quoteAsset: "USDT",
          baseAssetPrecision: 8,
          quotePrecision: 8,
          quoteAssetPrecision: 8,
          orderTypes: ["LIMIT", "LIMIT_MAKER", "MARKET", "STOP_LOSS_LIMIT", "TAKE_PROFIT_LIMIT"],
          icebergAllowed: true,
          ocoAllowed: true,
          isSpotTradingAllowed: true,
          isMarginTradingAllowed: true,
          filters: []
        }
      ]
    };
  }

  // Mock 24hr ticker
  async dailyStats(symbol?: string) {
    const stats = {
      symbol: symbol || "BTCUSDT",
      priceChange: "1000.00000000",
      priceChangePercent: "2.273",
      weightedAvgPrice: "44500.00000000",
      prevClosePrice: "44000.00000000",
      lastPrice: this.mockPrices[symbol || "BTCUSDT"]?.toString() || "45000.00000000",
      lastQty: "0.10000000",
      bidPrice: "44999.00000000",
      askPrice: "45001.00000000",
      openPrice: "44000.00000000",
      highPrice: "46000.00000000",
      lowPrice: "43000.00000000",
      volume: "1000000.00000000",
      quoteVolume: "45000000000.00000000",
      openTime: Date.now() - 86400000,
      closeTime: Date.now(),
      firstId: 1,
      lastId: 100000,
      count: 100000
    };

    return symbol ? stats : [stats];
  }

  // Mock ping
  async ping() {
    return {};
  }

  // Mock server time
  async time() {
    return {
      serverTime: Date.now()
    };
  }

  // Helper method to simulate API errors
  simulateError(errorType: 'NETWORK' | 'API_LIMIT' | 'INVALID_KEY' | 'INSUFFICIENT_BALANCE') {
    const errors = {
      NETWORK: new Error('Network Error: Connection timeout'),
      API_LIMIT: new Error('API-key format invalid'),
      INVALID_KEY: new Error('Invalid API key'),
      INSUFFICIENT_BALANCE: new Error('Account has insufficient balance for requested action')
    };

    throw errors[errorType];
  }

  // Helper to update mock data
  updateMockBalance(asset: string, amount: number) {
    this.mockBalances[asset] = amount;
  }

  updateMockPrice(symbol: string, price: number) {
    this.mockPrices[symbol] = price;
  }
}

export default BinanceMock;
