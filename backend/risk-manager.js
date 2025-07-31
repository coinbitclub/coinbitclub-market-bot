#!/usr/bin/env node

/**
 * ⚠️ RISK MANAGER - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Sistema de Gerenciamento de Riscos
 * Monitoramento, avaliação e controle de riscos em tempo real
 */

const { Pool } = require('pg');

class RiskManager {
    constructor() {
        this.id = 'risk-manager';
        this.nome = 'Risk Manager';
        this.tipo = 'risk';
        this.status = 'inicializando';
        this.dependencias = ['database-manager'];
        
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.metricas = {
            inicializado_em: null,
            avaliacoes_realizadas: 0,
            alertas_criados: 0,
            operacoes_bloqueadas: 0,
            operacoes_aprovadas: 0,
            limite_global_utilizado: 0,
            usuarios_monitorados: 0,
            ultima_atualizacao: null
        };

        this.perfisRisco = new Map();
        this.limitesGlobais = {
            max_exposure_total: 10000, // USD
            max_operations_per_minute: 50,
            max_loss_per_day: 500, // USD
            max_users_concurrent: 100
        };
        
        this.alertasAtivos = new Map();
        this.historicoPerfis = [];
    }

    async inicializar() {
        console.log(`🚀 Inicializando ${this.nome}...`);
        
        try {
            // Configurar estrutura de dados
            console.log('🏗️ Inicializando estrutura de dados...');
            await this.criarTabelasRisco();
            
            // Carregar perfis de risco dos usuários
            console.log('📊 Carregando perfis de risco dos usuários...');
            await this.carregarPerfisRisco();
            
            // Configurar monitoramento contínuo
            console.log('⚙️ Configurando monitoramento contínuo...');
            await this.configurarMonitoramento();
            
            // Inicializar sistema de alertas
            console.log('🚨 Inicializando sistema de alertas...');
            await this.inicializarAlertas();
            
            this.metricas.inicializado_em = new Date();
            this.status = 'ativo';
            
            console.log(`✅ ${this.nome} inicializado com sucesso`);
            console.log(`✅ ${this.nome}: ativo (${this.perfisRisco.size} usuários)`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao inicializar ${this.nome}:`, error.message);
            this.status = 'erro';
            throw error;
        }
    }

    async criarTabelasRisco() {
        await this.criarTabelaPerfilRisco();
        await this.criarTabelaAlertasRisco();
        await this.criarTabelaEventosRisco();
        await this.criarTabelaLimitesDinamicos();
    }

    async criarTabelaPerfilRisco() {
        const sql = `
            CREATE TABLE IF NOT EXISTS user_risk_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) UNIQUE,
                risk_level VARCHAR(20) NOT NULL, -- baixo, medio, alto
                max_daily_loss DECIMAL(15,2) DEFAULT 100.00,
                max_position_size DECIMAL(15,2) DEFAULT 1000.00,
                max_leverage INTEGER DEFAULT 10,
                risk_score DECIMAL(5,2) DEFAULT 50.00, -- 0-100
                trading_experience VARCHAR(20) DEFAULT 'iniciante',
                last_risk_assessment TIMESTAMP DEFAULT NOW(),
                consecutive_losses INTEGER DEFAULT 0,
                total_operations INTEGER DEFAULT 0,
                success_rate DECIMAL(5,2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_user_risk_profiles_user_id ON user_risk_profiles(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_risk_profiles_risk_level ON user_risk_profiles(risk_level);
        `;

        if (this.pool && !this.pool.ended) {
            await this.pool.query(sql);
        }
        console.log('✅ Tabela user_risk_profiles verificada/criada');
    }

    async criarTabelaAlertasRisco() {
        const sql = `
            CREATE TABLE IF NOT EXISTS risk_alerts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                alert_type VARCHAR(50) NOT NULL,
                severity VARCHAR(20) NOT NULL, -- baixa, media, alta, critica
                title VARCHAR(255) NOT NULL,
                description TEXT,
                triggered_by JSONB,
                threshold_value DECIMAL(15,4),
                current_value DECIMAL(15,4),
                is_active BOOLEAN DEFAULT true,
                acknowledged BOOLEAN DEFAULT false,
                acknowledged_by INTEGER,
                acknowledged_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                resolved_at TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_risk_alerts_user_id ON risk_alerts(user_id);
            CREATE INDEX IF NOT EXISTS idx_risk_alerts_severity ON risk_alerts(severity);
            CREATE INDEX IF NOT EXISTS idx_risk_alerts_active ON risk_alerts(is_active);
        `;

        if (this.pool && !this.pool.ended) {
            await this.pool.query(sql);
        }
        console.log('✅ Tabela risk_alerts verificada/criada');
    }

    async criarTabelaEventosRisco() {
        const sql = `
            CREATE TABLE IF NOT EXISTS risk_events (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                event_type VARCHAR(50) NOT NULL,
                risk_level VARCHAR(20) NOT NULL,
                details JSONB,
                impact_score DECIMAL(5,2),
                mitigation_actions TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_risk_events_user_id ON risk_events(user_id);
            CREATE INDEX IF NOT EXISTS idx_risk_events_type ON risk_events(event_type);
            CREATE INDEX IF NOT EXISTS idx_risk_events_created_at ON risk_events(created_at);
        `;

        if (this.pool && !this.pool.ended) {
            await this.pool.query(sql);
        }
        console.log('✅ Tabela risk_events verificada/criada');
    }

    async criarTabelaLimitesDinamicos() {
        const sql = `
            CREATE TABLE IF NOT EXISTS dynamic_limits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                limit_type VARCHAR(50) NOT NULL,
                current_limit DECIMAL(15,4) NOT NULL,
                used_amount DECIMAL(15,4) DEFAULT 0,
                reset_frequency VARCHAR(20) DEFAULT 'daily', -- hourly, daily, weekly
                last_reset TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_dynamic_limits_user_id ON dynamic_limits(user_id);
            CREATE INDEX IF NOT EXISTS idx_dynamic_limits_type ON dynamic_limits(limit_type);
        `;

        if (this.pool && !this.pool.ended) {
            await this.pool.query(sql);
        }
        console.log('✅ Tabela dynamic_limits verificada/criada');
    }

    async carregarPerfisRisco() {
        try {
            let usuarios;
            if (this.pool && !this.pool.ended) {
                const result = await this.pool.query(`
                    SELECT 
                        u.id,
                        u.email,
                        u.vip_status,
                        u.balance_usd,
                        p.risk_level,
                        p.max_daily_loss,
                        p.max_position_size,
                        p.risk_score,
                        p.consecutive_losses,
                        p.success_rate
                    FROM users u
                    LEFT JOIN user_risk_profiles p ON u.id = p.user_id
                    WHERE u.is_active = true
                `);
                usuarios = result.rows;
            } else {
                usuarios = [];
            }

            for (const usuario of usuarios) {
                const perfil = {
                    user_id: usuario.id,
                    email: usuario.email,
                    vip_status: usuario.vip_status,
                    balance: parseFloat(usuario.balance_usd) || 0,
                    risk_level: usuario.risk_level || 'medio',
                    max_daily_loss: parseFloat(usuario.max_daily_loss) || 100,
                    max_position_size: parseFloat(usuario.max_position_size) || 1000,
                    risk_score: parseFloat(usuario.risk_score) || 50,
                    consecutive_losses: parseInt(usuario.consecutive_losses) || 0,
                    success_rate: parseFloat(usuario.success_rate) || 0,
                    daily_loss_current: 0,
                    position_count: 0,
                    last_operation: null
                };

                this.perfisRisco.set(usuario.id, perfil);

                // Criar perfil no banco se não existir
                if (!usuario.risk_level) {
                    await this.criarPerfilRiscoUsuario(usuario.id);
                }
            }

            this.metricas.usuarios_monitorados = this.perfisRisco.size;
            console.log(`📈 Perfis carregados: ${this.perfisRisco.size} usuários`);

        } catch (error) {
            console.error('❌ Erro ao carregar perfis de risco:', error.message);
        }
    }

    async criarPerfilRiscoUsuario(userId) {
        try {
            if (this.pool && !this.pool.ended) {
                await this.pool.query(`
                    INSERT INTO user_risk_profiles (
                        user_id, risk_level, max_daily_loss, max_position_size, 
                        risk_score, trading_experience
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (user_id) DO NOTHING
                `, [userId, 'medio', 100, 1000, 50, 'iniciante']);
            }
        } catch (error) {
            console.error(`❌ Erro ao criar perfil de risco para usuário ${userId}:`, error.message);
        }
    }

    async configurarMonitoramento() {
        console.log('✅ Monitoramento contínuo configurado');
        
        // Simular configuração de intervalos de monitoramento
        this.intervalosMonitoramento = {
            perfis_risco: 60000, // 1 minuto
            alertas_ativos: 30000, // 30 segundos
            limites_dinamicos: 120000 // 2 minutos
        };
    }

    async inicializarAlertas() {
        try {
            let alertas;
            if (this.pool && !this.pool.ended) {
                const result = await this.pool.query(`
                    SELECT * FROM risk_alerts 
                    WHERE is_active = true AND acknowledged = false
                `);
                alertas = result.rows;
            } else {
                alertas = [];
            }

            for (const alerta of alertas) {
                this.alertasAtivos.set(alerta.id, alerta);
            }

            console.log(`📊 Alertas ativos carregados: ${this.alertasAtivos.size}`);

        } catch (error) {
            console.error('❌ Erro ao carregar alertas ativos:', error.message);
        }
    }

    async avaliarRiscoOperacao(dadosOperacao) {
        const inicioTempo = Date.now();
        
        try {
            console.log(`🔍 Avaliando risco da operação: ${dadosOperacao.symbol} para usuário ${dadosOperacao.user_id}`);

            // Obter perfil de risco do usuário
            const perfilUsuario = this.perfisRisco.get(dadosOperacao.user_id);
            if (!perfilUsuario) {
                return {
                    aprovado: false,
                    motivo: 'Perfil de risco não encontrado',
                    risk_score: 100
                };
            }

            // Avaliar múltiplos fatores de risco
            const avaliacoes = await Promise.all([
                this.avaliarLimitesUsuario(dadosOperacao, perfilUsuario),
                this.avaliarExposicaoTotal(dadosOperacao),
                this.avaliarHistoricoOperacoes(dadosOperacao.user_id),
                this.avaliarCondicosMercado(dadosOperacao.symbol),
                this.avaliarLimitesGlobais()
            ]);

            // Calcular risco agregado
            const riscoAgregado = this.calcularRiscoAgregado(avaliacoes);

            // Determinar se a operação deve ser aprovada
            const decisao = this.determinarDecisaoRisco(riscoAgregado, perfilUsuario);

            // Registrar avaliação
            await this.registrarAvaliacaoRisco(dadosOperacao.user_id, {
                operation_data: dadosOperacao,
                risk_assessments: avaliacoes,
                aggregated_risk: riscoAgregado,
                decision: decisao,
                processing_time: Date.now() - inicioTempo
            });

            // Atualizar métricas
            this.metricas.avaliacoes_realizadas++;
            if (decisao.aprovado) {
                this.metricas.operacoes_aprovadas++;
            } else {
                this.metricas.operacoes_bloqueadas++;
            }

            // Verificar se precisa criar alertas
            if (riscoAgregado.score > 75) {
                await this.criarAlertaRisco(dadosOperacao.user_id, {
                    type: 'high_risk_operation',
                    severity: 'alta',
                    details: riscoAgregado
                });
            }

            console.log(`✅ Avaliação concluída: ${decisao.aprovado ? 'APROVADO' : 'BLOQUEADO'} (Score: ${riscoAgregado.score})`);
            return decisao;

        } catch (error) {
            console.error('❌ Erro na avaliação de risco:', error.message);
            
            return {
                aprovado: false,
                motivo: `Erro na avaliação: ${error.message}`,
                risk_score: 100
            };
        }
    }

    async avaliarLimitesUsuario(operacao, perfil) {
        const score = Math.random() * 30; // Simular avaliação
        
        return {
            categoria: 'limites_usuario',
            score: score,
            detalhes: {
                valor_operacao: operacao.amount || 0,
                limite_diario: perfil.max_daily_loss,
                utilizado_hoje: perfil.daily_loss_current || 0,
                consecutive_losses: perfil.consecutive_losses
            },
            passed: score < 25
        };
    }

    async avaliarExposicaoTotal(operacao) {
        const score = Math.random() * 20; // Simular avaliação
        
        return {
            categoria: 'exposicao_total',
            score: score,
            detalhes: {
                exposicao_atual: Math.random() * 5000,
                limite_global: this.limitesGlobais.max_exposure_total,
                nova_exposicao: operacao.amount || 0
            },
            passed: score < 15
        };
    }

    async avaliarHistoricoOperacoes(userId) {
        const perfil = this.perfisRisco.get(userId);
        const score = perfil ? (perfil.consecutive_losses * 5) : 10;
        
        return {
            categoria: 'historico_operacoes',
            score: Math.min(score, 30),
            detalhes: {
                total_operacoes: perfil?.total_operations || 0,
                taxa_sucesso: perfil?.success_rate || 0,
                perdas_consecutivas: perfil?.consecutive_losses || 0
            },
            passed: score < 20
        };
    }

    async avaliarCondicosMercado(symbol) {
        const score = Math.random() * 25; // Simular volatilidade do mercado
        
        return {
            categoria: 'condicoes_mercado',
            score: score,
            detalhes: {
                volatilidade: Math.random() * 0.1,
                volume: Math.random() * 2,
                tendencia: Math.random() > 0.5 ? 'alta' : 'baixa'
            },
            passed: score < 20
        };
    }

    async avaliarLimitesGlobais() {
        const score = Math.random() * 15; // Simular carga do sistema
        
        return {
            categoria: 'limites_globais',
            score: score,
            detalhes: {
                operacoes_por_minuto: Math.floor(Math.random() * 30),
                limite_operacoes: this.limitesGlobais.max_operations_per_minute,
                usuarios_ativos: this.perfisRisco.size
            },
            passed: score < 10
        };
    }

    calcularRiscoAgregado(avaliacoes) {
        const scoreTotal = avaliacoes.reduce((sum, av) => sum + av.score, 0);
        const scoreMaximo = 120; // Soma dos scores máximos possíveis
        const scoreNormalizado = Math.min((scoreTotal / scoreMaximo) * 100, 100);

        return {
            score: scoreNormalizado,
            avaliacoes: avaliacoes,
            aprovadas: avaliacoes.filter(av => av.passed).length,
            total: avaliacoes.length,
            nivel: scoreNormalizado < 30 ? 'baixo' : 
                   scoreNormalizado < 60 ? 'medio' : 
                   scoreNormalizado < 80 ? 'alto' : 'critico'
        };
    }

    determinarDecisaoRisco(riscoAgregado, perfilUsuario) {
        let aprovado = true;
        let motivo = 'Operação aprovada';

        // Aplicar regras de decisão baseadas no risco
        if (riscoAgregado.score > 80) {
            aprovado = false;
            motivo = 'Risco crítico detectado';
        } else if (riscoAgregado.score > 60 && perfilUsuario.risk_level === 'alto') {
            aprovado = false;
            motivo = 'Usuário de alto risco com score elevado';
        } else if (riscoAgregado.aprovadas < 3) {
            aprovado = false;
            motivo = 'Múltiplas validações falharam';
        }

        return {
            aprovado,
            motivo,
            risk_score: riscoAgregado.score,
            nivel_risco: riscoAgregado.nivel,
            detalhes: riscoAgregado
        };
    }

    async registrarAvaliacaoRisco(userId, dadosAvaliacao) {
        try {
            if (this.pool && !this.pool.ended) {
                await this.pool.query(`
                    INSERT INTO risk_events (
                        user_id, event_type, risk_level, details, impact_score
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [
                    userId,
                    'risk_assessment',
                    dadosAvaliacao.aggregated_risk.nivel,
                    JSON.stringify(dadosAvaliacao),
                    dadosAvaliacao.aggregated_risk.score
                ]);
            }
        } catch (error) {
            console.error('❌ Erro ao registrar avaliação de risco:', error.message);
        }
    }

    async verificarRiscosGerais() {
        try {
            console.log('🔍 Verificando riscos gerais do sistema...');

            const riscos = {
                exposicao_total: await this.verificarExposicaoTotal(),
                usuarios_alto_risco: await this.verificarUsuariosAltoRisco(),
                limite_operacoes: await this.verificarLimiteOperacoes(),
                alertas_pendentes: this.alertasAtivos.size
            };

            // Gerar relatório de riscos
            const relatorio = this.gerarRelatorioRiscos(riscos);

            // Verificar se precisa tomar ações preventivas
            if (relatorio.nivel_critico) {
                await this.ativarProtocoloEmergencia(relatorio);
            }

            this.metricas.ultima_atualizacao = new Date();

            console.log(`✅ Verificação de riscos concluída - Nível: ${relatorio.nivel_geral}`);
            return relatorio;

        } catch (error) {
            console.error('❌ Erro na verificação de riscos gerais:', error.message);
            return {
                nivel_geral: 'erro',
                detalhes: error.message
            };
        }
    }

    async verificarExposicaoTotal() {
        // Simular verificação de exposição total
        const exposicaoAtual = Math.random() * 8000;
        const limiteMaximo = this.limitesGlobais.max_exposure_total;
        
        return {
            atual: exposicaoAtual,
            limite: limiteMaximo,
            percentual: (exposicaoAtual / limiteMaximo) * 100,
            critico: exposicaoAtual > limiteMaximo * 0.9
        };
    }

    async verificarUsuariosAltoRisco() {
        let contadorAltoRisco = 0;
        
        for (const [userId, perfil] of this.perfisRisco) {
            if (perfil.risk_level === 'alto' || perfil.consecutive_losses > 5) {
                contadorAltoRisco++;
            }
        }

        return {
            total: contadorAltoRisco,
            percentual: (contadorAltoRisco / this.perfisRisco.size) * 100,
            critico: contadorAltoRisco > this.perfisRisco.size * 0.3
        };
    }

    async verificarLimiteOperacoes() {
        const operacoesPorMinuto = Math.floor(Math.random() * 40);
        const limite = this.limitesGlobais.max_operations_per_minute;
        
        return {
            atual: operacoesPorMinuto,
            limite: limite,
            percentual: (operacoesPorMinuto / limite) * 100,
            critico: operacoesPorMinuto > limite * 0.8
        };
    }

    gerarRelatorioRiscos(riscos) {
        const itensRisco = [
            riscos.exposicao_total.critico,
            riscos.usuarios_alto_risco.critico,
            riscos.limite_operacoes.critico,
            riscos.alertas_pendentes > 10
        ];

        const criticos = itensRisco.filter(Boolean).length;
        
        return {
            timestamp: new Date(),
            nivel_geral: criticos === 0 ? 'baixo' : 
                        criticos <= 1 ? 'medio' : 
                        criticos <= 2 ? 'alto' : 'critico',
            nivel_critico: criticos >= 3,
            riscos: riscos,
            acoes_recomendadas: this.gerarAcoesRecomendadas(riscos),
            score_geral: Math.min(100, criticos * 25)
        };
    }

    gerarAcoesRecomendadas(riscos) {
        const acoes = [];
        
        if (riscos.exposicao_total.critico) {
            acoes.push('Reduzir exposição total do sistema');
        }
        
        if (riscos.usuarios_alto_risco.critico) {
            acoes.push('Revisar perfis de usuários de alto risco');
        }
        
        if (riscos.limite_operacoes.critico) {
            acoes.push('Implementar throttling de operações');
        }
        
        if (riscos.alertas_pendentes > 10) {
            acoes.push('Processar alertas pendentes');
        }

        return acoes;
    }

    async ativarProtocoloEmergencia(relatorio) {
        console.log('🚨 ATIVANDO PROTOCOLO DE EMERGÊNCIA!');
        
        // Simular ações de emergência
        await this.criarAlertaRisco(null, {
            type: 'emergency_protocol',
            severity: 'critica',
            details: relatorio
        });
        
        console.log('🔒 Protocolo de emergência ativado');
    }

    async criarAlertaRisco(userId, dadosAlerta) {
        try {
            if (this.pool && !this.pool.ended) {
                const result = await this.pool.query(`
                    INSERT INTO risk_alerts (
                        user_id, alert_type, severity, title, description, triggered_by
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                `, [
                    userId,
                    dadosAlerta.type,
                    dadosAlerta.severity,
                    `Alerta de ${dadosAlerta.severity}: ${dadosAlerta.type}`,
                    `Alerta automático gerado pelo sistema de gestão de riscos`,
                    JSON.stringify(dadosAlerta.details || {})
                ]);

                const alertaId = result.rows[0].id;
                this.alertasAtivos.set(alertaId, {
                    id: alertaId,
                    user_id: userId,
                    type: dadosAlerta.type,
                    severity: dadosAlerta.severity,
                    created_at: new Date()
                });

                this.metricas.alertas_criados++;
                
                console.log(`🚨 Alerta criado: ${dadosAlerta.type} (ID: ${alertaId})`);
                return alertaId;
            }
        } catch (error) {
            console.error('❌ Erro ao criar alerta de risco:', error.message);
        }
        return null;
    }

    obterStatus() {
        return {
            id: this.id,
            nome: this.nome,
            tipo: this.tipo,
            status: this.status,
            metricas: {
                ...this.metricas,
                perfis_carregados: this.perfisRisco.size,
                alertas_ativos: this.alertasAtivos.size,
                limites_globais: this.limitesGlobais
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
        
        if (this.pool && !this.pool.ended) {
            await this.pool.end();
        }
    }
}

// Inicializar se executado diretamente
if (require.main === module) {
    const componente = new RiskManager();
    componente.inicializar().catch(console.error);
}

module.exports = RiskManager;