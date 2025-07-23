import express from 'express';
import { db } from '../../../common/db.js';
import { validate, validateBody } from '../../../common/validation.js';
import { handleAsyncError } from '../../../common/utils.js';
import logger from '../../../common/logger.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Get all users (admin only)
export const getAllUsers = handleAsyncError(async (req, res) => {
  const { page = 1, limit = 20, search, role, status } = req.query;
  const offset = (page - 1) * limit;
  
  let query = db('users')
    .leftJoin('subscriptions', function() {
      this.on('users.id', '=', 'subscriptions.user_id')
          .andOn('subscriptions.status', '=', db.raw('?', ['active']));
    })
    .leftJoin('plans', 'subscriptions.plan_id', 'plans.id')
    .select(
      'users.id',
      'users.name',
      'users.email',
      'users.role',
      'users.is_active',
      'users.created_at',
      'users.last_login',
      'users.affiliate_id',
      'users.affiliate_code',
      'subscriptions.id as subscription_id',
      'plans.name as plan_name',
      'plans.price as plan_price'
    );
  
  if (search) {
    query = query.where(function() {
      this.where('users.name', 'ilike', `%${search}%`)
          .orWhere('users.email', 'ilike', `%${search}%`);
    });
  }
  
  if (role) {
    query = query.where('users.role', role);
  }
  
  if (status) {
    query = query.where('users.is_active', status === 'active');
  }
  
  const [users, totalCount] = await Promise.all([
    query.clone()
      .orderBy('users.created_at', 'desc')
      .limit(limit)
      .offset(offset),
    query.clone().count('users.id as count').first()
  ]);
  
  res.json({
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(totalCount.count),
      pages: Math.ceil(totalCount.count / limit)
    }
  });
});

// Get user details
export const getUserDetails = handleAsyncError(async (req, res) => {
  const { userId } = req.params;
  
  const user = await db('users')
    .leftJoin('subscriptions', function() {
      this.on('users.id', '=', 'subscriptions.user_id')
          .andOn('subscriptions.status', '=', db.raw('?', ['active']));
    })
    .leftJoin('plans', 'subscriptions.plan_id', 'plans.id')
    .where('users.id', userId)
    .select(
      'users.*',
      'subscriptions.id as subscription_id',
      'subscriptions.status as subscription_status',
      'subscriptions.current_period_start',
      'subscriptions.current_period_end',
      'plans.name as plan_name',
      'plans.price as plan_price'
    )
    .first();
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Get user statistics
  const [
    totalReferrals,
    totalCommissions,
    loginHistory,
    auditLogs
  ] = await Promise.all([
    // Total referrals if user is affiliate
    db('users').where({ affiliate_id: userId }).count('* as count').first(),
    
    // Total commissions earned
    db('affiliate_commissions')
      .where({ affiliate_id: userId })
      .sum('commission_amount as total')
      .first(),
    
    // Recent login history
    db('audit_logs')
      .where({ 
        user_id: userId,
        action: 'login'
      })
      .orderBy('created_at', 'desc')
      .limit(5),
    
    // Recent audit logs
    db('audit_logs')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(10)
  ]);
  
  // Remove sensitive data
  delete user.password;
  delete user.reset_token;
  delete user.reset_token_expires;
  
  res.json({
    ...user,
    stats: {
      totalReferrals: parseInt(totalReferrals.count),
      totalCommissions: parseFloat(totalCommissions.total || 0)
    },
    loginHistory,
    auditLogs
  });
});

// Create new user
export const createUser = handleAsyncError(async (req, res) => {
  const { name, email, password, role = 'user', isActive = true } = req.body;
  
  // Check if user already exists
  const existingUser = await db('users').where({ email }).first();
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const [user] = await db('users').insert({
    name,
    email,
    password: hashedPassword,
    role,
    is_active: isActive,
    email_verified: true // Admin created users are auto-verified
  }).returning(['id', 'name', 'email', 'role', 'is_active', 'created_at']);
  
  // Log audit trail
  await db('audit_logs').insert({
    user_id: req.user.id,
    action: 'user_created',
    resource_type: 'user',
    resource_id: user.id.toString(),
    details: {
      createdUserId: user.id,
      createdUserEmail: email,
      role
    }
  });
  
  logger.info({ 
    adminId: req.user.id, 
    createdUserId: user.id, 
    email 
  }, 'User created by admin');
  
  res.json({
    message: 'User created successfully',
    user
  });
});

