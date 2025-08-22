// ========================================
// MARKETBOT - TRADING CONTROLLERS
// Controladores para endpoints de trading
// ========================================

import { Request, Response } from 'express';
import { TradingService } from '../services/trading.service.js';
import { ExchangeService } from '../services/exchange.service.js';
import { DatabaseService } from '../services/database.service.js';
import { 
  CreateSignalDTO, 
  CreateOrderDTO, 
  ExchangeType,
  SignalType,
  OrderType,
  OrderSide,
  PositionStatus 
} from '../types/trading.types.js';
import { z } from 'zod';

// ========================================
// SCHEMAS DE VALIDAÇÃO
// ========================================

const CreateExchangeAccountSchema = z.object({
  exchange: z.nativeEnum(ExchangeType),
  accountName: z.string().min(1, 'Nome da conta é obrigatório'),
  apiKey: z.string().min(1, 'API Key é obrigatória'),
  apiSecret: z.string().min(1, 'API Secret é obrigatório'),
  passphrase: z.string().optional(),
  isTestnet: z.boolean().optional().default(false),
  maxPositionSizeUsd: z.number().positive().optional().default(1000),
  dailyLossLimitUsd: z.number().positive().optional().default(500)
});

const CreateSignalSchema = z.object({
  source: z.string().min(1, 'Fonte do sinal é obrigatória'),
  symbol: z.string().min(1, 'Símbolo é obrigatório'),
  signalType: z.nativeEnum(SignalType),
  leverage: z.number().min(1).max(100).optional().default(1),
  entryPrice: z.number().positive().optional(),
  stopLoss: z.number().positive().optional(),
  takeProfit1: z.number().positive().optional(),
  takeProfit2: z.number().positive().optional(),
  takeProfit3: z.number().positive().optional(),
  positionSizePercent: z.number().min(0.1).max(100).optional().default(1),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().optional()
});

const CreateOrderSchema = z.object({
  exchangeAccountId: z.string().uuid('ID da conta de exchange inválido'),
  symbol: z.string().min(1, 'Símbolo é obrigatório'),
  type: z.nativeEnum(OrderType),
  side: z.nativeEnum(OrderSide),
  amount: z.number().positive('Quantidade deve ser positiva'),
  price: z.number().positive().optional(),
  positionId: z.string().uuid().optional(),
  signalId: z.string().uuid().optional()
});

const TradingViewWebhookSchema = z.object({
  symbol: z.string().min(1),
  action: z.enum(['BUY', 'SELL', 'CLOSE']),
  price: z.number().positive().optional(),
  leverage: z.number().min(1).max(100).optional(),
  stop_loss: z.number().positive().optional(),
  take_profit: z.number().positive().optional(),
  position_size: z.number().min(0.1).max(100).optional(),
  timeframe: z.string().optional(),
  strategy: z.string().optional(),
  timestamp: z.string().optional()
}).catchall(z.any());

// ========================================
// INSTÂNCIAS DOS SERVIÇOS
// ========================================

const tradingService = TradingService.getInstance();
const exchangeService = ExchangeService.getInstance();

// ========================================
// UTILITY FUNCTION
// ========================================

const getUserId = (req: Request): string | null => {
  return (req as any).user?.id || null;
};

// ========================================
// CONTROLLERS DE EXCHANGE ACCOUNTS
// ========================================

export const addExchangeAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }

    const validatedData = CreateExchangeAccountSchema.parse(req.body);

    const account = await exchangeService.addExchangeAccount(userId, {
      exchange: validatedData.exchange,
      accountName: validatedData.accountName,
      apiKey: validatedData.apiKey,
      apiSecret: validatedData.apiSecret,
      passphrase: validatedData.passphrase,
      isTestnet: validatedData.isTestnet,
      maxPositionSizeUsd: validatedData.maxPositionSizeUsd,
      dailyLossLimitUsd: validatedData.dailyLossLimitUsd
    });

    console.log(`Conta de exchange adicionada para usuário ${userId}: ${validatedData.exchange}`);

    res.status(201).json({
      success: true,
      message: 'Conta de exchange adicionada com sucesso',
      data: {
        id: account.id,
        exchange: account.exchange,
        accountName: account.accountName,
        isTestnet: account.isTestnet,
        isVerified: account.isVerified,
        canTrade: account.canTrade,
        maxPositionSizeUsd: account.maxPositionSizeUsd,
        createdAt: account.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar conta de exchange:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: (error as Error).message
    });
  }
};

