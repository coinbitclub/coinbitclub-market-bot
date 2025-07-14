import { db } from '../../common/db.js';

export async function linkAffiliate(userId, affiliateId) {
  await db('affiliates').insert({ user_id: userId, affiliate_id: affiliateId });
}
