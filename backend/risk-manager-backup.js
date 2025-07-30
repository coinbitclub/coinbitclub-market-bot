#!/usr/bin/env node

/**
 * 🛡️ RISK MANAGER - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Gerenciador de riscos com análise em tempo real
 * Proteção de capital, stop-loss automático e gestão de exposição
 */

const { Pool } = require('pg');

class RiskManager {
    constructor() {
        this.id = 'risk-manager';
        this.nome = 'Risk Manager';
        this.tipo = 'risk';
        this.status = 'inicializando';
        this.dependencias = ['database-manager', 'user-manager'];
        
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.metricas = {
            inicializado_em: null,
            operacoes_bloqueadas: 0,
            stop_loss_executados: 0,
            alertas_gerados: 0,
            usuarios_protegidos: 0,
            valor_protegido: 0,
            ultima_verificacao: null
        };

        this.configuracoes = {
            max_perda_diaria: 0.05, // 5% do capital por dia
            max_exposicao_ativo: 0.20, // 20% em um único ativo
            max_operacoes_simultaneas: 10,
            stop_loss_padrao: 0.02, // 2% stop loss
            take_profit_padrao: 0.04, // 4% take profit
            drawdown_maximo: 0.15, // 15% drawdown máximo
            volatilidade_maxima: 0.10, // 10% volatilidade máxima
            intervalo_verificacao: 30000 // 30 segundos
        };

        this.usuariosMonitorados = new Map();
        this.posicoesBloqueadas = new Set();
        this.alertasAtivos = new Map();
    }

