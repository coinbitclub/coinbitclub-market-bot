import express from 'express';
import { db } from '../../../common/db.js';
import { validate, validateBody } from '../../../common/validation.js';
import { handleAsyncError } from '../../../common/utils.js';
import logger from '../../../common/logger.js';

const router = express.Router();

// Get user notifications
export const getUserNotifications = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const offset = (page - 1) * limit;
  
  let query = db('notifications')
    .where({ user_id: userId });
  
  if (unreadOnly === 'true') {
    query = query.where({ is_read: false });
  }
  
  const [notifications, totalCount] = await Promise.all([
    query.clone()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset),
    query.clone().count('* as count').first()
  ]);
  
  res.json({
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(totalCount.count),
      pages: Math.ceil(totalCount.count / limit)
    }
  });
});

// Mark notification as read
export const markNotificationRead = handleAsyncError(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;
  
  const notification = await db('notifications')
    .where({ 
      id: notificationId, 
      user_id: userId 
    })
    .first();
  
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  
  await db('notifications')
    .where({ id: notificationId })
    .update({ 
      is_read: true,
      read_at: db.fn.now()
    });
  
  res.json({ message: 'Notification marked as read' });
});

// Mark all notifications as read
export const markAllNotificationsRead = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  
  await db('notifications')
    .where({ 
      user_id: userId,
      is_read: false
    })
    .update({ 
      is_read: true,
      read_at: db.fn.now()
    });
  
  res.json({ message: 'All notifications marked as read' });
});

// Delete notification
export const deleteNotification = handleAsyncError(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;
  
  const notification = await db('notifications')
    .where({ 
      id: notificationId, 
      user_id: userId 
    })
    .first();
  
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  
  await db('notifications')
    .where({ id: notificationId })
    .del();
  
  res.json({ message: 'Notification deleted' });
});

// Get notification preferences
export const getNotificationPreferences = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  
  const preferences = await db('notification_preferences')
    .where({ user_id: userId })
    .first();
  
  if (!preferences) {
    // Return default preferences
    const defaultPreferences = {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      marketing_emails: true,
      affiliate_notifications: true,
      order_notifications: true,
      system_notifications: true
    };
    
    res.json(defaultPreferences);
  } else {
    res.json(preferences);
  }
});

// Update notification preferences
export const updateNotificationPreferences = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  const preferences = req.body;
  
  // Check if preferences exist
  const existingPreferences = await db('notification_preferences')
    .where({ user_id: userId })
    .first();
  
  if (existingPreferences) {
    await db('notification_preferences')
      .where({ user_id: userId })
      .update({
        ...preferences,
        updated_at: db.fn.now()
      });
  } else {
    await db('notification_preferences')
      .insert({
        user_id: userId,
        ...preferences
      });
  }
  
  res.json({ message: 'Notification preferences updated' });
});

// Create notification (internal function)
export const createNotification = async (userId, type, title, message, metadata = {}) => {
  try {
    const [notification] = await db('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      metadata
    }).returning('*');
    
    logger.info({ 
      userId, 
      type, 
      title, 
      notificationId: notification.id 
    }, 'Notification created');
    
    return notification;
  } catch (error) {
    logger.error({ error, userId, type, title }, 'Failed to create notification');
    throw error;
  }
};

// Send bulk notification (admin only)
export const sendBulkNotification = handleAsyncError(async (req, res) => {
  const { title, message, type, userIds, filters } = req.body;
  
  // Verify user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  let targetUserIds = userIds;
  
  // If filters provided, get user IDs based on filters
  if (filters && !userIds) {
    let query = db('users').select('id');
    
    if (filters.role) {
      query = query.where({ role: filters.role });
    }
    
    if (filters.hasActiveSubscription) {
      query = query.whereExists(function() {
        this.select('*')
            .from('subscriptions')
            .whereRaw('subscriptions.user_id = users.id')
            .where({ status: 'active' });
      });
    }
    
    if (filters.isAffiliate) {
      query = query.whereExists(function() {
        this.select('*')
            .from('users as u2')
            .whereRaw('u2.affiliate_id = users.id');
      });
    }
    
    const users = await query;
    targetUserIds = users.map(user => user.id);
  }
  
  if (!targetUserIds || targetUserIds.length === 0) {
    return res.status(400).json({ error: 'No target users specified' });
  }
  
  // Create notifications for all target users
  const notifications = targetUserIds.map(userId => ({
    user_id: userId,
    type: type || 'system',
    title,
    message,
    metadata: {
      sentBy: req.user.id,
      bulkNotification: true
    }
  }));
  
  await db('notifications').insert(notifications);
  
  // Log audit trail
  await db('audit_logs').insert({
    user_id: req.user.id,
    action: 'bulk_notification_sent',
    resource_type: 'notification',
    details: {
      title,
      type,
      recipientCount: targetUserIds.length,
      filters
    }
  });
  
  logger.info({ 
    adminId: req.user.id, 
    recipientCount: targetUserIds.length, 
    type, 
    title 
  }, 'Bulk notification sent');
  
  res.json({
    message: 'Bulk notification sent successfully',
    recipientCount: targetUserIds.length
  });
});

// Get notification statistics (admin only)
export const getNotificationStats = handleAsyncError(async (req, res) => {
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
    totalNotifications,
    unreadNotifications,
    notificationsByType,
    dailyStats
  ] = await Promise.all([
    // Total notifications
    db('notifications')
      .where('created_at', '>=', dateFilter)
      .count('* as count')
      .first(),
    
    // Unread notifications
    db('notifications')
      .where('created_at', '>=', dateFilter)
      .where({ is_read: false })
      .count('* as count')
      .first(),
    
    // Notifications by type
    db('notifications')
      .where('created_at', '>=', dateFilter)
      .select('type')
      .count('* as count')
      .groupBy('type'),
    
    // Daily notification stats
    db.raw(`
      WITH date_series AS (
        SELECT generate_series(
          DATE_TRUNC('day', ?::timestamp),
          DATE_TRUNC('day', NOW()),
          INTERVAL '1 day'
        )::date as date
      )
      SELECT 
        ds.date,
        COALESCE(n.sent, 0) as sent,
        COALESCE(n.read, 0) as read
      FROM date_series ds
      LEFT JOIN (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as sent,
          COUNT(CASE WHEN is_read THEN 1 END) as read
        FROM notifications
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
      ) n ON ds.date = n.date
      ORDER BY ds.date
    `, [dateFilter, dateFilter])
  ]);
  
  res.json({
    stats: {
      totalNotifications: parseInt(totalNotifications.count),
      unreadNotifications: parseInt(unreadNotifications.count),
      readRate: totalNotifications.count > 0 
        ? ((totalNotifications.count - unreadNotifications.count) / totalNotifications.count * 100).toFixed(2) + '%'
        : '0%'
    },
    byType: notificationsByType,
    dailyStats: dailyStats.rows
  });
});

// Routes
router.get('/', getUserNotifications);
router.put('/:notificationId/read', markNotificationRead);
router.put('/mark-all-read', markAllNotificationsRead);
router.delete('/:notificationId', deleteNotification);
router.get('/preferences', getNotificationPreferences);
router.put('/preferences', updateNotificationPreferences);
router.post('/bulk', sendBulkNotification);
router.get('/stats', getNotificationStats);

export default router;
