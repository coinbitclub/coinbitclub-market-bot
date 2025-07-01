import { pool, cleanExpiredTestUsers, cleanOldInactiveUsers } from '../database.js';

import cron from "node-cron";

cron.schedule('0 3 * * *', async () => {
  try {
    await cleanExpiredTestUsers();
    await cleanOldInactiveUsers();
    console.log("🧹 Limpeza de usuários expirados/inativos executada com sucesso!");
  } catch (err) {
    console.error("❌ Erro na limpeza de usuários expirados/inativos:", err.message);
  }
});


