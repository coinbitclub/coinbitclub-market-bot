import express from 'express';
import { db } from '../../../common/db.js';
import { validate, validateBody } from '../../../common/validation.js';
import { handleAsyncError } from '../../../common/utils.js';
import logger from '../../../common/logger.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// =================== USERS MANAGEMENT ===================

// Get all users with enhanced data
export const getAllUsersEnhanced = handleAsyncError(async (req, res) => {
  const { page = 1, limit = 20, search, role, status, plan } = req.query;
  const offset = (page - 1) * limit;
  
  let query = db('users')
    .leftJoin('subscriptions', function() {
      this.on('users.id', '=', 'subscriptions.user_id')
          .andOn('subscriptions.status', '=', db.raw('?', ['active']));
    })
    .leftJoin('plans', 'subscriptions.plan_id', 'plans.id')
    .leftJoin('user_profiles', 'users.id', 'user_profiles.user_id')
    .leftJoin('user_balances', 'users.id', 'user_balances.user_id')
    .leftJoin('affiliates', 'users.affiliate_id', 'affiliates.id')
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
      'subscriptions.status as subscription_status',
      'subscriptions.expires_at',
      'plans.name as plan_name',
      'plans.price as plan_price',
      'user_profiles.cpf',
      'user_profiles.phone',
      'user_profiles.pix_key',
      'user_profiles.bank_name',
      'user_profiles.bank_agency',
      'user_profiles.bank_account',
      'user_balances.balance_usd',
      'user_balances.balance_brl',
      'user_balances.total_revenue',
      'user_balances.total_losses',
      db.raw('COALESCE(affiliates.name, \'Sem afiliado\') as affiliate_name')
    );
  
  // Apply filters
  if (search) {
    query = query.where(function() {
      this.where('users.name', 'ilike', `%${search}%`)
          .orWhere('users.email', 'ilike', `%${search}%`)
          .orWhere('user_profiles.cpf', 'ilike', `%${search}%`);
    });
  }
  
  if (role) query = query.where('users.role', role);
  if (status) query = query.where('users.is_active', status === 'active');
  if (plan) query = query.where('plans.name', plan);
  
  const [users, total] = await Promise.all([
    query.offset(offset).limit(limit).orderBy('users.created_at', 'desc'),
    db('users').count('* as count').first()
  ]);
  
  res.json({
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total.count),
      pages: Math.ceil(total.count / limit)
    }
  });
});

// Get user details
export const getUserDetails = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  
  const user = await db('users')
    .leftJoin('user_profiles', 'users.id', 'user_profiles.user_id')
    .leftJoin('user_balances', 'users.id', 'user_balances.user_id')
    .leftJoin('subscriptions', 'users.id', 'subscriptions.user_id')
    .leftJoin('plans', 'subscriptions.plan_id', 'plans.id')
    .leftJoin('affiliates', 'users.affiliate_id', 'affiliates.id')
    .select(
      'users.*',
      'user_profiles.*',
      'user_balances.*',
      'subscriptions.status as subscription_status',
      'subscriptions.expires_at',
      'plans.name as plan_name',
      'plans.price as plan_price',
      'affiliates.name as affiliate_name'
    )
    .where('users.id', id)
    .first();
    
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  // Get trading history
  const tradingHistory = await db('orders')
    .where('user_id', id)
    .orderBy('created_at', 'desc')
    .limit(10)
    .select('*');
    
  // Get payment history
  const paymentHistory = await db('payments')
    .where('user_id', id)
    .orderBy('created_at', 'desc')
    .limit(10)
    .select('*');
  
  res.json({
    user,
    tradingHistory,
    paymentHistory
  });
});

