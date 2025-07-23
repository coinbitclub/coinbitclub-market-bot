import express from 'express';
import { db } from '../../../common/db.js';
import { validate, validateBody } from '../../../common/validation.js';
import { handleAsyncError } from '../../../common/utils.js';
import logger from '../../../common/logger.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// Get affiliate dashboard data
export const getAffiliateDashboard = handleAsyncError(async (req, res) => {
  const affiliateId = req.user.id;
  
  // Get affiliate stats
  const [
    totalReferrals,
    activeSubscriptions,
    totalCommissions,
    pendingCommissions,
    approvedCommissions,
    paidCommissions
  ] = await Promise.all([
    // Total referrals
    db('users')
      .where({ affiliate_id: affiliateId })
      .count('* as count')
      .first(),
      
    // Active subscriptions from referrals
    db('subscriptions')
      .join('users', 'subscriptions.user_id', 'users.id')
      .where({ 
        'users.affiliate_id': affiliateId,
        'subscriptions.status': 'active'
      })
      .count('* as count')
      .first(),
      
    // Total commissions earned
    db('affiliate_commissions')
      .where({ affiliate_id: affiliateId })
      .sum('commission_amount as total')
      .first(),
      
    // Pending commissions
    db('affiliate_commissions')
      .where({ 
        affiliate_id: affiliateId,
        status: 'pending'
      })
      .sum('commission_amount as total')
      .first(),
      
    // Approved commissions
    db('affiliate_commissions')
      .where({ 
        affiliate_id: affiliateId,
        status: 'approved'
      })
      .sum('commission_amount as total')
      .first(),
      
    // Paid commissions
    db('affiliate_commissions')
      .where({ 
        affiliate_id: affiliateId,
        status: 'paid'
      })
      .sum('commission_amount as total')
      .first()
  ]);
  
  // Get recent commissions
  const recentCommissions = await db('affiliate_commissions')
    .join('users', 'affiliate_commissions.user_id', 'users.id')
    .where({ 'affiliate_commissions.affiliate_id': affiliateId })
    .select(
      'affiliate_commissions.*',
      'users.name as user_name',
      'users.email as user_email'
    )
    .orderBy('affiliate_commissions.created_at', 'desc')
    .limit(10);
  
  // Get monthly commission trend (last 6 months)
  const monthlyTrend = await db('affiliate_commissions')
    .where({ 
      affiliate_id: affiliateId,
      status: 'paid'
    })
    .whereRaw('created_at >= ?', [new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)])
    .select(
      db.raw('DATE_TRUNC(\'month\', created_at) as month'),
      db.raw('SUM(commission_amount) as total'),
      db.raw('COUNT(*) as count')
    )
    .groupBy(db.raw('DATE_TRUNC(\'month\', created_at)'))
    .orderBy('month');
  
  res.json({
    stats: {
      totalReferrals: parseInt(totalReferrals.count),
      activeSubscriptions: parseInt(activeSubscriptions.count),
      totalCommissions: parseFloat(totalCommissions.total || 0),
      pendingCommissions: parseFloat(pendingCommissions.total || 0),
      approvedCommissions: parseFloat(approvedCommissions.total || 0),
      paidCommissions: parseFloat(paidCommissions.total || 0)
    },
    recentCommissions,
    monthlyTrend
  });
});

// Get affiliate referrals
export const getAffiliateReferrals = handleAsyncError(async (req, res) => {
  const affiliateId = req.user.id;
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;
  
  let query = db('users')
    .leftJoin('subscriptions', function() {
      this.on('users.id', '=', 'subscriptions.user_id')
          .andOn('subscriptions.status', '=', db.raw('?', ['active']));
    })
    .leftJoin('plans', 'subscriptions.plan_id', 'plans.id')
    .where({ 'users.affiliate_id': affiliateId })
    .select(
      'users.id',
      'users.name',
      'users.email',
      'users.created_at as registration_date',
      'subscriptions.id as subscription_id',
      'subscriptions.status as subscription_status',
      'subscriptions.current_period_end',
      'plans.name as plan_name',
      'plans.price as plan_price'
    );
  
  if (status) {
    if (status === 'subscribed') {
      query = query.whereNotNull('subscriptions.id');
    } else if (status === 'unsubscribed') {
      query = query.whereNull('subscriptions.id');
    }
  }
  
  const [referrals, totalCount] = await Promise.all([
    query.clone()
      .orderBy('users.created_at', 'desc')
      .limit(limit)
      .offset(offset),
    query.clone().count('users.id as count').first()
  ]);
  
  res.json({
    referrals,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(totalCount.count),
      pages: Math.ceil(totalCount.count / limit)
    }
  });
});

