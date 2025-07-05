// backend/src/routes/stripeRoutes.js
import express from "express";
import Stripe from "stripe";
import { pool } from "../database.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

router.post("/checkout", async (req, res) => {
  try {
    const { plan_id, user_email } = req.body;
    if (!plan_id || !user_email)
      return res.status(400).json({ error: "plan_id e user_email obrigatórios" });

    const { rows } = await pool.query(
      "SELECT stripe_price_id FROM plans WHERE id = $1",
      [plan_id]
    );
    if (!rows.length)
      return res.status(404).json({ error: "Plano não encontrado" });
    const price_id = rows[0].stripe_price_id;

    const { rows: pr } = await pool.query(
      "SELECT tipo FROM plans WHERE id = $1",
      [plan_id]
    );
    const modo = pr[0].tipo.includes("mensal") ? "subscription" : "payment";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: modo,
      line_items: [{ price: price_id, quantity: 1 }],
      customer_email: user_email,
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Erro Stripe:", err);
    res.status(500).json({ error: "Falha ao criar checkout" });
  }
});

// Webhook handler exportado
export async function stripeWebhookHandler(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed":
      console.log("✅ Checkout completed:", event.data.object.id);
      // TODO: ative assinatura no DB aqui
      break;
    default:
      console.log(`🔔 Evento não tratado: ${event.type}`);
  }

  res.json({ received: true });
}

export default router;
