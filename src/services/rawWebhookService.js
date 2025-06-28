import { query } from './databaseService.js';

export async function saveRawWebhook({ source, payload, error }) {
  await query(
    'INSERT INTO raw_webhook (source, payload, error, created_at) VALUES ($1, $2, $3, NOW())',
    [source, JSON.stringify(payload), error]
  );
}