export const getUserExchangeAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }

    const accounts = await exchangeService.getUserExchangeAccounts(userId);

    const safeAccounts = accounts.map(account => ({
      id: account.id,
      exchange: account.exchange,
      accountName: account.accountName,
      isTestnet: account.isTestnet,
      isActive: account.isActive,
      isVerified: account.isVerified,
      canRead: account.canRead,
      canTrade: account.canTrade,
      canWithdraw: account.canWithdraw,
      maxPositionSizeUsd: account.maxPositionSizeUsd,
      dailyLossLimitUsd: account.dailyLossLimitUsd,
      totalPositions: account.totalPositions,
      totalPnlUsd: account.totalPnlUsd,
      lastConnectionTest: account.lastConnectionTest,
      createdAt: account.createdAt
    }));

    res.status(200).json({
      success: true,
      message: 'Contas de exchange recuperadas com sucesso',
      data: safeAccounts
    });
  } catch (error) {
    console.error('Erro ao buscar contas de exchange:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const getExchangeBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { accountId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }

    const account = await exchangeService.getExchangeAccount(accountId);
    if (!account || account.userId !== userId) {
      res.status(404).json({ success: false, message: 'Conta de exchange não encontrada' });
      return;
    }

    const balances = await exchangeService.getBalance(accountId);

    res.status(200).json({
      success: true,
      message: 'Saldo recuperado com sucesso',
      data: balances
    });
  } catch (error) {
    console.error('Erro ao obter saldo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter saldo da exchange'
    });
  }
};

