import express from 'express';
import realDataController from '../controllers/realDataController.js';
const router = express.Router();

// Middleware de autenticação simplificado para desenvolvimento
const auth = (req, res, next) => {
  // Para desenvolvimento, aceitar qualquer token ou sem token
  next();
};

// Rotas para dados reais do PostgreSQL
router.get('/users', auth, realDataController.getUsers);
router.get('/operations', auth, realDataController.getOperations);
router.get('/dashboard/summary', auth, realDataController.getDashboardData);
router.get('/activities/recent', auth, realDataController.getRecentActivities);

// Rota de teste para verificar conectividade
router.get('/test', (req, res) => {
  res.json({
    message: 'API Real Data funcionando!',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL Railway conectado'
  });
});

export default router;
