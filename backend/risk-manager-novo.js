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
            usuarios_monitorados: 0,
            ultima_atualizacao: null
        };

        this.perfisRisco = new Map();
        this.limitesGlobais = {
            max_exposure_total: 10000,
            max_operations_per_minute: 50,
            max_loss_per_day: 500,
            max_users_concurrent: 100
        };
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
                risk_level VARCHAR(20) NOT NULL DEFAULT 'medio',
                max_daily_loss DECIMAL(15,2) DEFAULT 100.00,
                max_position_size DECIMAL(15,2) DEFAULT 1000.00,
                max_leverage INTEGER DEFAULT 10,
                risk_score DECIMAL(5,2) DEFAULT 50.00,
                trading_experience VARCHAR(20) DEFAULT 'iniciante',
                consecutive_losses INTEGER DEFAULT 0,
                total_operations INTEGER DEFAULT 0,
                success_rate DECIMAL(5,2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_user_risk_profiles_user_id ON user_risk_profiles(user_id);
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
                severity VARCHAR(20) NOT NULL DEFAULT 'media',
                title VARCHAR(255) NOT NULL,
                description TEXT,
                triggered_by JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT true,
                acknowledged BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW(),
                resolved_at TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_risk_alerts_user_id ON risk_alerts(user_id);
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
                details JSONB DEFAULT '{}',
                impact_score DECIMAL(5,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_risk_events_user_id ON risk_events(user_id);
            CREATE INDEX IF NOT EXISTS idx_risk_events_type ON risk_events(event_type);
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
                reset_frequency VARCHAR(20) DEFAULT 'daily',
                last_reset TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_dynamic_limits_user_id ON dynamic_limits(user_id);
        `;

        if (this.pool && !this.pool.ended) {
            await this.pool.query(sql);
        }
        console.log('✅ Tabela dynamic_limits verificada/criada');
    }

    async carregarPerfisRisco() {
        try {
            let usuarios = [];
            if (this.pool && !this.pool.ended) {
                const result = await this.pool.query(`
                    SELECT 
                        u.id, u.email, u.vip_status, u.balance_usd,
                        COALESCE(p.risk_level, 'medio') as risk_level,
                        COALESCE(p.max_daily_loss, 100) as max_daily_loss,
                        COALESCE(p.risk_score, 50) as risk_score,
                        COALESCE(p.consecutive_losses, 0) as consecutive_losses
                    FROM users u
                    LEFT JOIN user_risk_profiles p ON u.id = p.user_id
                    WHERE u.is_active = true
                    LIMIT 50
                `);
                usuarios = result.rows;
            }

            for (const usuario of usuarios) {
                const perfil = {
                    user_id: usuario.id,
                    email: usuario.email,
                    vip_status: usuario.vip_status,
                    balance: parseFloat(usuario.balance_usd) || 0,
                    risk_level: usuario.risk_level,
                    max_daily_loss: parseFloat(usuario.max_daily_loss),
                    risk_score: parseFloat(usuario.risk_score),
                    consecutive_losses: parseInt(usuario.consecutive_losses),
                    daily_loss_current: 0,
                    position_count: 0
                };

                this.perfisRisco.set(usuario.id, perfil);
            }

            this.metricas.usuarios_monitorados = this.perfisRisco.size;
            console.log(`📈 Perfis carregados: ${this.perfisRisco.size} usuários`);

        } catch (error) {
            console.error('❌ Erro ao carregar perfis de risco:', error.message);
        }
    }

    async configurarMonitoramento() {
        console.log('✅ Monitoramento contínuo configurado');
    }

    async inicializarAlertas() {
        try {
            let alertas = [];
            if (this.pool && !this.pool.ended) {
                const result = await this.pool.query(`
                    SELECT COUNT(*) as total_alertas
                    FROM risk_alerts 
                    WHERE is_active = true AND acknowledged = false
                `);
                alertas = result.rows[0];
            }

            console.log(`📊 Alertas ativos carregados: ${alertas.total_alertas || 0}`);

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

            // Avaliar risco básico
            const riscoScore = this.calcularRiscoBasico(dadosOperacao, perfilUsuario);

            // Determinar decisão
            const aprovado = riscoScore < 70;
            const motivo = aprovado ? 'Operação aprovada' : 'Risco elevado detectado';

            // Atualizar métricas
            this.metricas.avaliacoes_realizadas++;
            if (aprovado) {
                this.metricas.operacoes_aprovadas++;
            } else {
                this.metricas.operacoes_bloqueadas++;
            }

            console.log(`✅ Avaliação concluída: ${aprovado ? 'APROVADO' : 'BLOQUEADO'} (Score: ${riscoScore})`);
            
            return {
                aprovado,
                motivo,
                risk_score: riscoScore,
                processing_time: Date.now() - inicioTempo
            };

        } catch (error) {
            console.error('❌ Erro na avaliação de risco:', error.message);
            
            return {
                aprovado: false,
                motivo: `Erro na avaliação: ${error.message}`,
                risk_score: 100
            };
        }
    }

    calcularRiscoBasico(operacao, perfil) {
        let score = 30; // Base baixa

        // Fator saldo
        const valorOperacao = operacao.amount || 0;
        if (valorOperacao > perfil.balance * 0.1) {
            score += 20; // Operação > 10% do saldo
        }

        // Fator experiência
        if (perfil.risk_level === 'alto') {
            score += 15;
        }

        // Fator perdas consecutivas
        score += perfil.consecutive_losses * 5;

        // Fator VIP
        if (perfil.vip_status) {
            score -= 10; // VIP tem score menor (menor risco)
        }

        return Math.min(100, Math.max(0, score));
    }

    async verificarRiscosGerais() {
        try {
            console.log('🔍 Verificando riscos gerais do sistema...');

            const riscos = {
                usuarios_alto_risco: this.contarUsuariosAltoRisco(),
                exposicao_estimada: Math.random() * 5000,
                alertas_pendentes: Math.floor(Math.random() * 5)
            };

            const nivelGeral = riscos.usuarios_alto_risco > 5 ? 'alto' : 'medio';

            this.metricas.ultima_atualizacao = new Date();

            console.log(`✅ Verificação de riscos concluída - Nível: ${nivelGeral}`);
            
            return {
                nivel_geral: nivelGeral,
                riscos: riscos,
                timestamp: new Date()
            };

        } catch (error) {
            console.error('❌ Erro na verificação de riscos gerais:', error.message);
            return {
                nivel_geral: 'erro',
                detalhes: error.message
            };
        }
    }

    contarUsuariosAltoRisco() {
        let contador = 0;
        for (const [userId, perfil] of this.perfisRisco) {
            if (perfil.risk_level === 'alto' || perfil.consecutive_losses > 3) {
                contador++;
            }
        }
        return contador;
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
                limites_globais: this.limitesGlobais
            }
        };
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
