import { NextApiRequest, NextApiResponse } from 'next';
import { createExchangeAPI, ExchangeConfig } from '../../../src/lib/exchanges';
import { aiService } from '../../../src/lib/ai';
import { coinStatsAPI } from '../../../src/lib/coinstats';
import { zapiService } from '../../../src/lib/zapi';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Executar operação de trading
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const userId = decoded.userId;

      const {
        exchangeId,
        symbol,
        action, // 'buy' | 'sell' | 'close'
        type = 'market', // 'market' | 'limit'
        quantity,
        price,
        stopLoss,
        takeProfit
      } = req.body;

      // Validar dados básicos
      if (!exchangeId || !symbol || !action || !quantity) {
        return res.status(400).json({ 
          error: 'Dados obrigatórios: exchangeId, symbol, action, quantity' 
        });
      }

      // Buscar configuração da exchange do usuário (do banco de dados)
      // Aqui você faria: SELECT * FROM user_exchanges WHERE id = ? AND user_id = ?
      const userExchange = {
        id: exchangeId,
        exchange: 'binance', // vem do banco
        apiKey: 'decrypted_api_key', // descriptografar do banco
        secretKey: 'decrypted_secret_key', // descriptografar do banco
        testnet: true, // vem do banco
        userId
      };

      // Verificar limite de operações simultâneas (máximo 2)
      const activeOperations = await getActiveOperations(userId);
      if (activeOperations.length >= 2 && action !== 'close') {
        return res.status(400).json({
          error: 'Limite máximo de 2 operações simultâneas atingido'
        });
      }

      // Criar instância da API da exchange
      const exchangeAPI = createExchangeAPI(userExchange as ExchangeConfig);

      // Testar conexão
      const connectionTest = await exchangeAPI.testConnection();
      if (!connectionTest.success) {
        return res.status(400).json({
          error: 'Falha na conexão com a exchange',
          details: connectionTest.error
        });
      }

      // Obter preço atual
      const currentPriceResponse = await exchangeAPI.getSymbolPrice(symbol);
      if (!currentPriceResponse.success) {
        return res.status(400).json({
          error: 'Erro ao obter preço do símbolo',
          details: currentPriceResponse.error
        });
      }

      const currentPrice = currentPriceResponse.data!;
      const orderPrice = type === 'market' ? currentPrice : (price || currentPrice);

      // Executar ordem
      const orderResult = await exchangeAPI.createOrder({
        symbol,
        side: action === 'buy' ? 'buy' : 'sell',
        type,
        quantity,
        price: type === 'limit' ? orderPrice : undefined,
        stopLoss,
        takeProfit
      });

      if (!orderResult.success) {
        return res.status(400).json({
          error: 'Erro ao executar ordem',
          details: orderResult.error
        });
      }

      // Salvar operação no banco de dados
      const tradeOperation = {
        userId,
        exchangeId,
        symbol,
        action,
        type,
        quantity,
        entryPrice: orderPrice,
        stopLoss,
        takeProfit,
        status: 'active',
        orderId: orderResult.data!.orderId,
        createdAt: new Date()
      };

      // Aqui você salvaria: INSERT INTO trade_operations (...) VALUES (...)
      const operationId = 'generated_id_from_db';

      // Enviar notificação por WhatsApp
      const user = await getUserById(userId);
      if (user?.phone) {
        await zapiService.sendTradeAlert(user.phone, {
          symbol,
          action: action as 'buy' | 'sell',
          price: orderPrice,
          quantity,
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Operação executada com sucesso',
        operation: {
          id: operationId,
          symbol,
          action,
          quantity,
          price: orderPrice,
          orderId: orderResult.data!.orderId,
          status: 'active'
        }
      });

    } catch (error) {
      console.error('Erro ao executar trade:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  if (req.method === 'GET') {
    // Obter operações ativas e histórico
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const userId = decoded.userId;

      // Buscar operações do usuário
      const operations = await getUserOperations(userId);
      
      return res.status(200).json({
        success: true,
        operations
      });

    } catch (error) {
      console.error('Erro ao obter operações:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  if (req.method === 'PUT') {
    // Atualizar/fechar operação
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const userId = decoded.userId;

      const { operationId, action } = req.body; // action: 'close' | 'update_sl' | 'update_tp'

      if (!operationId || !action) {
        return res.status(400).json({ error: 'operationId e action são obrigatórios' });
      }

      // Buscar operação no banco
      const operation = await getOperationById(operationId, userId);
      if (!operation) {
        return res.status(404).json({ error: 'Operação não encontrada' });
      }

      // Buscar configuração da exchange
      const userExchange = await getUserExchange(operation.exchangeId, userId);
      if (!userExchange) {
        return res.status(404).json({ error: 'Configuração da exchange não encontrada' });
      }

      const exchangeAPI = createExchangeAPI(userExchange);

      if (action === 'close') {
        // Fechar operação
        const closeOrder = await exchangeAPI.createOrder({
          symbol: operation.symbol,
          side: operation.action === 'buy' ? 'sell' : 'buy',
          type: 'market',
          quantity: operation.quantity
        });

        if (closeOrder.success) {
          // Calcular resultado
          const currentPrice = await exchangeAPI.getSymbolPrice(operation.symbol);
          const exitPrice = currentPrice.data || operation.entryPrice;
          const result = calculateTradeResult(operation, exitPrice);

          // Atualizar no banco
          await updateOperationStatus(operationId, 'closed', {
            exitPrice,
            result: result.profit,
            pnl: result.pnl
          });

          // Gerar análise com IA se houve prejuízo
          if (result.profit === 'loss') {
            const analysis = await aiService.analyzeTradeResult(
              operation.symbol,
              operation.entryPrice,
              exitPrice,
              'loss',
              'Mercado volátil'
            );

            // Salvar análise no banco para exibir ao usuário
            await saveTradeAnalysis(operationId, analysis);
          }

          // Notificar usuário
          const user = await getUserById(userId);
          if (user?.phone) {
            await zapiService.sendTradeAlert(user.phone, {
              symbol: operation.symbol,
              action: 'close',
              price: exitPrice,
              quantity: operation.quantity,
              result: result.profit,
              amount: result.pnl
            });
          }

          return res.status(200).json({
            success: true,
            message: 'Operação fechada com sucesso',
            result
          });
        } else {
          return res.status(400).json({
            error: 'Erro ao fechar operação',
            details: closeOrder.error
          });
        }
      }

      return res.status(400).json({ error: 'Ação não implementada' });

    } catch (error) {
      console.error('Erro ao atualizar operação:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

// Funções auxiliares (implementar com banco de dados real)
async function getActiveOperations(userId: string): Promise<any[]> {
  // SELECT * FROM trade_operations WHERE user_id = ? AND status = 'active'
  return [];
}

async function getUserOperations(userId: string): Promise<any[]> {
  // SELECT * FROM trade_operations WHERE user_id = ? ORDER BY created_at DESC
  return [];
}

async function getOperationById(operationId: string, userId: string): Promise<any> {
  // SELECT * FROM trade_operations WHERE id = ? AND user_id = ?
  return null;
}

async function getUserExchange(exchangeId: string, userId: string): Promise<ExchangeConfig | null> {
  // SELECT * FROM user_exchanges WHERE id = ? AND user_id = ?
  // Descriptografar API keys
  return null;
}

async function updateOperationStatus(
  operationId: string, 
  status: string, 
  data: any
): Promise<void> {
  // UPDATE trade_operations SET status = ?, exit_price = ?, pnl = ? WHERE id = ?
}

async function saveTradeAnalysis(operationId: string, analysis: string): Promise<void> {
  // INSERT INTO trade_analysis (operation_id, analysis, created_at) VALUES (?, ?, NOW())
}

async function getUserById(userId: string): Promise<any> {
  // SELECT * FROM users WHERE id = ?
  return null;
}

function calculateTradeResult(operation: any, exitPrice: number): {
  profit: 'profit' | 'loss';
  pnl: number;
  percentage: number;
} {
  const entryPrice = operation.entryPrice;
  const quantity = operation.quantity;
  
  let pnl: number;
  
  if (operation.action === 'buy') {
    pnl = (exitPrice - entryPrice) * quantity;
  } else {
    pnl = (entryPrice - exitPrice) * quantity;
  }
  
  const percentage = (Math.abs(pnl) / (entryPrice * quantity)) * 100;
  
  return {
    profit: pnl >= 0 ? 'profit' : 'loss',
    pnl,
    percentage
  };
}
