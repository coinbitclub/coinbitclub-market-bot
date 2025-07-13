import Stripe from 'stripe';
import { getDB } from '../common/db.js';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export async function subscribe(req, res) {
  const plan = await getDB()('plans').where('id', req.body.planId).first();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: req.user.email,
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL}/success`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`
  });
  res.json({ sessionId: session.id });
}
export async function requestRefund(req, res) {
  await getDB()('user_financial').insert({ user_id: req.user.id, tipo_movimento: 'refund_request', valor: 0, descricao: req.body.subscriptionId });
  res.status(201).json({ message: 'Refund requested' });
}
