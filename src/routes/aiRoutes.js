// src/routes/aiRoutes.js
import express from 'express';
import realRoutes from './ai.js';
import testRoutes from './aiTestRoutes.js';

const router = express.Router();

// Se estivermos em ambiente de teste, usar rotas mock
if (process.env.NODE_ENV === 'test') {
  router.use('/', testRoutes);
} else {
  router.use('/', realRoutes);
}

export default router;
