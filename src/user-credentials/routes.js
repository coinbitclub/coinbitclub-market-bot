import express from 'express';
<<<<<<< HEAD
import { authMiddleware } from '../common/auth.js';
import { addCredentials, listCredentials } from './service.js';
const router = express.Router();
router.post('/', authMiddleware, async (req, res) => {
  await addCredentials(req.user.id, req.body);
  res.status(201).end();
});
router.get('/', authMiddleware, async (req, res) => {
=======
import { jwtMiddleware } from '../common/auth.js';
import { addCredentials, listCredentials } from './service.js';
const router = express.Router();
router.post('/', jwtMiddleware, async (req, res) => {
  await addCredentials(req.user.id, req.body);
  res.status(201).end();
});
router.get('/', jwtMiddleware, async (req, res) => {
>>>>>>> aacf3516e63892bec79e9806af8daf54878b8cb5
  const creds = await listCredentials(req.user.id);
  res.json(creds);
});
export default router;
