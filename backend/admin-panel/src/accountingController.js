const { query } = require('./db');

class AccountingController {
  // Get company financial overview
  async getCompanyFinancialOverview(req, res) {
    try {
      const query = `
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END), 0) as total_entradas,
          COALESCE(SUM(CASE WHEN type = 'pagamento_usuario' THEN amount ELSE 0 END), 0) as pagos_usuarios,
          COALESCE(SUM(CASE WHEN type = 'pagamento_afiliado' THEN amount ELSE 0 END), 0) as pagos_afiliados,
          COALESCE(SUM(CASE WHEN type = 'reserva' THEN amount ELSE 0 END), 0) as saldo_comprometido,
          COALESCE(SUM(CASE WHEN type = 'retirada_empresa' THEN amount ELSE 0 END), 0) as retiradas,
          COALESCE(SUM(CASE 
            WHEN type = 'entrada' THEN amount 
            WHEN type IN ('pagamento_usuario', 'pagamento_afiliado', 'retirada_empresa', 'reserva') THEN -amount 
            ELSE 0 
          END), 0) as saldo_liquido
        FROM company_financial
      `;
      
      const overview = await query(query);
      
      // Get currency breakdown
      const currencyQuery = `
        SELECT 
          currency,
          COALESCE(SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END), 0) as entradas,
          COALESCE(SUM(CASE WHEN type IN ('pagamento_usuario', 'pagamento_afiliado', 'retirada_empresa') THEN amount ELSE 0 END), 0) as saidas,
          COALESCE(SUM(CASE 
            WHEN type = 'entrada' THEN amount 
            WHEN type IN ('pagamento_usuario', 'pagamento_afiliado', 'retirada_empresa') THEN -amount 
            ELSE 0 
          END), 0) as saldo_liquido
        FROM company_financial
        GROUP BY currency
        ORDER BY currency
      `;
      
      const byCurrency = await query(currencyQuery);
      
      res.json({
        success: true,
        data: {
          overview: overview[0],
          by_currency: byCurrency
        }
      });
    } catch (error) {
      console.error('Error fetching company financial overview:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch financial overview' 
      });
    }
  }

  // Get monthly financial flow
  async getMonthlyFlow(req, res) {
    try {
      const { months = 12 } = req.query;
      
      const query = `
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as mes,
          currency,
          SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END) as entradas,
          SUM(CASE WHEN type IN ('pagamento_usuario', 'pagamento_afiliado', 'retirada_empresa') THEN amount ELSE 0 END) as saidas,
          SUM(CASE 
            WHEN type = 'entrada' THEN amount 
            WHEN type IN ('pagamento_usuario', 'pagamento_afiliado', 'retirada_empresa') THEN -amount 
            ELSE 0 
          END) as saldo_liquido
        FROM company_financial
        WHERE created_at >= NOW() - INTERVAL '${months} months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM'), currency
        ORDER BY mes DESC, currency
      `;
      
      const monthlyFlow = await query(query);
      
      res.json({
        success: true,
        data: monthlyFlow
      });
    } catch (error) {
      console.error('Error fetching monthly flow:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch monthly flow' 
      });
    }
  }

  // Get all transactions with filters
  async getAllTransactions(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        type, 
        currency, 
        start_date, 
        end_date 
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      let queryParams = [limit, offset];
      let paramCount = 2;
      
      if (type) {
        whereClause += ` AND cf.type = $${++paramCount}`;
        queryParams.push(type);
      }
      
      if (currency) {
        whereClause += ` AND cf.currency = $${++paramCount}`;
        queryParams.push(currency);
      }
      
      if (start_date) {
        whereClause += ` AND cf.created_at >= $${++paramCount}`;
        queryParams.push(start_date);
      }
      
      if (end_date) {
        whereClause += ` AND cf.created_at <= $${++paramCount}`;
        queryParams.push(end_date);
      }
      
      const query = `
        SELECT 
          cf.*,
          u.name as user_name,
          u.email as user_email,
          af.name as affiliate_name,
          af.email as affiliate_email,
          o.symbol as operation_symbol,
          o.profit_usd as operation_profit
        FROM company_financial cf
        LEFT JOIN users u ON u.id = cf.related_user_id
        LEFT JOIN users af ON af.id = cf.related_affiliate_id
        LEFT JOIN operations o ON o.id = cf.reference_operation
        WHERE 1=1 ${whereClause}
        ORDER BY cf.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      const transactions = await query(query, queryParams);
      
      // Count total transactions for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM company_financial cf
        WHERE 1=1 ${whereClause}
      `;
      
      const countResult = await query(countQuery, queryParams.slice(2));
      const total = parseInt(countResult[0].total);
      
      res.json({
        success: true,
        data: transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch transactions' 
      });
    }
  }

  // Create manual transaction
  async createTransaction(req, res) {
    try {
      const {
        type,
        description,
        amount,
        currency = 'BRL',
        related_user_id,
        related_affiliate_id,
        reference_operation
      } = req.body;
      
      // Validate transaction type
      const validTypes = ['entrada', 'pagamento_usuario', 'pagamento_afiliado', 'retirada_empresa', 'reserva'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid transaction type'
        });
      }
      
      const query = `
        INSERT INTO company_financial (
          type, description, amount, currency, 
          related_user_id, related_affiliate_id, reference_operation
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const newTransaction = await query(query, [
        type, description, amount, currency,
        related_user_id, related_affiliate_id, reference_operation
      ]);
      
      res.status(201).json({
        success: true,
        data: newTransaction[0]
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create transaction' 
      });
    }
  }

  // Get pending financial obligations
  async getPendingObligations(req, res) {
    try {
      // Get pending refund requests
      const refundsQuery = `
        SELECT 
          'refund_request' as type,
          r.id,
          r.user_id,
          u.name as user_name,
          u.email as user_email,
          r.amount_requested as amount,
          r.currency,
          r.created_at,
          NULL as affiliate_id,
          NULL as affiliate_name
        FROM refund_requests r
        JOIN users u ON u.id = r.user_id
        WHERE r.status = 'pending'
      `;
      
      const refunds = await query(refundsQuery);
      
      // Get affiliate commissions not yet paid
      const affiliateCommissionsQuery = `
        SELECT 
          'affiliate_commission' as type,
          ac.id,
          ac.affiliate_id as user_id,
          af.name as user_name,
          af.email as user_email,
          ac.commission_usd as amount,
          'USD' as currency,
          ac.created_at,
          ac.affiliate_id,
          af.name as affiliate_name
        FROM affiliate_commissions ac
        JOIN users af ON af.id = ac.affiliate_id
        WHERE NOT EXISTS (
          SELECT 1 FROM company_financial cf
          WHERE cf.type = 'pagamento_afiliado' 
            AND cf.related_affiliate_id = ac.affiliate_id
            AND cf.amount = ac.commission_usd
            AND DATE_TRUNC('day', cf.created_at) = DATE_TRUNC('day', ac.created_at)
        )
      `;
      
      const affiliateCommissions = await query(affiliateCommissionsQuery);
      
      const allPending = [...refunds, ...affiliateCommissions].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      
      res.json({
        success: true,
        data: allPending
      });
    } catch (error) {
      console.error('Error fetching pending obligations:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch pending obligations' 
      });
    }
  }

  // Get revenue by plan
  async getRevenueByPlan(req, res) {
    try {
      const { months = 12 } = req.query;
      
      const query = `
        SELECT 
          p.name as plan_name,
          TO_CHAR(ce.created_at, 'YYYY-MM') as mes,
          COUNT(DISTINCT ce.user_id) as usuarios_ativos,
          SUM(ce.profit_usd) as lucro_gerado,
          SUM(ce.commission_usd) as comissao_empresa
        FROM commission_events ce
        JOIN subscriptions s ON s.user_id = ce.user_id
        JOIN plans p ON p.id = s.plan_id
        WHERE ce.created_at >= NOW() - INTERVAL '${months} months'
        GROUP BY p.name, TO_CHAR(ce.created_at, 'YYYY-MM')
        ORDER BY mes DESC, plan_name
      `;
      
      const revenueByPlan = await query(query);
      
      res.json({
        success: true,
        data: revenueByPlan
      });
    } catch (error) {
      console.error('Error fetching revenue by plan:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch revenue by plan' 
      });
    }
  }

  // Get user financial details
  async getUserFinancialDetails(req, res) {
    try {
      const { user_id } = req.params;
      
      // Get user financial summary
      const userQuery = `
        SELECT 
          u.name,
          u.email,
          uf.balance,
          uf.profit,
          uf.locked,
          COALESCE(SUM(CASE WHEN cf.type = 'reserva' THEN cf.amount ELSE 0 END), 0) as reservado
        FROM users u
        LEFT JOIN user_financial uf ON uf.user_id = u.id
        LEFT JOIN company_financial cf ON cf.related_user_id = u.id
        WHERE u.id = $1
        GROUP BY u.name, u.email, uf.balance, uf.profit, uf.locked
      `;
      
      const userData = await query(userQuery, [user_id]);
      
      if (userData.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Get user's commission events
      const commissionsQuery = `
        SELECT * FROM commission_events
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 20
      `;
      
      const commissions = await query(commissionsQuery, [user_id]);
      
      // Get user's operations
      const operationsQuery = `
        SELECT * FROM operations
        WHERE user_id = $1
        ORDER BY closed_at DESC
        LIMIT 20
      `;
      
      const operations = await query(operationsQuery, [user_id]);
      
      res.json({
        success: true,
        data: {
          user: userData[0],
          recent_commissions: commissions,
          recent_operations: operations
        }
      });
    } catch (error) {
      console.error('Error fetching user financial details:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch user financial details' 
      });
    }
  }

  // Process refund request
  async processRefund(req, res) {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'approve' or 'reject'
      
      if (action === 'approve') {
        // Get refund request details
        const refundQuery = `
          SELECT * FROM refund_requests
          WHERE id = $1 AND status = 'pending'
        `;
        
        const refund = await query(refundQuery, [id]);
        
        if (refund.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Refund request not found or already processed'
          });
        }
        
        const refundData = refund[0];
        
        // Update refund status
        await query(
          'UPDATE refund_requests SET status = $1 WHERE id = $2',
          ['approved', id]
        );
        
        // Create company financial outflow
        await query(`
          INSERT INTO company_financial (
            type, description, amount, currency, related_user_id
          ) VALUES ('pagamento_usuario', $1, $2, $3, $4)
        `, [
          `Reembolso aprovado - Solicitação #${id}`,
          refundData.amount_requested,
          refundData.currency,
          refundData.user_id
        ]);
        
        res.json({
          success: true,
          message: 'Refund approved and processed'
        });
      } else if (action === 'reject') {
        await query(
          'UPDATE refund_requests SET status = $1 WHERE id = $2',
          ['rejected', id]
        );
        
        res.json({
          success: true,
          message: 'Refund request rejected'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid action. Use "approve" or "reject"'
        });
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process refund' 
      });
    }
  }
}

module.exports = new AccountingController();
