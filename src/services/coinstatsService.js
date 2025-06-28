import axios from 'axios';
import { query } from './databaseService.js';

const API_KEY = process.env.COINSTATS_API_KEY;
const BASE = 'https://openapiv1.coinstats.app';

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

    console.log('Executando query:', sql.trim());
    console.log('Com parÃ¢metros:', [value, value_classification, captured_at]);

    await query(sql, [value, value_classification, captured_at]);

    console.log('[FearGreed] Dados inseridos com sucesso');
  } catch (err) {
    console.error('[FearGreed] Erro ao inserir:', err.response?.data || err.message);
  }
}
