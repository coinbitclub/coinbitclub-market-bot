// Mock implementation for Bybit API
export class BybitMock {
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

  constructor(options?: { key?: string; secret?: string; testnet?: boolean }) {
    this.isTestnet = options?.testnet || true;
  }

  // Mock account balance
  async getWalletBalance(params?: any) {
    return {
      retCode: 0,
      retMsg: "OK",
      result: {
        list: [{
          accountType: "UNIFIED",
          coin: Object.entries(this.mockBalances).map(([coin, balance]) => ({
            coin,
            equity: balance.toString(),
            availableToWithdraw: balance.toString(),
            usdValue: (balance * (this.mockPrices[coin + 'USDT'] || 1)).toString(),
            walletBalance: balance.toString(),
            unrealisedPnl: "0",
            cumRealisedPnl: "0"
          }))
        }]
      },
      retExtInfo: {},
      time: Date.now()
    };
  }

  // Mock ticker price
  async getTickers(params?: { symbol?: string; category?: string }) {
    const symbol = params?.symbol;
    const mockTicker = {
      symbol: symbol || "BTCUSDT",
      lastPrice: this.mockPrices[symbol || "BTCUSDT"]?.toString() || "45000",
      indexPrice: this.mockPrices[symbol || "BTCUSDT"]?.toString() || "45000",
      markPrice: this.mockPrices[symbol || "BTCUSDT"]?.toString() || "45000",
      prevPrice24h: "44000",
      price24hPcnt: "0.0227",
      highPrice24h: "46000",
      lowPrice24h: "43000",
      prevPrice1h: "44800",
      openInterest: "15000",
      openInterestValue: "675000000",
      turnover24h: "2050000000",
      volume24h: "45000",
      fundingRate: "0.0001",
      nextFundingTime: (Date.now() + 8 * 60 * 60 * 1000).toString(),
      predictedDeliveryPrice: "",
      basisRate: "",
      deliveryFeeRate: "",
      deliveryTime: "0",
      ask1Size: "0.1",
      bid1Price: "44999",
      ask1Price: "45001",
      bid1Size: "0.1"
    };

    return {
      retCode: 0,
      retMsg: "OK",
      result: {
        category: params?.category || "spot",
        list: [mockTicker]
      },
      retExtInfo: {},
      time: Date.now()
    };
  }

