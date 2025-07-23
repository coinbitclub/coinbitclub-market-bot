const { query } = require('./db');

class OperationsController {
  // Get all operations with user and affiliate data
  async getAllOperations(req, res) {
    try {
      const { page = 1, limit = 50, symbol, user_id, status } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      let queryParams = [limit, offset];
      let paramCount = 2;
      
      if (symbol) {
        whereClause += ` AND o.symbol ILIKE $${++paramCount}`;
        queryParams.push(`%${symbol}%`);
      }
      
      if (user_id) {
        whereClause += ` AND o.user_id = $${++paramCount}`;
        queryParams.push(user_id);
      }
      
      if (status) {
        whereClause += ` AND o.status = $${++paramCount}`;
        queryParams.push(status);
      }
      
      const query = `
        SELECT 
          o.*,
          u.name as user_name,
          u.email as user_email,
          ce.commission_percent,
          ce.commission_usd,
          ac.commission_usd as affiliate_commission,
          af.name as affiliate_name,
          s.type as signal_type,
          s.strategy_used
        FROM operations o
        LEFT JOIN users u ON u.id = o.user_id
        LEFT JOIN commission_events ce ON ce.operation_id = o.id
        LEFT JOIN affiliate_commissions ac ON ac.operation_id = o.id
        LEFT JOIN users af ON af.id = ac.affiliate_id
        LEFT JOIN signals s ON s.id_uuid = o.signal_id
        WHERE 1=1 ${whereClause}
        ORDER BY o.closed_at DESC NULLS LAST
        LIMIT $1 OFFSET $2
      `;
      
      const operations = await query(query, queryParams);
      
      // Count total operations for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM operations o
        WHERE 1=1 ${whereClause}
      `;
      
      const countResult = await query(countQuery, queryParams.slice(2));
      const total = parseInt(countResult[0].total);
      
      res.json({
        success: true,
        data: operations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching operations:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch operations' 
      });
    }
  }

  // Get operation by ID with detailed information
  async getOperationById(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          o.*,
          u.name as user_name,
          u.email as user_email,
          ce.commission_percent,
          ce.commission_usd,
          ce.commission_converted,
          ce.currency as commission_currency,
          ac.commission_usd as affiliate_commission,
          af.name as affiliate_name,
          af.email as affiliate_email,
          s.type as signal_type,
          s.strategy_used,
          s.price as signal_price,
          s.created_at as signal_created_at,
          ai.decision as ai_decision,
          ai.confidence as ai_confidence
        FROM operations o
        LEFT JOIN users u ON u.id = o.user_id
        LEFT JOIN commission_events ce ON ce.operation_id = o.id
        LEFT JOIN affiliate_commissions ac ON ac.operation_id = o.id
        LEFT JOIN users af ON af.id = ac.affiliate_id
        LEFT JOIN signals s ON s.id_uuid = o.signal_id
        LEFT JOIN ai_decisions ai ON ai.signal_id::uuid = o.signal_id
        WHERE o.id = $1
      `;
      
      const operations = await query(query, [id]);
      
      if (operations.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Operation not found'
        });
      }
      
