import express from 'express';
import { authMiddleware } from '../common/auth.js';
import { addCredentials, listCredentials } from './service.js';

const router = express.Router();

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    await addCredentials(req.user.id, req.body);
    res.status(201).end();
  } catch (err) {
    next(err);
  }
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const creds = await listCredentials(req.user.id);
    res.json(creds);
  } catch (err) {
    next(err);
  }
});

export default router;