// Get affiliate commissions
export const getAffiliateCommissions = handleAsyncError(async (req, res) => {
  const affiliateId = req.user.id;
  const { page = 1, limit = 20, status, startDate, endDate } = req.query;
  const offset = (page - 1) * limit;
  
  let query = db('affiliate_commissions')
    .join('users', 'affiliate_commissions.user_id', 'users.id')
    .where({ 'affiliate_commissions.affiliate_id': affiliateId })
    .select(
      'affiliate_commissions.*',
      'users.name as user_name',
      'users.email as user_email'
    );
  
  if (status) {
    query = query.where({ 'affiliate_commissions.status': status });
  }
  
  if (startDate) {
    query = query.where('affiliate_commissions.created_at', '>=', startDate);
  }
  
  if (endDate) {
    query = query.where('affiliate_commissions.created_at', '<=', endDate);
  }
  
  const [commissions, totalCount] = await Promise.all([
    query.clone()
      .orderBy('affiliate_commissions.created_at', 'desc')
      .limit(limit)
      .offset(offset),
    query.clone().count('affiliate_commissions.id as count').first()
  ]);
  
  res.json({
    commissions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(totalCount.count),
      pages: Math.ceil(totalCount.count / limit)
    }
  });
});

// Generate affiliate link
export const generateAffiliateLink = handleAsyncError(async (req, res) => {
  const affiliateId = req.user.id;
  const { campaign = 'default' } = req.body;
  
  // Generate unique affiliate code if not exists
  let user = await db('users').where({ id: affiliateId }).first();
  
  if (!user.affiliate_code) {
    const affiliateCode = `AF${affiliateId.toString().padStart(6, '0')}`;
    await db('users')
      .where({ id: affiliateId })
      .update({ affiliate_code: affiliateCode });
    user.affiliate_code = affiliateCode;
  }
  
  const baseUrl = process.env.FRONTEND_URL || 'https://coinbitclub.com';
  const affiliateLink = `${baseUrl}/register?ref=${user.affiliate_code}&campaign=${campaign}`;
  
  res.json({
    affiliateCode: user.affiliate_code,
    affiliateLink,
    campaign
  });
});

// Process affiliate payout
export const processAffiliatePayout = handleAsyncError(async (req, res) => {
  const { affiliateId, commissionIds, paymentMethod, paymentDetails } = req.body;
  
  // Verify user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  // Get approved commissions
  const commissions = await db('affiliate_commissions')
    .whereIn('id', commissionIds)
    .where({ 
      affiliate_id: affiliateId,
      status: 'approved'
    });
  
  if (commissions.length === 0) {
    return res.status(400).json({ error: 'No approved commissions found' });
  }
  
  const totalAmount = commissions.reduce((sum, commission) => sum + parseFloat(commission.commission_amount), 0);
  
  try {
    await db.transaction(async (trx) => {
      // Update commissions status to paid
      await trx('affiliate_commissions')
        .whereIn('id', commissionIds)
        .update({
          status: 'paid',
          paid_at: db.fn.now(),
          payment_method: paymentMethod,
          payment_details: paymentDetails
        });
      
      // Create payout record
      const [payout] = await trx('affiliate_payouts').insert({
        affiliate_id: affiliateId,
        amount: totalAmount,
        commission_count: commissions.length,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        status: 'completed',
        processed_by: req.user.id
      }).returning('*');
      
      // Log audit trail
      await trx('audit_logs').insert({
        user_id: req.user.id,
        action: 'affiliate_payout_processed',
        resource_type: 'affiliate_payout',
        resource_id: payout.id.toString(),
        details: {
          affiliateId,
          amount: totalAmount,
          commissionCount: commissions.length,
          paymentMethod
        }
      });
      
      // Send notification email to affiliate
      const affiliate = await trx('users').where({ id: affiliateId }).first();
      await emailService.sendEmail(affiliate.email, 'affiliatePayout', {
        affiliateName: affiliate.name,
        amount: totalAmount,
        commissionCount: commissions.length,
        paymentMethod
      });
      
      logger.info({ 
        affiliateId, 
        amount: totalAmount, 
        commissionCount: commissions.length 
      }, 'Affiliate payout processed');
    });
    
    res.json({
      message: 'Payout processed successfully',
      amount: totalAmount,
      commissionCount: commissions.length
    });
    
  } catch (error) {
    logger.error({ error, affiliateId, commissionIds }, 'Failed to process payout');
    throw error;
  }
});

