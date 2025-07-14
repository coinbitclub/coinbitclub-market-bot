import express from 'express';
import auth from './controllers/authController.js';
import plans from './controllers/planController.js';
import credentials from './controllers/credentialsController.js';
import cointars from './controllers/cointarsController.js';
import dashboard from './controllers/dashboardController.js';
import admin from '../../admin-panel/src/index.js';

const router = express.Router();

router.use('/auth', auth);
router.use('/plans', plans);
router.use('/credentials', credentials);
router.use('/cointars', cointars);
router.use('/dashboard', dashboard);
router.use('/admin', admin);

export default router;
