import express from 'express';
import { saveRawWebhook } from './service.js';
import { validateHeaderToken } from '../common/security.js';
const router = express.Router();
router.post('/webhook', validateHeaderToken('SIGNAL_WEBHOOK_SECRET'), async (req, res, next) => {
  const route = req.query.source || 'generic';
  await saveRawWebhook(route, req.body);
  res.status(201).json({ message: 'Signal received' });
});
export default router;
