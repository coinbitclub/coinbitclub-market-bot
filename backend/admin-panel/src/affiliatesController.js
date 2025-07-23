const { query } = require('./db');

class AffiliatesController {
  // Get all affiliates with commission data
  async getAllAffiliates(req, res) {
    try {
      const query = `
        SELECT 
          u.id as affiliate_id,
          u.name as affiliate_name,
          u.email as affiliate_email,
          a.code as affiliate_code,
          u.created_at,
          af.credits as financial_credits,
          COUNT(DISTINCT ac.referred_user_id) as total_referrals,
          COUNT(DISTINCT ac.operation_id) as total_operations,
          COALESCE(SUM(ac.commission_usd), 0) as total_commissions,
          COALESCE(SUM(ac.profit_usd), 0) as total_profits_generated,
          MAX(ac.created_at) as last_commission_date
        FROM users u
        INNER JOIN affiliates a ON a.user_id = u.id
        LEFT JOIN affiliate_financial af ON af.affiliate_id = u.id
        LEFT JOIN affiliate_commissions ac ON ac.affiliate_id = u.id
        WHERE u.is_affiliate = true
        GROUP BY u.id, u.name, u.email, a.code, u.created_at, af.credits
        ORDER BY total_commissions DESC
      `;
      
      const affiliates = await query(query);
      
      res.json({
        success: true,
        data: affiliates,
        total: affiliates.length
      });
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch affiliates' 
      });
    }
  }

  // Get affiliate by ID with detailed information
  async getAffiliateById(req, res) {
    try {
      const { id } = req.params;
      
      // Get affiliate basic info
      const affiliateQuery = `
        SELECT 
          u.id as affiliate_id,
          u.name as affiliate_name,
          u.email as affiliate_email,
          a.code as affiliate_code,
          u.created_at,
          af.credits as financial_credits,
          af.created_at as financial_created,
          af.updated_at as financial_updated
        FROM users u
        INNER JOIN affiliates a ON a.user_id = u.id
        LEFT JOIN affiliate_financial af ON af.affiliate_id = u.id
        WHERE u.id = $1 AND u.is_affiliate = true
      `;
      
      const affiliates = await query(affiliateQuery, [id]);
      
      if (affiliates.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Affiliate not found'
        });
      }
      
      // Get referred users
      const referralsQuery = `
        SELECT DISTINCT
          ru.id as user_id,
          ru.name as user_name,
          ru.email as user_email,
          ru.created_at as user_joined,
          COUNT(ac.operation_id) as operations_count,
          COALESCE(SUM(ac.commission_usd), 0) as total_commissions,
          COALESCE(SUM(ac.profit_usd), 0) as total_profits
        FROM affiliate_commissions ac
        JOIN users ru ON ru.id = ac.referred_user_id
        WHERE ac.affiliate_id = $1
        GROUP BY ru.id, ru.name, ru.email, ru.created_at
        ORDER BY total_commissions DESC
      `;
      
      const referrals = await query(referralsQuery, [id]);
      
      // Get commission history
      const commissionsQuery = `
        SELECT 
          ac.*,
          ru.name as referred_user_name,
          o.symbol,
          o.side,
          o.entry_price,
          o.exit_price
        FROM affiliate_commissions ac
        LEFT JOIN users ru ON ru.id = ac.referred_user_id
        LEFT JOIN operations o ON o.id = ac.operation_id
        WHERE ac.affiliate_id = $1
        ORDER BY ac.created_at DESC
        LIMIT 50
      `;
      
      const commissions = await query(commissionsQuery, [id]);
      
      // Get settlements
      const settlementsQuery = `
        SELECT * FROM affiliate_settlements
        WHERE affiliate_id = $1
        ORDER BY created_at DESC
      `;
      
      const settlements = await query(settlementsQuery, [id]);
      
      const affiliateData = {
        ...affiliates[0],
        referrals,
        recent_commissions: commissions,
        settlements
      };
      
      res.json({
        success: true,
        data: affiliateData
      });
    } catch (error) {
      console.error('Error fetching affiliate:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch affiliate' 
      });
    }
  }

  // Get affiliate statistics
  async getAffiliateStats(req, res) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT u.id) as total_affiliates,
          COUNT(DISTINCT ac.referred_user_id) as total_referrals,
          COALESCE(SUM(ac.commission_usd), 0) as total_commissions_paid,
          COALESCE(SUM(ac.profit_usd), 0) as total_profits_generated,
          COUNT(DISTINCT ac.operation_id) as total_affiliate_operations,
          COALESCE(AVG(ac.commission_usd), 0) as avg_commission_per_operation
        FROM users u
        INNER JOIN affiliates a ON a.user_id = u.id
        LEFT JOIN affiliate_commissions ac ON ac.affiliate_id = u.id
        WHERE u.is_affiliate = true
      `;
      
      const stats = await query(statsQuery);
      
      // Get top affiliates
      const topAffiliatesQuery = `
        SELECT 
          u.name as affiliate_name,
          u.email as affiliate_email,
          COALESCE(SUM(ac.commission_usd), 0) as total_earned,
          COUNT(DISTINCT ac.referred_user_id) as referrals_count
        FROM users u
        INNER JOIN affiliates a ON a.user_id = u.id
        LEFT JOIN affiliate_commissions ac ON ac.affiliate_id = u.id
        WHERE u.is_affiliate = true
        GROUP BY u.id, u.name, u.email
        ORDER BY total_earned DESC
        LIMIT 10
      `;
      
      const topAffiliates = await query(topAffiliatesQuery);
      
      res.json({
        success: true,
        data: {
          ...stats[0],
          top_affiliates: topAffiliates
        }
      });
    } catch (error) {
      console.error('Error fetching affiliate stats:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch affiliate statistics' 
      });
    }
  }

  // Create new affiliate
  async createAffiliate(req, res) {
    try {
      const { user_id, code } = req.body;
      
      // Check if user exists
      const userCheck = await query(
        'SELECT id FROM users WHERE id = $1',
        [user_id]
      );
      
      if (userCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Check if affiliate code already exists
      const codeCheck = await query(
        'SELECT id FROM affiliates WHERE code = $1',
        [code]
      );
      
      if (codeCheck.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Affiliate code already exists'
        });
      }
      
      // Update user to be affiliate
      await query(
        'UPDATE users SET is_affiliate = true WHERE id = $1',
        [user_id]
      );
      
      // Create affiliate record
      const affiliateQuery = `
        INSERT INTO affiliates (user_id, code)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      const newAffiliate = await query(affiliateQuery, [user_id, code]);
      
      // Create affiliate financial record
      await query(
        'INSERT INTO affiliate_financial (affiliate_id) VALUES ($1)',
        [user_id]
      );
      
      res.status(201).json({
        success: true,
        data: newAffiliate[0]
      });
    } catch (error) {
      console.error('Error creating affiliate:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create affiliate' 
      });
    }
  }

  // Update affiliate credits
  async updateAffiliateCredits(req, res) {
    try {
      const { id } = req.params;
      const { credits } = req.body;
      
      const query = `
        UPDATE affiliate_financial 
        SET credits = $1, updated_at = NOW()
        WHERE affiliate_id = $2
        RETURNING *
      `;
      
      const updated = await query(query, [credits, id]);
      
      if (updated.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Affiliate financial record not found'
        });
      }
      
      res.json({
        success: true,
        data: updated[0]
      });
    } catch (error) {
      console.error('Error updating affiliate credits:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update affiliate credits' 
      });
    }
  }

  // Process affiliate payment
  async processAffiliatePayment(req, res) {
    try {
      const { id } = req.params;
      const { amount, currency = 'BRL', reference_period } = req.body;
      
      // Create settlement record
      const settlementQuery = `
        INSERT INTO affiliate_settlements (
          affiliate_id, total_due, currency, paid, paid_at, reference_period
        )
        VALUES ($1, $2, $3, true, NOW(), $4)
        RETURNING *
      `;
      
      const settlement = await query(settlementQuery, [
        id, amount, currency, reference_period
      ]);
      
      // Record company financial outflow
      const companyFinancialQuery = `
        INSERT INTO company_financial (
          type, description, amount, currency, related_affiliate_id
        )
        VALUES ('pagamento_afiliado', $1, $2, $3, $4)
        RETURNING *
      `;
      
      const description = `Pagamento de comissão para afiliado - ${reference_period}`;
      
      await query(companyFinancialQuery, [
        description, amount, currency, id
      ]);
      
      res.json({
        success: true,
        message: 'Affiliate payment processed successfully',
        data: settlement[0]
      });
    } catch (error) {
      console.error('Error processing affiliate payment:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process affiliate payment' 
      });
    }
  }

  // Get commission history for affiliate
  async getCommissionHistory(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      
      const query = `
        SELECT 
          ac.*,
          ru.name as referred_user_name,
          ru.email as referred_user_email,
          o.symbol,
          o.side,
          o.entry_price,
          o.exit_price,
          o.closed_at as operation_closed_at
        FROM affiliate_commissions ac
        LEFT JOIN users ru ON ru.id = ac.referred_user_id
        LEFT JOIN operations o ON o.id = ac.operation_id
        WHERE ac.affiliate_id = $1
        ORDER BY ac.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const commissions = await query(query, [id, limit, offset]);
      
      // Count total commissions for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM affiliate_commissions
        WHERE affiliate_id = $1
      `;
      
      const countResult = await query(countQuery, [id]);
      const total = parseInt(countResult[0].total);
      
      res.json({
        success: true,
        data: commissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching commission history:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch commission history' 
      });
    }
  }
}

module.exports = new AffiliatesController();
