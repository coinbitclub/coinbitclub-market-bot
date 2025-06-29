import express from 'express';
import { pool, getUserById, addUserMessage } from '../database.js';
import { sendWhatsApp } from '../services/whatsapp.js';

const router = express.Router();

// Mensagens
router.post('/notificar-fim-degustacao/:user_id', async (req, res) => {
  // ...igual ao seu código, sem alteração necessária!
});

router.get('/mensagens/:user_id', async (req, res) => { /* ... */ });
router.get('/mensagens', async (req, res) => { /* ... */ });

// Usuários
router.get('/usuarios', async (req, res) => { /* ... */ });
router.get('/usuarios/:user_id', async (req, res) => { /* ... */ });
router.put('/usuarios/:user_id', async (req, res) => { /* ... */ });

// Assinaturas
router.get('/usuarios/:user_id/assinaturas', async (req, res) => { /* ... */ });

// Operações
router.get('/usuarios/:user_id/operacoes', async (req, res) => { /* ... */ });

// Credenciais
router.get('/usuarios/:user_id/credenciais', async (req, res) => { /* ... */ });
router.put('/usuarios/:user_id/credenciais/bybit', async (req, res) => { /* ... */ });
router.put('/usuarios/:user_id/credenciais/binance', async (req, res) => { /* ... */ });

// Relatório/Dashboard
router.get('/relatorio', async (req, res) => { /* ... */ });

router.get('/', (req, res) => {
  res.send('Painel de Controle CoinbitClub – API REST pronta!');
});

export default router;
