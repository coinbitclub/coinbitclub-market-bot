import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateRequest } from '../../../src/lib/jwt';
import { query } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = authenticateRequest(req);

    if (req.method === 'GET') {
      await handleGetOperations(req, res, user.userId);
    } else {
      return res.status(405).json({ message: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de operações:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor' 
    });
  }
}

async function handleGetOperations(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { 
    page = 1, 
    limit = 50, 
    startDate, 
    endDate, 
    exchange, 
    symbol, 
    type,
    status = 'closed'
  } = req.query;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  let whereClause = 'WHERE user_id = $1';
  const params: any[] = [userId];
  let paramCount = 1;

  // Filtro por status
  if (status) {
    paramCount++;
    whereClause += ` AND status = $${paramCount}`;
    params.push(status);
  }

  // Filtro por período
  if (startDate && endDate) {
    paramCount++;
    whereClause += ` AND DATE(${status === 'closed' ? 'closed_at' : 'opened_at'}) BETWEEN $${paramCount} AND $${paramCount + 1}`;
    params.push(startDate, endDate);
    paramCount++;
  }

  // Filtro por exchange
  if (exchange) {
    paramCount++;
    whereClause += ` AND exchange = $${paramCount}`;
    params.push(exchange);
  }

  // Filtro por símbolo
  if (symbol) {
    paramCount++;
    whereClause += ` AND symbol ILIKE $${paramCount}`;
    params.push(`%${symbol}%`);
  }

  // Filtro por tipo
  if (type) {
    paramCount++;
    whereClause += ` AND type = $${paramCount}`;
    params.push(type);
  }

  // Buscar operações
  const operationsResult = await query(`
    SELECT 
      to_id as id,
      exchange,
      symbol,
      type,
      status,
      entry_price,
      exit_price,
      quantity,
      leverage,
      stop_loss,
      take_profit,
      result,
      result_percentage,
      opened_at,
      closed_at,
      ai_justification,
      commission,
      fees,
      (quantity * entry_price) as invested_amount
    FROM trade_operations
    ${whereClause}
    ORDER BY ${status === 'closed' ? 'closed_at' : 'opened_at'} DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `, [...params, parseInt(limit as string), offset]);

  // Buscar total de operações para paginação
  const totalResult = await query(`
    SELECT COUNT(*) as total
    FROM trade_operations
    ${whereClause}
  `, params);

  // Buscar estatísticas do período filtrado
  const statsResult = await query(`
    SELECT 
      COUNT(*) as total_operations,
      COUNT(CASE WHEN result > 0 THEN 1 END) as profitable_operations,
      COUNT(CASE WHEN result < 0 THEN 1 END) as loss_operations,
      COALESCE(SUM(CASE WHEN result > 0 THEN result ELSE 0 END), 0) as total_profit,
      COALESCE(SUM(CASE WHEN result < 0 THEN ABS(result) ELSE 0 END), 0) as total_loss,
      COALESCE(SUM(result), 0) as net_result,
      COALESCE(AVG(result), 0) as average_result,
      COALESCE(SUM(commission + fees), 0) as total_fees
    FROM trade_operations
    ${whereClause} AND status = 'closed'
  `, params);

  const operations = operationsResult.rows.map(op => ({
    id: op.id,
    exchange: op.exchange,
    symbol: op.symbol,
    type: op.type,
    status: op.status,
    entryPrice: parseFloat(op.entry_price),
    exitPrice: op.exit_price ? parseFloat(op.exit_price) : null,
    quantity: parseFloat(op.quantity),
    leverage: parseFloat(op.leverage),
    stopLoss: parseFloat(op.stop_loss),
    takeProfit: op.take_profit ? parseFloat(op.take_profit) : null,
    result: op.result ? parseFloat(op.result) : null,
    resultPercentage: op.result_percentage ? parseFloat(op.result_percentage) : null,
    investedAmount: parseFloat(op.invested_amount),
    openedAt: op.opened_at,
    closedAt: op.closed_at,
    aiJustification: op.ai_justification,
    commission: parseFloat(op.commission || 0),
    fees: parseFloat(op.fees || 0),
    duration: op.closed_at && op.opened_at 
      ? Math.round((new Date(op.closed_at).getTime() - new Date(op.opened_at).getTime()) / (1000 * 60 * 60))
      : null // duração em horas
  }));

  const stats = statsResult.rows[0];
  const periodStats = {
    totalOperations: parseInt(stats.total_operations),
    profitableOperations: parseInt(stats.profitable_operations),
    lossOperations: parseInt(stats.loss_operations),
    successRate: stats.total_operations > 0 
      ? (parseInt(stats.profitable_operations) / parseInt(stats.total_operations)) * 100 
      : 0,
    totalProfit: parseFloat(stats.total_profit),
    totalLoss: parseFloat(stats.total_loss),
    netResult: parseFloat(stats.net_result),
    averageResult: parseFloat(stats.average_result),
    totalFees: parseFloat(stats.total_fees)
  };

  res.status(200).json({
    operations,
    stats: periodStats,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: parseInt(totalResult.rows[0].total),
      totalPages: Math.ceil(parseInt(totalResult.rows[0].total) / parseInt(limit as string))
    }
  });
}
