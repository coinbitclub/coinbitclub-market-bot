import express from 'express';
import { authMiddleware } from '../common/auth.js';
import { addCredentials, listCredentials } from './service.js';
const router = express.Router();
router.post('/', authMiddleware, async (req, res) => {
  await addCredentials(req.user.id, req.body);
  res.status(201).end();
});
router.get('/', authMiddleware, async (req, res) => {
  const creds = await listCredentials(req.user.id);
  res.json(creds);
});
export default router;
