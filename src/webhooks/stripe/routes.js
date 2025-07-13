import express from 'express';
import Stripe from 'stripe';
import { getDB } from '../../common/db.js';
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }
  const db = getDB();
  switch(event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // handle subscription activation
      break;
    case 'invoice.payment_failed':
      const invoice = event.data.object;
      // handle payment failure
      break;
  }
  res.json({ received: true });
});
export default router;