// Update user
export const updateUser = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  await db.transaction(async (trx) => {
    // Update user table
    if (updates.name || updates.email || updates.role || updates.is_active !== undefined) {
      await trx('users')
        .where('id', id)
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.email && { email: updates.email }),
          ...(updates.role && { role: updates.role }),
          ...(updates.is_active !== undefined && { is_active: updates.is_active }),
          updated_at: new Date()
        });
    }
    
    // Update user profile
    if (updates.cpf || updates.phone || updates.pix_key || updates.bank_name) {
      await trx('user_profiles')
        .where('user_id', id)
        .update({
          ...(updates.cpf && { cpf: updates.cpf }),
          ...(updates.phone && { phone: updates.phone }),
          ...(updates.pix_key && { pix_key: updates.pix_key }),
          ...(updates.bank_name && { bank_name: updates.bank_name }),
          ...(updates.bank_agency && { bank_agency: updates.bank_agency }),
          ...(updates.bank_account && { bank_account: updates.bank_account }),
          updated_at: new Date()
        });
    }
    
    // Update balance if provided
    if (updates.balance_usd !== undefined || updates.balance_brl !== undefined) {
      await trx('user_balances')
        .where('user_id', id)
        .update({
          ...(updates.balance_usd !== undefined && { balance_usd: updates.balance_usd }),
          ...(updates.balance_brl !== undefined && { balance_brl: updates.balance_brl }),
          updated_at: new Date()
        });
    }
  });
  
  res.json({ message: 'Usuário atualizado com sucesso' });
});

// Reset user password
export const resetUserPassword = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await db('users')
    .where('id', id)
    .update({
      password: hashedPassword,
      updated_at: new Date()
    });
    
  res.json({ message: 'Senha resetada com sucesso' });
});

// =================== AFFILIATES MANAGEMENT ===================

// Get all affiliates
export const getAllAffiliates = handleAsyncError(async (req, res) => {
  const { page = 1, limit = 20, search, type, status } = req.query;
  const offset = (page - 1) * limit;
  
  let query = db('affiliates')
    .leftJoin('users', 'affiliates.user_id', 'users.id')
    .select(
      'affiliates.*',
      'users.name as user_name',
      'users.email as user_email',
      db.raw(`(
        SELECT COUNT(*) 
        FROM users 
        WHERE users.affiliate_id = affiliates.id
      ) as referred_users`),
      db.raw(`(
        SELECT COALESCE(SUM(amount), 0) 
        FROM commissions 
        WHERE commissions.affiliate_id = affiliates.id 
        AND commissions.status = 'PAID'
      ) as total_commissions`)
    );
    
  if (search) {
    query = query.where(function() {
      this.where('affiliates.name', 'ilike', `%${search}%`)
          .orWhere('users.email', 'ilike', `%${search}%`)
          .orWhere('affiliates.referral_code', 'ilike', `%${search}%`);
    });
  }
  
  if (type) query = query.where('affiliates.type', type);
  if (status) query = query.where('affiliates.is_active', status === 'active');
  
  const [affiliates, total] = await Promise.all([
    query.offset(offset).limit(limit).orderBy('affiliates.created_at', 'desc'),
    db('affiliates').count('* as count').first()
  ]);
  
  res.json({
    affiliates,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total.count),
      pages: Math.ceil(total.count / limit)
    }
  });
});

// Get affiliate details
export const getAffiliateDetails = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  
  const affiliate = await db('affiliates')
    .leftJoin('users', 'affiliates.user_id', 'users.id')
    .select('affiliates.*', 'users.name as user_name', 'users.email as user_email')
    .where('affiliates.id', id)
    .first();
    
  if (!affiliate) {
    return res.status(404).json({ error: 'Afiliado não encontrado' });
  }
  
  // Get referred users
  const referredUsers = await db('users')
    .where('affiliate_id', id)
    .select('id', 'name', 'email', 'created_at')
    .orderBy('created_at', 'desc');
    
  // Get commissions
  const commissions = await db('commissions')
    .leftJoin('users', 'commissions.user_id', 'users.id')
    .where('commissions.affiliate_id', id)
    .select(
      'commissions.*',
      'users.name as user_name'
    )
    .orderBy('commissions.created_at', 'desc');
  
  res.json({
    affiliate,
    referredUsers,
    commissions
  });
});

// =================== COMMISSIONS MANAGEMENT ===================

