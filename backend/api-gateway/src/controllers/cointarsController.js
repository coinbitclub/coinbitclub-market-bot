import express from 'express';
import { db } from '../../../common/db.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  const data = await db('cointars').orderBy('timestamp', 'desc').limit(100);
  res.json(data);
});

export default router;
