import { getDB } from '../common/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET;
export async function register({ email, password }) {
  const db = getDB();
  const hash = await bcrypt.hash(password, 10);
  const [user] = await db('users').insert({ email, password_hash: hash, trialEndsAt: db.raw("now() + interval '7 days'") }, '*');
  return { id: user.id, email: user.email };
}
export async function login({ email, password }) {
  const db = getDB();
  const user = await db('users').where({ email }).first();
  if (!user || !await bcrypt.compare(password, user.password_hash)) throw new Error('Invalid credentials');
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  return { token };
}
export async function requestPasswordReset(email) { /* omitted for brevity */ }
export async function resetPassword(token, newPassword) { /* omitted for brevity */ }
