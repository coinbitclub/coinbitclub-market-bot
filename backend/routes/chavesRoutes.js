/**
 * 🔗 ROTAS DO GESTOR DE CHAVES API
 * Endpoints para gestão de chaves e parametrizações
 */

const express = require('express');
const router = express.Router();
const GestorChavesAPI = require('../gestor-chaves-parametrizacoes');

const gestorChaves = new GestorChavesAPI();

console.log('🔗 ROTAS GESTOR CHAVES API CARREGADAS');

// ========================================
// 1. ROTAS DE CHAVES API
// ========================================

// Adicionar nova chave API
router.post('/chaves', async (req, res) => {
    try {
        const { userId, exchangeName, apiKey, apiSecret, testnet = true } = req.body;

        if (!userId || !exchangeName || !apiKey || !apiSecret) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Campos obrigatórios: userId, exchangeName, apiKey, apiSecret'
            });
        }

        const resultado = await gestorChaves.adicionarChaveAPI(userId, exchangeName, apiKey, apiSecret, testnet);

        res.status(201).json({
            sucesso: true,
            mensagem: 'Chave API adicionada com sucesso',
            dados: resultado
        });

    } catch (error) {
        console.error('❌ Erro ao adicionar chave API:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Validar chaves API
router.post('/chaves/validar', async (req, res) => {
    try {
        const { apiKey, apiSecret, exchangeName, testnet = true } = req.body;

        const validacao = await gestorChaves.validarChavesAPI(apiKey, apiSecret, exchangeName, testnet);

        res.json({
            sucesso: true,
            validacao
        });

    } catch (error) {
        console.error('❌ Erro ao validar chave API:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// ========================================
// 2. ROTAS DE PARAMETRIZAÇÕES
// ========================================

// Obter parametrizações do usuário
router.get('/parametrizacoes/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const dados = await gestorChaves.obterDadosUsuarioParaTrading(userId);

        res.json({
            sucesso: true,
            dados: {
                parametrizacoes: dados.parametrizacoes,
                chaves: dados.chaves.map(chave => ({
                    exchange_name: chave.exchange_name,
                    testnet: chave.testnet,
                    status: chave.status,
                    permissions: chave.permissions,
                    last_validated: chave.last_validated
                })) // Remove chaves sensíveis da resposta
            }
        });

    } catch (error) {
        console.error('❌ Erro ao obter parametrizações:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Atualizar parametrizações do usuário
router.put('/parametrizacoes/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const novasParametrizacoes = req.body;

        const resultado = await gestorChaves.atualizarParametrizacoes(userId, novasParametrizacoes);

        res.json({
            sucesso: true,
            mensagem: 'Parametrizações atualizadas com sucesso',
            dados: resultado
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar parametrizações:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Obter parametrizações padrão
router.get('/parametrizacoes/padrao', (req, res) => {
    try {
        res.json({
            sucesso: true,
            parametrizacoes: gestorChaves.parametrizacoesPadrao
        });
    } catch (error) {
        console.error('❌ Erro ao obter parametrizações padrão:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// ========================================
// 3. ROTAS DE DADOS PARA TRADING
// ========================================

// Obter dados completos do usuário para trading
router.get('/trading/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const dados = await gestorChaves.obterDadosUsuarioParaTrading(userId);

        res.json({
            sucesso: true,
            dados
        });

    } catch (error) {
        console.error('❌ Erro ao obter dados para trading:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// ========================================
// 4. ROTAS DE RELATÓRIOS
// ========================================

// Relatório de usuários
router.get('/relatorio/usuarios', async (req, res) => {
    try {
        const relatorio = await gestorChaves.gerarRelatorioUsuarios();

        res.json({
            sucesso: true,
            relatorio
        });

    } catch (error) {
        console.error('❌ Erro ao gerar relatório:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// ========================================
// 5. ROTAS DE VALIDAÇÃO ESPECÍFICAS
// ========================================

// Validar configuração de máximo 2 operações por usuário
router.get('/validacao/max-operacoes/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const dados = await gestorChaves.obterDadosUsuarioParaTrading(userId);
        const maxOperacoes = dados.parametrizacoes?.trading?.max_open_positions || 2;

        res.json({
            sucesso: true,
            dados: {
                user_id: userId,
                max_operacoes_simultaneas: maxOperacoes,
                configuracao: 'POR USUÁRIO',
                descricao: `Cada usuário pode ter no máximo ${maxOperacoes} operações simultâneas`
            }
        });

    } catch (error) {
        console.error('❌ Erro ao validar máximo operações:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

module.exports = router;
