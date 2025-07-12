// src/routes/userRoutes.js
import { Router } from 'express';
import userController from '../controllers/userController.js';
import { jwtMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validatePayload.js';
import {
  riskSchema,
  signalSchema,
  withdrawalSchema,
  settingsSchema,
  credentialsSchema
} from '../middleware/validation.js';

const router = Router();

// Perfil do usuário
router.get(
  '/profile',
  jwtMiddleware,
  userController.getProfile
);

// Configurações do usuário
router.get(
  '/settings',
  jwtMiddleware,
  userController.getUserSettings
);
router.put(
  '/settings',
  jwtMiddleware,
  validate(settingsSchema),
  userController.updateSettings
);

// Credenciais de exchange
router.post(
  '/credentials',
  jwtMiddleware,
  validate(credentialsSchema),
  userController.saveCredentials
);
router.put(
  '/credentials',
  jwtMiddleware,
  validate(credentialsSchema),
  userController.updateCredentials
);

// Histórico de operações
router.get(
  '/operations',
  jwtMiddleware,
  userController.getOperations
);
router.post(
  '/operations',
  jwtMiddleware,
  userController.createOperation
);

// Riscos do usuário
router.get(
  '/risks',
  jwtMiddleware,
  userController.fetchRisks
);
router.put(
  '/risks',
  jwtMiddleware,
  validate(riskSchema),
  userController.modifyRisks
);

// Sinais do usuário
router.get(
  '/signals',
  jwtMiddleware,
  userController.fetchSignals
);

// Saque
router.post(
  '/withdraw',
  jwtMiddleware,
  validate(withdrawalSchema),
  userController.withdraw
);

export default router;
