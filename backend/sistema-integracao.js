/**
 * 🔗 SISTEMA DE INTEGRAÇÃO FRONTEND-BACKEND
 * Garantia de integração total entre front e backend
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const MiddlewareAutenticacao = require('./middleware-autenticacao');
const GestorMedoGanancia = require('./gestor-medo-ganancia');
const ProcessadorSinaisTradingView = require('./processador-sinais-tradingview');
const GestorOperacoesAvancado = require('./gestor-operacoes-avancado');
const GestorFinanceiroAtualizado = require('./gestor-financeiro-atualizado');
const GestorAfiliadosAvancado = require('./gestor-afiliados-avancado');
const GestorFechamentoOrdens = require('./gestor-fechamento-ordens');
const SistemaLimpezaAutomatica = require('./sistema-limpeza-automatica');

console.log('🔗 SISTEMA DE INTEGRAÇÃO FRONTEND-BACKEND');
console.log('=========================================');

class SistemaIntegracao {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Inicializar componentes
        this.middlewareAuth = new MiddlewareAutenticacao();
        this.gestorMG = new GestorMedoGanancia();
        this.processadorSinais = new ProcessadorSinaisTradingView();
        this.gestorOperacoes = new GestorOperacoesAvancado();
        this.gestorFinanceiro = new GestorFinanceiroAtualizado();
        this.gestorAfiliados = new GestorAfiliadosAvancado();
        this.gestorFechamento = new GestorFechamentoOrdens();
        this.sistemaLimpeza = new SistemaLimpezaAutomatica();

        this.configurarMiddlewares();
        this.configurarRotas();
        this.configurarWebSocket();
        this.configurarTratamentoErros();
    }

    // ========================================
    // 1. CONFIGURAÇÃO DE MIDDLEWARES
    // ========================================

    configurarMiddlewares() {
        console.log('⚙️ Configurando middlewares...');

        // CORS configurado para frontend
        this.app.use(cors({
            origin: [
                'http://localhost:3001',
                'http://localhost:3000',
                'https://coinbitclub-frontend.vercel.app',
                'https://coinbitclub.com',
                process.env.FRONTEND_URL
            ].filter(Boolean),
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Parsers
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Headers de segurança
        this.app.use((req, res, next) => {
            res.header('X-Content-Type-Options', 'nosniff');
            res.header('X-Frame-Options', 'DENY');
            res.header('X-XSS-Protection', '1; mode=block');
            next();
        });

        // Log de requisições
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
            next();
        });

        console.log('✅ Middlewares configurados');
    }

    // ========================================
    // 2. CONFIGURAÇÃO DE ROTAS COMPLETA
    // ========================================

    configurarRotas() {
        console.log('🛣️ Configurando rotas...');

        // ===== ROTAS PÚBLICAS =====
        this.configurarRotasPublicas();

        // ===== ROTAS DE AUTENTICAÇÃO =====
        this.configurarRotasAuth();

        // ===== WEBHOOK TRADINGVIEW =====
        this.configurarWebhook();

        // ===== ROTAS PROTEGIDAS =====
        this.app.use('/api', this.middlewareAuth.verificarAutenticacao.bind(this.middlewareAuth));

        // ===== ROTAS DE USUÁRIO =====
        this.configurarRotasUsuario();

        // ===== ROTAS DE TRADING =====
        this.configurarRotasTrading();

        // ===== ROTAS DE AFILIADOS =====
        this.configurarRotasAfiliados();

        // ===== ROTAS ADMINISTRATIVAS =====
        this.configurarRotasAdmin();

        console.log('✅ Rotas configuradas');
    }

    configurarRotasPublicas() {
        // Health check
        this.app.get('/health', async (req, res) => {
            try {
                const client = await this.pool.connect();
                await client.query('SELECT 1');
                client.release();

                res.json({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    version: '1.0.0',
                    components: {
                        database: 'connected',
                        fear_greed: this.gestorMG ? 'active' : 'inactive',
                        trading_signals: this.processadorSinais ? 'active' : 'inactive'
                    }
                });
            } catch (error) {
                res.status(500).json({
                    status: 'unhealthy',
                    error: error.message
                });
            }
        });

        // Status do sistema
        this.app.get('/api/status', async (req, res) => {
            try {
                const fearGreed = await this.gestorMG.obterUltimoFearGreed();
                
                res.json({
                    sucesso: true,
                    sistema: {
                        status: 'operational',
                        fear_greed: fearGreed,
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });
    }

    configurarRotasAuth() {
        // Login
        this.app.post('/api/auth/login', async (req, res) => {
            try {
                const { email, password } = req.body;
                const resultado = await this.middlewareAuth.fazerLogin(email, password);
                
                res.json(resultado);
            } catch (error) {
                res.status(401).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Registro
        this.app.post('/api/auth/register', async (req, res) => {
            try {
                const resultado = await this.middlewareAuth.registrarUsuario(req.body);
                res.json(resultado);
            } catch (error) {
                res.status(400).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Recuperação de senha
        this.app.post('/api/auth/recover-password', async (req, res) => {
            try {
                const { email } = req.body;
                const resultado = await this.middlewareAuth.solicitarRecuperacaoSenha(email);
                res.json(resultado);
            } catch (error) {
                res.status(400).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Redefinir senha
        this.app.post('/api/auth/reset-password', async (req, res) => {
            try {
                const { token, newPassword } = req.body;
                const resultado = await this.middlewareAuth.redefinirSenha(token, newPassword);
                res.json(resultado);
            } catch (error) {
                res.status(400).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });
    }

    configurarWebhook() {
        // Webhook TradingView - SEM autenticação
        this.app.post('/webhook', async (req, res) => {
            try {
                const resultado = await this.processadorSinais.processarSinal(req.body);
                res.json(resultado);
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });
    }

    configurarRotasUsuario() {
        // Perfil do usuário
        this.app.get('/api/user/profile', async (req, res) => {
            try {
                const client = await this.pool.connect();
                const usuario = await client.query(
                    'SELECT id, username, email, role, subscription_plan, created_at FROM users WHERE id = $1',
                    [req.usuario.id]
                );
                client.release();

                if (usuario.rows.length === 0) {
                    return res.status(404).json({
                        sucesso: false,
                        erro: 'Usuário não encontrado'
                    });
                }

                res.json({
                    sucesso: true,
                    usuario: usuario.rows[0]
                });
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Saldos do usuário
        this.app.get('/api/user/balances', async (req, res) => {
            try {
                const saldos = await this.gestorFinanceiro.obterSaldosUsuario(req.usuario.id);
                res.json({
                    sucesso: true,
                    saldos
                });
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Configurações do usuário
        this.app.get('/api/user/settings', async (req, res) => {
            try {
                const client = await this.pool.connect();
                const config = await client.query(
                    'SELECT parameters FROM user_trading_params WHERE user_id = $1',
                    [req.usuario.id]
                );
                client.release();

                res.json({
                    sucesso: true,
                    configuracoes: config.rows[0]?.parameters || {}
                });
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });
    }

    configurarRotasTrading() {
        // Operações do usuário
        this.app.get('/api/trading/operations', async (req, res) => {
            try {
                const operacoes = await this.gestorOperacoes.obterOperacoesUsuario(req.usuario.id);
                res.json({
                    sucesso: true,
                    operacoes
                });
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Histórico de operações
        this.app.get('/api/trading/history', async (req, res) => {
            try {
                const { page = 1, limit = 20 } = req.query;
                const historico = await this.gestorOperacoes.obterHistoricoOperacoes(
                    req.usuario.id, 
                    parseInt(page), 
                    parseInt(limit)
                );
                
                res.json({
                    sucesso: true,
                    historico
                });
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Estatísticas de trading
        this.app.get('/api/trading/stats', async (req, res) => {
            try {
                const stats = await this.gestorOperacoes.obterEstatisticasUsuario(req.usuario.id);
                res.json({
                    sucesso: true,
                    estatisticas: stats
                });
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Fear & Greed atual
        this.app.get('/api/trading/fear-greed', async (req, res) => {
            try {
                const fearGreed = await this.gestorMG.obterUltimoFearGreed();
                res.json({
                    sucesso: true,
                    fear_greed: fearGreed
                });
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });
    }

    configurarRotasAfiliados() {
        // Dashboard de afiliados
        this.app.get('/api/affiliate/dashboard', async (req, res) => {
            try {
                const dashboard = await this.gestorAfiliados.obterDashboardAfiliado(req.usuario.id);
                res.json({
                    sucesso: true,
                    dashboard
                });
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Comissões do afiliado
        this.app.get('/api/affiliate/commissions', async (req, res) => {
            try {
                const comissoes = await this.gestorAfiliados.obterComissoesAfiliado(req.usuario.id);
                res.json({
                    sucesso: true,
                    comissoes
                });
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Solicitar compensação de créditos
        this.app.post('/api/affiliate/request-credit-compensation', async (req, res) => {
            try {
                const { valorComissao, motivo } = req.body;
                const resultado = await this.gestorFinanceiro.solicitarCompensacaoCredito(
                    req.usuario.id, 
                    valorComissao, 
                    motivo
                );
                
                res.json(resultado);
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });
    }

    configurarRotasAdmin() {
        // Middleware para verificar se é admin
        const verificarAdmin = (req, res, next) => {
            if (req.usuario.role !== 'admin') {
                return res.status(403).json({
                    sucesso: false,
                    erro: 'Acesso negado - apenas administradores'
                });
            }
            next();
        };

        // Relatório de sistema
        this.app.get('/api/admin/system-report', verificarAdmin, async (req, res) => {
            try {
                const relatorio = await this.gerarRelatorioSistema();
                res.json({
                    sucesso: true,
                    relatorio
                });
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Logs de limpeza
        this.app.get('/api/admin/cleanup-logs', verificarAdmin, async (req, res) => {
            try {
                const logs = await this.sistemaLimpeza.gerarRelatorioLimpeza();
                res.json({
                    sucesso: true,
                    logs
                });
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });
    }

    // ========================================
    // 3. WEBSOCKET PARA ATUALIZAÇÕES EM TEMPO REAL
    // ========================================

    configurarWebSocket() {
        const http = require('http');
        const socketIo = require('socket.io');

        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: [
                    'http://localhost:3001',
                    'http://localhost:3000',
                    'https://coinbitclub-frontend.vercel.app',
                    'https://coinbitclub.com',
                    process.env.FRONTEND_URL
                ].filter(Boolean),
                methods: ['GET', 'POST']
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`📱 Cliente conectado: ${socket.id}`);

            // Autenticar socket
            socket.on('authenticate', async (token) => {
                try {
                    const decoded = await this.middlewareAuth.validarToken(token);
                    if (decoded) {
                        socket.userId = decoded.id;
                        socket.join(`user_${decoded.id}`);
                        socket.emit('authenticated', { sucesso: true });
                        console.log(`✅ Socket autenticado para usuário: ${decoded.id}`);
                    } else {
                        socket.emit('authentication_error', { erro: 'Token inválido' });
                    }
                } catch (error) {
                    socket.emit('authentication_error', { erro: error.message });
                }
            });

            socket.on('disconnect', () => {
                console.log(`📱 Cliente desconectado: ${socket.id}`);
            });
        });

        // Configurar eventos para atualizações em tempo real
        this.configurarEventosTempoReal();

        console.log('📱 WebSocket configurado');
    }

    configurarEventosTempoReal() {
        // Atualizar Fear & Greed a cada 30 minutos
        setInterval(async () => {
            try {
                const fearGreed = await this.gestorMG.obterUltimoFearGreed();
                this.io.emit('fear_greed_update', fearGreed);
            } catch (error) {
                console.error('❌ Erro ao enviar atualização Fear & Greed:', error.message);
            }
        }, 30 * 60 * 1000);

        // Notificar sobre novas operações
        this.emitirAtualizacaoOperacao = (userId, operacao) => {
            this.io.to(`user_${userId}`).emit('operation_update', operacao);
        };

        // Notificar sobre mudanças de saldo
        this.emitirAtualizacaoSaldo = (userId, saldo) => {
            this.io.to(`user_${userId}`).emit('balance_update', saldo);
        };
    }

    // ========================================
    // 4. TRATAMENTO DE ERROS
    // ========================================

    configurarTratamentoErros() {
        // Handler para rotas não encontradas
        this.app.use('*', (req, res) => {
            res.status(404).json({
                sucesso: false,
                erro: 'Rota não encontrada',
                path: req.originalUrl
            });
        });

        // Handler global de erros
        this.app.use((error, req, res, next) => {
            console.error('❌ Erro não tratado:', error);

            // Log do erro no banco
            this.registrarErroSistema(error, req);

            res.status(500).json({
                sucesso: false,
                erro: process.env.NODE_ENV === 'production' 
                    ? 'Erro interno do servidor' 
                    : error.message
            });
        });

        console.log('🛡️ Tratamento de erros configurado');
    }

    async registrarErroSistema(error, req) {
        try {
            const client = await this.pool.connect();
            await client.query(`
                INSERT INTO system_logs (level, category, message, details, user_id, created_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `, [
                'error',
                'system_error',
                error.message,
                JSON.stringify({
                    stack: error.stack,
                    url: req.originalUrl,
                    method: req.method,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                }),
                req.usuario?.id || null
            ]);
            client.release();
        } catch (logError) {
            console.error('❌ Erro ao registrar erro no banco:', logError.message);
        }
    }

    // ========================================
    // 5. RELATÓRIOS E MONITORAMENTO
    // ========================================

    async gerarRelatorioSistema() {
        const client = await this.pool.connect();
        try {
            const [usuarios, operacoes, sinais, logs] = await Promise.all([
                client.query('SELECT COUNT(*) as total FROM users WHERE status = $1', ['active']),
                client.query('SELECT COUNT(*) as total FROM trading_operations WHERE status = $1', ['open']),
                client.query('SELECT COUNT(*) as total FROM trading_signals WHERE created_at > NOW() - INTERVAL $1', ['1 hour']),
                client.query('SELECT COUNT(*) as total FROM system_logs WHERE level = $1 AND created_at > NOW() - INTERVAL $2', ['error', '24 hours'])
            ]);

            return {
                usuarios_ativos: parseInt(usuarios.rows[0].total),
                operacoes_abertas: parseInt(operacoes.rows[0].total),
                sinais_ultima_hora: parseInt(sinais.rows[0].total),
                erros_ultimas_24h: parseInt(logs.rows[0].total),
                timestamp: new Date().toISOString()
            };

        } finally {
            client.release();
        }
    }

    // ========================================
    // 6. INICIALIZAÇÃO DO SERVIDOR
    // ========================================

    iniciar() {
        const servidor = this.server || this.app;
        
        servidor.listen(this.port, () => {
            console.log('🚀 SERVIDOR INICIADO COM SUCESSO!');
            console.log('================================');
            console.log(`📡 Servidor rodando na porta: ${this.port}`);
            console.log(`🌐 URL: http://localhost:${this.port}`);
            console.log(`📱 WebSocket: ws://localhost:${this.port}`);
            console.log(`🔗 Health Check: http://localhost:${this.port}/health`);
            console.log('');
            console.log('✅ COMPONENTES ATIVOS:');
            console.log('   🧠 Gestor Medo e Ganância');
            console.log('   📡 Processador Sinais TradingView');
            console.log('   📈 Gestor Operações Avançado');
            console.log('   💰 Gestor Financeiro');
            console.log('   🤝 Gestor Afiliados');
            console.log('   🎯 Gestor Fechamento Ordens');
            console.log('   🧹 Sistema Limpeza Automática');
            console.log('   🔐 Middleware Autenticação');
            console.log('');
            console.log('🎊 SISTEMA 100% OPERACIONAL! 🎊');
        });

        return servidor;
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const sistema = new SistemaIntegracao();
    const servidor = sistema.iniciar();

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Finalizando servidor...');
        servidor.close(() => {
            console.log('✅ Servidor finalizado');
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Finalizando servidor...');
        servidor.close(() => {
            console.log('✅ Servidor finalizado');
            process.exit(0);
        });
    });
}

module.exports = SistemaIntegracao;
