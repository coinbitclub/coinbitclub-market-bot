import { NextApiRequest, NextApiResponse } from 'next';
import { aiService } from '../../../src/lib/ai';
import { coinStatsAPI } from '../../../src/lib/coinstats';
import { zapiService } from '../../../src/lib/zapi';

// Sistema de CRON para gerar relatórios IA automaticamente
// Endpoint protegido por chave do sistema
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Verificar chave do sistema
  const systemKey = req.headers['x-system-key'];
  if (!systemKey || systemKey !== process.env.SYSTEM_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { action } = req.body;

    switch (action) {
      case 'generate_radar_report':
        await generateRadarReport();
        break;
      case 'check_active_trades':
        await checkActiveTrades();
        break;
      case 'send_daily_summary':
        await sendDailySummary();
        break;
      case 'process_affiliate_payments':
        await processAffiliatePayments();
        break;
      default:
        return res.status(400).json({ error: 'Ação inválida' });
    }

    return res.status(200).json({ success: true, message: `${action} executado com sucesso` });
  } catch (error) {
    console.error('Erro no cron job:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Gerar relatório RADAR DA ÁGUIA NEWS (executar a cada 4 horas)
async function generateRadarReport(): Promise<void> {
  try {
    console.log('Iniciando geração do relatório RADAR DA ÁGUIA...');

    // Obter dados de mercado do CoinStats
    const [globalStats, topCoins, trending, news] = await Promise.all([
      coinStatsAPI.getGlobalStats(),
      coinStatsAPI.getCoins(10),
      coinStatsAPI.getTrending(5),
      coinStatsAPI.getNews(10)
    ]);

    if (!globalStats || !topCoins.length) {
      throw new Error('Erro ao obter dados de mercado');
    }

    // Preparar dados para o AI
    const marketData = {
      btcPrice: topCoins.find(coin => coin.symbol === 'BTC')?.price || 0,
      ethPrice: topCoins.find(coin => coin.symbol === 'ETH')?.price || 0,
      marketCap: globalStats.totalMarketCap,
      volume24h: globalStats.total24hVolume,
      dominance: globalStats.btcDominance,
      fearGreedIndex: 50, // Implementar cálculo real
      trending: trending.map(coin => coin.symbol)
    };

    // Gerar relatório com IA
    const aiReport = await aiService.generateRadarDaAguiaReport(marketData);

    // Salvar no banco de dados
    const reportId = await saveAIReport(aiReport);

    // Enviar para todos os usuários ativos
    const activeUsers = await getActiveUsers();
    
    for (const user of activeUsers) {
      // Verificar se usuário tem plano ativo
      if (user.planType !== 'none' && user.phone) {
        await zapiService.sendAIReport(user.phone, {
          title: aiReport.title,
          summary: aiReport.summary,
          fullReport: aiReport.content
        });
        
        // Delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Relatório RADAR DA ÁGUIA gerado e enviado para ${activeUsers.length} usuários`);
  } catch (error) {
    console.error('Erro ao gerar relatório RADAR DA ÁGUIA:', error);
    throw error;
  }
}

// Verificar trades ativos e alertas (executar a cada 15 minutos)
async function checkActiveTrades(): Promise<void> {
  try {
    console.log('Verificando trades ativos...');

    // Buscar todas as operações ativas
    const activeOperations = await getActiveOperationsFromDB();

    for (const operation of activeOperations) {
      try {
        // Obter configuração da exchange do usuário
        const userExchange = await getUserExchange(operation.exchangeId, operation.userId);
        if (!userExchange) continue;

        // Verificar preço atual
        const currentPriceResponse = await getCurrentPrice(userExchange, operation.symbol);
        if (!currentPriceResponse.success) continue;

        const currentPrice = currentPriceResponse.price;
        const entryPrice = operation.entryPrice;
        
        // Verificar stop loss
        if (operation.stopLoss) {
          const shouldTriggerSL = (
            (operation.action === 'buy' && currentPrice <= operation.stopLoss) ||
            (operation.action === 'sell' && currentPrice >= operation.stopLoss)
          );

          if (shouldTriggerSL) {
            await executeStopLoss(operation, currentPrice);
            continue;
          }
        }

        // Verificar take profit
        if (operation.takeProfit) {
          const shouldTriggerTP = (
            (operation.action === 'buy' && currentPrice >= operation.takeProfit) ||
            (operation.action === 'sell' && currentPrice <= operation.takeProfit)
          );

          if (shouldTriggerTP) {
            await executeTakeProfit(operation, currentPrice);
            continue;
          }
        }

        // Verificar alertas de preço
        const priceChange = ((currentPrice - entryPrice) / entryPrice) * 100;
        
        // Alertar se mudança significativa (>5%)
        if (Math.abs(priceChange) >= 5) {
          const user = await getUserById(operation.userId);
          if (user?.phone) {
            await zapiService.sendTradeAlert(user.phone, {
              symbol: operation.symbol,
              action: 'close', // Apenas alerta
              price: currentPrice,
              quantity: operation.quantity,
              result: priceChange > 0 ? 'profit' : 'loss',
              amount: Math.abs(priceChange)
            });
          }
        }

      } catch (error) {
        console.error(`Erro ao verificar operação ${operation.id}:`, error);
      }
    }

    console.log(`Verificados ${activeOperations.length} trades ativos`);
  } catch (error) {
    console.error('Erro ao verificar trades ativos:', error);
    throw error;
  }
}

// Enviar resumo diário (executar às 18h todos os dias)
async function sendDailySummary(): Promise<void> {
  try {
    console.log('Enviando resumo diário...');

    const users = await getActiveUsers();
    
    for (const user of users) {
      try {
        // Obter estatísticas do dia
        const dailyStats = await getUserDailyStats(user.id);
        
        if (user.phone && dailyStats.hasActivity) {
          const message = `
📊 *RESUMO DIÁRIO - ${new Date().toLocaleDateString('pt-BR')}*

💰 Saldo: $${dailyStats.currentBalance.toFixed(2)}
📈 P&L do dia: ${dailyStats.dailyPnL >= 0 ? '+' : ''}$${dailyStats.dailyPnL.toFixed(2)}
🎯 Trades: ${dailyStats.totalTrades}
✅ Taxa de sucesso: ${dailyStats.successRate.toFixed(1)}%

📋 Próximo relatório IA: ${getNextReportTime()}

🔗 Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard
          `.trim();

          await zapiService.sendWhatsAppMessage(user.phone, message);
          
          // Delay para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Erro ao enviar resumo para usuário ${user.id}:`, error);
      }
    }

    console.log(`Resumo diário enviado para ${users.length} usuários`);
  } catch (error) {
    console.error('Erro ao enviar resumo diário:', error);
    throw error;
  }
}

// Processar pagamentos de afiliados (executar no dia 5 de cada mês)
async function processAffiliatePayments(): Promise<void> {
  try {
    console.log('Processando pagamentos de afiliados...');

    // Buscar afiliados com comissões pendentes
    const affiliatesWithCommissions = await getAffiliatesWithPendingCommissions();

    for (const affiliate of affiliatesWithCommissions) {
      try {
        // Calcular total de comissões do mês anterior
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const totalCommissions = await calculateAffiliateCommissions(
          affiliate.userId, 
          lastMonth
        );

        if (totalCommissions >= 10) { // Mínimo $10 para saque
          // Registrar pagamento automático
          await processAffiliatePayment(affiliate.userId, totalCommissions);
          
          // Notificar afiliado
          const user = await getUserById(affiliate.userId);
          if (user?.phone) {
            await zapiService.sendWhatsAppMessage(user.phone, `
💰 *PAGAMENTO DE AFILIADO PROCESSADO*

💵 Valor: $${totalCommissions.toFixed(2)}
📅 Referente: ${lastMonth.toLocaleDateString('pt-BR')}
🏦 Processamento: 1-3 dias úteis

🔗 Ver detalhes: ${process.env.NEXT_PUBLIC_APP_URL}/user/affiliate
            `.trim());
          }
        }
      } catch (error) {
        console.error(`Erro ao processar pagamento do afiliado ${affiliate.userId}:`, error);
      }
    }

    console.log(`Processados pagamentos para ${affiliatesWithCommissions.length} afiliados`);
  } catch (error) {
    console.error('Erro ao processar pagamentos de afiliados:', error);
    throw error;
  }
}

// Funções auxiliares (implementar com banco de dados real)
async function saveAIReport(report: any): Promise<string> {
  // INSERT INTO ai_reports (...) VALUES (...)
  return 'report_id';
}

async function getActiveUsers(): Promise<any[]> {
  // SELECT * FROM users WHERE plan_type != 'none' AND is_active = true
  return [];
}

async function getActiveOperationsFromDB(): Promise<any[]> {
  // SELECT * FROM trade_operations WHERE status = 'active'
  return [];
}

async function executeStopLoss(operation: any, currentPrice: number): Promise<void> {
  // Implementar fechamento automático por stop loss
}

async function executeTakeProfit(operation: any, currentPrice: number): Promise<void> {
  // Implementar fechamento automático por take profit
}

async function getUserDailyStats(userId: string): Promise<any> {
  // Calcular estatísticas do dia do usuário
  return {
    hasActivity: false,
    currentBalance: 0,
    dailyPnL: 0,
    totalTrades: 0,
    successRate: 0
  };
}

async function getAffiliatesWithPendingCommissions(): Promise<any[]> {
  // SELECT * FROM affiliates WHERE pending_commissions > 0
  return [];
}

async function calculateAffiliateCommissions(userId: string, month: Date): Promise<number> {
  // Calcular comissões do afiliado para o mês
  return 0;
}

async function processAffiliatePayment(userId: string, amount: number): Promise<void> {
  // Processar pagamento automático para afiliado
}

function getNextReportTime(): string {
  const now = new Date();
  const nextReport = new Date(now);
  
  // Próximo horário de relatório (a cada 4 horas: 0, 4, 8, 12, 16, 20)
  const currentHour = now.getHours();
  const nextHour = Math.ceil((currentHour + 1) / 4) * 4;
  
  nextReport.setHours(nextHour, 0, 0, 0);
  
  if (nextHour >= 24) {
    nextReport.setDate(nextReport.getDate() + 1);
    nextReport.setHours(0, 0, 0, 0);
  }
  
  return nextReport.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

// Função auxiliar para obter configuração da exchange do usuário
async function getUserExchange(exchangeId: string, userId: string) {
  // Implementação simulada - em produção, buscar do banco de dados
  return {
    id: exchangeId,
    userId: userId,
    apiKey: 'mock-api-key',
    secretKey: 'mock-secret-key',
    exchange: 'binance'
  };
}

// Função auxiliar para obter usuário por ID
async function getUserById(userId: string) {
  // Implementação simulada - em produção, buscar do banco de dados
  return {
    id: userId,
    phone: '+5511999999999',
    email: 'user@example.com',
    name: 'Usuário Demo'
  };
}

// Função auxiliar para obter preço atual
async function getCurrentPrice(userExchange: any, symbol: string) {
  // Implementação simulada - em produção, consultar API da exchange
  return {
    success: true,
    price: 50000 // Mock price
  };
}
