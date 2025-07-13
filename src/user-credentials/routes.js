import express from 'express';
import { jwtMiddleware } from '../common/auth.js';
import { addCredentials, listCredentials } from './service.js';
const router = express.Router();
router.post('/', jwtMiddleware, async (req, res) => {
  await addCredentials(req.user.id, req.body);
  res.status(201).end();
});
router.get('/', jwtMiddleware, async (req, res) => {
  const creds = await listCredentials(req.user.id);
  res.json(creds);
});
export default router;
