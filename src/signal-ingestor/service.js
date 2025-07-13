import { getDB } from '../common/db.js';
export async function saveRawWebhook(route, payload) {
  await getDB()('raw_webhook').insert({ route, payload, received_at: getDB().fn.now() });
}
