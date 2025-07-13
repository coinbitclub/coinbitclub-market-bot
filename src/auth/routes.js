import express from 'express';
import { register, login, requestPasswordReset, resetPassword } from './service.js';
import { validateBody } from '../common/validation.js';
<<<<<<< HEAD
import Joi from '@hapi/joi';
=======
import Joi from 'joi';
>>>>>>> aacf3516e63892bec79e9806af8daf54878b8cb5
const router = express.Router();

const registerSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().min(8).required() });
const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });
const resetReqSchema = Joi.object({ email: Joi.string().email().required() });
const resetSchema = Joi.object({ token: Joi.string().required(), newPassword: Joi.string().min(8).required() });

router.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try { const user = await register(req.body); res.status(201).json(user); } catch(e){next(e);}
});
router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try { const tokens = await login(req.body); res.json(tokens); } catch(e){next(e);}
});
router.post('/request-password-reset', validateBody(resetReqSchema), async (req, res, next) => {
  try { await requestPasswordReset(req.body.email); res.status(204).end(); } catch(e){next(e);}
});
router.post('/reset-password', validateBody(resetSchema), async (req, res, next) => {
  try { await resetPassword(req.body.token, req.body.newPassword); res.status(204).end(); } catch(e){next(e);}
});

export default router;
