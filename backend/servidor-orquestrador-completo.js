/**
 * 🎯 SERVIDOR ORQUESTRADOR COMPLETO - COINBITCLUB IA TRADING
 * ================================================================
 * Sistema principal que conecta TODOS os componentes:
 * - Webhook TradingView
 * - Fear & Greed Integration
 * - Processamento de Sinais
 * - Abertura Automática de Operações
 * - Monitoramento IA Supervisor
 * 
 * Status: ATIVO - Todas as funcionalidades integradas
 * Versão: 1.0.0 - Produção
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');

// Importar todos os módulos necessários
const fearGreedService = require('./fear-greed-integration.js');
const processadorSinais = require('./processador-sinais-tradingview-real.js');
const gestorChaves = require('./gestor-chaves-parametrizacoes.js');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_PORT = 3001;

// ===============================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// ===============================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/trading_db',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ===============================================
// MIDDLEWARE DE SEGURANÇA
// ===============================================
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3000', 'https://*.railway.app', 'https://*.vercel.app'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===============================================
// SISTEMA DE LOG AVANÇADO
// ===============================================
const log = {
    info: (msg, data = {}) => {
        const timestamp = new Date().toLocaleString('pt-BR');
        console.log(`ℹ️ [${timestamp}] ${msg}`, data);
    },
    success: (msg, data = {}) => {
        const timestamp = new Date().toLocaleString('pt-BR');
        console.log(`✅ [${timestamp}] ${msg}`, data);
    },
    warning: (msg, data = {}) => {
        const timestamp = new Date().toLocaleString('pt-BR');
        console.log(`⚠️ [${timestamp}] ${msg}`, data);
    },
    error: (msg, error = {}) => {
        const timestamp = new Date().toLocaleString('pt-BR');
        console.error(`❌ [${timestamp}] ${msg}`, error);
    },
    trade: (msg, data = {}) => {
        const timestamp = new Date().toLocaleString('pt-BR');
        console.log(`💰 [${timestamp}] TRADE: ${msg}`, data);
    }
};

// ===============================================
// CLASSE PRINCIPAL DO ORQUESTRADOR
// ===============================================
class OrquestradorCompleto {
    constructor() {
        this.usuarios = new Map();
        this.estatisticas = {
            sinaisRecebidos: 0,
            operacoesAbertas: 0,
            operacoesFechadas: 0,
            lucroTotal: 0,
            iniciadoEm: new Date()
        };
        
        this.init();
    }

    async init() {
        try {
            log.info('🚀 Iniciando Orquestrador Completo...');
            
            // Carregar usuários ativos
            await this.carregarUsuarios();
            
            // Configurar rotas
            this.configurarRotas();
            
            // Iniciar servidor webhook
            this.iniciarServidorWebhook();
            
            log.success('🎯 Orquestrador Completo ATIVO!');
            
        } catch (error) {
            log.error('Erro ao inicializar orquestrador:', error);
        }
    }

    async carregarUsuarios() {
        try {
            const query = `
                SELECT DISTINCT 
                    u.id, u.name as nome, u.email, u.access_level as nivel_acesso,
                    k.exchange, k.api_key, k.api_secret, k.testnet,
                    COALESCE(b.balance_usd, 0) as saldo_inicial
                FROM users u
                LEFT JOIN user_api_keys k ON u.id = k.user_id
                LEFT JOIN user_balances b ON u.id = b.user_id
                WHERE u.active = true 
                AND k.active = true
                ORDER BY u.id
            `;
            
            const result = await pool.query(query);
            
            this.usuarios.clear();
            
            for (const row of result.rows) {
                if (!this.usuarios.has(row.id)) {
                    this.usuarios.set(row.id, {
                        id: row.id,
                        nome: row.nome,
                        email: row.email,
                        nivel: row.nivel_acesso,
                        chaves: [],
                        saldoInicial: parseFloat(row.saldo_inicial) || 0,
                        operacoesAtivas: 0
                    });
                }
                
                if (row.api_key) {
                    this.usuarios.get(row.id).chaves.push({
                        exchange: row.exchange,
                        apiKey: row.api_key,
                        apiSecret: row.api_secret,
                        testnet: row.testnet
                    });
                }
            }
            
            log.success(`👥 Carregados ${this.usuarios.size} usuários ativos`);
            
        } catch (error) {
            log.error('Erro ao carregar usuários:', error);
        }
    }

    configurarRotas() {
        // ===============================================
        // WEBHOOK TRADINGVIEW - PRINCIPAL
        // ===============================================
        app.post('/webhook/tradingview', async (req, res) => {
            try {
                const sinal = req.body;
                this.estatisticas.sinaisRecebidos++;
                
                log.trade('🔔 SINAL RECEBIDO', {
                    tipo: sinal.action,
                    par: sinal.ticker,
                    preco: sinal.price,
                    timestamp: new Date().toISOString()
                });

                // PROCESSAR SINAL PARA TODOS OS USUÁRIOS ATIVOS
                await this.processarSinalTodos(sinal);

                res.status(200).json({
                    success: true,
                    message: 'Sinal processado com sucesso',
                    timestamp: new Date().toISOString(),
                    estatisticas: this.estatisticas
                });

            } catch (error) {
                log.error('Erro no webhook TradingView:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // ===============================================
        // API STATUS E MONITORAMENTO
        // ===============================================
        app.get('/status', async (req, res) => {
            try {
                const fearGreedAtual = await fearGreedService.obterIndice();
                
                res.json({
                    status: 'ATIVO',
                    orquestrador: 'ONLINE',
                    usuarios: this.usuarios.size,
                    fearGreed: fearGreedAtual,
                    estatisticas: this.estatisticas,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                res.status(500).json({
                    status: 'ERRO',
                    error: error.message
                });
            }
        });

        // ===============================================
        // API DASHBOARD
        // ===============================================
        app.get('/api/dashboard/:usuario', async (req, res) => {
            try {
                const usuario = req.params.usuario.toLowerCase();
                
                // Buscar dados do usuário
                const userData = await this.obterDadosUsuario(usuario);
                
                res.json(userData);
                
            } catch (error) {
                log.error(`Erro ao buscar dados do usuário ${req.params.usuario}:`, error);
                res.status(500).json({
                    error: 'Erro interno do servidor'
                });
            }
        });

        // ===============================================
        // API OPERAÇÕES ATIVAS
        // ===============================================
        app.get('/api/operacoes/:usuario', async (req, res) => {
            try {
                const usuario = req.params.usuario.toLowerCase();
                
                const query = `
                    SELECT 
                        o.*,
                        u.nome as usuario_nome,
                        EXTRACT(EPOCH FROM (NOW() - o.data_abertura))/60 as duracao_minutos
                    FROM operacoes o
                    JOIN usuarios u ON o.usuario_id = u.id
                    WHERE LOWER(u.nome) LIKE $1
                    AND o.status = 'ativa'
                    ORDER BY o.data_abertura DESC
                `;
                
                const result = await pool.query(query, [`%${usuario}%`]);
                
                res.json({
                    success: true,
                    operacoes: result.rows,
                    total: result.rows.length
                });
                
            } catch (error) {
                log.error(`Erro ao buscar operações do usuário ${req.params.usuario}:`, error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    async processarSinalTodos(sinal) {
        try {
            log.info(`🔄 Processando sinal para ${this.usuarios.size} usuários...`);
            
            for (const [userId, userData] of this.usuarios) {
                try {
                    await this.processarSinalUsuario(sinal, userData);
                } catch (error) {
                    log.error(`Erro ao processar sinal para usuário ${userData.nome}:`, error);
                }
            }
            
        } catch (error) {
            log.error('Erro ao processar sinal para todos usuários:', error);
        }
    }

    async processarSinalUsuario(sinal, userData) {
        try {
            // 1. VERIFICAR FEAR & GREED
            const fearGreed = await fearGreedService.obterIndice();
            const direcaoPermitida = fearGreedService.validarDirecao(sinal.action, fearGreed.valor);
            
            if (!direcaoPermitida) {
                log.warning(`❌ Sinal rejeitado para ${userData.nome} - Fear & Greed: ${fearGreed.valor}`);
                return;
            }

            // 2. PROCESSAR SINAL
            const resultado = await processadorSinais.processarSinal({
                sinal,
                usuario: userData,
                fearGred: fearGreed
            });

            if (resultado.success) {
                this.estatisticas.operacoesAbertas++;
                userData.operacoesAtivas++;
                
                log.trade(`✅ Operação aberta para ${userData.nome}`, {
                    tipo: sinal.action,
                    par: sinal.ticker,
                    valor: resultado.valor
                });
            }

        } catch (error) {
            log.error(`Erro ao processar sinal para ${userData.nome}:`, error);
        }
    }

    async obterDadosUsuario(nomeUsuario) {
        try {
            // Buscar dados básicos do usuário
            const queryUsuario = `
                SELECT 
                    u.id, u.nome, u.email, u.nivel_acesso, u.data_cadastro,
                    COALESCE(b.saldo_usd, 0) as saldo_atual
                FROM usuarios u
                LEFT JOIN balances b ON u.id = b.usuario_id
                WHERE LOWER(u.nome) LIKE $1
                LIMIT 1
            `;
            
            const resultUsuario = await pool.query(queryUsuario, [`%${nomeUsuario}%`]);
            
            if (resultUsuario.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            }
            
            const usuario = resultUsuario.rows[0];
            
            // Buscar operações ativas
            const queryOperacoes = `
                SELECT 
                    o.*,
                    EXTRACT(EPOCH FROM (NOW() - o.data_abertura))/60 as duracao_minutos
                FROM operacoes o
                WHERE o.usuario_id = $1 AND o.status = 'ativa'
                ORDER BY o.data_abertura DESC
            `;
            
            const resultOperacoes = await pool.query(queryOperacoes, [usuario.id]);
            
            // Calcular estatísticas
            let plTotal = 0;
            let plPercentualTotal = 0;
            
            for (const op of resultOperacoes.rows) {
                if (op.pl_atual) {
                    plTotal += parseFloat(op.pl_atual);
                }
                if (op.pl_percentual) {
                    plPercentualTotal += parseFloat(op.pl_percentual);
                }
            }
            
            return {
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    nivel: usuario.nivel_acesso,
                    cadastro: usuario.data_cadastro
                },
                saldo: {
                    atual: parseFloat(usuario.saldo_atual),
                    moeda: 'USD'
                },
                operacoes: {
                    ativas: resultOperacoes.rows,
                    total: resultOperacoes.rows.length
                },
                desempenho: {
                    plTotal: plTotal,
                    plPercentual: plPercentualTotal,
                    plMedio: resultOperacoes.rows.length > 0 ? plPercentualTotal / resultOperacoes.rows.length : 0
                },
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            throw error;
        }
    }

    iniciarServidorWebhook() {
        // Servidor principal
        app.listen(PORT, () => {
            log.success(`🌐 Servidor Principal rodando na porta ${PORT}`);
        });

        // Webhook dedicado (se necessário)
        if (WEBHOOK_PORT !== PORT) {
            const webhookApp = express();
            webhookApp.use(express.json());
            
            webhookApp.post('/webhook', app._router.stack.find(layer => 
                layer.route && layer.route.path === '/webhook/tradingview'
            ).route.stack[0].handle);
            
            webhookApp.listen(WEBHOOK_PORT, () => {
                log.success(`🔔 Servidor Webhook rodando na porta ${WEBHOOK_PORT}`);
            });
        }
    }
}

// ===============================================
// INICIALIZAÇÃO DO SISTEMA
// ===============================================
console.log(`
🚀 COINBITCLUB IA TRADING ORQUESTRADOR
======================================
🎯 Sistema Completo de Trading Automatizado
📡 Integração TradingView + Fear & Greed
🤖 IA Supervisor em Tempo Real
💰 Multi-usuário + Multi-exchange

Iniciando em ${new Date().toLocaleString('pt-BR')}...
`);

// Instanciar orquestrador
const orquestrador = new OrquestradorCompleto();

// Tratamento de erros globais
process.on('uncaughtException', (error) => {
    log.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    log.error('Promise rejeitada não tratada:', { reason, promise });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    log.info('🛑 Recebido SIGTERM, fechando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    log.info('🛑 Recebido SIGINT, fechando servidor...');
    process.exit(0);
});

module.exports = orquestrador;
