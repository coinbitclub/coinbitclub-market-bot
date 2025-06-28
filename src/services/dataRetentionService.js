import { query } from './databaseService.js';

export async function purgeOldData() {
  const sql = `
    DELETE FROM public.signals      WHERE received_at < now() - interval '90 days';
    DELETE FROM public.dominance    WHERE timestamp   < now() - interval '90 days';
    DELETE FROM public.fear_greed   WHERE timestamp   < now() - interval '90 days';
    DELETE FROM public.market       WHERE timestamp   < now() - interval '90 days';
  `;
  await query(sql);
}