// Get all commissions
export const getAllCommissions = handleAsyncError(async (req, res) => {
  const { page = 1, limit = 20, status, affiliate_id, type } = req.query;
  const offset = (page - 1) * limit;
  
  let query = db('commissions')
    .leftJoin('affiliates', 'commissions.affiliate_id', 'affiliates.id')
    .leftJoin('users', 'commissions.user_id', 'users.id')
    .leftJoin('plans', 'commissions.plan_id', 'plans.id')
    .select(
      'commissions.*',
      'affiliates.name as affiliate_name',
      'affiliates.type as affiliate_type',
      'affiliates.commission_rate',
      'users.name as user_name',
      'users.email as user_email',
      'plans.name as plan_name'
    );
    
  if (status) query = query.where('commissions.status', status);
  if (affiliate_id) query = query.where('commissions.affiliate_id', affiliate_id);
  if (type) query = query.where('commissions.type', type);
  
  const [commissions, total] = await Promise.all([
    query.offset(offset).limit(limit).orderBy('commissions.created_at', 'desc'),
    db('commissions').count('* as count').first()
  ]);
  
  // Get summary stats
  const stats = await db('commissions')
    .select(
      db.raw('SUM(CASE WHEN status = \'PENDING\' THEN amount ELSE 0 END) as total_pending'),
      db.raw('SUM(CASE WHEN status = \'APPROVED\' THEN amount ELSE 0 END) as total_approved'),
      db.raw('SUM(CASE WHEN status = \'PAID\' THEN amount ELSE 0 END) as total_paid'),
      db.raw('SUM(CASE WHEN status = \'REJECTED\' THEN amount ELSE 0 END) as total_rejected'),
      db.raw('AVG(commission_rate) as avg_commission_rate')
    )
    .first();
  
  res.json({
    commissions,
    stats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total.count),
      pages: Math.ceil(total.count / limit)
    }
  });
});

// Update commission status
export const updateCommissionStatus = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { status, notes, payment_method, payment_details } = req.body;
  
  await db('commissions')
    .where('id', id)
    .update({
      status,
      ...(notes && { notes }),
      ...(payment_method && { payment_method }),
      ...(payment_details && { payment_details }),
      processed_at: new Date(),
      updated_at: new Date()
    });
    
  res.json({ message: 'Status da comissão atualizado' });
});

// =================== SYSTEM LOGS ===================

// Get system logs
export const getSystemLogs = handleAsyncError(async (req, res) => {
  const { 
    page = 1, 
    limit = 100, 
    level, 
    service, 
    search,
    start_date,
    end_date 
  } = req.query;
  const offset = (page - 1) * limit;
  
  let query = db('system_logs')
    .select('*');
    
  if (level) query = query.where('level', level);
  if (service) query = query.where('service', service);
  if (search) {
    query = query.where(function() {
      this.where('message', 'ilike', `%${search}%`)
          .orWhere('details', 'ilike', `%${search}%`);
    });
  }
  if (start_date) query = query.where('created_at', '>=', start_date);
  if (end_date) query = query.where('created_at', '<=', end_date);
  
  const [logs, total] = await Promise.all([
    query.offset(offset).limit(limit).orderBy('created_at', 'desc'),
    db('system_logs').count('* as count').first()
  ]);
  
  res.json({
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total.count),
      pages: Math.ceil(total.count / limit)
    }
  });
});

// Clear system logs
export const clearSystemLogs = handleAsyncError(async (req, res) => {
  const { level, service, older_than_days } = req.body;
  
  let query = db('system_logs');
  
  if (level) query = query.where('level', level);
  if (service) query = query.where('service', service);
  if (older_than_days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - older_than_days);
    query = query.where('created_at', '<', cutoffDate);
  }
  
  const deletedCount = await query.del();
  
  res.json({ 
    message: `${deletedCount} logs removidos com sucesso`,
    deletedCount 
  });
});

// =================== SYSTEM ALERTS ===================