// Update user
export const updateUser = handleAsyncError(async (req, res) => {
  const { userId } = req.params;
  const { name, email, role, isActive, affiliateId } = req.body;
  
  const user = await db('users').where({ id: userId }).first();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Check email uniqueness if changing
  if (email && email !== user.email) {
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
  }
  
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.is_active = isActive;
  if (affiliateId !== undefined) updateData.affiliate_id = affiliateId;
  
  updateData.updated_at = db.fn.now();
  
  await db('users').where({ id: userId }).update(updateData);
  
  // Log audit trail
  await db('audit_logs').insert({
    user_id: req.user.id,
    action: 'user_updated',
    resource_type: 'user',
    resource_id: userId,
    details: {
      updatedFields: Object.keys(updateData),
      previousData: {
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        affiliateId: user.affiliate_id
      }
    }
  });
  
  logger.info({ 
    adminId: req.user.id, 
    updatedUserId: userId, 
    fields: Object.keys(updateData)
  }, 'User updated by admin');
  
  res.json({ message: 'User updated successfully' });
});

// Delete user
export const deleteUser = handleAsyncError(async (req, res) => {
  const { userId } = req.params;
  
  const user = await db('users').where({ id: userId }).first();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Check if user has active subscriptions
  const activeSubscription = await db('subscriptions')
    .where({ 
      user_id: userId, 
      status: 'active' 
    })
    .first();
  
  if (activeSubscription) {
    return res.status(400).json({ 
      error: 'Cannot delete user with active subscription' 
    });
  }
  
  await db.transaction(async (trx) => {
    // Soft delete user
    await trx('users')
      .where({ id: userId })
      .update({ 
        is_active: false,
        deleted_at: db.fn.now(),
        email: `deleted_${Date.now()}_${user.email}` // Prevent email conflicts
      });
    
    // Log audit trail
    await trx('audit_logs').insert({
      user_id: req.user.id,
      action: 'user_deleted',
      resource_type: 'user',
      resource_id: userId,
      details: {
        deletedUserEmail: user.email,
        deletedUserName: user.name
      }
    });
  });
  
  logger.info({ 
    adminId: req.user.id, 
    deletedUserId: userId, 
    email: user.email 
  }, 'User deleted by admin');
  
  res.json({ message: 'User deleted successfully' });
});

// Reset user password
export const resetUserPassword = handleAsyncError(async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;
  
  const user = await db('users').where({ id: userId }).first();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  await db('users')
    .where({ id: userId })
    .update({ 
      password: hashedPassword,
      updated_at: db.fn.now()
    });
  
  // Log audit trail
  await db('audit_logs').insert({
    user_id: req.user.id,
    action: 'password_reset_by_admin',
    resource_type: 'user',
    resource_id: userId,
    details: {
      targetUserEmail: user.email
    }
  });
  
  logger.info({ 
    adminId: req.user.id, 
    targetUserId: userId 
  }, 'Password reset by admin');
  
  res.json({ message: 'Password reset successfully' });
});

// Get user activity
export const getUserActivity = handleAsyncError(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20, action } = req.query;
  const offset = (page - 1) * limit;
  
  let query = db('audit_logs')
    .where({ user_id: userId });
  
  if (action) {
    query = query.where({ action });
  }
  
  const [activities, totalCount] = await Promise.all([
    query.clone()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset),
    query.clone().count('* as count').first()
  ]);
  
  res.json({
    activities,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(totalCount.count),
      pages: Math.ceil(totalCount.count / limit)
    }
  });
});

