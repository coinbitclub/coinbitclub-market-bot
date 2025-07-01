import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Valores do admin definidos em variáveis de ambiente
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS = process.env.ADMIN_PASS;
const JWT_SECRET = process.env.JWT_SECRET;

// Rota de login do admin
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Verifica credenciais
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Gera token JWT
  const token = jwt.sign({ role: 'admin', email }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

export default router;