// Get system alerts
export const getSystemAlerts = handleAsyncError(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    type, 
    category, 
    priority,
    acknowledged,
    resolved 
  } = req.query;
  const offset = (page - 1) * limit;
  
  let query = db('system_alerts')
    .select('*');
    
  if (type) query = query.where('type', type);
  if (category) query = query.where('category', category);
  if (priority) query = query.where('priority', priority);
  if (acknowledged !== undefined) query = query.where('acknowledged', acknowledged === 'true');
  if (resolved !== undefined) query = query.where('resolved', resolved === 'true');
  
  const [alerts, total] = await Promise.all([
    query.offset(offset).limit(limit).orderBy('created_at', 'desc'),
    db('system_alerts').count('* as count').first()
  ]);
  
  // Get summary stats
  const stats = await db('system_alerts')
    .select(
      db.raw('COUNT(*) as total'),
      db.raw('SUM(CASE WHEN acknowledged = false THEN 1 ELSE 0 END) as unacknowledged'),
      db.raw('SUM(CASE WHEN type = \'CRITICAL\' THEN 1 ELSE 0 END) as critical'),
      db.raw('SUM(CASE WHEN type = \'ERROR\' THEN 1 ELSE 0 END) as errors'),
      db.raw('SUM(CASE WHEN type = \'WARNING\' THEN 1 ELSE 0 END) as warnings')
    )
    .first();
    
  res.json({
    alerts,
    stats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total.count),
      pages: Math.ceil(total.count / limit)
    }
  });
});

// Acknowledge alert
export const acknowledgeAlert = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  
  await db('system_alerts')
    .where('id', id)
    .update({
      acknowledged: true,
      acknowledged_at: new Date(),
      acknowledged_by: req.user.id
    });
    
  res.json({ message: 'Alerta reconhecido' });
});

// Resolve alert
export const resolveAlert = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { resolution_notes } = req.body;
  
  await db('system_alerts')
    .where('id', id)
    .update({
      resolved: true,
      acknowledged: true,
      resolved_at: new Date(),
      resolved_by: req.user.id,
      ...(resolution_notes && { resolution_notes })
    });
    
  res.json({ message: 'Alerta resolvido' });
});

// =================== SYSTEM CONTROLS ===================

