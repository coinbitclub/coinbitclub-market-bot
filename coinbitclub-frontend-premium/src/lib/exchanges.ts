import crypto from 'crypto';

// Interface para configurações da API
export interface ExchangeConfig {
  exchange: 'binance' | 'bybit';
  apiKey: string;
  secretKey: string;
  testnet: boolean;
  userId: string;
}

// Interface para resposta da API
export interface ExchangeResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Interface para dados de conta
export interface AccountInfo {
  totalBalance: number;
  availableBalance: number;
  positions: Position[];
  openOrders: Order[];
}

export interface Position {
  symbol: string;
  size: number;
  side: 'long' | 'short';
  unrealizedPnl: number;
  markPrice: number;
  entryPrice: number;
}

export interface Order {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
  status: 'new' | 'filled' | 'cancelled' | 'rejected';
  timestamp: number;
}

// Interface para parâmetros de ordem
export interface OrderParams {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

// URLs base das exchanges
const EXCHANGE_URLS = {
  binance: {
    mainnet: 'https://fapi.binance.com',
    testnet: 'https://testnet.binancefuture.com'
  },
  bybit: {
    mainnet: 'https://api.bybit.com',
    testnet: 'https://api-testnet.bybit.com'
  }
};

export class ExchangeAPI {
  private config: ExchangeConfig;

  private baseUrl: string;

  constructor(config: ExchangeConfig) {
    this.config = config;
    this.baseUrl = EXCHANGE_URLS[config.exchange][config.testnet ? 'testnet' : 'mainnet'];
  }

  // Gerar assinatura para Binance
  private generateBinanceSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(queryString)
      .digest('hex');
  }

  // Gerar assinatura para Bybit
  private generateBybitSignature(params: Record<string, any>): string {
    const timestamp = Date.now().toString();
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const queryString = `${timestamp}${this.config.apiKey}${sortedParams}`;
    
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(queryString)
      .digest('hex');
  }

