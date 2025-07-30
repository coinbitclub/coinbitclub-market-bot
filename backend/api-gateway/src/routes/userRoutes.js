const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Pool de conexão PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// ===== ROTAS DE AUTENTICAÇÃO SIMPLES =====
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }
        
        // Buscar usuário no banco
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou senha inválidos' });
        }
        
        const user = result.rows[0];
        
        // Verificar senha
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Email ou senha inválidos' });
        }
        
        // Gerar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'coinbitclub-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({
            message: 'Login realizado com sucesso',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        });
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

router.post('/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
        }
        
        // Verificar se usuário já existe
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Usuário já existe com este email' });
        }
        
        // Hash da senha
        const passwordHash = await bcrypt.hash(password, 12);
        
        // Criar usuário
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, name, email, role, status',
            [name, email, passwordHash, 'user', 'active']
        );
        
        const user = result.rows[0];
        
        // Gerar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'coinbitclub-secret-key',
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            message: 'Usuário registrado com sucesso',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status
            },
            token
        });
        
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ===== ROTAS DE USUÁRIO (PROTEGIDAS) =====
router.get('/user/dashboard', userController.authenticateUser, userController.getUserDashboard);
router.get('/user/operations', userController.authenticateUser, userController.getUserOperations);
router.get('/user/plans', userController.authenticateUser, userController.getAvailablePlans);
router.get('/user/settings', userController.authenticateUser, userController.getUserSettings);
router.put('/user/settings', userController.authenticateUser, userController.updateUserSettings);

// ===== ROTAS DE AFILIADO (PROTEGIDAS) =====
router.get('/affiliate/dashboard', userController.authenticateUser, userController.getAffiliateDashboard);
router.get('/affiliate/commissions', userController.authenticateUser, userController.getAffiliateCommissions);
router.post('/affiliate/request-payment', userController.authenticateUser, userController.requestCommissionPayment);

module.exports = router;
