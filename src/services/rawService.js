import { executeQuery } from './databaseService.js';

// Salva payloads brutos recebidos em qualquer rota (auditoria/debug)
export async function saveRaw(route, payload) {
  const sql = `INSERT INTO raw_webhook(route, payload) VALUES($1, $2)`;
  await executeQuery(sql, [route, payload]);
}
