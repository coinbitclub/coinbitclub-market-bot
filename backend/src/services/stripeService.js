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
    success_url: process.env.FRONTEND_URL + "/dashboard?success=1",
    cancel_url: process.env.FRONTEND_URL + "/dashboard?cancel=1",
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

  // Depósito via Checkout
  if (event.type === "checkout.session.completed") {
    const { userId } = event.data.object.metadata;
    const valor = event.data.object.amount_total / 100;
    const moeda = event.data.object.currency.toUpperCase();
    await updateUserBalance(userId, valor, "Depósito via Stripe", "deposito", event.data.object.id);
  }

  // Adicione aqui tratamento para assinaturas, payouts, etc

  res.json({ received: true });
}