// Get dashboard statistics
export const getDashboardStats = handleAsyncError(async (req, res) => {
  const { period = '30d' } = req.query;
  
  let dateFilter;
  switch (period) {
    case '7d':
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }
  
  const [
    totalUsers,
    activeUsers,
    newUsers,
    totalSubscriptions,
    activeSubscriptions,
    totalRevenue,
    pendingCommissions
  ] = await Promise.all([
    // Total users
    db('users').count('* as count').first(),
    
    // Active users (logged in last 30 days)
    db('users')
      .where('last_login', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .count('* as count')
      .first(),
    
    // New users in period
    db('users')
      .where('created_at', '>=', dateFilter)
      .count('* as count')
      .first(),
    
    // Total subscriptions
    db('subscriptions').count('* as count').first(),
    
    // Active subscriptions
    db('subscriptions')
      .where({ status: 'active' })
      .count('* as count')
      .first(),
    
    // Total revenue
    db('subscriptions')
      .join('plans', 'subscriptions.plan_id', 'plans.id')
      .where('subscriptions.status', 'active')
      .sum('plans.price as total')
      .first(),
    
    // Pending commissions
    db('affiliate_commissions')
      .where({ status: 'pending' })
      .sum('commission_amount as total')
      .first()
  ]);
  
  // Growth data (daily for last 30 days)
  const growthData = await db.raw(`
    WITH date_series AS (
      SELECT generate_series(
        DATE_TRUNC('day', ?::timestamp),
        DATE_TRUNC('day', NOW()),
        INTERVAL '1 day'
      )::date as date
    )
    SELECT 
      ds.date,
      COALESCE(u.new_users, 0) as new_users,
      COALESCE(s.new_subscriptions, 0) as new_subscriptions,
      COALESCE(s.revenue, 0) as daily_revenue
    FROM date_series ds
    LEFT JOIN (
      SELECT DATE(created_at) as date, COUNT(*) as new_users
      FROM users 
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
    ) u ON ds.date = u.date
    LEFT JOIN (
      SELECT 
        DATE(s.created_at) as date, 
        COUNT(*) as new_subscriptions,
        SUM(p.price) as revenue
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.created_at >= ?
      GROUP BY DATE(s.created_at)
    ) s ON ds.date = s.date
    ORDER BY ds.date
  `, [dateFilter, dateFilter, dateFilter]);
  
  res.json({
    stats: {
      totalUsers: parseInt(totalUsers.count),
      activeUsers: parseInt(activeUsers.count),
      newUsers: parseInt(newUsers.count),
      totalSubscriptions: parseInt(totalSubscriptions.count),
      activeSubscriptions: parseInt(activeSubscriptions.count),
      totalRevenue: parseFloat(totalRevenue.total || 0),
      pendingCommissions: parseFloat(pendingCommissions.total || 0)
    },
    growth: growthData.rows
  });
});

// Get all operations (trading history)
export const getAllOperations = handleAsyncError(async (req, res) => {
  const { page = 1, limit = 20, search, status, symbol, userId, startDate, endDate } = req.query;
  const offset = (page - 1) * limit;
  
  let query = db('cointars')
    .leftJoin('users', 'cointars.user_id', 'users.id')
    .select(
      'cointars.*',
      'users.name as user_name',
      'users.email as user_email'
    );
  
  if (search) {
    query = query.where(function() {
      this.where('users.name', 'ilike', `%${search}%`)
          .orWhere('users.email', 'ilike', `%${search}%`)
          .orWhere('cointars.symbol', 'ilike', `%${search}%`);
    });
  }
  
  if (status) {
    query = query.where('cointars.status', status);
  }
  
  if (symbol) {
    query = query.where('cointars.symbol', symbol);
  }
  
  if (userId) {
    query = query.where('cointars.user_id', userId);
  }
  
  if (startDate) {
    query = query.where('cointars.created_at', '>=', startDate);
  }
  
  if (endDate) {
    query = query.where('cointars.created_at', '<=', endDate);
  }
  
  const [operations, totalCount] = await Promise.all([
    query.clone()
      .orderBy('cointars.created_at', 'desc')
      .limit(limit)
      .offset(offset),
    query.clone().count('* as count').first()
  ]);
  
  res.json({
    operations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(totalCount.count),
      pages: Math.ceil(totalCount.count / limit)
    }
  });
});

