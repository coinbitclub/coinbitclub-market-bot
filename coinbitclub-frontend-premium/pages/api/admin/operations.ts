import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../src/lib/database-real';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getOperations(req, res);
      case 'POST':
        return await createOperation(req, res);
      case 'PUT':
        return await updateOperation(req, res);
      case 'DELETE':
        return await closeOperation(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Erro na API operations:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// GET - Listar operações com filtros
async function getOperations(req: NextApiRequest, res: NextApiResponse) {
  const { 
    page = 1, 
    limit = 20, 
    status = '', 
    symbol = '',
    user_id = '',
    exchange = '',
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  try {
    console.log('🔍 Buscando operações com filtros:', { page, limit, status, symbol, user_id, exchange });

    // Construir query com filtros
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`o.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (symbol) {
      whereConditions.push(`o.symbol ILIKE $${paramIndex}`);
      queryParams.push(`%${symbol}%`);
      paramIndex++;
    }

    if (user_id) {
      whereConditions.push(`o.user_id = $${paramIndex}`);
      queryParams.push(user_id);
      paramIndex++;
    }

    if (exchange) {
      whereConditions.push(`o.exchange = $${paramIndex}`);
      queryParams.push(exchange);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM trade_operations o 
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Query principal com paginação
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    queryParams.push(limit, offset);
    
    const operationsQuery = `
      SELECT 
        o.id,
        o.user_id,
        o.symbol,
        o.side,
        o.quantity,
        o.entry_price,
        o.current_price,
        o.exit_price,
        o.stop_loss,
        o.take_profit,
        o.profit_loss,
        o.profit_loss_percentage,
        o.status,
        o.exchange,
        o.order_id,
        o.signal_id,
        o.strategy,
        o.risk_level,
        o.created_at,
        o.updated_at,
        o.closed_at,
        o.close_reason,
        u.name as user_name,
        u.email as user_email,
        s.source as signal_source,
        s.action as signal_action,
        s.confidence as signal_confidence
      FROM trade_operations o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN trading_signals s ON o.signal_id = s.id
      ${whereClause}
      ORDER BY o.${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const operationsResult = await query(operationsQuery, queryParams);

    // Calcular métricas para cada operação
    const operationsWithMetrics = operationsResult.rows.map(operation => {
      const duration = operation.closed_at 
        ? Math.round((new Date(operation.closed_at).getTime() - new Date(operation.created_at).getTime()) / (1000 * 60 * 60)) // horas
        : Math.round((new Date().getTime() - new Date(operation.created_at).getTime()) / (1000 * 60 * 60));

      return {
        ...operation,
        entryPrice: parseFloat(operation.entry_price) || 0,
        currentPrice: parseFloat(operation.current_price) || 0,
        exitPrice: parseFloat(operation.exit_price) || 0,
        stopLoss: parseFloat(operation.stop_loss) || 0,
        takeProfit: parseFloat(operation.take_profit) || 0,
        profitLoss: parseFloat(operation.profit_loss) || 0,
        profitLossPercentage: parseFloat(operation.profit_loss_percentage) || 0,
        quantity: parseFloat(operation.quantity) || 0,
        duration: duration,
        signalConfidence: parseFloat(operation.signal_confidence) || 0
      };
    });

    // Estatísticas gerais
    const statsQuery = `
      SELECT 
        COUNT(*) as total_operations,
        COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_operations,
        COUNT(CASE WHEN status = 'CLOSED' AND profit_loss > 0 THEN 1 END) as profitable_operations,
        COUNT(CASE WHEN status = 'CLOSED' AND profit_loss < 0 THEN 1 END) as losing_operations,
        AVG(profit_loss) as avg_profit_loss,
        SUM(profit_loss) as total_profit_loss,
        AVG(CASE WHEN status = 'CLOSED' THEN profit_loss_percentage END) as avg_return_percentage,
        SUM(quantity * entry_price) as total_volume
      FROM trade_operations o
      ${whereClause}
    `;

    const statsResult = await query(statsQuery, queryParams.slice(0, paramIndex - 2));
    const stats = statsResult.rows[0];

    const response = {
      operations: operationsWithMetrics,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      },
      stats: {
        totalOperations: parseInt(stats.total_operations) || 0,
        openOperations: parseInt(stats.open_operations) || 0,
        profitableOperations: parseInt(stats.profitable_operations) || 0,
        losingOperations: parseInt(stats.losing_operations) || 0,
        winRate: stats.total_operations > 0 ? ((parseInt(stats.profitable_operations) || 0) / parseInt(stats.total_operations) * 100).toFixed(2) : '0.00',
        avgProfitLoss: parseFloat(stats.avg_profit_loss) || 0,
        totalProfitLoss: parseFloat(stats.total_profit_loss) || 0,
        avgReturnPercentage: parseFloat(stats.avg_return_percentage) || 0,
        totalVolume: parseFloat(stats.total_volume) || 0
      },
      filters: { status, symbol, user_id, exchange, sortBy, sortOrder }
    };

    console.log(`✅ ${operationsWithMetrics.length} operações retornadas de ${total} total`);
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Erro ao buscar operações:', error);
    throw error;
  }
}

// POST - Criar nova operação
async function createOperation(req: NextApiRequest, res: NextApiResponse) {
  const { 
    userId, 
    symbol, 
    side, 
    quantity, 
    entryPrice, 
    stopLoss, 
    takeProfit, 
    exchange, 
    signalId, 
    strategy = 'manual',
    riskLevel = 'medium'
  } = req.body;

  if (!userId || !symbol || !side || !quantity || !entryPrice || !exchange) {
    return res.status(400).json({ error: 'Campos obrigatórios: userId, symbol, side, quantity, entryPrice, exchange' });
  }

  try {
    // Verificar se usuário existe e está ativo
    const userCheck = await query('SELECT id, status, current_plan FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].status !== 'active') {
      return res.status(404).json({ error: 'Usuário não encontrado ou inativo' });
    }

    // Verificar se signal existe se fornecido
    if (signalId) {
      const signalCheck = await query('SELECT id FROM trading_signals WHERE id = $1', [signalId]);
      if (signalCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Sinal não encontrado' });
      }
    }

    // Criar operação
    const operationResult = await query(`
      INSERT INTO trade_operations (
        user_id, symbol, side, quantity, entry_price, current_price,
        stop_loss, take_profit, status, exchange, signal_id,
        strategy, risk_level, created_at
      ) VALUES ($1, $2, $3, $4, $5, $5, $6, $7, 'OPEN', $8, $9, $10, $11, NOW())
      RETURNING id, user_id, symbol, side, quantity, entry_price, status, created_at
    `, [
      userId, symbol.toUpperCase(), side.toUpperCase(), quantity, entryPrice,
      stopLoss, takeProfit, exchange, signalId, strategy, riskLevel
    ]);

    const newOperation = operationResult.rows[0];

    // Atualizar estatísticas do usuário
    await query(`
      UPDATE users 
      SET total_operations = total_operations + 1, updated_at = NOW()
      WHERE id = $1
    `, [userId]);

    // Log de atividade
    await query(`
      INSERT INTO user_activity_logs (
        user_id, action, details, created_at
      ) VALUES ($1, 'OPERATION_OPENED', $2, NOW())
    `, [userId, JSON.stringify({
      operationId: newOperation.id,
      symbol: symbol,
      side: side,
      quantity: quantity,
      entryPrice: entryPrice
    })]);

    console.log('✅ Operação criada:', newOperation.id);
    return res.status(201).json({ operation: newOperation });

  } catch (error) {
    console.error('❌ Erro ao criar operação:', error);
    throw error;
  }
}

// PUT - Atualizar operação (principalmente preço atual e P&L)
async function updateOperation(req: NextApiRequest, res: NextApiResponse) {
  const { operationId, updates } = req.body;

  if (!operationId) {
    return res.status(400).json({ error: 'Operation ID é obrigatório' });
  }

  try {
    const allowedFields = [
      'current_price', 'stop_loss', 'take_profit', 'profit_loss', 
      'profit_loss_percentage', 'status'
    ];

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(field => {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = $${paramIndex}`);
        updateValues.push(updates[field]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    }

    updateValues.push(operationId);
    
    const updateQuery = `
      UPDATE trade_operations 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, symbol, side, current_price, profit_loss, status, updated_at
    `;

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operação não encontrada' });
    }

    console.log('✅ Operação atualizada:', operationId);
    return res.status(200).json({ operation: result.rows[0] });

  } catch (error) {
    console.error('❌ Erro ao atualizar operação:', error);
    throw error;
  }
}

// DELETE - Fechar operação
async function closeOperation(req: NextApiRequest, res: NextApiResponse) {
  const { operationId, exitPrice, closeReason = 'MANUAL_CLOSE' } = req.body;

  if (!operationId || !exitPrice) {
    return res.status(400).json({ error: 'Operation ID e exit price são obrigatórios' });
  }

  try {
    // Buscar operação atual
    const operationCheck = await query(`
      SELECT id, user_id, symbol, side, quantity, entry_price, status 
      FROM trade_operations 
      WHERE id = $1
    `, [operationId]);

    if (operationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Operação não encontrada' });
    }

    const operation = operationCheck.rows[0];

    if (operation.status !== 'OPEN') {
      return res.status(400).json({ error: 'Operação já está fechada' });
    }

    // Calcular P&L
    const entryPrice = parseFloat(operation.entry_price);
    const quantity = parseFloat(operation.quantity);
    const profitLoss = operation.side === 'BUY' 
      ? (exitPrice - entryPrice) * quantity
      : (entryPrice - exitPrice) * quantity;
    
    const profitLossPercentage = ((exitPrice - entryPrice) / entryPrice) * 100;

    // Fechar operação
    const result = await query(`
      UPDATE trade_operations 
      SET 
        status = 'CLOSED',
        exit_price = $1,
        current_price = $1,
        profit_loss = $2,
        profit_loss_percentage = $3,
        close_reason = $4,
        closed_at = NOW(),
        updated_at = NOW()
      WHERE id = $5
      RETURNING id, symbol, side, profit_loss, profit_loss_percentage, closed_at
    `, [exitPrice, profitLoss, profitLossPercentage, closeReason, operationId]);

    // Atualizar estatísticas do usuário
    await query(`
      UPDATE users 
      SET 
        total_profit_loss = total_profit_loss + $1,
        win_rate = (
          SELECT ROUND(
            (COUNT(CASE WHEN profit_loss > 0 THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
          )
          FROM trade_operations 
          WHERE user_id = $2 AND status = 'CLOSED'
        ),
        updated_at = NOW()
      WHERE id = $2
    `, [profitLoss, operation.user_id]);

    // Log de atividade
    await query(`
      INSERT INTO user_activity_logs (
        user_id, action, details, created_at
      ) VALUES ($1, 'OPERATION_CLOSED', $2, NOW())
    `, [operation.user_id, JSON.stringify({
      operationId: operationId,
      symbol: operation.symbol,
      profitLoss: profitLoss,
      closeReason: closeReason
    })]);

    console.log('✅ Operação fechada:', operationId, 'P&L:', profitLoss);
    return res.status(200).json({ 
      message: 'Operação fechada com sucesso',
      operation: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erro ao fechar operação:', error);
    throw error;
  }
}
