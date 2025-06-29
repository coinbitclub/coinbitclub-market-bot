import axios from 'axios';
import { pool } from '../database.js';

const API_KEY = process.env.COINSTATS_API_KEY;
const BASE = 'https://openapiv1.coinstats.app';

// Busca e salva dados do Fear & Greed
export async function fetchAndSaveFearGreed() {
  try {
    const res = await axios.get(`${BASE}/insights/fear-and-greed`, {
      headers: { 'X-API-KEY': API_KEY }
    });

    const { value, value_classification, timestamp } = res.data.now;
    const captured_at = new Date(timestamp * 1000).toISOString();

    const sql = `
      INSERT INTO public.fear_greed (value, value_classification, captured_at, created_at)
      VALUES ($1, $2, $3, NOW())
    `;

    console.log('[FearGreed] Executando query:', sql.trim(), 'com parâmetros:', [value, value_classification, captured_at]);

    await pool.query(sql, [value, value_classification, captured_at]);

    console.log('[FearGreed] Dados inseridos com sucesso');
  } catch (err) {
    console.error('[FearGreed] Erro ao inserir:', err.response?.data || err.message);
  }
}
