// ========================================
// MARKETBOT - EXCHANGE SERVICE
// Serviço para gerenciar conexões com exchanges
// ========================================

import * as ccxt from 'ccxt';
import crypto from 'crypto';
import { 
  ExchangeType, 
  ExchangeCredentials, 
  ExchangeBalance, 
  ExchangeOrderResponse, 
  ExchangePositionResponse,
  OrderType,
  OrderSide,
  UserExchangeAccount
} from '../types/trading.types.js';
import { DatabaseService } from './database.service.js';
import { logger } from '../utils/logger.js';

export class ExchangeService {
  private static instance: ExchangeService;
  private exchanges: Map<string, ccxt.Exchange> = new Map();
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'marketbot-default-key-change-in-production';
  }

  static getInstance(): ExchangeService {
    if (!ExchangeService.instance) {
      ExchangeService.instance = new ExchangeService();
    }
    return ExchangeService.instance;
  }

  // ========================================
  // CRIPTOGRAFIA - DESABILITADA PARA FACILITAR OPERAÇÕES REAIS
  // ========================================

  /*
  private encrypt(text: string): string {
    try {
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      logger.error('Erro ao criptografar:', error);
      throw new Error('Falha na criptografia');
    }
  }

  private decrypt(encryptedText: string): string {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.error('Erro ao descriptografar:', error);
      throw new Error('Falha na descriptografia');
    }
  }
  */

  // ========================================
  // GESTÃO DE CONTAS DE EXCHANGE
  // ========================================

  async addExchangeAccount(
    userId: string, 
    accountData: {
      exchange: ExchangeType;
      accountName: string;
      apiKey: string;
      apiSecret: string;
      passphrase?: string;
      isTestnet?: boolean;
      maxPositionSizeUsd?: number;
      dailyLossLimitUsd?: number;
    }
  ): Promise<UserExchangeAccount> {
    try {
      // SALVAR SEM CRIPTOGRAFIA PARA FACILITAR OPERAÇÕES REAIS
      const apiKey = accountData.apiKey;
      const apiSecret = accountData.apiSecret;
      const passphrase = accountData.passphrase || null;

      // Testar conexão antes de salvar
      const testConnection = await this.testConnection({
        apiKey: accountData.apiKey,
        apiSecret: accountData.apiSecret,
        passphrase: accountData.passphrase,
        testnet: accountData.isTestnet || false
      }, accountData.exchange);

      if (!testConnection.success) {
        throw new Error(`Falha ao conectar com ${accountData.exchange}: ${testConnection.error}`);
      }

      // Inserir no banco de dados
      const query = `
        INSERT INTO user_exchange_accounts (
          user_id, exchange, account_name, api_key, api_secret, passphrase,
          is_testnet, is_active, is_verified, can_read, can_trade, can_withdraw,
          max_position_size_usd, daily_loss_limit_usd, max_drawdown_percent,
          last_connection_test
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;

      const values = [
        userId,
        accountData.exchange,
        accountData.accountName,
        apiKey,
        apiSecret,
        passphrase,
        accountData.isTestnet || false,
        true, // is_active
        true, // is_verified (já testamos a conexão)
        testConnection.permissions?.canRead || true,
        testConnection.permissions?.canTrade || false,
        testConnection.permissions?.canWithdraw || false,
        accountData.maxPositionSizeUsd || 1000,
        accountData.dailyLossLimitUsd || 500,
        10.0, // max_drawdown_percent default
        new Date()
      ];

      const result = await DatabaseService.getInstance().query(query, values);
      
      logger.info(`Conta de exchange ${accountData.exchange} adicionada para usuário ${userId}`);
      
      return this.formatExchangeAccount(result.rows[0]);
    } catch (error) {
      logger.error('Erro ao adicionar conta de exchange:', error);
      throw error;
    }
  }

  async getUserExchangeAccounts(userId: string): Promise<UserExchangeAccount[]> {
    try {
      const query = `
        SELECT * FROM user_exchange_accounts 
        WHERE user_id = $1 AND is_active = true
        ORDER BY created_at DESC
      `;
      
      const result = await DatabaseService.getInstance().query(query, [userId]);
      
      return result.rows.map(row => this.formatExchangeAccount(row));
    } catch (error) {
      logger.error('Erro ao buscar contas de exchange:', error);
      throw error;
    }
  }

  async getExchangeAccount(accountId: string): Promise<UserExchangeAccount | null> {
    try {
      const query = `
        SELECT * FROM user_exchange_accounts 
        WHERE id = $1 AND is_active = true
      `;
      
      const result = await DatabaseService.getInstance().query(query, [accountId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.formatExchangeAccount(result.rows[0]);
    } catch (error) {
      logger.error('Erro ao buscar conta de exchange:', error);
      throw error;
    }
  }

  // ========================================
  // CONEXÃO COM EXCHANGES
  // ========================================

  async getExchangeConnection(accountId: string): Promise<ccxt.Exchange> {
    try {
      // Verificar se já existe uma conexão ativa
      if (this.exchanges.has(accountId)) {
        return this.exchanges.get(accountId)!;
      }

      // Buscar dados da conta
      const account = await this.getExchangeAccount(accountId);
      if (!account) {
        throw new Error(`Conta de exchange ${accountId} não encontrada`);
      }

      // USAR CREDENCIAIS SEM DESCRIPTOGRAFIA (SALVAS EM TEXTO PLANO)
      const credentials: ExchangeCredentials = {
        apiKey: account.apiKey,
        apiSecret: account.apiSecret,
        passphrase: account.passphrase || undefined,
        testnet: account.isTestnet
      };

      // Criar conexão
      const exchange = this.createExchangeInstance(account.exchange, credentials);
      
      // Armazenar conexão
      this.exchanges.set(accountId, exchange);
      
      logger.info(`Conexão estabelecida com ${account.exchange} para conta ${accountId}`);
      
      return exchange;
    } catch (error) {
      logger.error('Erro ao conectar com exchange:', error);
      throw error;
    }
  }

  private createExchangeInstance(exchangeType: ExchangeType, credentials: ExchangeCredentials): ccxt.Exchange {
    const config: any = {
      apiKey: credentials.apiKey,
      secret: credentials.apiSecret,
      sandbox: credentials.testnet || false,
      enableRateLimit: true,
      timeout: 45000, // Timeout aumentado para 45s
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    };

    if (credentials.passphrase) {
      config.passphrase = credentials.passphrase;
    }

    // Configurações específicas para Bybit com retry automático
    if (exchangeType === ExchangeType.BYBIT || exchangeType === ExchangeType.BYBIT_TESTNET) {
      config.options = {
        defaultType: 'linear',
        hedgeMode: false,
        portfolioMargin: false,
        recvWindow: 30000
      };
      
      const exchange = new ccxt.bybit(config);
      
      // Implementar retry automático para métodos críticos
      const originalFetch = exchange.fetch.bind(exchange);
      exchange.fetch = async function(url: string, method = 'GET', headers?: any, body?: any) {
        const retryConfigs = [
          { baseURL: 'https://api.bybit.com', name: 'primary' },
          { baseURL: 'https://api-testnet.bybit.com', name: 'testnet' }
        ];
        
        for (const retryConfig of retryConfigs) {
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              // Substituir base URL se necessário
              if (url.includes('api.bybit.com') && retryConfig.name === 'testnet') {
                url = url.replace('api.bybit.com', 'api-testnet.bybit.com');
              }
              
              const result = await originalFetch(url, method, headers, body);
              return result;
              
            } catch (error: any) {
              if (error.message && error.message.includes('403') && attempt === 1) {
                // Retry uma vez em caso de 403
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
              
              if (attempt === 2 || !error.message.includes('403')) {
                throw error;
              }
            }
          }
        }
        
        throw new Error('Todas as tentativas de conexão falharam');
      };
      
      return exchange;
    }

    switch (exchangeType) {
      case ExchangeType.BINANCE:
      case ExchangeType.BINANCE_TESTNET:
        return new ccxt.binance(config);
      
      case ExchangeType.BYBIT:
      case ExchangeType.BYBIT_TESTNET:
        return new ccxt.bybit(config);
      
      default:
        throw new Error(`Exchange ${exchangeType} não suportada`);
    }
  }

  async testConnection(
    credentials: ExchangeCredentials, 
    exchangeType: ExchangeType
  ): Promise<{ success: boolean; error?: string; permissions?: any; isTestnet?: boolean }> {
    try {
      const exchange = this.createExchangeInstance(exchangeType, credentials);
      
      // Testar conexão obtendo saldo
      const balance = await exchange.fetchBalance();
      
      // AUTO-DETECÇÃO DE TESTNET/MAINNET
      const isTestnet = this.detectTestnetFromBalance(balance, exchangeType);
      
      // Verificar permissões
      const permissions = {
        canRead: true,
        canTrade: balance.info?.canTrade || false,
        canWithdraw: balance.info?.canWithdraw || false
      };
      
      await exchange.close();
      
      return { success: true, permissions, isTestnet };
    } catch (error) {
      logger.error('Erro no teste de conexão:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // AUTO-DETECÇÃO DE TESTNET/MAINNET
  private detectTestnetFromBalance(balance: any, exchangeType: ExchangeType): boolean {
    try {
      // Binance: Testnet tem URL diferente no info
      if (exchangeType === ExchangeType.BINANCE) {
        const baseUrl = balance.info?.baseURL || '';
        return baseUrl.includes('testnet') || baseUrl.includes('api-testnet');
      }
      
      // Bybit: Testnet tem indicadores específicos
      if (exchangeType === ExchangeType.BYBIT) {
        const serverTime = balance.info?.serverTime || '';
        return balance.info?.isTestnet === true || 
               String(serverTime).includes('testnet');
      }
      
      // Fallback: Verificar se tem saldos "irreais" (muito altos para testnet)
      const totalBalance = Object.values(balance)
        .filter(b => typeof b === 'object' && b !== null)
        .reduce((sum: number, b: any) => sum + (b.total || 0), 0);
      
      // Se saldo muito alto (>1M USD), provavelmente é testnet
      return totalBalance > 1000000;
      
    } catch (error) {
      logger.warn('Não foi possível detectar testnet/mainnet automaticamente');
      return false; // Default para mainnet por segurança
    }
  }

  // ========================================
  // OPERAÇÕES DE TRADING
  // ========================================

  async getBalance(accountId: string): Promise<ExchangeBalance[]> {
    try {
      const exchange = await this.getExchangeConnection(accountId);
      const balance = await exchange.fetchBalance();
      
      const balances: ExchangeBalance[] = [];
      
      for (const [asset, data] of Object.entries(balance)) {
        if (asset !== 'info' && asset !== 'free' && asset !== 'used' && asset !== 'total') {
          const balanceData = data as any;
          if (balanceData.total > 0) {
            balances.push({
              asset,
              free: balanceData.free || 0,
              locked: balanceData.used || 0,
              total: balanceData.total || 0
            });
          }
        }
      }
      
      return balances;
    } catch (error) {
      logger.error('Erro ao obter saldo:', error);
      throw error;
    }
  }

  async createOrder(
    accountId: string,
    symbol: string,
    type: OrderType,
    side: OrderSide,
    amount: number,
    price?: number
  ): Promise<ExchangeOrderResponse> {
    try {
      const exchange = await this.getExchangeConnection(accountId);
      
      // Converter tipos para o formato CCXT
      const ccxtSide = side.toLowerCase() as 'buy' | 'sell';
      const ccxtType = type.toLowerCase() as 'market' | 'limit';
      
      // Executar ordem
      const order = await exchange.createOrder(symbol, ccxtType, ccxtSide, amount, price);
      
      logger.info(`Ordem criada: ${symbol} ${side} ${amount} @ ${price || 'MARKET'}`);
      
      return {
        orderId: order.id,
        clientOrderId: order.clientOrderId,
        symbol: order.symbol,
        status: order.status || 'pending',
        type: String(order.type),
        side: String(order.side),
        amount: order.amount,
        price: order.price,
        filled: order.filled || 0,
        remaining: order.remaining || amount,
        cost: order.cost || 0,
        fee: order.fee ? {
          amount: Number(order.fee.cost || 0),
          currency: String(order.fee.currency || '')
        } : undefined,
        timestamp: order.timestamp || Date.now(),
        rawResponse: order
      };
    } catch (error) {
      logger.error('Erro ao criar ordem:', error);
      throw error;
    }
  }

  async getOrderStatus(accountId: string, orderId: string, symbol: string): Promise<ExchangeOrderResponse> {
    try {
      const exchange = await this.getExchangeConnection(accountId);
      const order = await exchange.fetchOrder(orderId, symbol);
      
      return {
        orderId: order.id,
        clientOrderId: order.clientOrderId,
        symbol: order.symbol,
        status: order.status || 'pending',
        type: String(order.type),
        side: String(order.side),
        amount: order.amount,
        price: order.price,
        filled: order.filled || 0,
        remaining: order.remaining || 0,
        cost: order.cost || 0,
        fee: order.fee ? {
          amount: Number(order.fee.cost || 0),
          currency: String(order.fee.currency || '')
        } : undefined,
        timestamp: order.timestamp || Date.now(),
        rawResponse: order
      };
    } catch (error) {
      logger.error('Erro ao obter status da ordem:', error);
      throw error;
    }
  }

  async cancelOrder(accountId: string, orderId: string, symbol: string): Promise<boolean> {
    try {
      const exchange = await this.getExchangeConnection(accountId);
      await exchange.cancelOrder(orderId, symbol);
      
      logger.info(`Ordem cancelada: ${orderId} para ${symbol}`);
      return true;
    } catch (error) {
      logger.error('Erro ao cancelar ordem:', error);
      throw error;
    }
  }

  async getPositions(accountId: string): Promise<ExchangePositionResponse[]> {
    try {
      const exchange = await this.getExchangeConnection(accountId);
      const positions = await exchange.fetchPositions();
      
      return positions
        .filter(pos => (pos.contracts || 0) > 0) // Apenas posições abertas
        .map(pos => ({
          symbol: pos.symbol,
          side: pos.side as 'long' | 'short',
          size: Number(pos.contracts || 0),
          entryPrice: pos.entryPrice || 0,
          markPrice: pos.markPrice || 0,
          unrealizedPnl: pos.unrealizedPnl || 0,
          percentage: pos.percentage || 0,
          timestamp: pos.timestamp || Date.now()
        }));
    } catch (error) {
      logger.error('Erro ao obter posições:', error);
      throw error;
    }
  }

  // ========================================
  // UTILITÁRIOS
  // ========================================

  private formatExchangeAccount(row: any): UserExchangeAccount {
    return {
      id: row.id,
      userId: row.user_id,
      exchange: row.exchange,
      accountName: row.account_name,
      apiKey: row.api_key, // AGORA EM TEXTO PLANO
      apiSecret: row.api_secret, // AGORA EM TEXTO PLANO
      passphrase: row.passphrase,
      isTestnet: row.is_testnet,
      isActive: row.is_active,
      isVerified: row.is_verified,
      canRead: row.can_read,
      canTrade: row.can_trade,
      canWithdraw: row.can_withdraw,
      maxPositionSizeUsd: parseFloat(row.max_position_size_usd),
      dailyLossLimitUsd: parseFloat(row.daily_loss_limit_usd),
      maxDrawdownPercent: parseFloat(row.max_drawdown_percent),
      lastConnectionTest: row.last_connection_test,
      lastSyncAt: row.last_sync_at,
      totalPositions: parseInt(row.total_positions) || 0,
      totalPnlUsd: parseFloat(row.total_pnl_usd) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async updateConnectionTest(accountId: string): Promise<void> {
    try {
      const query = `
        UPDATE user_exchange_accounts 
        SET last_connection_test = CURRENT_TIMESTAMP 
        WHERE id = $1
      `;
      
      await DatabaseService.getInstance().query(query, [accountId]);
    } catch (error) {
      logger.error('Erro ao atualizar teste de conexão:', error);
    }
  }

  async removeExchangeAccount(accountId: string): Promise<boolean> {
    try {
      // Remover conexão ativa
      this.exchanges.delete(accountId);
      
      // Marcar como inativa no banco
      const query = `
        UPDATE user_exchange_accounts 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `;
      
      await DatabaseService.getInstance().query(query, [accountId]);
      
      logger.info(`Conta de exchange ${accountId} removida`);
      return true;
    } catch (error) {
      logger.error('Erro ao remover conta de exchange:', error);
      throw error;
    }
  }

  // Limpar conexões inativas
  clearInactiveConnections(): void {
    for (const [accountId, exchange] of this.exchanges) {
      try {
        exchange.close();
      } catch (error) {
        logger.error(`Erro ao fechar conexão ${accountId}:`, error);
      }
    }
    this.exchanges.clear();
    logger.info('Conexões de exchange limpas');
  }
}

export default ExchangeService;
