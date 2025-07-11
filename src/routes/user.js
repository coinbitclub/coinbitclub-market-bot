// src/routes/user.js
import express from 'express';
import { jwtMiddleware } from '../middleware/auth.js';
import {
  registerUser,
  loginUser,
  getUserSettings,
  getUserStatus,
  saveCredentials
} from '../services/userService.js';

const router = express.Router();

// Registrar usuário
router.post('/register', async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Login de usuário
router.post('/login', async (req, res, next) => {
  try {
    const { token } = await loginUser(req.body);
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

// Obter status/perfil do usuário
router.get('/profile', jwtMiddleware, async (req, res, next) => {
  try {
    const status = await getUserStatus(req.user.id);
    res.json({ status });
  } catch (err) {
    next(err);
  }
});

// Salvar ou atualizar credenciais de exchange
router.post('/credentials', jwtMiddleware, async (req, res, next) => {
  try {
    const { exchange, apiKey, apiSecret, testnet } = req.body;
    if (!apiKey || !apiSecret) {
      return res.status(200).json({ exchange });
    }
    const result = await saveCredentials(req.user.id, exchange, apiKey, apiSecret, testnet);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
router.put('/credentials', jwtMiddleware, async (req, res, next) => {
  try {
    const { exchange, apiKey, apiSecret, testnet } = req.body;
    if (!apiKey || !apiSecret) {
      return res.status(200).json({ exchange });
    }
    const result = await saveCredentials(req.user.id, exchange, apiKey, apiSecret, testnet);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Obter configurações de exchange do usuário
router.get('/settings', jwtMiddleware, async (req, res, next) => {
  try {
    const settings = await getUserSettings(req.user.id);
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

export default router;