      res.json({
        success: true,
        data: operations[0]
      });
    } catch (error) {
      console.error('Error fetching operation:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch operation' 
      });
    }
  }

  // Get operations statistics
  async getOperationsStats(req, res) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_operations,
          COUNT(CASE WHEN profit_usd > 0 THEN 1 END) as profitable_operations,
          COUNT(CASE WHEN profit_usd < 0 THEN 1 END) as losing_operations,
          COALESCE(SUM(profit_usd), 0) as total_profit,
          COALESCE(AVG(profit_usd), 0) as avg_profit,
          COUNT(CASE WHEN closed_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as operations_24h,
          COUNT(CASE WHEN closed_at >= NOW() - INTERVAL '7 days' THEN 1 END) as operations_7d,
          COUNT(CASE WHEN closed_at >= NOW() - INTERVAL '30 days' THEN 1 END) as operations_30d
        FROM operations
        WHERE closed_at IS NOT NULL
      `;
      
      const stats = await query(statsQuery);
      
      // Get top performing symbols
      const symbolsQuery = `
        SELECT 
          symbol,
          COUNT(*) as operation_count,
          COALESCE(SUM(profit_usd), 0) as total_profit,
          COALESCE(AVG(profit_usd), 0) as avg_profit
        FROM operations
        WHERE closed_at IS NOT NULL
        GROUP BY symbol
        ORDER BY total_profit DESC
        LIMIT 10
      `;
      
      const topSymbols = await query(symbolsQuery);
      
      res.json({
        success: true,
        data: {
          ...stats[0],
          top_symbols: topSymbols
        }
      });
    } catch (error) {
      console.error('Error fetching operations stats:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch operations statistics' 
      });
    }
  }

  // Get operations by date range
  async getOperationsByDateRange(req, res) {
    try {
      const { start_date, end_date, group_by = 'day' } = req.query;
      
      let dateFormat;
      switch (group_by) {
        case 'hour':
          dateFormat = 'YYYY-MM-DD HH24:00:00';
          break;
        case 'week':
          dateFormat = 'YYYY-WW';
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
      }
      
      const query = `
        SELECT 
          TO_CHAR(closed_at, '${dateFormat}') as period,
          COUNT(*) as operation_count,
          COALESCE(SUM(profit_usd), 0) as total_profit,
          COALESCE(AVG(profit_usd), 0) as avg_profit,
          COUNT(CASE WHEN profit_usd > 0 THEN 1 END) as profitable_count,
          COUNT(CASE WHEN profit_usd < 0 THEN 1 END) as losing_count
        FROM operations
        WHERE closed_at IS NOT NULL
          AND ($1::date IS NULL OR closed_at >= $1::date)
          AND ($2::date IS NULL OR closed_at <= $2::date)
        GROUP BY TO_CHAR(closed_at, '${dateFormat}')
        ORDER BY period DESC
      `;
      
      const operations = await query(query, [start_date || null, end_date || null]);
      
      res.json({
        success: true,
        data: operations
      });
    } catch (error) {
      console.error('Error fetching operations by date range:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch operations by date range' 
      });
    }
  }

  // Manually create operation (for testing/admin purposes)
  async createOperation(req, res) {
    try {
      const {
        user_id,
        symbol,
        side,
        entry_price,
        exit_price,
        profit_usd,
        signal_id
      } = req.body;
      
      const query = `
        INSERT INTO operations (
          user_id, symbol, side, entry_price, exit_price, 
          profit_usd, opened_at, closed_at, status, signal_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), 'closed', $7)
        RETURNING *
      `;
      
      const newOperations = await query(query, [
        user_id, symbol, side, entry_price, exit_price, profit_usd, signal_id
      ]);
      
      res.status(201).json({
        success: true,
        data: newOperations[0]
      });
    } catch (error) {
      console.error('Error creating operation:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create operation' 
      });
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(req, res) {
    try {
      const { period = '30d' } = req.query;
      
      let dateFilter = '';
      switch (period) {
        case '24h':
          dateFilter = "AND closed_at >= NOW() - INTERVAL '24 hours'";
          break;
        case '7d':
          dateFilter = "AND closed_at >= NOW() - INTERVAL '7 days'";
          break;
        case '30d':
          dateFilter = "AND closed_at >= NOW() - INTERVAL '30 days'";
          break;
        case '90d':
          dateFilter = "AND closed_at >= NOW() - INTERVAL '90 days'";
          break;
        default:
          dateFilter = "AND closed_at >= NOW() - INTERVAL '30 days'";
      }
      
      const query = `
        SELECT 
          COUNT(*) as total_operations,
          COALESCE(SUM(profit_usd), 0) as total_profit,
          COALESCE(AVG(profit_usd), 0) as avg_profit_per_operation,
          COUNT(CASE WHEN profit_usd > 0 THEN 1 END) as winning_operations,
          COUNT(CASE WHEN profit_usd < 0 THEN 1 END) as losing_operations,
          CASE 
            WHEN COUNT(*) > 0 THEN 
              ROUND((COUNT(CASE WHEN profit_usd > 0 THEN 1 END)::decimal / COUNT(*)) * 100, 2)
            ELSE 0 
          END as win_rate,
          COALESCE(MAX(profit_usd), 0) as best_operation,
          COALESCE(MIN(profit_usd), 0) as worst_operation,
          COUNT(DISTINCT user_id) as active_users
        FROM operations
        WHERE closed_at IS NOT NULL ${dateFilter}
      `;
      
      const metrics = await query(query);
      
      res.json({
        success: true,
        data: {
          period,
          metrics: metrics[0]
        }
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch performance metrics' 
      });
    }
  }
}

module.exports = new OperationsController();