export const testExchangeConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountId } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }

    const account = await exchangeService.getExchangeAccount(accountId);
    if (!account || account.userId !== userId) {
      res.status(404).json({ success: false, message: 'Conta de exchange não encontrada' });
      return;
    }

    const balances = await exchangeService.getBalance(accountId);
    await exchangeService.updateConnectionTest(accountId);

    res.status(200).json({
      success: true,
      message: 'Conexão testada com sucesso',
      data: {
        connected: true,
        balanceCount: balances.length,
        testedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Erro no teste de conexão:', error);
    res.status(400).json({
      success: false,
      message: 'Falha na conexão com a exchange',
      error: (error as Error).message
    });
  }
};

export const removeExchangeAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountId } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }

    const account = await exchangeService.getExchangeAccount(accountId);
    if (!account || account.userId !== userId) {
      res.status(404).json({ success: false, message: 'Conta de exchange não encontrada' });
      return;
    }

    await exchangeService.removeExchangeAccount(accountId);

    res.status(200).json({
      success: true,
      message: 'Conta de exchange removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover conta de exchange:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// ========================================
// CONTROLLERS DE SIGNALS
// ========================================

export const createSignal = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = CreateSignalSchema.parse(req.body);

    const signalData: CreateSignalDTO = {
      source: validatedData.source,
      symbol: validatedData.symbol,
      signalType: validatedData.signalType,
      leverage: validatedData.leverage || undefined,
      entryPrice: validatedData.entryPrice || undefined,
      stopLoss: validatedData.stopLoss || undefined,
      takeProfit1: validatedData.takeProfit1 || undefined,
      takeProfit2: validatedData.takeProfit2 || undefined,
      takeProfit3: validatedData.takeProfit3 || undefined,
      positionSizePercent: validatedData.positionSizePercent || undefined,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      notes: validatedData.notes || undefined
    };

    const signal = await tradingService.createSignal(signalData);

    res.status(201).json({
      success: true,
      message: 'Sinal criado com sucesso',
      data: signal
    });
  } catch (error) {
    console.error('Erro ao criar sinal:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const getUserSignals = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const signals = await tradingService.getUserSignals(userId, limit);

    res.status(200).json({
      success: true,
      message: 'Sinais recuperados com sucesso',
      data: signals
    });
  } catch (error) {
    console.error('Erro ao buscar sinais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const getSignal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { signalId } = req.params;
    const signal = await tradingService.getSignal(signalId);

    if (!signal) {
      res.status(404).json({ success: false, message: 'Sinal não encontrado' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Sinal recuperado com sucesso',
      data: signal
    });
  } catch (error) {
    console.error('Erro ao buscar sinal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// ========================================
// CONTROLLERS DE POSITIONS
// ========================================

export const getUserPositions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }

    const status = req.query.status as PositionStatus | undefined;
    const positions = await tradingService.getUserPositions(userId, status);

    res.status(200).json({
      success: true,
      message: 'Posições recuperadas com sucesso',
      data: positions
    });
  } catch (error) {
    console.error('Erro ao buscar posições:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const closePosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { positionId } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }

    const positions = await tradingService.getUserPositions(userId);
    const position = positions.find(p => p.id === positionId);

    if (!position) {
      res.status(404).json({ success: false, message: 'Posição não encontrada' });
      return;
    }

    if (position.status === PositionStatus.CLOSED) {
      res.status(400).json({ success: false, message: 'Posição já está fechada' });
      return;
    }

    await tradingService.closePosition(positionId, 'MANUAL');

    res.status(200).json({
      success: true,
      message: 'Posição fechada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fechar posição:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// ========================================
// CONTROLLERS DE ORDERS
// ========================================

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }

    const validatedData = CreateOrderSchema.parse(req.body);

    const account = await exchangeService.getExchangeAccount(validatedData.exchangeAccountId);
    if (!account || account.userId !== userId) {
      res.status(404).json({ success: false, message: 'Conta de exchange não encontrada' });
      return;
    }

    const order = await tradingService.createAndExecuteOrder(validatedData);

    res.status(201).json({
      success: true,
      message: 'Ordem criada com sucesso',
      data: order
    });
  } catch (error) {
    console.error('Erro ao criar ordem:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// ========================================
// WEBHOOK TRADINGVIEW
// ========================================

export const tradingViewWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Webhook TradingView recebido:', req.body);

    const validatedData = TradingViewWebhookSchema.parse(req.body);

    let signalType: SignalType;
    switch (validatedData.action) {
      case 'BUY':
        signalType = SignalType.LONG;
        break;
      case 'SELL':
        signalType = SignalType.SHORT;
        break;
      case 'CLOSE':
        signalType = SignalType.CLOSE_LONG;
        break;
      default:
        throw new Error('Ação inválida no webhook');
    }

    const signalData: CreateSignalDTO = {
      source: 'TRADINGVIEW',
      symbol: validatedData.symbol.toUpperCase(),
      signalType,
      leverage: validatedData.leverage || undefined,
      entryPrice: validatedData.price || undefined,
      stopLoss: validatedData.stop_loss || undefined,
      takeProfit1: validatedData.take_profit || undefined,
      positionSizePercent: validatedData.position_size || undefined,
      notes: `Strategy: ${validatedData.strategy || 'Unknown'}, Timeframe: ${validatedData.timeframe || 'Unknown'}`
    };

    const signal = await tradingService.createSignal(signalData);

    console.log(`Sinal criado via webhook TradingView: ${signal.id}`);

    res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      data: {
        signalId: signal.id,
        symbol: signal.symbol,
        type: signal.signalType,
        status: signal.status
      }
    });
  } catch (error) {
    console.error('Erro no webhook TradingView:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Dados do webhook inválidos',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao processar webhook'
    });
  }
};

// ========================================
// CONTROLLER PARA VERIFICAR STATUS DAS FASES
// ========================================

export const checkPhasesStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = DatabaseService.getInstance();
    
    // Verificar migrações executadas
    let migrations: any[] = [];
    try {
      const migrationResult = await db.query(`
        SELECT migration_name, executed_at 
        FROM database_migrations 
        ORDER BY executed_at ASC
      `);
      migrations = migrationResult.rows;
    } catch (error) {
      console.log('Tabela de migrações não existe');
    }
    
    // Verificar tabelas existentes
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const existingTables = tablesResult.rows.map((row: any) => row.table_name);
    
    // Definir tabelas por fase
    const fase1Tables = ['database_migrations'];
    const fase2Tables = ['users', 'affiliates', 'user_sessions', 'verification_tokens', 'audit_logs'];
    const fase3Tables = ['user_exchange_accounts', 'trading_signals', 'trading_positions', 'trading_orders', 'trading_settings', 'market_data'];
    
    // Verificar completude de cada fase
    const fase1Complete = fase1Tables.every(table => existingTables.includes(table));
    const fase2Complete = fase2Tables.every(table => existingTables.includes(table));
    const fase3Complete = fase3Tables.every(table => existingTables.includes(table));
    
    // Contar tabelas por fase
    const fase1Count = fase1Tables.filter(table => existingTables.includes(table)).length;
    const fase2Count = fase2Tables.filter(table => existingTables.includes(table)).length;
    const fase3Count = fase3Tables.filter(table => existingTables.includes(table)).length;
    
    // Verificar ENUMs de trading
    let tradingEnums: any[] = [];
    try {
      const enumsResult = await db.query(`
        SELECT typname as enum_name 
        FROM pg_type 
        WHERE typtype = 'e' 
        AND (typname LIKE '%_type' OR typname LIKE '%_status' OR typname LIKE '%_side')
        ORDER BY typname
      `);
      tradingEnums = enumsResult.rows.map((row: any) => row.enum_name);
    } catch (error) {
      console.log('Erro ao verificar ENUMs');
    }
    
    res.status(200).json({
      success: true,
      message: 'Status das fases verificado com sucesso',
      data: {
        migrations: migrations.map(m => ({
          name: m.migration_name,
          executedAt: m.executed_at
        })),
        phases: {
          fase1: {
            name: 'Infraestrutura Básica',
            complete: fase1Complete,
            tablesCount: `${fase1Count}/${fase1Tables.length}`,
            tables: {
              expected: fase1Tables,
              existing: fase1Tables.filter(table => existingTables.includes(table)),
              missing: fase1Tables.filter(table => !existingTables.includes(table))
            }
          },
          fase2: {
            name: 'Sistema de Autenticação',
            complete: fase2Complete,
            tablesCount: `${fase2Count}/${fase2Tables.length}`,
            tables: {
              expected: fase2Tables,
              existing: fase2Tables.filter(table => existingTables.includes(table)),
              missing: fase2Tables.filter(table => !existingTables.includes(table))
            }
          },
          fase3: {
            name: 'Sistema de Trading',
            complete: fase3Complete,
            tablesCount: `${fase3Count}/${fase3Tables.length}`,
            tables: {
              expected: fase3Tables,
              existing: fase3Tables.filter(table => existingTables.includes(table)),
              missing: fase3Tables.filter(table => !existingTables.includes(table))
            },
            enums: tradingEnums
          }
        },
        summary: {
          totalTables: existingTables.length,
          fase1Status: fase1Complete ? 'COMPLETA' : 'INCOMPLETA',
          fase2Status: fase2Complete ? 'COMPLETA' : 'INCOMPLETA', 
          fase3Status: fase3Complete ? 'COMPLETA' : 'INCOMPLETA',
          allPhasesComplete: fase1Complete && fase2Complete && fase3Complete
        },
        allTables: existingTables
      }
    });
  } catch (error) {
    console.error('Erro ao verificar status das fases:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status das fases',
      error: (error as Error).message
    });
  }
};

// ========================================
// EXPORT DOS CONTROLLERS
// ========================================

export default {
  addExchangeAccount,
  getUserExchangeAccounts,
  getExchangeBalance,
  testExchangeConnection,
  removeExchangeAccount,
  createSignal,
  getUserSignals,
  getSignal,
  getUserPositions,
  closePosition,
  createOrder,
  tradingViewWebhook,
  checkPhasesStatus
};
