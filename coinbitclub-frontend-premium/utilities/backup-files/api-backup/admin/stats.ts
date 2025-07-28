import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../src/lib/jwt';
import { query } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificar se é admin
    requireAdmin(req);

    // Buscar estatísticas gerais
    const [usersStats, revenueStats, subscriptionStats] = await Promise.all([
      // Estatísticas de usuários
      query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month
        FROM users
      `),
      
      // Estatísticas de receita
      query(`
        SELECT 
          COALESCE(SUM(amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as monthly_revenue,
          COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN amount ELSE 0 END), 0) as daily_revenue
        FROM payments 
        WHERE status = 'completed'
      `),
      
      // Estatísticas de assinaturas
      query(`
        SELECT 
          COUNT(*) as total_subscriptions,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
          COUNT(CASE WHEN status = 'cancelled' AND updated_at >= NOW() - INTERVAL '30 days' THEN 1 END) as cancelled_month
        FROM subscriptions
      `)
    ]);

    const users = usersStats.rows[0];
    const revenue = revenueStats.rows[0];
    const subscriptions = subscriptionStats.rows[0];

    // Calcular taxa de conversão e churn
    const totalTrials = await query(`
      SELECT COUNT(*) as trial_count 
      FROM subscriptions 
      WHERE is_trial = true AND created_at >= NOW() - INTERVAL '90 days'
    `);

    const convertedTrials = await query(`
      SELECT COUNT(DISTINCT s1.user_id) as converted_count
      FROM subscriptions s1
      INNER JOIN subscriptions s2 ON s1.user_id = s2.user_id
      WHERE s1.is_trial = true 
        AND s2.is_trial = false 
        AND s1.created_at >= NOW() - INTERVAL '90 days'
    `);

    const conversionRate = totalTrials.rows[0].trial_count > 0 
      ? (convertedTrials.rows[0].converted_count / totalTrials.rows[0].trial_count) * 100 
      : 0;

    const churnRate = subscriptions.active_subscriptions > 0 
      ? (subscriptions.cancelled_month / subscriptions.active_subscriptions) * 100 
      : 0;

    res.status(200).json({
      totalUsers: parseInt(users.total_users),
      activeUsers: parseInt(users.active_users),
      newUsersMonth: parseInt(users.new_users_month),
      totalRevenue: parseFloat(revenue.total_revenue),
      monthlyRevenue: parseFloat(revenue.monthly_revenue),
      dailyRevenue: parseFloat(revenue.daily_revenue),
      totalSubscriptions: parseInt(subscriptions.total_subscriptions),
      activeSubscriptions: parseInt(subscriptions.active_subscriptions),
      cancelledMonth: parseInt(subscriptions.cancelled_month),
      conversionRate: Math.round(conversionRate * 10) / 10,
      churnRate: Math.round(churnRate * 10) / 10
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas admin:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor' 
    });
  }
}