// Get accounting reports
export const getAccountingReports = handleAsyncError(async (req, res) => {
  const { type, period = '30d' } = req.query;
  
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  
  // Financial summary
  const [
    totalRevenue,
    totalCommissions,
    totalWithdrawals,
    activeSubscriptions,
    userBalances
  ] = await Promise.all([
    // Total revenue from subscriptions
    db('subscriptions')
      .join('plans', 'subscriptions.plan_id', 'plans.id')
      .where('subscriptions.created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .sum('plans.price as total')
      .first(),
    
    // Total commissions paid
    db('affiliate_commissions')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .where('status', 'paid')
      .sum('commission_amount as total')
      .first(),
    
    // Total withdrawals
    db('financial_transactions')
      .where('type', 'withdrawal')
      .where('status', 'completed')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .sum('amount as total')
      .first(),
    
    // Active subscriptions count
    db('subscriptions')
      .where('status', 'active')
      .count('* as count')
      .first(),
    
    // Total user balances
    db('user_credentials')
      .where('is_active', true)
      .sum('balance_usdt as total')
      .first()
  ]);
  
  // Monthly breakdown
  const monthlyData = await db.raw(`
    SELECT 
      DATE_TRUNC('month', s.created_at) as month,
      SUM(p.price) as revenue,
      COUNT(s.id) as subscriptions
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', s.created_at)
    ORDER BY month DESC
  `);
  
  res.json({
    summary: {
      totalRevenue: parseFloat(totalRevenue.total || 0),
      totalCommissions: parseFloat(totalCommissions.total || 0),
      totalWithdrawals: parseFloat(totalWithdrawals.total || 0),
      activeSubscriptions: parseInt(activeSubscriptions.count),
      userBalances: parseFloat(userBalances.total || 0),
      netProfit: parseFloat(totalRevenue.total || 0) - parseFloat(totalCommissions.total || 0) - parseFloat(totalWithdrawals.total || 0)
    },
    monthlyData: monthlyData.rows,
    period: `${days}d`
  });
});

// Get system logs
export const getSystemLogs = handleAsyncError(async (req, res) => {
  const { page = 1, limit = 50, level, service, search } = req.query;
  const offset = (page - 1) * limit;
  
  let query = db('system_logs')
    .select('*');
  
  if (level) {
    query = query.where('level', level);
  }
  
  if (service) {
    query = query.where('service', service);
  }
  
  if (search) {
    query = query.where(function() {
      this.where('message', 'ilike', `%${search}%`)
          .orWhere('details', 'ilike', `%${search}%`);
    });
  }
  
  const [logs, totalCount] = await Promise.all([
    query.clone()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset),
    query.clone().count('* as count').first()
  ]);
  
  res.json({
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(totalCount.count),
      pages: Math.ceil(totalCount.count / limit)
    }
  });
});

// Get affiliate management data
export const getAffiliateManagement = handleAsyncError(async (req, res) => {
  const { page = 1, limit = 20, search, status } = req.query;
  const offset = (page - 1) * limit;
  
  let query = db('users')
    .leftJoin('affiliate_commissions', 'users.id', 'affiliate_commissions.affiliate_id')
    .where('users.role', 'affiliate')
    .orWhere('users.affiliate_code', '!=', null)
    .select(
      'users.id',
      'users.name',
      'users.email',
      'users.affiliate_code',
      'users.is_active',
      'users.created_at',
      db.raw('COUNT(DISTINCT referrals.id) as total_referrals'),
      db.raw('COALESCE(SUM(affiliate_commissions.commission_amount), 0) as total_commissions'),
      db.raw('COALESCE(SUM(CASE WHEN affiliate_commissions.status = ? THEN affiliate_commissions.commission_amount ELSE 0 END), 0) as pending_commissions', ['pending']),
      db.raw('COALESCE(SUM(CASE WHEN affiliate_commissions.status = ? THEN affiliate_commissions.commission_amount ELSE 0 END), 0) as paid_commissions', ['paid'])
    )
    .leftJoin('users as referrals', 'users.id', 'referrals.affiliate_id')
    .groupBy('users.id');
  
  if (search) {
    query = query.where(function() {
      this.where('users.name', 'ilike', `%${search}%`)
          .orWhere('users.email', 'ilike', `%${search}%`)
          .orWhere('users.affiliate_code', 'ilike', `%${search}%`);
    });
  }
  
  if (status) {
    query = query.where('users.is_active', status === 'active');
  }
  
  const [affiliates, totalCount] = await Promise.all([
    query.clone()
      .orderBy('users.created_at', 'desc')
      .limit(limit)
      .offset(offset),
    query.clone().count('* as count').first()
  ]);
  
  res.json({
    affiliates,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(totalCount.count),
      pages: Math.ceil(totalCount.count / limit)
    }
  });
});

