// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const jwt = require('../middleware/jwt'); // middleware de autenticação

// … rotas existentes … //

router.get('/risks',        jwt, userController.getRisks);
router.put('/risks',        jwt, userController.updateRisks);
router.get('/signals',      jwt, userController.getSignals);
router.post('/withdraw',    jwt, userController.requestWithdrawal);

module.exports = router;
