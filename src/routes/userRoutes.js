const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { jwtMiddleware } = require('../middleware/auth'); // ✅ CORREÇÃO

router.get('/profile',      jwtMiddleware, userController.getProfile);          
router.get('/risks',        jwtMiddleware, userController.fetchRisks);
router.put('/risks',        jwtMiddleware, userController.modifyRisks);
router.get('/signals',      jwtMiddleware, userController.fetchSignals);
router.post('/withdraw',    jwtMiddleware, userController.withdraw);

module.exports = router;