// Get system status
export const getSystemStatus = handleAsyncError(async (req, res) => {
  try {
    // Check database connection
    await db.raw('SELECT 1');
    const dbStatus = 'connected';
    
    // Get system metrics
    const userCount = await db('users').count('* as count').first();
    const activeSubscriptions = await db('subscriptions')
      .where('status', 'active')
      .count('* as count')
      .first();
      
    const todayRevenue = await db('payments')
      .where('created_at', '>=', db.raw('CURRENT_DATE'))
      .where('status', 'completed')
      .sum('amount as total')
      .first();
      
    // Check trading engine status (mock for now)
    const tradingStatus = process.env.TRADING_ENABLED === 'true' ? 'running' : 'stopped';
    
    res.json({
      status: 'online',
      database: dbStatus,
      tradingEngine: tradingStatus,
      binanceAPI: 'connected', // This would be checked in real implementation
      bybitAPI: 'connected',   // This would be checked in real implementation
      redis: 'connected',      // This would be checked in real implementation
      scheduler: 'active',
      monitoring: 'active',
      metrics: {
        totalUsers: parseInt(userCount.count),
        activeSubscriptions: parseInt(activeSubscriptions.count),
        todayRevenue: parseFloat(todayRevenue.total || 0)
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Emergency stop operations
export const emergencyStopOperations = handleAsyncError(async (req, res) => {
  try {
    // Set emergency stop flag
    process.env.EMERGENCY_STOP = 'true';
    process.env.TRADING_ENABLED = 'false';
    
    // Log the emergency stop
    await db('system_logs').insert({
      level: 'CRITICAL',
      service: 'admin-panel',
      message: 'EMERGENCY STOP ACTIVATED',
      details: `Emergency stop activated by admin user ${req.user.id}`,
      user_id: req.user.id,
      created_at: new Date()
    });
    
    // Create alert
    await db('system_alerts').insert({
      type: 'CRITICAL',
      category: 'SYSTEM',
      title: 'Emergency Stop Activated',
      message: 'All trading operations have been stopped',
      priority: 'CRITICAL',
      source: 'Admin Panel',
      metadata: JSON.stringify({ activated_by: req.user.id }),
      created_at: new Date()
    });
    
    res.json({ message: 'Emergency stop activated successfully' });
  } catch (error) {
    logger.error('Emergency stop failed:', error);
    res.status(500).json({ error: 'Failed to activate emergency stop' });
  }
});

// Restart trading
export const restartTrading = handleAsyncError(async (req, res) => {
  try {
    process.env.EMERGENCY_STOP = 'false';
    process.env.TRADING_ENABLED = 'true';
    
    await db('system_logs').insert({
      level: 'INFO',
      service: 'admin-panel',
      message: 'Trading operations restarted',
      details: `Trading restarted by admin user ${req.user.id}`,
      user_id: req.user.id,
      created_at: new Date()
    });
    
    res.json({ message: 'Trading operations restarted successfully' });
  } catch (error) {
    logger.error('Trading restart failed:', error);
    res.status(500).json({ error: 'Failed to restart trading' });
  }
});

// =================== FINANCIAL REPORTS ===================

// Get financial summary
export const getFinancialSummary = handleAsyncError(async (req, res) => {
  const { period = 'month' } = req.query;
  
  let dateFilter;
  switch (period) {
    case 'today':
      dateFilter = db.raw('DATE(created_at) = CURRENT_DATE');
      break;
    case 'week':
      dateFilter = db.raw('created_at >= DATE_TRUNC(\'week\', CURRENT_DATE)');
      break;
    case 'month':
      dateFilter = db.raw('created_at >= DATE_TRUNC(\'month\', CURRENT_DATE)');
      break;
    case 'year':
      dateFilter = db.raw('created_at >= DATE_TRUNC(\'year\', CURRENT_DATE)');
      break;
    default:
      dateFilter = db.raw('1=1');
  }
  
  const [revenue, expenses, subscriptions, commissions] = await Promise.all([
    // Total revenue from payments
    db('payments')
      .where('status', 'completed')
      .where(dateFilter)
      .sum('amount as total')
      .first(),
      
    // Total expenses (commissions paid)
    db('commissions')
      .where('status', 'PAID')
      .where(dateFilter)
      .sum('amount as total')
      .first(),
      
    // New subscriptions
    db('subscriptions')
      .where(dateFilter)
      .count('* as count')
      .first(),
      
    // Pending commissions
    db('commissions')
      .where('status', 'PENDING')
      .sum('amount as total')
      .first()
  ]);
  
  const totalRevenue = parseFloat(revenue.total || 0);
  const totalExpenses = parseFloat(expenses.total || 0);
  const pendingCommissions = parseFloat(commissions.total || 0);
  
  res.json({
    period,
    revenue: totalRevenue,
    expenses: totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    newSubscriptions: parseInt(subscriptions.count),
    pendingCommissions,
    profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
  });
});

// Setup routes
router.get('/users', getAllUsersEnhanced);
router.get('/users/:id', getUserDetails);
router.put('/users/:id', updateUser);
router.post('/users/:id/reset-password', resetUserPassword);

router.get('/affiliates', getAllAffiliates);
router.get('/affiliates/:id', getAffiliateDetails);

router.get('/commissions', getAllCommissions);
router.put('/commissions/:id/status', updateCommissionStatus);

router.get('/logs', getSystemLogs);
router.delete('/logs', clearSystemLogs);

router.get('/alerts', getSystemAlerts);
router.put('/alerts/:id/acknowledge', acknowledgeAlert);
router.put('/alerts/:id/resolve', resolveAlert);

router.get('/system/status', getSystemStatus);
router.post('/system/emergency-stop', emergencyStopOperations);
router.post('/system/restart-trading', restartTrading);

router.get('/financial/summary', getFinancialSummary);

export default router;
