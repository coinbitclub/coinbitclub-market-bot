import { pool } from "../database.js";

export async function createSubscription(req, res) {
  try {
    const { user_id, plan_id, start_date } = req.body;
    const result = await pool.query(
      "INSERT INTO subscriptions (user_id, plan_id, start_date) VALUES ($1, $2, $3) RETURNING *",
      [user_id, plan_id, start_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar assinatura:", err);
    res.status(500).json({ error: "Erro ao criar assinatura" });
  }
}
