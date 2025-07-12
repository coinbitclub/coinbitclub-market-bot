// src/services/stripeService.js
import Stripe from "stripe";
import { updateUserBalance } from "./balanceService.js";
import { setUserPlan } from "./planService.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/** Gera checkout session Stripe para depósito pré-pago */
export async function createCheckoutSession(userId, amount, currency) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          product_data: { name: "Saldo CoinbitClub" },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1
      }
    ],
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL}/dashboard?success=1`,
    cancel_url: `${process.env.FRONTEND_URL}/dashboard?cancel=1`,
    metadata: { userId }
  });
  return session.url;
}

/** Webhook Stripe para depósitos, assinaturas etc */
export async function handleStripeWebhook(req, res) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;

  if (event.type === "checkout.session.completed") {
    const { userId, planId } = session.metadata || {};

    if (session.mode === "payment") {
      const valor = session.amount_total / 100;
      const moeda = session.currency.toUpperCase();
      await updateUserBalance(
        userId,
        valor,
        "Depósito via Stripe",
        "deposito",
        session.id
      );
    } else if (session.mode === "subscription" && planId) {
      await setUserPlan(userId, planId);
    }
  }

  res.json({ received: true });
}
