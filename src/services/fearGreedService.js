import { query } from './databaseService.js';

/** Persiste no banco um novo valor de Fear & Greed. */
export async function saveFearGreed({ fear_greed: value, time }) {
  await query(
    'INSERT INTO fear_greed (value, "timestamp", captured_at) VALUES ($1, $2, NOW())',
    [value, time]
  );
}
