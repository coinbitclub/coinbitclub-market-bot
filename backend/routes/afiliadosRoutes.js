/**
 * 🔗 ROTAS DO GESTOR DE AFILIADOS
 * Endpoints para sistema de afiliados
 */

const express = require('express');
const router = express.Router();
const GestorAfiliados = require('../gestor-afiliados-completo');

const gestorAfiliados = new GestorAfiliados();

console.log('🔗 ROTAS GESTOR AFILIADOS CARREGADAS');

// ========================================
// 1. ROTAS DE AFILIADOS
// ========================================

// Criar novo afiliado
router.post('/afiliados', async (req, res) => {
    try {
        const { userId, tipo = 'normal', indicadoPor = null } = req.body;

        const resultado = await gestorAfiliados.criarAfiliado(userId, tipo, indicadoPor);

        res.status(201).json({
            sucesso: true,
            mensagem: 'Afiliado criado com sucesso',
            dados: resultado
        });

    } catch (error) {
        console.error('❌ Erro ao criar afiliado:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Obter dados do afiliado
router.get('/afiliados/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const afiliado = await gestorAfiliados.obterAfiliado(userId);

        res.json({
            sucesso: true,
            dados: afiliado
        });

    } catch (error) {
        console.error('❌ Erro ao obter afiliado:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// ========================================
// 2. ROTAS DE COMISSÕES
// ========================================

// Calcular comissão
router.post('/comissoes/calcular', async (req, res) => {
    try {
        const { afiliadoId, lucroOperacao, tipoOperacao = 'trading' } = req.body;

        const resultado = await gestorAfiliados.calcularComissao(afiliadoId, lucroOperacao, tipoOperacao);

        res.json({
            sucesso: true,
            dados: resultado
        });

    } catch (error) {
        console.error('❌ Erro ao calcular comissão:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Processar pagamento de comissão
router.post('/comissoes/processar', async (req, res) => {
    try {
        const { afiliadoId, valor, origem, metadata = {} } = req.body;

        const resultado = await gestorAfiliados.processarComissao(afiliadoId, valor, origem, metadata);

        res.json({
            sucesso: true,
            mensagem: 'Comissão processada com sucesso',
            dados: resultado
        });

    } catch (error) {
        console.error('❌ Erro ao processar comissão:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Obter histórico de comissões
router.get('/comissoes/:afiliadoId', async (req, res) => {
    try {
        const { afiliadoId } = req.params;

        const historico = await gestorAfiliados.obterHistoricoComissoes(afiliadoId);

        res.json({
            sucesso: true,
            dados: historico
        });

    } catch (error) {
        console.error('❌ Erro ao obter histórico:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// ========================================
// 3. ROTAS DE SAQUES
// ========================================

// Solicitar saque
router.post('/saques', async (req, res) => {
    try {
        const { afiliadoId, valor, dadosBancarios } = req.body;

        const resultado = await gestorAfiliados.solicitarSaque(afiliadoId, valor, dadosBancarios);

        res.status(201).json({
            sucesso: true,
            mensagem: 'Saque solicitado com sucesso',
            dados: resultado
        });

    } catch (error) {
        console.error('❌ Erro ao solicitar saque:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Processar saque
router.put('/saques/:saqueId/processar', async (req, res) => {
    try {
        const { saqueId } = req.params;
        const { status, observacoes } = req.body;

        const resultado = await gestorAfiliados.processarSaque(saqueId, status, observacoes);

        res.json({
            sucesso: true,
            mensagem: 'Saque processado com sucesso',
            dados: resultado
        });

    } catch (error) {
        console.error('❌ Erro ao processar saque:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// ========================================
// 4. ROTAS DE CONFIGURAÇÕES
// ========================================

// Obter configurações do sistema de afiliados
router.get('/configuracoes', (req, res) => {
    try {
        res.json({
            sucesso: true,
            configuracoes: gestorAfiliados.configuracoes
        });
    } catch (error) {
        console.error('❌ Erro ao obter configurações:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Obter tipos de afiliados disponíveis
router.get('/tipos', (req, res) => {
    try {
        const tipos = gestorAfiliados.configuracoes.niveis;

        res.json({
            sucesso: true,
            tipos: Object.keys(tipos).map(tipo => ({
                tipo,
                nome: tipos[tipo].nome,
                comissao: tipos[tipo].comissao * 100, // Converter para percentual
                descricao: tipos[tipo].descricao
            }))
        });

    } catch (error) {
        console.error('❌ Erro ao obter tipos:', error.message);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// ========================================
// 5. ROTAS DE RELATÓRIOS
// ========================================

// Relatório de performance do afiliado
router.get('/relatorio/performance/:afiliadoId', async (req, res) => {
    try {
        const { afiliadoId } = req.params;

        const relatorio = await gestorAfiliados.gerarRelatorioPerformance(afiliadoId);

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

// Status geral do sistema de afiliados
router.get('/status', (req, res) => {
    try {
        const status = gestorAfiliados.obterStatus();

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
