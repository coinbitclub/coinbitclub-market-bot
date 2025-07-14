import express from 'express';
import auth from './controllers/authController.js';
import plans from './controllers/planController.js';
import credentials from './controllers/credentialsController.js';
import cointars from './controllers/cointarsController.js';
import dashboard from './controllers/dashboardController.js';
import orders from './controllers/ordersController.js';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = express.Router();

router.use('/auth', auth);
router.use('/plans', plans);
router.use('/credentials', credentials);
router.use('/cointars', cointars);
router.use('/dashboard', dashboard);
router.use('/orders', orders);
router.use('/admin', createProxyMiddleware({ target: 'http://admin-panel:3000' }));

export default router;
