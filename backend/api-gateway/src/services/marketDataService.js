import axios from 'axios';
import WebSocket from 'ws';

class MarketDataService {
  constructor() {
    this.wsConnections = new Map();
    this.subscribers = new Map();
  }

  // Conectar ao TradingView WebSocket
  async connectTradingView(symbols = ['BTCUSDT', 'ETHUSDT']) {
    try {
      const ws = new WebSocket('wss://data.tradingview.com/socket.io/websocket');
      
      ws.on('open', () => {
        console.log('TradingView WebSocket conectado');
        
        // Configurar protocolo TradingView
        ws.send('~m~52~m~{"m":"set_auth_token","p":["unauthorized_user_token"]}');
        
        // Subscribe aos símbolos
        symbols.forEach(symbol => {
          this.subscribeTradingViewSymbol(ws, symbol);
        });
      });

      ws.on('message', (data) => {
        this.handleTradingViewMessage(data);
      });

      ws.on('error', (error) => {
        console.error('Erro TradingView WebSocket:', error);
      });

      this.wsConnections.set('tradingview', ws);
      return ws;

    } catch (error) {
      console.error('Erro ao conectar TradingView:', error);
      throw error;
    }
  }

  // Subscribe a um símbolo no TradingView
  subscribeTradingViewSymbol(ws, symbol) {
    const message = {
      m: 'quote_add_symbols',
      p: [
        'qs_session_01',
        symbol,
        {
          flags: ['force_permission']
        }
      ]
    };
    
    const messageStr = `~m~${JSON.stringify(message).length}~m~${JSON.stringify(message)}`;
    ws.send(messageStr);
  }

  // Processar mensagens do TradingView
  handleTradingViewMessage(data) {
    try {
      const message = this.parseTradingViewMessage(data);
      
      if (message && message.m === 'qsd' && message.p) {
        const [session, symbol, update] = message.p;
        
        if (update && update.lp) { // Last Price
          this.notifySubscribers(symbol, {
            price: update.lp,
            volume: update.volume,
            change: update.chp,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('Erro ao processar mensagem TradingView:', error);
    }
  }

  // Parse de mensagens do protocolo TradingView
  parseTradingViewMessage(data) {
    try {
      const str = data.toString();
      const regex = /~m~\d+~m~/g;
      const messages = str.split(regex).filter(msg => msg.length > 0);
      
      return messages.map(msg => {
        try {
          return JSON.parse(msg);
        } catch {
          return null;
        }
      }).filter(Boolean)[0];
      
    } catch (error) {
      return null;
    }
  }

  // Obter dados históricos via API pública
  async getHistoricalData(symbol, interval = '1h', limit = 100) {
    try {
      // Usar Binance API como fallback
      const response = await axios.get('https://api.binance.com/api/v3/klines', {
        params: {
          symbol: symbol.replace('USDT', 'USDT'),
          interval: interval,
          limit: limit
        }
      });

      return response.data.map(kline => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));

    } catch (error) {
      console.error('Erro ao obter dados históricos:', error);
      throw error;
    }
  }

  // Obter indicadores técnicos
  async calculateTechnicalIndicators(data) {
    try {
      const prices = data.map(d => d.close);
      
      return {
        sma_20: this.calculateSMA(prices, 20),
        sma_50: this.calculateSMA(prices, 50),
        rsi: this.calculateRSI(prices, 14),
        macd: this.calculateMACD(prices),
        bollinger: this.calculateBollingerBands(prices, 20),
        ema_12: this.calculateEMA(prices, 12),
        ema_26: this.calculateEMA(prices, 26)
      };

    } catch (error) {
      console.error('Erro ao calcular indicadores:', error);
      return {};
    }
  }

  // Média Móvel Simples
  calculateSMA(prices, period) {
    if (prices.length < period) return null;
    
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  // Média Móvel Exponencial
  calculateEMA(prices, period) {
    if (prices.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  // RSI (Relative Strength Index)
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;
      
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // MACD
  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    if (!ema12 || !ema26) return null;
    
    const macdLine = ema12 - ema26;
    return {
      macd: macdLine,
      signal: this.calculateEMA([macdLine], 9),
      histogram: macdLine - this.calculateEMA([macdLine], 9)
    };
  }

  // Bandas de Bollinger
  calculateBollingerBands(prices, period = 20) {
    const sma = this.calculateSMA(prices, period);
    if (!sma) return null;
    
    const recentPrices = prices.slice(-period);
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * 2),
      middle: sma,
      lower: sma - (stdDev * 2)
    };
  }

  // Subscribe para receber atualizações de preço
  subscribe(symbol, callback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
    }
    this.subscribers.get(symbol).push(callback);
  }

  // Notificar subscribers
  notifySubscribers(symbol, data) {
    const callbacks = this.subscribers.get(symbol);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Erro ao notificar subscriber:', error);
        }
      });
    }
  }

  // Obter análise de mercado completa
  async getMarketAnalysis(symbol, timeframe = '1h') {
    try {
      const historicalData = await this.getHistoricalData(symbol, timeframe, 200);
      const indicators = await this.calculateTechnicalIndicators(historicalData);
      
      const currentPrice = historicalData[historicalData.length - 1];
      const previousPrice = historicalData[historicalData.length - 2];
      
      const analysis = {
        symbol,
        timeframe,
        current_price: currentPrice.close,
        price_change: currentPrice.close - previousPrice.close,
        price_change_percent: ((currentPrice.close - previousPrice.close) / previousPrice.close) * 100,
        volume_24h: currentPrice.volume,
        indicators,
        trend: this.determineTrend(indicators),
        support_resistance: this.findSupportResistance(historicalData),
        timestamp: Date.now()
      };

      return analysis;

    } catch (error) {
      console.error('Erro ao obter análise de mercado:', error);
      throw error;
    }
  }

  // Determinar tendência baseada nos indicadores
  determineTrend(indicators) {
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    // RSI
    if (indicators.rsi > 50) bullishSignals++;
    else bearishSignals++;
    
    // MACD
    if (indicators.macd && indicators.macd.macd > 0) bullishSignals++;
    else bearishSignals++;
    
    // SMA
    if (indicators.sma_20 > indicators.sma_50) bullishSignals++;
    else bearishSignals++;
    
    if (bullishSignals > bearishSignals) return 'alta';
    else if (bearishSignals > bullishSignals) return 'baixa';
    else return 'lateral';
  }

  // Encontrar suporte e resistência
  findSupportResistance(data) {
    const highs = data.map(d => d.high).sort((a, b) => b - a);
    const lows = data.map(d => d.low).sort((a, b) => a - b);
    
    return {
      resistance: highs[0],
      support: lows[0],
      resistance_levels: highs.slice(0, 3),
      support_levels: lows.slice(0, 3)
    };
  }

  // Limpar conexões
  disconnect() {
    this.wsConnections.forEach((ws, key) => {
      ws.close();
      this.wsConnections.delete(key);
    });
    
    this.subscribers.clear();
  }
}

export default new MarketDataService();
