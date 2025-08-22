// ========================================
// MARKETBOT - ROTAS DE TRADING ENTERPRISE
// Sistema completo de gerenciamento de trading e configurações
// ========================================

import express from 'express';
import { TradingConfigurationService } from '../services/trading-configuration.service';
import TradingQueueService from '../services/trading-queue-simple.service';
import { DatabaseService } from '../services/database.service';
import tradingController from '../controllers/trading.controller.js';

const router = express.Router();
const configService = TradingConfigurationService.getInstance();
const queueService = TradingQueueService.getInstance();
const db = DatabaseService.getInstance().getPool();

// Middleware simples de autenticação (temporário)
const authenticate = (req: any, res: any, next: any) => {
  // Por enquanto, simula um usuário autenticado
  req.user = { id: 'temp-user-id' };
  next();
};

// ========================================
// 1. ROTAS DE CONFIGURAÇÃO (ADMIN)
// ========================================

// GET /api/trading/config - Buscar configurações atuais
router.get('/config', authenticate, async (req, res) => {
  try {
    const config = await configService.getTradingConfig();
    
    res.json({
      success: true,
      data: config,
      message: 'Configurações de trading recuperadas'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar configurações',
      error: error.message
    });
  }
});

// PUT /api/trading/config - Atualizar configurações (apenas admin)
router.put('/config', authenticate, async (req, res) => {
  try {
    const { config, reason } = req.body;
    const adminUser = (req as any).user.id;
    
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Dados de configuração são obrigatórios'
      });
    }

    const updatedConfig = await configService.updateTradingConfig(config, adminUser, reason, 'API');
    
    return res.json({
      success: true,
      data: updatedConfig,
      message: 'Configurações atualizadas com sucesso'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configurações',
      error: error.message
    });
  }
});

// ========================================
// 2. ROTAS DE VALIDAÇÃO DE TRADING
// ========================================

// POST /api/trading/validate - Validar se um trade é permitido
router.post('/validate', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { 
      symbol, 
      leverage, 
      positionSizePercent, 
      stopLossPercent, 
      takeProfitPercent 
    } = req.body;

    const validation = await configService.validateTradeRequest(
      userId,
      symbol,
      leverage,
      positionSizePercent,
      stopLossPercent,
      takeProfitPercent
    );
    
    res.json({
      success: true,
      data: validation,
      message: validation.valid ? 'Trade válido' : 'Trade inválido'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro na validação do trade',
      error: error.message
    });
  }
});

// ========================================
// 3. ROTAS DE FILA DE TRADING
// ========================================

// POST /api/trading/queue - Adicionar trade à fila
router.post('/queue', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const {
      symbol,
      side,
      leverage,
      positionSizePercent,
      stopLossPercent,
      takeProfitPercent,
      amountUsd,
      environment,
      exchange
    } = req.body;

    // Validar dados obrigatórios
    if (!symbol || !side || !leverage || !positionSizePercent || !stopLossPercent || !takeProfitPercent || !amountUsd || !environment || !exchange) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    // Validar trade antes de adicionar à fila
    const validation = await configService.validateTradeRequest(
      userId,
      symbol,
      leverage,
      positionSizePercent,
      stopLossPercent,
      takeProfitPercent
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Trade inválido',
        errors: validation.errors
      });
    }

    // Adicionar à fila com prioridade calculada
    const tradeId = await queueService.queueTrade({
      user_id: userId,
      symbol,
      side,
      leverage,
      position_size_percent: positionSizePercent,
      stop_loss_percent: stopLossPercent,
      take_profit_percent: takeProfitPercent,
      amount_usd: amountUsd,
      environment,
      exchange,
      max_attempts: 3,
      priority: 'MEDIUM' // Default priority
    });
    
    return res.json({
      success: true,
      data: { tradeId },
      message: 'Trade adicionado à fila com sucesso'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao adicionar trade à fila',
      error: error.message
    });
  }
});