  // Mock place order
  async submitOrder(params: any) {
    const orderId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      retCode: 0,
      retMsg: "OK",
      result: {
        orderId,
        orderLinkId: params.orderLinkId || `link_${orderId}`,
        symbol: params.symbol,
        createTime: Date.now().toString(),
        category: params.category || "spot",
        side: params.side,
        orderType: params.orderType,
        qty: params.qty,
        price: params.price || this.mockPrices[params.symbol]?.toString() || "0",
        timeInForce: params.timeInForce || "GTC",
        orderStatus: "Filled",
        avgPrice: params.price || this.mockPrices[params.symbol]?.toString() || "0",
        cumExecQty: params.qty,
        cumExecValue: (parseFloat(params.qty) * parseFloat(params.price || this.mockPrices[params.symbol]?.toString() || "0")).toString(),
        cumExecFee: "0.001",
        leavesQty: "0"
      },
      retExtInfo: {},
      time: Date.now()
    };
  }

  // Mock get order
  async getOrderHistory(params: { symbol?: string; orderId?: string; orderLinkId?: string }) {
    const orderId = params.orderId || `mock_${Date.now()}`;
    
    return {
      retCode: 0,
      retMsg: "OK",
      result: {
        category: "spot",
        list: [{
          orderId,
          orderLinkId: params.orderLinkId || `link_${orderId}`,
          symbol: params.symbol || "BTCUSDT",
          createTime: Date.now().toString(),
          updateTime: Date.now().toString(),
          side: "Buy",
          orderType: "Market",
          qty: "1",
          price: this.mockPrices[params.symbol || "BTCUSDT"]?.toString() || "45000",
          timeInForce: "IOC",
          orderStatus: "Filled",
          avgPrice: this.mockPrices[params.symbol || "BTCUSDT"]?.toString() || "45000",
          cumExecQty: "1",
          cumExecValue: this.mockPrices[params.symbol || "BTCUSDT"]?.toString() || "45000",
          cumExecFee: "0.045",
          leavesQty: "0",
          blockTradeId: "",
          isLeverage: "0",
          rejectReason: "EC_NoError"
        }],
        nextPageCursor: ""
      },
      retExtInfo: {},
      time: Date.now()
    };
  }

  // Mock cancel order
  async cancelOrder(params: { symbol: string; orderId?: string; orderLinkId?: string }) {
    return {
      retCode: 0,
      retMsg: "OK",
      result: {
        orderId: params.orderId || `mock_${Date.now()}`,
        orderLinkId: params.orderLinkId || ""
      },
      retExtInfo: {},
      time: Date.now()
    };
  }

  // Mock instruments info
  async getInstrumentsInfo(params?: { symbol?: string; category?: string }) {
    return {
      retCode: 0,
      retMsg: "OK",
      result: {
        category: params?.category || "spot",
        list: [{
          symbol: params?.symbol || "BTCUSDT",
          baseCoin: "BTC",
          quoteCoin: "USDT",
          status: "Trading",
          innovation: "0",
          marginTrading: "both",
          lotSizeFilter: {
            basePrecision: "0.000001",
            quotePrecision: "0.01",
            minOrderQty: "0.000048",
            maxOrderQty: "71.73956243",
            minOrderAmt: "1",
            maxOrderAmt: "2000000"
          },
          priceFilter: {
            tickSize: "0.01"
          }
        }]
      },
      retExtInfo: {},
      time: Date.now()
    };
  }

  // Mock server time
  async getServerTime() {
    return {
      retCode: 0,
      retMsg: "OK",
      result: {
        timeSecond: Math.floor(Date.now() / 1000).toString(),
        timeNano: (Date.now() * 1000000).toString()
      },
      retExtInfo: {},
      time: Date.now()
    };
  }

  // Mock positions
  async getPositionInfo(params?: { symbol?: string; category?: string }) {
    return {
      retCode: 0,
      retMsg: "OK",
      result: {
        category: params?.category || "linear",
        list: []
      },
      retExtInfo: {},
      time: Date.now()
    };
  }

  // Mock kline data
  async getKline(params: { symbol: string; interval: string; start?: number; end?: number }) {
    const klines: string[][] = [];
    const now = Date.now();
    const interval = this.getIntervalMs(params.interval);
    
    // Generate 100 mock klines
    for (let i = 99; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const basePrice = this.mockPrices[params.symbol] || 45000;
      const variation = (Math.random() - 0.5) * 0.02; // 2% variation
      const price = basePrice * (1 + variation);
      
      klines.push([
        timestamp.toString(),
        (price * 0.998).toString(), // open
        (price * 1.002).toString(), // high
        (price * 0.996).toString(), // low
        price.toString(), // close
        (Math.random() * 100).toString(), // volume
        "0" // turnover
      ]);
    }

    return {
      retCode: 0,
      retMsg: "OK",
      result: {
        symbol: params.symbol,
        category: "spot",
        list: klines
      },
      retExtInfo: {},
      time: Date.now()
    };
  }

  private getIntervalMs(interval: string): number {
    const intervals: Record<string, number> = {
      '1': 60 * 1000,
      '3': 3 * 60 * 1000,
      '5': 5 * 60 * 1000,
      '15': 15 * 60 * 1000,
      '30': 30 * 60 * 1000,
      '60': 60 * 60 * 1000,
      '120': 2 * 60 * 60 * 1000,
      '240': 4 * 60 * 60 * 1000,
      '360': 6 * 60 * 60 * 1000,
      '720': 12 * 60 * 60 * 1000,
      'D': 24 * 60 * 60 * 1000,
      'W': 7 * 24 * 60 * 60 * 1000
    };
    return intervals[interval] || 60 * 1000;
  }

  // Helper method to simulate API errors
  simulateError(errorType: 'NETWORK' | 'API_LIMIT' | 'INVALID_KEY' | 'INSUFFICIENT_BALANCE') {
    const errors = {
      NETWORK: { retCode: -1, retMsg: 'Network Error: Connection timeout' },
      API_LIMIT: { retCode: 10004, retMsg: 'error sign! origin_string' },
      INVALID_KEY: { retCode: 10003, retMsg: 'Invalid API key' },
      INSUFFICIENT_BALANCE: { retCode: 110007, retMsg: 'Insufficient wallet balance' }
    };

    const error = errors[errorType];
    const apiError = new Error(error.retMsg);
    (apiError as any).retCode = error.retCode;
    throw apiError;
  }

  // Helper to update mock data
  updateMockBalance(coin: string, amount: number) {
    this.mockBalances[coin] = amount;
  }

  updateMockPrice(symbol: string, price: number) {
    this.mockPrices[symbol] = price;
  }
}

export default BybitMock;
