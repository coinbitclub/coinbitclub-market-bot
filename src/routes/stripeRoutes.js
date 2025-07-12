// src/routes/stripeRoutes.js
import express from 'express';
import { checkout, webhookHandler } from '../services/stripeService.js';

const router = express.Router();

// POST /stripe/checkout
router.post('/checkout', async (req, res, next) => {
  try {
    await checkout(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;

// Handler para Webhook Stripe
export { webhookHandler };
