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
import paymentController from './controllers/paymentController.js';
import webhookController from './controllers/webhookController.js';
import docsController from './controllers/docsController.js';
import withdrawalController from './controllers/withdrawalController.js';
import operationController from './controllers/operationController.js';
import financialControlController from './controllers/financialControlController.js';
import aiRoutes from './routes/aiRoutes.js';
import tradingViewWebhookController from './controllers/tradingViewWebhookController.js';
import affiliateControllerV2 from './controllers/affiliateControllerV2.js';
import apiKeysController from './controllers/apiKeysController.js';
import userDashboardController from './controllers/userDashboardController.js';
import { authenticateToken, requireRole } from './middleware/auth.js';

// Import do novo controlador Railway integrado
const adminRailwayController = require('./controllers/adminRailwayController.js');
const userRoutes = require('./routes/userRoutes.js');

// Import das novas rotas do sistema de pagamentos
const catalogRoutes = require('../../routes/catalog.js');
const adminFinancialRoutes = require('../../routes/adminFinancial.js');
const stripeProductRoutes = require('../../routes/stripeProducts.js');

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

// Affiliate V2 routes (sistema de afiliados atualizado)
router.get('/affiliate/v2/dashboard', authenticateToken, affiliateControllerV2.getDashboard.bind(affiliateControllerV2));
router.get('/affiliate/v2/link', authenticateToken, affiliateControllerV2.getAffiliateLink.bind(affiliateControllerV2));
router.get('/affiliate/v2/commissions', authenticateToken, affiliateControllerV2.getCommissions.bind(affiliateControllerV2));
router.post('/affiliate/v2/withdraw', authenticateToken, affiliateControllerV2.requestWithdraw.bind(affiliateControllerV2));
router.get('/affiliate/v2/withdrawals', authenticateToken, affiliateControllerV2.getWithdrawals.bind(affiliateControllerV2));
router.get('/affiliate/v2/analytics', authenticateToken, affiliateControllerV2.getAnalytics.bind(affiliateControllerV2));

router.use('/notifications', notificationController);
router.use('/analytics', analyticsController);
router.use('/settings', settingsController);
router.use('/financial', financialController);

// Payment system routes
router.use('/payments', authenticateToken, paymentController);

// Withdrawal system routes
router.use('/withdrawals', authenticateToken, withdrawalController);

// Operation control routes
router.use('/operations', authenticateToken, operationController);

// Financial control routes (admin only)
router.use('/financial-control', requireRole('admin'), financialControlController);

// AI Águia routes (sistema de IA para trading)
router.use('/ai', aiRoutes);

// User Dashboard routes (dashboard completo conforme especificação)
router.get('/user/dashboard', authenticateToken, userDashboardController.getDashboard.bind(userDashboardController));

// API Keys routes (gerenciamento de chaves de exchanges)
router.get('/user/api-keys', authenticateToken, apiKeysController.getUserApiKeys.bind(apiKeysController));
router.post('/user/api-keys', authenticateToken, apiKeysController.createOrUpdateApiKey.bind(apiKeysController));
router.delete('/user/api-keys/:id', authenticateToken, apiKeysController.deleteApiKey.bind(apiKeysController));
router.put('/user/api-keys/:id/toggle', authenticateToken, apiKeysController.toggleApiKey.bind(apiKeysController));
router.get('/user/api-keys/validate/:id', authenticateToken, apiKeysController.validateApiKey.bind(apiKeysController));

// Admin routes (require admin role)
router.use('/admin', requireRole('admin'), adminController);

// Webhook routes (no authentication required)
router.use('/webhooks', webhookController);

// TradingView webhook routes (no authentication required)
router.post('/webhook/tradingview/alert', tradingViewWebhookController.receiveAlert.bind(tradingViewWebhookController));
router.post('/webhook/tradingview/strategy', tradingViewWebhookController.automatedStrategy.bind(tradingViewWebhookController));

// TradingView admin routes (require admin role)
router.get('/admin/tradingview/alerts', requireRole('admin'), tradingViewWebhookController.getAlertHistory.bind(tradingViewWebhookController));

// Admin Railway routes (integração completa com PostgreSQL Railway)
router.use('/admin/railway', adminRailwayController);

// User and Affiliate routes (integração Railway)
router.use('/api', userRoutes);

// Catalog and Product routes (sistema de produtos e checkout)
router.use('/catalog', catalogRoutes);

// Admin Financial routes (dashboard administrativo financeiro)
router.use('/admin/financial', requireRole('admin'), adminFinancialRoutes);

// Stripe Product routes (gerenciamento de produtos Stripe)
router.use('/stripe', stripeProductRoutes);

export default router;