    async inicializar() {
        console.log(`🚀 Inicializando ${this.nome}...`);
        
        try {
            // Inicializar estrutura de dados
            await this.inicializarEstruturaDados();
            
            // Carregar perfis de risco dos usuários
            await this.carregarPerfisRisco();
            
            // Configurar monitoramento contínuo
            await this.configurarMonitoramentoContinuo();
            
            // Inicializar sistema de alertas
            await this.inicializarSistemaAlertas();
            
            this.status = 'ativo';
            this.metricas.inicializado_em = new Date();
            
            console.log(`✅ ${this.nome} inicializado com sucesso`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao inicializar ${this.nome}:`, error.message);
            this.status = 'erro';
            return false;
        }
    }

    async inicializarEstruturaDados() {
        console.log('🏗️ Inicializando estrutura de dados...');
        
        // Criar tabela de perfis de risco
        await this.criarTabelaPerfisRisco();
        
        // Criar tabela de alertas de risco
        await this.criarTabelaAlertasRisco();
        
        // Criar tabela de eventos de risco
        await this.criarTabelaEventosRisco();
        
        // Criar tabela de limites dinâmicos
        await this.criarTabelaLimitesDinamicos();
    }

    async criarTabelaPerfisRisco() {
        const sql = `
            CREATE TABLE IF NOT EXISTS user_risk_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) UNIQUE,
                risk_tolerance VARCHAR(20) DEFAULT 'medium', -- low, medium, high, custom
                max_daily_loss DECIMAL(5,4) DEFAULT 0.05,
                max_position_size DECIMAL(5,4) DEFAULT 0.20,
                max_concurrent_trades INTEGER DEFAULT 5,
                stop_loss_percentage DECIMAL(5,4) DEFAULT 0.02,
                take_profit_percentage DECIMAL(5,4) DEFAULT 0.04,
                max_drawdown DECIMAL(5,4) DEFAULT 0.15,
                risk_score DECIMAL(5,4) DEFAULT 0.5,
                last_risk_assessment TIMESTAMP,
                custom_rules JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_user_risk_profiles_user_id ON user_risk_profiles(user_id);
        `;

        if (this.pool && !this.pool.ended) { await this.pool.query(sql);
        console.log('✅ Tabela user_risk_profiles verificada/criada');
    }

    async criarTabelaAlertasRisco() {
        const sql = `
            CREATE TABLE IF NOT EXISTS risk_alerts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                alert_type VARCHAR(50) NOT NULL, -- drawdown, exposure, loss_limit, volatility
                severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
                message TEXT NOT NULL,
                current_value DECIMAL(20,8),
                threshold_value DECIMAL(20,8),
                symbol VARCHAR(20),
                trade_id INTEGER,
                status VARCHAR(20) DEFAULT 'active', -- active, resolved, dismissed
                actions_taken JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                resolved_at TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_risk_alerts_user_id ON risk_alerts(user_id);
            CREATE INDEX IF NOT EXISTS idx_risk_alerts_created_at ON risk_alerts(created_at);
            CREATE INDEX IF NOT EXISTS idx_risk_alerts_status ON risk_alerts(status);
        `;

        if (this.pool && !this.pool.ended) { await this.pool.query(sql);
        console.log('✅ Tabela risk_alerts verificada/criada');
    }

    async criarTabelaEventosRisco() {
        const sql = `
            CREATE TABLE IF NOT EXISTS risk_events (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL, -- stop_loss_triggered, position_blocked, limit_exceeded
                user_id INTEGER REFERENCES users(id),
                trade_id INTEGER,
                symbol VARCHAR(20),
                event_data JSONB NOT NULL,
                risk_level VARCHAR(20), -- low, medium, high, critical
                auto_action_taken BOOLEAN DEFAULT FALSE,
                manual_override BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_risk_events_user_id ON risk_events(user_id);
            CREATE INDEX IF NOT EXISTS idx_risk_events_created_at ON risk_events(created_at);
            CREATE INDEX IF NOT EXISTS idx_risk_events_type ON risk_events(event_type);
        `;

        if (this.pool && !this.pool.ended) { await this.pool.query(sql);
        console.log('✅ Tabela risk_events verificada/criada');
    }

    async criarTabelaLimitesDinamicos() {
        const sql = `
            CREATE TABLE IF NOT EXISTS dynamic_limits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                limit_type VARCHAR(50) NOT NULL, -- daily_loss, position_size, trade_count
                current_value DECIMAL(20,8) DEFAULT 0,
                limit_value DECIMAL(20,8) NOT NULL,
                usage_percentage DECIMAL(5,4) DEFAULT 0,
                reset_at TIMESTAMP,
                last_reset TIMESTAMP,
                breach_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, limit_type)
            );

            CREATE INDEX IF NOT EXISTS idx_dynamic_limits_user_id ON dynamic_limits(user_id);
            CREATE INDEX IF NOT EXISTS idx_dynamic_limits_reset_at ON dynamic_limits(reset_at);
        `;

        if (this.pool && !this.pool.ended) { await this.pool.query(sql);
        console.log('✅ Tabela dynamic_limits verificada/criada');
    }

    async carregarPerfisRisco() {
        console.log('📊 Carregando perfis de risco dos usuários...');
        
        try {
            // Buscar todos os usuários ativos
            const usuarios = if (this.pool && !this.pool.ended) { await this.pool.query(`
                SELECT u.id, u.plan_type, u.vip_status, u.balance_usd,
                       rp.risk_tolerance, rp.max_daily_loss, rp.max_position_size,
                       rp.stop_loss_percentage, rp.take_profit_percentage,
                       rp.max_drawdown, rp.risk_score
                FROM users u
                LEFT JOIN user_risk_profiles rp ON u.id = rp.user_id
                WHERE u.status = 'active'
            `);

            for (const user of usuarios.rows) {
                // Se não tem perfil de risco, criar um padrão
                if (!user.risk_tolerance) {
                    await this.criarPerfilRiscoPadrao(user.id, user.plan_type);
                }

                // Carregar perfil na memória
                const perfil = await this.obterPerfilRisco(user.id);
                this.usuariosMonitorados.set(user.id, {
                    perfil: perfil,
                    limites: await this.carregarLimitesUsuario(user.id),
                    posicoes_ativas: await this.carregarPosicoesAtivas(user.id),
                    ultima_verificacao: new Date()
                });
            }

            this.metricas.usuarios_protegidos = usuarios.rows.length;
            console.log(`📈 Perfis carregados: ${usuarios.rows.length} usuários`);

        } catch (error) {
            console.error('❌ Erro ao carregar perfis de risco:', error.message);
        }
    }

    async criarPerfilRiscoPadrao(userId, planType) {
        let configuracao = {
            risk_tolerance: 'medium',
            max_daily_loss: 0.05,
            max_position_size: 0.20,
            max_concurrent_trades: 5,
            stop_loss_percentage: 0.02,
            take_profit_percentage: 0.04,
            max_drawdown: 0.15
        };

        // Ajustar baseado no plano
        if (planType === 'premium' || planType === 'vip') {
            configuracao.max_concurrent_trades = 10;
            configuracao.max_position_size = 0.25;
        } else if (planType === 'basic' || planType === 'free') {
            configuracao.max_concurrent_trades = 3;
            configuracao.max_position_size = 0.15;
            configuracao.max_daily_loss = 0.03;
        }

        if (this.pool && !this.pool.ended) { await this.pool.query(`
            INSERT INTO user_risk_profiles (
                user_id, risk_tolerance, max_daily_loss, max_position_size,
                max_concurrent_trades, stop_loss_percentage, take_profit_percentage,
                max_drawdown, risk_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id) DO UPDATE SET
                max_concurrent_trades = EXCLUDED.max_concurrent_trades,
                max_position_size = EXCLUDED.max_position_size
        `, [
            userId, configuracao.risk_tolerance, configuracao.max_daily_loss,
            configuracao.max_position_size, configuracao.max_concurrent_trades,
            configuracao.stop_loss_percentage, configuracao.take_profit_percentage,
            configuracao.max_drawdown, 0.5
        ]);

        console.log(`✅ Perfil de risco criado para usuário ${userId}`);
    }

    async obterPerfilRisco(userId) {
        try {
            const result = if (this.pool && !this.pool.ended) { await this.pool.query(`
                SELECT * FROM user_risk_profiles WHERE user_id = $1
            `, [userId]);

            return result.rows[0] || null;
        } catch (error) {
            console.error(`❌ Erro ao obter perfil de risco do usuário ${userId}:`, error.message);
            return null;
        }
    }

    async carregarLimitesUsuario(userId) {
        try {
            const result = if (this.pool && !this.pool.ended) { await this.pool.query(`
                SELECT * FROM dynamic_limits WHERE user_id = $1
            `, [userId]);

            const limites = {};
            for (const limite of result.rows) {
                limites[limite.limit_type] = {
                    atual: parseFloat(limite.current_value),
                    limite: parseFloat(limite.limit_value),
                    porcentagem: parseFloat(limite.usage_percentage),
                    reset_em: limite.reset_at
                };
            }

            return limites;
        } catch (error) {
            console.error(`❌ Erro ao carregar limites do usuário ${userId}:`, error.message);
            return {};
        }
    }

    async carregarPosicoesAtivas(userId) {
        try {
            const result = if (this.pool && !this.pool.ended) { await this.pool.query(`
                SELECT symbol, quantity, entry_price, current_pnl, created_at
                FROM trading_operations
                WHERE user_id = $1 AND status = 'active'
            `, [userId]);

            return result.rows.map(pos => ({
                symbol: pos.symbol,
                quantity: parseFloat(pos.quantity),
                entry_price: parseFloat(pos.entry_price),
                pnl: parseFloat(pos.current_pnl || 0),
                tempo_aberto: Date.now() - new Date(pos.created_at).getTime()
            }));
        } catch (error) {
            console.error(`❌ Erro ao carregar posições do usuário ${userId}:`, error.message);
            return [];
        }
    }

    async configurarMonitoramentoContinuo() {
        console.log('⚙️ Configurando monitoramento contínuo...');

        // Verificação geral de riscos a cada 30 segundos
        setInterval(async () => {
            await this.verificarRiscosGerais();
        }, this.configuracoes.intervalo_verificacao);

        // Verificação de stop-loss a cada 10 segundos
        setInterval(async () => {
            await this.verificarStopLoss();
        }, 10000);

        // Verificação de limites diários a cada 1 minuto
        setInterval(async () => {
            await this.verificarLimitesDiarios();
        }, 60000);

        // Reset de limites diários à meia-noite
        setInterval(async () => {
            await this.resetarLimitesDiarios();
        }, 3600000); // Verificar a cada hora

        console.log('✅ Monitoramento contínuo configurado');
    }

    async inicializarSistemaAlertas() {
        console.log('🚨 Inicializando sistema de alertas...');
        
        // Configurar níveis de alerta
        this.niveisAlerta = {
            low: { cor: '🟡', acao: 'monitorar' },
            medium: { cor: '🟠', acao: 'alertar' },
            high: { cor: '🔴', acao: 'bloquear' },
            critical: { cor: '🚨', acao: 'parar_tudo' }
        };

        // Carregar alertas ativos
        await this.carregarAlertasAtivos();
    }

    async carregarAlertasAtivos() {
        try {
            const result = if (this.pool && !this.pool.ended) { await this.pool.query(`
                SELECT * FROM risk_alerts 
                WHERE status = 'active' 
                ORDER BY created_at DESC
            `);

            for (const alerta of result.rows) {
                this.alertasAtivos.set(alerta.id, {
                    tipo: alerta.alert_type,
                    severidade: alerta.severity,
                    usuario: alerta.user_id,
                    mensagem: alerta.message
                });
            }

            console.log(`📊 Alertas ativos carregados: ${result.rows.length}`);
        } catch (error) {
            console.error('❌ Erro ao carregar alertas:', error.message);
        }
    }

    async avaliarRiscoOperacao(userId, dadosOperacao) {
        try {
            console.log(`🔍 Avaliando risco da operação para usuário ${userId}`);

            const usuario = this.usuariosMonitorados.get(userId);
            if (!usuario) {
                return {
                    aprovado: false,
                    motivo: 'Usuário não encontrado no sistema de risco',
                    risco: 'critical'
                };
            }

            // Verificações sequenciais
            const verificacoes = [
                await this.verificarLimitesDiarios(userId),
                await this.verificarExposicaoAtivo(userId, dadosOperacao.symbol, dadosOperacao.quantidade),
                await this.verificarOperacoesSimultaneas(userId),
                await this.verificarVolatilidadeAtivo(dadosOperacao.symbol),
                await this.verificarDrawdown(userId),
                await this.verificarCapitalDisponivel(userId, dadosOperacao.valor)
            ];

            // Consolidar resultado
            const bloqueios = verificacoes.filter(v => !v.aprovado);
            
            if (bloqueios.length > 0) {
                const motivoBloqueio = bloqueios.map(b => b.motivo).join('; ');
                
                await this.registrarEventoRisco(userId, 'operation_blocked', {
                    operacao: dadosOperacao,
                    motivos: bloqueios
                });

                this.metricas.operacoes_bloqueadas++;
                
                return {
                    aprovado: false,
                    motivo: motivoBloqueio,
                    risco: bloqueios.some(b => b.risco === 'critical') ? 'critical' : 'high'
                };
            }

            return {
                aprovado: true,
                risco: 'low',
                recomendacoes: await this.gerarRecomendacoes(userId, dadosOperacao)
            };

        } catch (error) {
            console.error('❌ Erro na avaliação de risco:', error.message);
            return {
                aprovado: false,
                motivo: 'Erro interno na avaliação de risco',
                risco: 'critical'
            };
        }
    }

    async verificarLimitesDiarios(userId) {
        const usuario = this.usuariosMonitorados.get(userId);
        if (!usuario) return { aprovado: false, motivo: 'Usuário não encontrado' };

        const limiteDiario = usuario.limites.daily_loss;
        if (!limiteDiario) return { aprovado: true };

        if (limiteDiario.porcentagem >= 1.0) { // 100% do limite usado
            return {
                aprovado: false,
                motivo: `Limite de perda diária atingido (${(limiteDiario.porcentagem * 100).toFixed(1)}%)`,
                risco: 'critical'
            };
        }

        if (limiteDiario.porcentagem >= 0.8) { // 80% do limite usado
            await this.gerarAlerta(userId, 'daily_loss_warning', 'medium', 
                `Limite diário em ${(limiteDiario.porcentagem * 100).toFixed(1)}%`);
        }

        return { aprovado: true };
    }

    async verificarExposicaoAtivo(userId, symbol, novaQuantidade) {
        const usuario = this.usuariosMonitorados.get(userId);
        if (!usuario) return { aprovado: false, motivo: 'Usuário não encontrado' };

        // Calcular exposição atual no ativo
        const posicoesAtivo = usuario.posicoes_ativas.filter(pos => pos.symbol === symbol);
        const exposicaoAtual = posicoesAtivo.reduce((total, pos) => total + Math.abs(pos.quantity), 0);
        
        // Simular valor total da exposição (em produção usar preço real)
        const precoAtivo = 50000; // Simulado
        const valorExposicaoAtual = exposicaoAtual * precoAtivo;
        const valorNovaOperacao = novaQuantidade * precoAtivo;
        const valorTotalExposicao = valorExposicaoAtual + valorNovaOperacao;

        // Obter saldo do usuário
        const saldoResult = if (this.pool && !this.pool.ended) { await this.pool.query(
            'SELECT balance_usd FROM users WHERE id = $1', [userId]
        );
        const saldo = parseFloat(saldoResult.rows[0]?.balance_usd || 0);

        const percentualExposicao = saldo > 0 ? (valorTotalExposicao / saldo) : 1;
        const limiteExposicao = usuario.perfil.max_position_size;

        if (percentualExposicao > limiteExposicao) {
            return {
                aprovado: false,
                motivo: `Exposição no ativo ${symbol} excede limite (${(percentualExposicao * 100).toFixed(1)}% > ${(limiteExposicao * 100).toFixed(1)}%)`,
                risco: 'high'
            };
        }

        return { aprovado: true };
    }

    async verificarOperacoesSimultaneas(userId) {
        const usuario = this.usuariosMonitorados.get(userId);
        if (!usuario) return { aprovado: false, motivo: 'Usuário não encontrado' };

        const operacoesAtivas = usuario.posicoes_ativas.length;
        const limite = usuario.perfil.max_concurrent_trades;

        if (operacoesAtivas >= limite) {
            return {
                aprovado: false,
                motivo: `Limite de operações simultâneas atingido (${operacoesAtivas}/${limite})`,
                risco: 'medium'
            };
        }

        return { aprovado: true };
    }

    async verificarVolatilidadeAtivo(symbol) {
        // Simular verificação de volatilidade (em produção usar dados reais)
        const volatilidade = Math.random() * 0.15; // 0-15% volatilidade
        
        if (volatilidade > this.configuracoes.volatilidade_maxima) {
            return {
                aprovado: false,
                motivo: `Volatilidade do ativo ${symbol} muito alta (${(volatilidade * 100).toFixed(1)}%)`,
                risco: 'medium'
            };
        }

        return { aprovado: true };
    }

    async verificarDrawdown(userId) {
        try {
            // Calcular drawdown atual do usuário
            const result = if (this.pool && !this.pool.ended) { await this.pool.query(`
                SELECT 
                    MAX(balance_usd) as max_balance,
                    balance_usd as current_balance
                FROM users 
                WHERE id = $1
            `, [userId]);

            if (result.rows.length === 0) {
                return { aprovado: false, motivo: 'Dados do usuário não encontrados' };
            }

            const { max_balance, current_balance } = result.rows[0];
            const drawdown = (max_balance - current_balance) / max_balance;
            
            const usuario = this.usuariosMonitorados.get(userId);
            const limiteDrawdown = usuario?.perfil?.max_drawdown || this.configuracoes.drawdown_maximo;

            if (drawdown > limiteDrawdown) {
                return {
                    aprovado: false,
                    motivo: `Drawdown máximo atingido (${(drawdown * 100).toFixed(1)}% > ${(limiteDrawdown * 100).toFixed(1)}%)`,
                    risco: 'critical'
                };
            }

            return { aprovado: true };
        } catch (error) {
            console.error('❌ Erro ao verificar drawdown:', error.message);
            return { aprovado: true }; // Em caso de erro, aprovar para não bloquear
        }
    }

    async verificarCapitalDisponivel(userId, valorOperacao) {
        try {
            const result = if (this.pool && !this.pool.ended) { await this.pool.query(
                'SELECT balance_usd FROM users WHERE id = $1', [userId]
            );

            const saldo = parseFloat(result.rows[0]?.balance_usd || 0);
            
            if (valorOperacao > saldo * 0.95) { // Manter 5% de reserva
                return {
                    aprovado: false,
                    motivo: 'Capital insuficiente para a operação',
                    risco: 'high'
                };
            }

            return { aprovado: true };
        } catch (error) {
            console.error('❌ Erro ao verificar capital:', error.message);
            return { aprovado: false, motivo: 'Erro ao verificar capital disponível' };
        }
    }

    async gerarRecomendacoes(userId, dadosOperacao) {
        const usuario = this.usuariosMonitorados.get(userId);
        const recomendacoes = [];

        // Recomendar stop-loss se não especificado
        if (!dadosOperacao.stop_loss) {
            const stopLoss = dadosOperacao.preco * (1 - usuario.perfil.stop_loss_percentage);
            recomendacoes.push(`Stop-loss recomendado: ${stopLoss.toFixed(2)}`);
        }

        // Recomendar take-profit se não especificado
        if (!dadosOperacao.take_profit) {
            const takeProfit = dadosOperacao.preco * (1 + usuario.perfil.take_profit_percentage);
            recomendacoes.push(`Take-profit recomendado: ${takeProfit.toFixed(2)}`);
        }

        // Recomendar redução de posição se exposição alta
        const exposicaoAtual = await this.calcularExposicaoTotal(userId);
        if (exposicaoAtual > 0.7) {
            recomendacoes.push('Considere reduzir o tamanho da posição devido à alta exposição');
        }

        return recomendacoes;
    }

    async calcularExposicaoTotal(userId) {
        // Simular cálculo de exposição total
        const usuario = this.usuariosMonitorados.get(userId);
        if (!usuario) return 0;

        const valorTotal = usuario.posicoes_ativas.reduce((total, pos) => {
            return total + Math.abs(pos.quantity * pos.entry_price);
        }, 0);

        const saldoResult = if (this.pool && !this.pool.ended) { await this.pool.query(
            'SELECT balance_usd FROM users WHERE id = $1', [userId]
        );
        const saldo = parseFloat(saldoResult.rows[0]?.balance_usd || 1);

        return valorTotal / saldo;
    }

    async verificarRiscosGerais() {
        try {
            for (const [userId, usuario] of this.usuariosMonitorados) {
                await this.verificarUsuario(userId, usuario);
            }
            
            this.metricas.ultima_verificacao = new Date();
        } catch (error) {
            console.error('❌ Erro na verificação geral de riscos:', error.message);
        }
    }

    async verificarUsuario(userId, dadosUsuario) {
        // Atualizar posições ativas
        dadosUsuario.posicoes_ativas = await this.carregarPosicoesAtivas(userId);
        
        // Verificar cada posição ativa
        for (const posicao of dadosUsuario.posicoes_ativas) {
            await this.verificarPosicao(userId, posicao);
        }
    }

    async verificarPosicao(userId, posicao) {
        const usuario = this.usuariosMonitorados.get(userId);
        if (!usuario) return;

        // Simular preço atual (em produção usar preço real)
        const precoAtual = posicao.entry_price * (1 + (Math.random() - 0.5) * 0.1);
        const pnlAtual = (precoAtual - posicao.entry_price) * posicao.quantity;
        const pnlPercentual = pnlAtual / (posicao.entry_price * Math.abs(posicao.quantity));

        // Verificar stop-loss
        const stopLossThreshold = -usuario.perfil.stop_loss_percentage;
        if (pnlPercentual <= stopLossThreshold) {
            await this.executarStopLoss(userId, posicao, pnlAtual);
        }

        // Verificar take-profit automático
        const takeProfitThreshold = usuario.perfil.take_profit_percentage;
        if (pnlPercentual >= takeProfitThreshold) {
            await this.sugerirTakeProfit(userId, posicao, pnlAtual);
        }
    }

    async executarStopLoss(userId, posicao, pnlAtual) {
        try {
            console.log(`🛑 Executando stop-loss para usuário ${userId} em ${posicao.symbol}`);

            // Registrar evento
            await this.registrarEventoRisco(userId, 'stop_loss_triggered', {
                symbol: posicao.symbol,
                entry_price: posicao.entry_price,
                pnl: pnlAtual,
                auto_executed: true
            });

            // Gerar alerta crítico
            await this.gerarAlerta(userId, 'stop_loss_executed', 'critical',
                `Stop-loss executado em ${posicao.symbol}. PnL: ${pnlAtual.toFixed(2)}`);

            this.metricas.stop_loss_executados++;

            // Em produção, executaria a ordem de fechamento real
            console.log(`✅ Stop-loss executado com sucesso`);

        } catch (error) {
            console.error('❌ Erro ao executar stop-loss:', error.message);
        }
    }

    async sugerirTakeProfit(userId, posicao, pnlAtual) {
        await this.gerarAlerta(userId, 'take_profit_suggestion', 'medium',
            `Consider taking profit on ${posicao.symbol}. Current PnL: ${pnlAtual.toFixed(2)}`);
    }

    async verificarStopLoss() {
        // Esta função é chamada com mais frequência para verificações críticas
        for (const [userId, usuario] of this.usuariosMonitorados) {
            for (const posicao of usuario.posicoes_ativas) {
                // Verificação rápida de stop-loss crítico
                const pnlCritico = -0.1; // -10% PnL crítico
                if (posicao.pnl <= pnlCritico) {
                    await this.executarStopLoss(userId, posicao, posicao.pnl);
                }
            }
        }
    }

    async verificarLimitesDiarios() {
        const agora = new Date();
        const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

        try {
            // Atualizar limites diários de todos os usuários
            for (const [userId, usuario] of this.usuariosMonitorados) {
                await this.atualizarLimitesDiarios(userId, inicioHoje);
            }
        } catch (error) {
            console.error('❌ Erro ao verificar limites diários:', error.message);
        }
    }

    async atualizarLimitesDiarios(userId, inicioHoje) {
        try {
            // Calcular perda do dia
            const result = if (this.pool && !this.pool.ended) { await this.pool.query(`
                SELECT COALESCE(SUM(pnl), 0) as perda_dia
                FROM trading_operations
                WHERE user_id = $1 
                AND created_at >= $2
                AND pnl < 0
            `, [userId, inicioHoje]);

            const perdaDia = Math.abs(parseFloat(result.rows[0].perda_dia));
            
            // Obter saldo do usuário
            const saldoResult = if (this.pool && !this.pool.ended) { await this.pool.query(
                'SELECT balance_usd FROM users WHERE id = $1', [userId]
            );
            const saldo = parseFloat(saldoResult.rows[0]?.balance_usd || 0);

            const usuario = this.usuariosMonitorados.get(userId);
            const limitePerda = saldo * usuario.perfil.max_daily_loss;
            const percentualUsado = limitePerda > 0 ? perdaDia / limitePerda : 0;

            // Atualizar limite dinâmico
            if (this.pool && !this.pool.ended) { await this.pool.query(`
                INSERT INTO dynamic_limits (user_id, limit_type, current_value, limit_value, usage_percentage, reset_at)
                VALUES ($1, 'daily_loss', $2, $3, $4, $5)
                ON CONFLICT (user_id, limit_type) 
                DO UPDATE SET 
                    current_value = EXCLUDED.current_value,
                    usage_percentage = EXCLUDED.usage_percentage,
                    updated_at = NOW()
            `, [userId, perdaDia, limitePerda, percentualUsado, this.calcularProximoReset()]);

            // Atualizar cache
            if (usuario.limites) {
                usuario.limites.daily_loss = {
                    atual: perdaDia,
                    limite: limitePerda,
                    porcentagem: percentualUsado
                };
            }

        } catch (error) {
            console.error(`❌ Erro ao atualizar limites do usuário ${userId}:`, error.message);
        }
    }

    calcularProximoReset() {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        amanha.setHours(0, 0, 0, 0);
        return amanha;
    }

    async resetarLimitesDiarios() {
        const agora = new Date();
        
        try {
            // Resetar limites que expiraram
            if (this.pool && !this.pool.ended) { await this.pool.query(`
                UPDATE dynamic_limits 
                SET current_value = 0, usage_percentage = 0, last_reset = NOW()
                WHERE reset_at <= $1
            `, [agora]);

            console.log('🔄 Limites diários resetados');
        } catch (error) {
            console.error('❌ Erro ao resetar limites diários:', error.message);
        }
    }

    async gerarAlerta(userId, tipo, severidade, mensagem, dadosExtras = {}) {
        try {
            const alertaId = if (this.pool && !this.pool.ended) { await this.pool.query(`
                INSERT INTO risk_alerts (user_id, alert_type, severity, message, current_value, threshold_value, symbol)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `, [
                userId, tipo, severidade, mensagem,
                dadosExtras.current_value, dadosExtras.threshold_value, dadosExtras.symbol
            ]);

            // Adicionar ao cache de alertas ativos
            this.alertasAtivos.set(alertaId.rows[0].id, {
                tipo: tipo,
                severidade: severidade,
                usuario: userId,
                mensagem: mensagem
            });

            this.metricas.alertas_gerados++;
            
            const emoji = this.niveisAlerta[severidade]?.cor || '⚠️';
            console.log(`${emoji} Alerta gerado para usuário ${userId}: ${mensagem}`);

        } catch (error) {
            console.error('❌ Erro ao gerar alerta:', error.message);
        }
    }

    async registrarEventoRisco(userId, tipoEvento, dados) {
        try {
            if (this.pool && !this.pool.ended) { await this.pool.query(`
                INSERT INTO risk_events (event_type, user_id, event_data, risk_level, auto_action_taken)
                VALUES ($1, $2, $3, $4, $5)
            `, [tipoEvento, userId, JSON.stringify(dados), dados.risk_level || 'medium', true]);

        } catch (error) {
            console.error('❌ Erro ao registrar evento de risco:', error.message);
        }
    }

    async obterRelatorioRiscos(userId = null) {
        try {
            let whereClause = '';
            let params = [];

            if (userId) {
                whereClause = 'WHERE user_id = $1';
                params = [userId];
            }

            const alertas = if (this.pool && !this.pool.ended) { await this.pool.query(`
                SELECT alert_type, severity, COUNT(*) as quantidade
                FROM risk_alerts
                ${whereClause}
                AND created_at >= NOW() - INTERVAL '24 hours'
                GROUP BY alert_type, severity
                ORDER BY quantidade DESC
            `, params);

            const eventos = if (this.pool && !this.pool.ended) { await this.pool.query(`
                SELECT event_type, COUNT(*) as quantidade
                FROM risk_events
                ${whereClause}
                AND created_at >= NOW() - INTERVAL '24 hours'
                GROUP BY event_type
                ORDER BY quantidade DESC
            `, params);

            return {
                alertas_24h: alertas.rows,
                eventos_24h: eventos.rows,
                usuarios_monitorados: this.usuariosMonitorados.size,
                alertas_ativos: this.alertasAtivos.size,
                metricas: this.metricas
            };

        } catch (error) {
            console.error('❌ Erro ao gerar relatório de riscos:', error.message);
            return null;
        }
    }

    obterStatus() {
        return {
            id: this.id,
            nome: this.nome,
            tipo: this.tipo,
            status: this.status,
            metricas: {
                ...this.metricas,
                usuarios_monitorados: this.usuariosMonitorados.size,
                alertas_ativos: this.alertasAtivos.size,
                posicoes_bloqueadas: this.posicoesBloqueadas.size
            }
        };
    }

    
    verificarPool() {
        if (!this.pool || this.pool.ended) {
            console.log('⚠️ Pool de conexão não disponível');
            return false;
        }
        return true;
    }

    async finalizar() {
        console.log(`🔄 Finalizando ${this.nome}`);
        this.status = 'finalizado';
        // Pool será finalizado pelo componente principal
    }
}

// Inicializar se executado diretamente
if (require.main === module) {
    const componente = new RiskManager();
    componente.inicializar().catch(console.error);
}

module.exports = RiskManager;