// Get affiliate performance analytics
export const getAffiliateAnalytics = handleAsyncError(async (req, res) => {
  const affiliateId = req.user.id;
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
    case '1y':
      dateFilter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }
  
  // Daily conversion data
  const dailyData = await db.raw(`
    WITH date_series AS (
      SELECT generate_series(
        DATE_TRUNC('day', ?::timestamp),
        DATE_TRUNC('day', NOW()),
        INTERVAL '1 day'
      )::date as date
    )
    SELECT 
      ds.date,
      COALESCE(r.registrations, 0) as registrations,
      COALESCE(s.subscriptions, 0) as subscriptions,
      COALESCE(c.commissions, 0) as commission_amount
    FROM date_series ds
    LEFT JOIN (
      SELECT DATE(created_at) as date, COUNT(*) as registrations
      FROM users 
      WHERE affiliate_id = ? AND created_at >= ?
      GROUP BY DATE(created_at)
    ) r ON ds.date = r.date
    LEFT JOIN (
      SELECT DATE(s.created_at) as date, COUNT(*) as subscriptions
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE u.affiliate_id = ? AND s.created_at >= ?
      GROUP BY DATE(s.created_at)
    ) s ON ds.date = s.date
    LEFT JOIN (
      SELECT DATE(created_at) as date, SUM(commission_amount) as commissions
      FROM affiliate_commissions
      WHERE affiliate_id = ? AND created_at >= ?
      GROUP BY DATE(created_at)
    ) c ON ds.date = c.date
    ORDER BY ds.date
  `, [dateFilter, affiliateId, dateFilter, affiliateId, dateFilter, affiliateId, dateFilter]);
  
  // Conversion funnel
  const funnelData = await db.raw(`
    SELECT 
      COUNT(DISTINCT u.id) as total_referrals,
      COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN u.id END) as converted_users,
      ROUND(
        COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN u.id END)::decimal / 
        NULLIF(COUNT(DISTINCT u.id), 0) * 100, 2
      ) as conversion_rate
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
    WHERE u.affiliate_id = ? AND u.created_at >= ?
  `, [affiliateId, dateFilter]);
  
  // Top performing campaigns
  const campaignData = await db.raw(`
    SELECT 
      COALESCE(metadata->>'campaign', 'default') as campaign,
      COUNT(*) as referrals,
      COUNT(CASE WHEN s.id IS NOT NULL THEN 1 END) as conversions,
      SUM(COALESCE(ac.commission_amount, 0)) as total_commissions
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
    LEFT JOIN affiliate_commissions ac ON u.id = ac.user_id AND ac.affiliate_id = ?
    WHERE u.affiliate_id = ? AND u.created_at >= ?
    GROUP BY COALESCE(metadata->>'campaign', 'default')
    ORDER BY total_commissions DESC
  `, [affiliateId, affiliateId, dateFilter]);
  
  res.json({
    period,
    dailyData: dailyData.rows,
    funnel: funnelData.rows[0],
    campaigns: campaignData.rows
  });
});

// Routes
router.get('/dashboard', getAffiliateDashboard);
router.get('/referrals', getAffiliateReferrals);
router.get('/commissions', getAffiliateCommissions);
router.post('/generate-link', generateAffiliateLink);
router.post('/payout', processAffiliatePayout);
router.get('/analytics', getAffiliateAnalytics);

export default router;
