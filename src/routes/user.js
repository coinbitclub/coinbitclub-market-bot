// src/routes/user.js
import express from "express";
import { pool } from "../database.js";
const router = express.Router();

router.post("/register", async (req, res) => {
  const {
    nome,
    email,
    telefone,
    bybit_api_key,
    bybit_api_secret,
    binance_api_key,
    binance_api_secret,
    aceite_termo
  } = req.body;
  if (!nome || !email || !telefone || !aceite_termo)
    return res.status(400).json({ error: "Campos obrigatórios não preenchidos" });

  try {
    // Cria usuário
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, created_at)
       VALUES ($1, $2, NOW()) RETURNING id`,
      [email, "HASHFAKE"] // Troque por hash real se quiser!
    );
    const user_id = userResult.rows[0].id;

    // Grava credenciais Bybit se vieram
    if (bybit_api_key && bybit_api_secret) {
      await pool.query(
        `INSERT INTO user_bybit_credentials (user_id, api_key, api_secret, is_testnet, criado_em, atualizado_em)
         VALUES ($1, $2, $3, true, NOW(), NOW())`,
        [user_id, bybit_api_key, bybit_api_secret]
      );
    }
    // Grava credenciais Binance se vieram
    if (binance_api_key && binance_api_secret) {
      await pool.query(
        `INSERT INTO user_binance_credentials (user_id, api_key, api_secret, criado_em, atualizado_em)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [user_id, binance_api_key, binance_api_secret]
      );
    }
    // Cria assinatura de teste
    await pool.query(
      `INSERT INTO user_subscriptions (user_id, tipo_plano, status, data_inicio, data_fim, valor_pago, metodo_pagamento, criado_em, atualizado_em)
       VALUES ($1, 'teste', 'ativo', NOW(), NOW() + INTERVAL '7 days', 0, 'teste', NOW(), NOW())`,
      [user_id]
    );
    res.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cadastrar usuário" });
  }
});

export default router;
