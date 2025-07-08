import express from 'express';
const router = express.Router();

/** Stub definitivo: responde 200 instantâneo em /webhook/signal */
router.post('/signal', (_req, res) => res.json({ status: 'ok' }));

export default router;
