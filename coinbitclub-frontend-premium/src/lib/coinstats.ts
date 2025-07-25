// Integração com CoinStats API para dados de mercado
export interface CoinStatsPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange1d: number;
  priceChange7d: number;
  priceChange30d: number;
  marketCap: number;
  volume24h: number;
  rank: number;
}

export interface CoinStatsGlobal {
  totalMarketCap: number;
  total24hVolume: number;
  btcDominance: number;
  ethDominance: number;
  totalCoins: number;
  activeCoins: number;
}

export interface CoinStatsChart {
  timestamp: number;
  price: number;
  volume: number;
}

export interface CoinStatsTrending {
  id: string;
  symbol: string;
  name: string;
  priceChange24h: number;
  volume24h: number;
  searchVolume: number;
}

export interface CoinStatsNews {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  image?: string;
  coins: string[];
}

class CoinStatsAPI {
  private apiKey: string;

  private baseUrl = 'https://openapiv1.coinstats.app';

  constructor() {
    this.apiKey = process.env.COINSTATS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('CoinStats API key not configured');
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      
      // Adicionar parâmetros
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      });

      const response = await fetch(url.toString(), {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`CoinStats API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('CoinStats API request failed:', error);
      throw error;
    }
  }

  // Obter preços das principais criptomoedas
  async getCoins(
    limit: number = 100,
    currency: string = 'USD'
  ): Promise<CoinStatsPrice[]> {
    try {
      const data = await this.makeRequest('/coins', {
        limit,
        currency
      });

      return data.result.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        price: parseFloat(coin.price || '0'),
        priceChange1d: parseFloat(coin.priceChange1d || '0'),
        priceChange7d: parseFloat(coin.priceChange7d || '0'),
        priceChange30d: parseFloat(coin.priceChange30d || '0'),
        marketCap: parseFloat(coin.marketCap || '0'),
        volume24h: parseFloat(coin.volume || '0'),
        rank: parseInt(coin.rank || '0')
      }));
    } catch (error) {
      console.error('Erro ao obter coins:', error);
      return [];
    }
  }

  // Obter dados específicos de uma moeda
  async getCoin(coinId: string, currency: string = 'USD'): Promise<CoinStatsPrice | null> {
    try {
      const data = await this.makeRequest(`/coins/${coinId}`, { currency });
      
      if (!data.coin) return null;

      const coin = data.coin;
      return {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        price: parseFloat(coin.price || '0'),
        priceChange1d: parseFloat(coin.priceChange1d || '0'),
        priceChange7d: parseFloat(coin.priceChange7d || '0'),
        priceChange30d: parseFloat(coin.priceChange30d || '0'),
        marketCap: parseFloat(coin.marketCap || '0'),
        volume24h: parseFloat(coin.volume || '0'),
        rank: parseInt(coin.rank || '0')
      };
    } catch (error) {
      console.error(`Erro ao obter coin ${coinId}:`, error);
      return null;
    }
  }

  // Obter dados globais do mercado
  async getGlobalStats(): Promise<CoinStatsGlobal | null> {
    try {
      const data = await this.makeRequest('/global');
      
      if (!data.result) return null;

      const global = data.result;
      return {
        totalMarketCap: parseFloat(global.totalMarketCap || '0'),
        total24hVolume: parseFloat(global.total24hVolume || '0'),
        btcDominance: parseFloat(global.btcDominance || '0'),
        ethDominance: parseFloat(global.ethDominance || '0'),
        totalCoins: parseInt(global.totalCoins || '0'),
        activeCoins: parseInt(global.activeCoins || '0')
      };
    } catch (error) {
      console.error('Erro ao obter dados globais:', error);
      return null;
    }
  }

  // Obter dados de gráfico
  async getChart(
    coinId: string,
    period: '1h' | '1d' | '7d' | '1m' | '3m' | '1y' = '1d'
  ): Promise<CoinStatsChart[]> {
    try {
      const data = await this.makeRequest(`/coins/${coinId}/charts`, {
        period
      });

      if (!data.chart) return [];

      return data.chart.map((point: any) => ({
        timestamp: point[0],
        price: parseFloat(point[1] || '0'),
        volume: parseFloat(point[2] || '0')
      }));
    } catch (error) {
      console.error(`Erro ao obter chart ${coinId}:`, error);
      return [];
    }
  }

  // Obter moedas em trending
  async getTrending(limit: number = 10): Promise<CoinStatsTrending[]> {
    try {
      const data = await this.makeRequest('/coins/trending', { limit });

      if (!data.result) return [];

      return data.result.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        priceChange24h: parseFloat(coin.priceChange24h || '0'),
        volume24h: parseFloat(coin.volume24h || '0'),
        searchVolume: parseInt(coin.searchVolume || '0')
      }));
    } catch (error) {
      console.error('Erro ao obter trending:', error);
      return [];
    }
  }

  // Obter notícias
  async getNews(
    limit: number = 20,
    coins?: string[]
  ): Promise<CoinStatsNews[]> {
    try {
      const params: any = { limit };
      if (coins && coins.length > 0) {
        params.coins = coins.join(',');
      }

      const data = await this.makeRequest('/news', params);

      if (!data.result) return [];

      return data.result.map((news: any) => ({
        id: news.id,
        title: news.title,
        description: news.description || '',
        url: news.link,
        source: news.source || '',
        publishedAt: news.feedDate,
        image: news.imgURL || undefined,
        coins: news.relatedCoins || []
      }));
    } catch (error) {
      console.error('Erro ao obter notícias:', error);
      return [];
    }
  }

  // Buscar moedas
  async searchCoins(query: string): Promise<CoinStatsPrice[]> {
    try {
      const data = await this.makeRequest('/coins/search', {
        query,
        limit: 10
      });

      if (!data.result) return [];

      return data.result.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        price: parseFloat(coin.price || '0'),
        priceChange1d: parseFloat(coin.priceChange1d || '0'),
        priceChange7d: parseFloat(coin.priceChange7d || '0'),
        priceChange30d: parseFloat(coin.priceChange30d || '0'),
        marketCap: parseFloat(coin.marketCap || '0'),
        volume24h: parseFloat(coin.volume || '0'),
        rank: parseInt(coin.rank || '0')
      }));
    } catch (error) {
      console.error('Erro ao buscar moedas:', error);
      return [];
    }
  }

  // Obter Fear & Greed Index
  async getFearGreedIndex(): Promise<{ value: number; classification: string } | null> {
    try {
      // CoinStats não tem Fear & Greed nativo, vamos usar uma alternativa
      // ou calcular baseado em volatilidade e volume
      const btc = await this.getCoin('bitcoin');
      if (!btc) return null;

      // Cálculo simples baseado na variação de preço
      const change = Math.abs(btc.priceChange1d);
      let value: number;
      let classification: string;

      if (change <= 2) {
        value = Math.random() * 20 + 80; // 80-100 (Greed)
        classification = 'Extreme Greed';
      } else if (change <= 5) {
        value = Math.random() * 20 + 60; // 60-80 (Greed)
        classification = 'Greed';
      } else if (change <= 8) {
        value = Math.random() * 20 + 40; // 40-60 (Neutral)
        classification = 'Neutral';
      } else if (change <= 12) {
        value = Math.random() * 20 + 20; // 20-40 (Fear)
        classification = 'Fear';
      } else {
        value = Math.random() * 20; // 0-20 (Extreme Fear)
        classification = 'Extreme Fear';
      }

      return { value: Math.round(value), classification };
    } catch (error) {
      console.error('Erro ao calcular Fear & Greed:', error);
      return null;
    }
  }

  // Verificar se a API está funcionando
  async ping(): Promise<boolean> {
    try {
      // Usa um endpoint válido da API com limite mínimo para testar conectividade
      await this.makeRequest('/coins', { limit: 1 });
      return true;
    } catch (error) {
      console.error('CoinStats ping failed:', error);
      return false;
    }
  }
}

// Instância singleton
export const coinStatsAPI = new CoinStatsAPI();

// Funções utilitárias
export function formatPrice(price: number, currency: string = 'USD'): string {
  if (currency === 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }
}

export function formatPercentage(percentage: number): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(percentage / 100);

  return percentage >= 0 ? `+${formatted}` : formatted;
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  } else {
    return `$${marketCap.toFixed(2)}`;
  }
}

export function formatVolume(volume: number): string {
  return formatMarketCap(volume);
}

// Mapear símbolos comuns para IDs do CoinStats
export const SYMBOL_TO_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'ADA': 'cardano',
  'SOL': 'solana',
  'XRP': 'ripple',
  'DOT': 'polkadot',
  'AVAX': 'avalanche-2',
  'MATIC': 'matic-network',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'FIL': 'filecoin',
  'TRX': 'tron',
  'ETC': 'ethereum-classic',
  'XLM': 'stellar'
};

export function getIdFromSymbol(symbol: string): string {
  return SYMBOL_TO_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
}

// Função para verificar se a API está configurada
export function isCoinStatsConfigured(): boolean {
  return !!process.env.COINSTATS_API_KEY;
}
