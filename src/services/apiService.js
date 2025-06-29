import axios from 'axios';
import { pool } from '../database.js';

const API_KEY = process.env.COINSTATS_API_KEY;

// Salva dados do índice Fear & Greed
export async function fetchAndSaveFearGreed() {
  try {
    const url = 'https://openapiv1.coinstats.app/insights/fear-and-greed';
    const { data } = await axios.get(url, { headers: { 'X-API-KEY': API_KEY } });

    const { value, value_classification, timestamp } = data.now;
    const captured_at = new Date(timestamp * 1000).toISOString();

    const sql = `INSERT INTO public.fear_greed (value, value_classification, captured_at, created_at)
                 VALUES ($1, $2, $3, NOW())`;
    await pool.query(sql, [value, value_classification, captured_at]);
    console.log('[FearGreed] Dados inseridos com sucesso');
  } catch (err) {
    console.error('[FearGreed] Erro ao inserir:', err.message || err);
  }
}

// Adicione funções para outros endpoints CoinStats seguindo o mesmo padrão:
// - fetchAndSaveBtcDominance()
// - fetchAndSaveMarkets()