  // Fazer requisição para Binance
  private async makeBinanceRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    params: Record<string, any> = {}
  ): Promise<ExchangeResponse> {
    try {
      const timestamp = Date.now();
      const queryParams = { ...params, timestamp };
      const queryString = new URLSearchParams(queryParams as any).toString();
      const signature = this.generateBinanceSignature(queryString);
      
      const url = `${this.baseUrl}${endpoint}?${queryString}&signature=${signature}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'X-MBX-APIKEY': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.msg || 'Erro na requisição Binance' };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  // Fazer requisição para Bybit
  private async makeBybitRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    params: Record<string, any> = {}
  ): Promise<ExchangeResponse> {
    try {
      const timestamp = Date.now().toString();
      const signature = this.generateBybitSignature(params);
      
      const headers = {
        'X-BAPI-API-KEY': this.config.apiKey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-SIGN': signature,
        'Content-Type': 'application/json'
      };

      let url = `${this.baseUrl}${endpoint}`;
      let body: string | undefined;

      if (method === 'GET') {
        const queryString = new URLSearchParams(params as any).toString();
        if (queryString) url += `?${queryString}`;
      } else {
        body = JSON.stringify(params);
      }

      const response = await fetch(url, {
        method,
        headers,
        body
      });

      const data = await response.json();
      
      if (data.retCode !== 0) {
        return { success: false, error: data.retMsg || 'Erro na requisição Bybit' };
      }

      return { success: true, data: data.result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  // Fazer requisição baseada na exchange
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    params: Record<string, any> = {}
  ): Promise<ExchangeResponse> {
    if (this.config.exchange === 'binance') {
      return this.makeBinanceRequest(endpoint, method, params);
    } else {
      return this.makeBybitRequest(endpoint, method as 'GET' | 'POST', params);
    }
  }

  // Obter informações da conta
  async getAccountInfo(): Promise<ExchangeResponse<AccountInfo>> {
    try {
      if (this.config.exchange === 'binance') {
        const accountResponse = await this.makeRequest('/fapi/v2/account');
        const positionsResponse = await this.makeRequest('/fapi/v2/positionRisk');
        
        if (!accountResponse.success || !positionsResponse.success) {
          return { success: false, error: 'Erro ao obter dados da conta' };
        }

        const totalBalance = parseFloat(accountResponse.data.totalWalletBalance);
        const availableBalance = parseFloat(accountResponse.data.availableBalance);
        
        const positions = positionsResponse.data
          .filter((pos: any) => parseFloat(pos.positionAmt) !== 0)
          .map((pos: any) => ({
            symbol: pos.symbol,
            size: Math.abs(parseFloat(pos.positionAmt)),
            side: parseFloat(pos.positionAmt) > 0 ? 'long' : 'short',
            unrealizedPnl: parseFloat(pos.unRealizedProfit),
            markPrice: parseFloat(pos.markPrice),
            entryPrice: parseFloat(pos.entryPrice)
          }));

        return {
          success: true,
          data: {
            totalBalance,
            availableBalance,
            positions,
            openOrders: [] // Implementar se necessário
          }
        };
      } else {
        // Bybit implementation
        const accountResponse = await this.makeRequest('/v5/account/wallet-balance', 'GET', {
          accountType: 'UNIFIED'
        });
        
        if (!accountResponse.success) {
          return { success: false, error: 'Erro ao obter dados da conta Bybit' };
        }

        const account = accountResponse.data.list[0];
        const totalBalance = parseFloat(account.totalEquity);
        const availableBalance = parseFloat(account.totalAvailableBalance);

        return {
          success: true,
          data: {
            totalBalance,
            availableBalance,
            positions: [], // Implementar se necessário
            openOrders: []
          }
        };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  // Criar ordem
  async createOrder(params: OrderParams): Promise<ExchangeResponse<Order>> {
    try {
      if (this.config.exchange === 'binance') {
        const orderParams = {
          symbol: params.symbol,
          side: params.side.toUpperCase(),
          type: params.type.toUpperCase(),
          quantity: params.quantity.toString(),
          ...(params.price && { price: params.price.toString() }),
          ...(params.timeInForce && { timeInForce: params.timeInForce })
        };

        const response = await this.makeRequest('/fapi/v1/order', 'POST', orderParams);
        
        if (!response.success) {
          return response;
        }

        return {
          success: true,
          data: {
            orderId: response.data.orderId.toString(),
            symbol: response.data.symbol,
            side: response.data.side.toLowerCase(),
            type: response.data.type.toLowerCase(),
            quantity: parseFloat(response.data.origQty),
            price: response.data.price ? parseFloat(response.data.price) : undefined,
            status: response.data.status.toLowerCase(),
            timestamp: response.data.updateTime
          }
        };
      } else {
        // Bybit implementation
        const orderParams = {
          category: 'linear',
          symbol: params.symbol,
          side: params.side.charAt(0).toUpperCase() + params.side.slice(1),
          orderType: params.type.charAt(0).toUpperCase() + params.type.slice(1),
          qty: params.quantity.toString(),
          ...(params.price && { price: params.price.toString() })
        };

        const response = await this.makeRequest('/v5/order/create', 'POST', orderParams);
        
        if (!response.success) {
          return response;
        }

        return {
          success: true,
          data: {
            orderId: response.data.orderId,
            symbol: params.symbol,
            side: params.side,
            type: params.type,
            quantity: params.quantity,
            price: params.price,
            status: 'new',
            timestamp: Date.now()
          }
        };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  // Cancelar ordem
  async cancelOrder(symbol: string, orderId: string): Promise<ExchangeResponse> {
    try {
      if (this.config.exchange === 'binance') {
        return this.makeRequest('/fapi/v1/order', 'DELETE', {
          symbol,
          orderId
        });
      } else {
        return this.makeRequest('/v5/order/cancel', 'POST', {
          category: 'linear',
          symbol,
          orderId
        });
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  // Testar conectividade
  async testConnection(): Promise<ExchangeResponse> {
    try {
      if (this.config.exchange === 'binance') {
        return this.makeRequest('/fapi/v1/ping');
      } else {
        return this.makeRequest('/v5/market/time');
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro de conexão' };
    }
  }

  // Obter preço do símbolo
  async getSymbolPrice(symbol: string): Promise<ExchangeResponse<number>> {
    try {
      if (this.config.exchange === 'binance') {
        const response = await this.makeRequest('/fapi/v1/ticker/price', 'GET', { symbol });
        if (response.success) {
          return { success: true, data: parseFloat(response.data.price) };
        }
        return response;
      } else {
        const response = await this.makeRequest('/v5/market/tickers', 'GET', {
          category: 'linear',
          symbol
        });
        if (response.success && response.data.list.length > 0) {
          return { success: true, data: parseFloat(response.data.list[0].lastPrice) };
        }
        return { success: false, error: 'Símbolo não encontrado' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao obter preço' };
    }
  }
}

// Função helper para criar instância da API
export function createExchangeAPI(config: ExchangeConfig): ExchangeAPI {
  return new ExchangeAPI(config);
}

// Função para validar configuração da API
export function validateExchangeConfig(config: Partial<ExchangeConfig>): string[] {
  const errors: string[] = [];

  if (!config.exchange) {
    errors.push('Exchange é obrigatória');
  } else if (!['binance', 'bybit'].includes(config.exchange)) {
    errors.push('Exchange deve ser "binance" ou "bybit"');
  }

  if (!config.apiKey || config.apiKey.length < 10) {
    errors.push('API Key inválida');
  }

  if (!config.secretKey || config.secretKey.length < 10) {
    errors.push('Secret Key inválida');
  }

  if (!config.userId) {
    errors.push('User ID é obrigatório');
  }

  return errors;
}
