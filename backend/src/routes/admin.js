import express from 'express';
import { pool } from '../database.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'sua_senha_secreta';

// LOGIN ADMIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validação básica
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha obrigatórios' });
  }

  try {
    // Busca o admin (troque para sua lógica real de admin)
    const { rows } = await pool.query(
      'SELECT id, email, senha FROM admins WHERE email = $1 LIMIT 1',
      [email]
    );
    const admin = rows[0];
    if (!admin || admin.senha !== password) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gera token
    const token = jwt.sign(
      { userId: admin.id, role: 'admin', email: admin.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, email: admin.email });
  } catch (err) {
    res.status(500).json({ error: 'Erro no login', details: err.message });
  }
});

// ROTA USUÁRIOS (exemplo)
router.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, email, created_at FROM users ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar usuários", details: err.message });
  }
});

export default router;
