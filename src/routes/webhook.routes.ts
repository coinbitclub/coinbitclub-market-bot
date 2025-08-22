// ========================================
// WEBHOOK ROUTER - TRADINGVIEW
// Endpoints específicos para webhooks TradingView
// ========================================

import { Router } from 'express';
import { Request, Response } from 'express';
import { TradingService } from '../services/trading.service.js';
import { CreateSignalDTO, SignalType } from '../types/trading.types.js';
import { z } from 'zod';

const router = Router();

// Schema para webhook TradingView
const TradingViewWebhookSchema = z.object({
  strategy: z.object({
    order_action: z.string(),
    market_position: z.string(),
    market_position_size: z.string(),
    prev_market_position: z.string().optional(),
    prev_market_position_size: z.string().optional()
  }).optional(),
  order: z.object({
    contracts: z.string(),
    price: z.string()
  }).optional(),
  ticker: z.string(),
  time: z.string().optional(),
  action: z.string().optional(),
  symbol: z.string().optional(),
  price: z.number().optional(),
  leverage: z.number().optional(),
  stop_loss: z.number().optional(),
  take_profit: z.number().optional(),
  position_size: z.number().optional(),
  timeframe: z.string().optional(),
  strategy_name: z.string().optional()
}).catchall(z.any());

// Instância do trading service
const tradingService = TradingService.getInstance();

// Middleware de autenticação simples para webhooks
const authenticateWebhook = (req: Request, res: Response, next: any) => {
  const token = req.query.token || req.headers['x-webhook-token'] || req.headers.authorization?.replace('Bearer ', '');
  
  // Tokens válidos (em produção seria em variáveis de ambiente)
  const validTokens = ['tradingview-2024', 'marketbot-webhook', 'tv-signal-auth', '210406'];
  
  if (!token || !validTokens.includes(token as string)) {
    console.log('🔒 Webhook rejeitado - token inválido:', token);
    res.status(401).json({
      success: false,
      error: 'Token de autenticação inválido',
      message: 'Use ?token=tradingview-2024 ou header X-Webhook-Token',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  console.log('✅ Webhook autenticado com token:', token);
  next();
};

// ========================================
// WEBHOOK TRADINGVIEW ENDPOINT
// ========================================

router.post('/tradingview', authenticateWebhook, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📈 TradingView Webhook recebido:', {
      timestamp: new Date().toISOString(),
      body: req.body,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type']
      }
    });

    // Validar dados do webhook
    const webhookData = TradingViewWebhookSchema.parse(req.body);
    
    // Extrair informações do sinal
    let symbol = webhookData.symbol || webhookData.ticker;
    let action = webhookData.action || webhookData.strategy?.order_action;
    let price = webhookData.price || parseFloat(webhookData.order?.price || '0');
    
    // Normalizar símbolo
    if (symbol) {
      symbol = symbol.replace('BINANCE:', '').replace('BYBIT:', '').toUpperCase();
      if (!symbol.includes('USDT') && !symbol.includes('USD')) {
        symbol = symbol + 'USDT';
      }
    }

    // Determinar tipo de sinal
    let signalType: SignalType;
    
    if (action) {
      switch (action.toLowerCase()) {
        case 'buy':
        case 'long':
          signalType = SignalType.LONG;
          break;
        case 'sell':
        case 'short':
          signalType = SignalType.SHORT;
          break;
        case 'close':
        case 'exit':
          signalType = SignalType.CLOSE_LONG;
          break;
        default:
          throw new Error(`Ação não reconhecida: ${action}`);
      }
    } else {
      throw new Error('Ação não especificada no webhook');
    }

    // Criar dados do sinal
    const signalData: CreateSignalDTO = {
      source: 'TRADINGVIEW_WEBHOOK',
      symbol: symbol,
      signalType,
      leverage: webhookData.leverage || 5,
      entryPrice: price > 0 ? price : undefined,
      stopLoss: webhookData.stop_loss || undefined,
      takeProfit1: webhookData.take_profit || undefined,
      positionSizePercent: webhookData.position_size || 10,
      notes: `TradingView Strategy: ${webhookData.strategy_name || 'Unknown'} | Timeframe: ${webhookData.timeframe || 'Unknown'} | Time: ${webhookData.time || new Date().toISOString()}`
    };

    console.log('📊 Dados do sinal processados:', signalData);

    // Criar sinal no sistema
    const signal = await tradingService.createSignal(signalData);

    console.log('✅ Sinal TradingView criado com sucesso:', {
      signalId: signal.id,
      symbol: signal.symbol,
      type: signal.signalType,
      status: signal.status
    });

    res.status(200).json({
      success: true,
      message: 'Webhook TradingView processado com sucesso',
      data: {
        signalId: signal.id,
        symbol: signal.symbol,
        signalType: signal.signalType,
        status: signal.status,
        entryPrice: signal.entryPrice
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook TradingView:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Dados do webhook inválidos',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
});

// ========================================
// HEALTH CHECK PARA WEBHOOKS
// ========================================

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Webhook TradingView operacional',
    endpoints: {
      tradingview: '/webhooks/tradingview?token=tradingview-2024',
      coinbitclub: '/api/webhooks/signal?token=210406'
    },
    authentication: {
      methods: ['query_param', 'header'],
      tokens: ['tradingview-2024', 'marketbot-webhook', 'tv-signal-auth', '210406']
    },
    timestamp: new Date().toISOString()
  });
});

// ========================================
// TESTE DE WEBHOOK
// ========================================

router.post('/test', authenticateWebhook, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Webhook teste recebido com sucesso',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

export default router;