// Get AI reports
export const getAIReports = handleAsyncError(async (req, res) => {
  const { page = 1, limit = 20, type, confidence } = req.query;
  const offset = (page - 1) * limit;
  
  // Mock AI reports data for now - in production this would come from AI analysis
  const aiReports = [
    {
      id: '1',
      type: 'market_analysis',
      title: 'Análise de Mercado - BTC/USDT',
      confidence: 85,
      prediction: 'Alta probabilidade de movimento ascendente',
      timeframe: '4h',
      created_at: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      details: {
        indicators: ['RSI: 45', 'MACD: Divergência positiva', 'Volume: Crescente'],
        recommendation: 'BUY',
        stopLoss: '42000',
        takeProfit: '48000'
      }
    },
    {
      id: '2',
      type: 'strategy_performance',
      title: 'Performance da Estratégia Scalping',
      confidence: 78,
      prediction: 'Estratégia com boa performance nas últimas 24h',
      timeframe: '1d',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      details: {
        winRate: '67%',
        totalTrades: 24,
        profit: '+3.2%',
        maxDrawdown: '-1.8%'
      }
    },
    {
      id: '3',
      type: 'risk_assessment',
      title: 'Avaliação de Risco do Portfólio',
      confidence: 92,
      prediction: 'Risco baixo para moderado',
      timeframe: '1d',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      details: {
        portfolioValue: '$125,450',
        volatility: '12.5%',
        sharpeRatio: '1.8',
        riskScore: 'B+'
      }
    }
  ];
  
  let filteredReports = aiReports;
  
  if (type) {
    filteredReports = filteredReports.filter(report => report.type === type);
  }
  
  if (confidence) {
    filteredReports = filteredReports.filter(report => report.confidence >= parseInt(confidence));
  }
  
  const total = filteredReports.length;
  const paginatedReports = filteredReports.slice(offset, offset + limit);
  
  res.json({
    reports: paginatedReports,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Get settings
export const getSettings = handleAsyncError(async (req, res) => {
  const settings = await db('system_settings')
    .select('key', 'value', 'description', 'type')
    .orderBy('key');
  
  const settingsObject = settings.reduce((acc, setting) => {
    let value = setting.value;
    
    // Parse value based on type
    if (setting.type === 'boolean') {
      value = value === 'true';
    } else if (setting.type === 'number') {
      value = parseFloat(value);
    } else if (setting.type === 'json') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        value = setting.value;
      }
    }
    
    acc[setting.key] = {
      value,
      description: setting.description,
      type: setting.type
    };
    
    return acc;
  }, {});
  
  res.json(settingsObject);
});

// Update settings
export const updateSettings = handleAsyncError(async (req, res) => {
  const updates = req.body;
  
  await db.transaction(async (trx) => {
    for (const [key, data] of Object.entries(updates)) {
      let value = data.value;
      
      // Convert value to string for storage
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else {
        value = String(value);
      }
      
      await trx('system_settings')
        .where({ key })
        .update({ 
          value,
          updated_at: db.fn.now()
        });
    }
    
    // Log audit trail
    await trx('audit_logs').insert({
      user_id: req.user.id,
      action: 'settings_updated',
      resource_type: 'system_settings',
      resource_id: 'global',
      details: {
        updatedKeys: Object.keys(updates)
      }
    });
  });
  
  logger.info({ 
    adminId: req.user.id, 
    updatedKeys: Object.keys(updates)
  }, 'System settings updated');
  
  res.json({ message: 'Settings updated successfully' });
});

// Routes
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.post('/users', createUser);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.post('/users/:userId/reset-password', resetUserPassword);
router.get('/users/:userId/activity', getUserActivity);
router.get('/dashboard/stats', getDashboardStats);

// New admin routes
router.get('/operations', getAllOperations);
router.get('/accounting', getAccountingReports);
router.get('/logs', getSystemLogs);
router.get('/affiliates', getAffiliateManagement);
router.get('/ai-reports', getAIReports);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
