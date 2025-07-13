import { getDB } from '../common/db.js';
export async function addCredentials(userId, cred) {
  await getDB()('user_credentials').insert({ user_id: userId, ...cred });
}
export async function listCredentials(userId) {
  return getDB()('user_credentials').where('user_id', userId);
}
