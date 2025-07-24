const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// ===== ROTAS DE AUTENTICAÇÃO =====
router.post('/auth/login', userController.loginUser);
router.post('/auth/register', userController.registerUser);

// ===== ROTAS DE USUÁRIO (PROTEGIDAS) =====
router.get('/user/dashboard', userController.authenticateUser, userController.getUserDashboard);
router.get('/user/operations', userController.authenticateUser, userController.getUserOperations);
router.get('/user/plans', userController.authenticateUser, userController.getAvailablePlans);
router.get('/user/settings', userController.authenticateUser, userController.getUserSettings);
router.put('/user/settings', userController.authenticateUser, userController.updateUserSettings);

// ===== ROTAS DE AFILIADO (PROTEGIDAS) =====
router.get('/affiliate/dashboard', userController.authenticateUser, userController.getAffiliateDashboard);
router.get('/affiliate/commissions', userController.authenticateUser, userController.getAffiliateCommissions);
router.post('/affiliate/request-payment', userController.authenticateUser, userController.requestCommissionPayment);

module.exports = router;
