import express from "express";
import Stripe from "stripe";
import { pool } from "../database.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/checkout", async (req, res) => {
  try {
    const { plan_id, user_email } = req.body;
    if (!plan_id || !user_email) return res.status(400).json({ error: "plan_id e user_email obrigatórios" });

    // Busca o price_id correto no banco
    const { rows } = await pool.query("SELECT stripe_price_id FROM plans WHERE id = $1", [plan_id]);
    if (!rows.length) return res.status(404).json({ error: "Plano não encontrado" });
    const price_id = rows[0].stripe_price_id;

    // Descobre o modo (assinatura ou pagamento avulso)
    const { rows: planoRows } = await pool.query("SELECT tipo FROM plans WHERE id = $1", [plan_id]);
    const modo = planoRows[0].tipo.includes("mensal") ? "subscription" : "payment";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: modo,
      line_items: [
        {
          price: price_id,
          quantity: 1,
        }
      ],
      customer_email: user_email,
      success_url: process.env.STRIPE_SUCCESS_URL || "https://SEUSITE.com/sucesso?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: process.env.STRIPE_CANCEL_URL || "https://SEUSITE.com/cancelado"
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Erro Stripe:", err);
    res.status(500).json({ error: "Falha ao criar checkout" });
  }
});

export default router;