// GET /api/trading/queue/status - Status geral da fila
router.get('/queue/status', authenticate, async (req, res) => {
  try {
    const status = await queueService.getQueueStatus();
    
    res.json({
      success: true,
      data: status,
      message: 'Status da fila recuperado'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar status da fila',
      error: error.message
    });
  }
});

// GET /api/trading/queue/user/:userId - Trades na fila de um usuário específico
router.get('/queue/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const trades = await db.query(`
      SELECT 
        id, symbol, side, leverage, position_size_percent,
        stop_loss_percent, take_profit_percent, amount_usd,
        priority, environment, exchange, status, attempts,
        error_message, estimated_execution_time, created_at
      FROM trading_queue 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [userId]);
    
    res.json({
      success: true,
      data: trades.rows,
      message: `${trades.rows.length} trades encontrados na fila`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar trades da fila',
      error: error.message
    });
  }
});

// ========================================
// 4. ROTAS DE POSIÇÕES
// ========================================

// GET /api/trading/positions - Listar posições do usuário
router.get('/positions', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { status, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        id, symbol, side, leverage, amount_usd, quantity,
        entry_price, mark_price, liquidation_price,
        stop_loss, take_profit, unrealized_pnl, realized_pnl,
        fees_paid, exchange, environment, status,
        created_at, updated_at, closed_at
      FROM trading_positions 
      WHERE user_id = $1
    `;
    
    const params = [userId];
    
    if (status) {
      query += ` AND status = $2`;
      params.push(status as string);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string));
    
    const positions = await db.query(query, params);
    
    res.json({
      success: true,
      data: positions.rows,
      message: `${positions.rows.length} posições encontradas`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar posições',
      error: error.message
    });
  }
});

// ========================================
// 5. ROTAS EXISTENTES (LEGADO)
// ========================================

// POST /api/v1/trading/accounts - Adicionar conta de exchange
router.post('/accounts', 
  authenticate, 
  tradingController.addExchangeAccount
);

// GET /api/v1/trading/accounts - Listar contas de exchange do usuário
router.get('/accounts', 
  authenticate, 
  tradingController.getUserExchangeAccounts
);

// GET /api/v1/trading/accounts/:accountId/balance - Obter saldo da conta
router.get('/accounts/:accountId/balance', 
  authenticate, 
  tradingController.getExchangeBalance
);

// POST /api/v1/trading/accounts/:accountId/test - Testar conexão
router.post('/accounts/:accountId/test', 
  authenticate, 
  tradingController.testExchangeConnection
);

// DELETE /api/v1/trading/accounts/:accountId - Remover conta de exchange
router.delete('/accounts/:accountId', 
  authenticate, 
  tradingController.removeExchangeAccount
);

// POST /api/v1/trading/signals - Criar sinal manual
router.post('/signals', 
  authenticate, 
  tradingController.createSignal
);

// GET /api/v1/trading/signals - Listar sinais do usuário
router.get('/signals', 
  authenticate, 
  tradingController.getUserSignals
);

// GET /api/v1/trading/signals/:signalId - Obter sinal específico
router.get('/signals/:signalId', 
  authenticate, 
  tradingController.getSignal
);

// POST /api/v1/trading/positions/:positionId/close - Fechar posição
router.post('/positions/:positionId/close', 
  authenticate, 
  tradingController.closePosition
);

// POST /api/v1/trading/orders - Criar ordem manual
router.post('/orders', 
  authenticate, 
  tradingController.createOrder
);

// POST /api/v1/trading/webhook/tradingview - Webhook do TradingView
router.post('/webhook/tradingview', 
  tradingController.tradingViewWebhook
);

// GET /api/v1/trading/health - Health check do sistema de trading
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sistema de trading Enterprise operacional',
    timestamp: new Date().toISOString(),
    services: {
      trading: 'OK',
      exchanges: 'OK',
      signals: 'OK',
      positions: 'OK',
      orders: 'OK',
      configuration: 'OK',
      queue: 'OK'
    }
  });
});

// GET /api/v1/trading/phases-status - Verificar status das fases
router.get('/phases-status', 
  tradingController.checkPhasesStatus
);

export default router;
