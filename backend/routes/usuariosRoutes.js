/**
 * 🔗 ROTAS DO GESTOR DE USUÁRIOS
 * Endpoints para gestão completa de usuários
 */

const express = require('express');
const router = express.Router();
const GestorUsuarios = require('../gestor-usuarios-completo');

const gestorUsuarios = new GestorUsuarios();

console.log('🔗 ROTAS GESTOR USUÁRIOS CARREGADAS');

// ========================================
// 1. ROTAS DE USUÁRIOS
// ========================================

// Criar novo usuário
router.post('/usuarios', async (req, res) => {
    try {
        const dadosUsuario = req.body;

        const resultado = await gestorUsuarios.criarUsuario(dadosUsuario);

        res.status(201).json({
            sucesso: true,
            mensagem: 'Usuário criado com sucesso',
            dados: resultado
        });

    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Obter dados do usuário
router.get('/usuarios/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const usuario = await gestorUsuarios.obterUsuario(userId);

        if (!usuario) {
            return res.status(404).json({
                sucesso: false,
                erro: 'Usuário não encontrado'
            });
        }

        res.json({
            sucesso: true,
            dados: usuario
        });

    } catch (error) {
        console.error('❌ Erro ao obter usuário:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Atualizar perfil do usuário
router.put('/usuarios/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const dadosAtualizacao = req.body;

        const resultado = await gestorUsuarios.atualizarUsuario(userId, dadosAtualizacao);

        res.json({
            sucesso: true,
            mensagem: 'Usuário atualizado com sucesso',
            dados: resultado
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar usuário:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// ========================================
// 2. ROTAS DE AUTENTICAÇÃO
// ========================================

// Login do usuário
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const resultado = await gestorUsuarios.autenticarUsuario(email, password);

        res.json({
            sucesso: true,
            dados: resultado
        });

    } catch (error) {
        console.error('❌ Erro ao fazer login:', error.message);
        res.status(401).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Logout do usuário
router.post('/auth/logout/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        await gestorUsuarios.encerrarSessao(userId);

        res.json({
            sucesso: true,
            mensagem: 'Logout realizado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao fazer logout:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// ========================================
// 3. ROTAS DE CONFIGURAÇÕES
// ========================================

// Obter configurações do sistema
router.get('/configuracoes', (req, res) => {
    try {
        res.json({
            sucesso: true,
            configuracoes: gestorUsuarios.configuracoes
        });
    } catch (error) {
        console.error('❌ Erro ao obter configurações:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Validar saldo mínimo por país
router.get('/configuracoes/saldo-minimo/:pais', (req, res) => {
    try {
        const { pais } = req.params;
        const config = gestorUsuarios.configuracoes.saldo_minimo;

        let saldoMinimo;
        if (pais.toLowerCase() === 'brasil') {
            saldoMinimo = { valor: config.brasil, moeda: 'BRL' };
        } else {
            saldoMinimo = { valor: config.internacional, moeda: 'USD' };
        }

        res.json({
            sucesso: true,
            pais: pais,
            saldo_minimo: saldoMinimo
        });

    } catch (error) {
        console.error('❌ Erro ao obter saldo mínimo:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// ========================================
// 4. ROTAS DE OPERAÇÕES
// ========================================

// Verificar limite de operações do usuário
router.get('/operacoes/limite/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const usuario = await gestorUsuarios.obterUsuario(userId);
        const maxOperacoes = gestorUsuarios.configuracoes.operacoes.max_operations;

        res.json({
            sucesso: true,
            dados: {
                user_id: userId,
                max_operacoes_simultaneas: maxOperacoes,
                perfil: usuario?.perfil || 'free',
                descricao: `Usuário pode ter no máximo ${maxOperacoes} operações simultâneas`
            }
        });

    } catch (error) {
        console.error('❌ Erro ao verificar limite:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// ========================================
// 5. ROTAS DE RELATÓRIOS
// ========================================

// Obter status geral do gestor
router.get('/status', (req, res) => {
    try {
        const status = gestorUsuarios.obterStatus();

        res.json({
            sucesso: true,
            status
        });

    } catch (error) {
        console.error('❌ Erro ao obter status:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

module.exports = router;
