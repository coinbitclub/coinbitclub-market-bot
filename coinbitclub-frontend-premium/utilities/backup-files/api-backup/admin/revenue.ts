import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../src/lib/jwt';
import { query } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verificar se é admin
    requireAdmin(req);

    if (req.method === 'GET') {
      await handleGetRevenue(req, res);
    } else {
      return res.status(405).json({ message: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de receita admin:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor' 
    });
  }
}

async function handleGetRevenue(req: NextApiRequest, res: NextApiResponse) {
  const { period = '30d', startDate, endDate } = req.query;

  let dateFilter = '';
  const params: any[] = [];

  if (startDate && endDate) {
    dateFilter = 'WHERE p.created_at BETWEEN $1 AND $2';
    params.push(startDate, endDate);
  } else {
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '365d') days = 365;
    
    dateFilter = 'WHERE p.created_at >= NOW() - INTERVAL \'' + days + ' days\'';
  }

  // Receita total por período
  const totalRevenueResult = await query(`
    SELECT 
      COALESCE(SUM(p.amount), 0) as total_revenue,
      COUNT(p.id) as total_transactions,
      COUNT(DISTINCT p.user_id) as unique_customers,
      AVG(p.amount) as average_transaction
    FROM payments p
    ${dateFilter} AND p.status = 'completed'
  `, params);

  // Receita por dia
  const dailyRevenueResult = await query(`
    SELECT 
      DATE(p.created_at) as date,
      SUM(p.amount) as revenue,
      COUNT(p.id) as transactions,
      COUNT(DISTINCT p.user_id) as customers
    FROM payments p
    ${dateFilter} AND p.status = 'completed'
    GROUP BY DATE(p.created_at)
    ORDER BY date DESC
    LIMIT 100
  `, params);

  // Receita por plano
  const revenueByPlanResult = await query(`
    SELECT 
      s.plan_type,
      SUM(p.amount) as revenue,
      COUNT(p.id) as transactions,
      COUNT(DISTINCT p.user_id) as customers,
      AVG(p.amount) as average_amount
    FROM payments p
    JOIN subscriptions s ON p.subscription_id = s.id
    ${dateFilter} AND p.status = 'completed'
    GROUP BY s.plan_type
    ORDER BY revenue DESC
  `, params);

  // Receita por método de pagamento
  const revenueByMethodResult = await query(`
    SELECT 
      p.payment_method,
      SUM(p.amount) as revenue,
      COUNT(p.id) as transactions,
      (COUNT(p.id) * 100.0 / (SELECT COUNT(*) FROM payments WHERE status = 'completed' ${dateFilter ? 'AND ' + dateFilter.replace('WHERE ', '') : ''})) as percentage
    FROM payments p
    ${dateFilter} AND p.status = 'completed'
    GROUP BY p.payment_method
    ORDER BY revenue DESC
  `, params);

  // Receita por país
  const revenueByCountryResult = await query(`
    SELECT 
      u.country,
      SUM(p.amount) as revenue,
      COUNT(p.id) as transactions,
      COUNT(DISTINCT p.user_id) as customers
    FROM payments p
    JOIN users u ON p.user_id = u.id
    ${dateFilter} AND p.status = 'completed' AND u.country IS NOT NULL
    GROUP BY u.country
    ORDER BY revenue DESC
    LIMIT 20
  `, params);

  // Taxa de conversão
  const conversionResult = await query(`
    SELECT 
      COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN u.id END) as paying_users,
      COUNT(DISTINCT u.id) as total_users,
      (COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN u.id END) * 100.0 / COUNT(DISTINCT u.id)) as conversion_rate
    FROM users u
    LEFT JOIN payments p ON u.id = p.user_id AND p.status = 'completed' ${dateFilter ? 'AND ' + dateFilter.replace('WHERE ', '') : ''}
    WHERE u.created_at >= NOW() - INTERVAL '90 days'
  `, params);

  // Métricas de retenção
  const retentionResult = await query(`
    SELECT 
      s.plan_type,
      COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_subscriptions,
      COUNT(CASE WHEN s.status = 'canceled' THEN 1 END) as canceled_subscriptions,
      COUNT(CASE WHEN s.status = 'expired' THEN 1 END) as expired_subscriptions,
      AVG(CASE WHEN s.canceled_at IS NOT NULL 
          THEN EXTRACT(days FROM (s.canceled_at - s.created_at))
          ELSE NULL END) as avg_days_to_cancel
    FROM subscriptions s
    GROUP BY s.plan_type
  `);

  // Refunds e chargebacks
  const refundsResult = await query(`
    SELECT 
      COUNT(CASE WHEN p.status = 'refunded' THEN 1 END) as total_refunds,
      COALESCE(SUM(CASE WHEN p.status = 'refunded' THEN p.amount ELSE 0 END), 0) as refunded_amount,
      COUNT(CASE WHEN p.status = 'failed' THEN 1 END) as failed_payments,
      COUNT(CASE WHEN p.status = 'disputed' THEN 1 END) as disputed_payments
    FROM payments p
    ${dateFilter}
  `, params);

  // Crescimento MRR (Monthly Recurring Revenue)
  const mrrResult = await query(`
    SELECT 
      DATE_TRUNC('month', s.created_at) as month,
      s.plan_type,
      COUNT(*) as new_subscriptions,
      SUM(CASE 
        WHEN s.plan_type = 'basic' THEN 29.99
        WHEN s.plan_type = 'premium' THEN 79.99
        WHEN s.plan_type = 'enterprise' THEN 199.99
        ELSE 0
      END) as monthly_revenue
    FROM subscriptions s
    WHERE s.created_at >= NOW() - INTERVAL '12 months'
      AND s.status IN ('active', 'canceled', 'expired')
    GROUP BY DATE_TRUNC('month', s.created_at), s.plan_type
    ORDER BY month DESC, s.plan_type
  `);

  res.status(200).json({
    period,
    summary: {
      totalRevenue: parseFloat(totalRevenueResult.rows[0].total_revenue),
      totalTransactions: parseInt(totalRevenueResult.rows[0].total_transactions),
      uniqueCustomers: parseInt(totalRevenueResult.rows[0].unique_customers),
      averageTransaction: parseFloat(totalRevenueResult.rows[0].average_transaction || 0),
      conversionRate: parseFloat(conversionResult.rows[0]?.conversion_rate || 0),
      payingUsers: parseInt(conversionResult.rows[0]?.paying_users || 0),
      totalRefunds: parseInt(refundsResult.rows[0].total_refunds),
      refundedAmount: parseFloat(refundsResult.rows[0].refunded_amount),
      failedPayments: parseInt(refundsResult.rows[0].failed_payments),
      disputedPayments: parseInt(refundsResult.rows[0].disputed_payments)
    },
    dailyRevenue: dailyRevenueResult.rows.map(row => ({
      date: row.date,
      revenue: parseFloat(row.revenue),
      transactions: parseInt(row.transactions),
      customers: parseInt(row.customers)
    })),
    revenueByPlan: revenueByPlanResult.rows.map(row => ({
      planType: row.plan_type,
      revenue: parseFloat(row.revenue),
      transactions: parseInt(row.transactions),
      customers: parseInt(row.customers),
      averageAmount: parseFloat(row.average_amount)
    })),
    revenueByMethod: revenueByMethodResult.rows.map(row => ({
      method: row.payment_method,
      revenue: parseFloat(row.revenue),
      transactions: parseInt(row.transactions),
      percentage: parseFloat(row.percentage)
    })),
    revenueByCountry: revenueByCountryResult.rows.map(row => ({
      country: row.country,
      revenue: parseFloat(row.revenue),
      transactions: parseInt(row.transactions),
      customers: parseInt(row.customers)
    })),
    retention: retentionResult.rows.map(row => ({
      planType: row.plan_type,
      activeSubscriptions: parseInt(row.active_subscriptions),
      canceledSubscriptions: parseInt(row.canceled_subscriptions),
      expiredSubscriptions: parseInt(row.expired_subscriptions),
      avgDaysToCancel: parseFloat(row.avg_days_to_cancel || 0)
    })),
    mrr: mrrResult.rows.map(row => ({
      month: row.month,
      planType: row.plan_type,
      newSubscriptions: parseInt(row.new_subscriptions),
      monthlyRevenue: parseFloat(row.monthly_revenue)
    }))
  });
}
