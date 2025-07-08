// src/routes/users.js
import express from 'express';
import Joi from 'joi';
import { validate } from '../middleware/validatePayload.js';
import { isUser } from '../middleware/auth.js';
import * as userService from '../services/userService.js';

const router = express.Router();

// Schemas
const registerSchema = Joi.object({
  body: Joi.object({
    nome: Joi.string().required(),
    sobrenome: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    telefone: Joi.string().required(),
    pais: Joi.string().required(),
    aceite_termo: Joi.boolean().valid(true).required(),
  })
});

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  })
});

// Cadastro de novo usuário
router.post(
  '/register',
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const user = await userService.registerUser(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
);

// Login de usuário
router.post(
  '/login',
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const result = await userService.loginUser(req.body);
      res.status(result.status || 200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// Recuperação de senha
router.post(
  '/forgot',
  validate(
    Joi.object({ body: Joi.object({ email: Joi.string().email().required() }) })
  ),
  async (req, res, next) => {
    try {
      const result = await userService.forgotPassword(req.body.email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// Abaixo requer usuário autenticado
router.use(isUser);

// Consulta do próprio perfil
router.get('/me', async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Atualização de perfil
router.put('/me', async (req, res, next) => {
  try {
    const updated = await userService.updateUser(req.user.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Cadastro/atualização de credenciais de exchange
router.post(
  '/credentials',
  validate(
    Joi.object({
      body: Joi.object({
        exchange: Joi.string().required(),
        api_key: Joi.string().required(),
        api_secret: Joi.string().required(),
        is_testnet: Joi.boolean().default(false),
      })
    })
  ),
  async (req, res, next) => {
    try {
      const cred = await userService.saveCredentials(req.user.id, req.body);
      res.json(cred);
    } catch (err) {
      next(err);
    }
  }
);

// Consulta de operações do usuário
router.get('/operations', async (req, res, next) => {
  try {
    const ops = await userService.getOperations(req.user.id, req.query.modo);
    res.json(ops);
  } catch (err) {
    next(err);
  }
});

// Consulta do extrato financeiro do usuário
router.get('/finance', async (req, res, next) => {
  try {
    const fin = await userService.getFinance(req.user.id);
    res.json(fin);
  } catch (err) {
    next(err);
  }
});

// Consulta de assinaturas/plano do usuário
router.get('/subscriptions', async (req, res, next) => {
  try {
    const subs = await userService.getSubscriptions(req.user.id);
    res.json(subs);
  } catch (err) {
    next(err);
  }
});

// Assinar/cancelar plano
router.post(
  '/subscription',
  validate(
    Joi.object({ body: Joi.object({ planId: Joi.number().required(), action: Joi.string().valid('subscribe','cancel').required() }) })
  ),
  async (req, res, next) => {
    try {
      const result = await userService.changeSubscription(req.user.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
