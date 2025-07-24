import express from 'express';
import auth from './controllers/authController.js';
import plans from './controllers/planController.js';
import credentials from './controllers/credentialsController.js';
import cointars from './controllers/cointarsController.js';
import dashboard from './controllers/dashboardController.js';
import orders from './controllers/ordersController.js';
import subscriptionController from './controllers/subscriptionController.js';
import affiliateController from './controllers/affiliateController.js';
import adminController from './controllers/adminController.js';
import notificationController from './controllers/notificationController.js';
import analyticsController from './controllers/analyticsController.js';
import settingsController from './controllers/settingsController.js';
import financialController from './controllers/financialController.js';
import docsController from './controllers/docsController.js';
import { authenticateToken, requireRole } from './middleware/auth.js';

// Import do novo controlador Railway integrado
const adminRailwayController = require('./controllers/adminRailwayController.js');

const router = express.Router();

// Public routes
router.use('/auth', auth);
router.use('/docs', docsController);

// Public dashboard demo route (no auth required)
router.get('/dashboard/admin-demo', async (req, res, next) => {
  const { getAdminDashboardDemo } = await import('./controllers/dashboardController.js');
  getAdminDashboardDemo(req, res, next);
});

// Protected routes (require authentication)
router.use(authenticateToken);

router.use('/plans', plans);
router.use('/credentials', credentials);
router.use('/cointars', cointars);
router.use('/dashboard', dashboard);
router.use('/orders', orders);

// New business logic routes
router.use('/subscriptions', subscriptionController);
router.use('/affiliate', affiliateController);
router.use('/notifications', notificationController);
router.use('/analytics', analyticsController);
router.use('/settings', settingsController);
router.use('/financial', financialController);

// Admin routes (require admin role)
router.use('/admin', requireRole('admin'), adminController);

// Admin Railway routes (integração completa com PostgreSQL Railway)
router.use('/admin/railway', adminRailwayController);

export default router;
