#!/usr/bin/env node

/**
 * 👥 GERENCIADOR DE USUÁRIOS - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Gerenciamento completo de usuários, autenticação, VIP e afiliados
 * Sistema multiusuário com suporte a diferentes planos e níveis
 */

const { Pool } = require('pg');
const crypto = require('crypto');

class UserManager {
    constructor() {
        this.id = 'user-manager';
        this.nome = 'Gerenciador de Usuários';
        this.tipo = 'core';
        this.status = 'inicializando';
        this.dependencias = ['database-manager'];
        
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.metricas = {
            inicializado_em: null,
            usuarios_ativos: 0,
            usuarios_vip: 0,
            sessoes_ativas: 0,
            logins_hoje: 0,
            registros_hoje: 0,
            ultima_verificacao: null
        };

        this.niveis_vip = {
            'standard': { limite_operacoes: 10, taxa_comissao: 0.1 },
            'vip': { limite_operacoes: 50, taxa_comissao: 0.05 },
            'premium': { limite_operacoes: 100, taxa_comissao: 0.03 },
            'elite': { limite_operacoes: -1, taxa_comissao: 0.01 }
        };
    }

    async inicializar() {
        console.log(`🚀 Inicializando ${this.nome}...`);
        
        try {
            // Verificar estrutura de usuários
            await this.verificarEstruturaUsuarios();
            
            // Carregar estatísticas iniciais
            await this.carregarEstatisticas();
            
            // Configurar rotinas de manutenção
            await this.configurarManutencaoUsuarios();
            
            // Inicializar sistema de sessões
            await this.inicializarSistemaSessoes();
            
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

    async verificarEstruturaUsuarios() {
        console.log('🔍 Verificando estrutura de usuários...');
        
        // Verificar se colunas essenciais existem
        const colunasEssenciais = [
            'balance_usd', 'vip_status', 'plan_type', 'is_active',
            'commission_rate', 'affiliate_level', 
            // ✅ Novas colunas para configurações personalizadas de trading
            'custom_leverage', 'custom_stop_loss_percent', 'custom_take_profit_percent',
            'custom_position_size_percent', 'allow_custom_params', 'trading_preferences'
        ];

        for (const coluna of colunasEssenciais) {
            try {
                await this.pool.query(`SELECT ${coluna} FROM users LIMIT 1`);
                console.log(`✅ Coluna encontrada: ${coluna}`);
            } catch (error) {
                console.log(`⚠️ Coluna faltante: ${coluna} - Criando...`);
                await this.adicionarColunaUsuario(coluna);
            }
        }
    }

    async adicionarColunaUsuario(coluna) {
        const alteracoes = {
            'balance_usd': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS balance_usd DECIMAL(20,8) DEFAULT 0',
            'vip_status': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_status BOOLEAN DEFAULT false',
            'plan_type': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT \'standard\'',
            'is_active': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true',
            'commission_rate': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) DEFAULT 0.001',
            'affiliate_level': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_level VARCHAR(20) DEFAULT \'basic\'',
            // ✅ Configurações personalizadas de trading
            'custom_leverage': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_leverage DECIMAL(4,2) DEFAULT 5.00',
            'custom_stop_loss_percent': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_stop_loss_percent DECIMAL(5,2) DEFAULT 10.00',
            'custom_take_profit_percent': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_take_profit_percent DECIMAL(5,2) DEFAULT 15.00',
            'custom_position_size_percent': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_position_size_percent DECIMAL(5,2) DEFAULT 30.00',
            'allow_custom_params': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_custom_params BOOLEAN DEFAULT false',
            'trading_preferences': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS trading_preferences JSONB DEFAULT \'{}\'::jsonb'
        };

        if (alteracoes[coluna]) {
            try {
                await this.pool.query(alteracoes[coluna]);
                console.log(`✅ Coluna ${coluna} adicionada`);
            } catch (error) {
                console.error(`❌ Erro ao adicionar coluna ${coluna}:`, error.message);
            }
        }
    }

    async carregarEstatisticas() {
        try {
            const stats = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_usuarios,
                    COUNT(*) FILTER (WHERE is_active = true) as usuarios_ativos,
                    COUNT(*) FILTER (WHERE vip_status = true) as usuarios_vip,
                    COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as registros_hoje,
                    AVG(balance_usd) FILTER (WHERE is_active = true) as saldo_medio,
                    SUM(balance_usd) FILTER (WHERE is_active = true) as saldo_total
                FROM users
            `);

            const dados = stats.rows[0];
            this.metricas.usuarios_ativos = parseInt(dados.usuarios_ativos || 0);
            this.metricas.usuarios_vip = parseInt(dados.usuarios_vip || 0);
            this.metricas.registros_hoje = parseInt(dados.registros_hoje || 0);

            console.log(`📊 Estatísticas carregadas:`);
            console.log(`   👥 Usuários ativos: ${this.metricas.usuarios_ativos}`);
            console.log(`   ⭐ Usuários VIP: ${this.metricas.usuarios_vip}`);
            console.log(`   📈 Registros hoje: ${this.metricas.registros_hoje}`);

        } catch (error) {
            console.error('❌ Erro ao carregar estatísticas:', error.message);
        }
    }

    async configurarManutencaoUsuarios() {
        console.log('🔧 Configurando manutenção de usuários...');

        // Atualizar estatísticas a cada 5 minutos
        setInterval(async () => {
            await this.carregarEstatisticas();
        }, 5 * 60 * 1000);
    }

    async inicializarSistemaSessoes() {
        console.log('🔐 Inicializando sistema de sessões...');
        this.metricas.sessoes_ativas = 0;
    }

    async obterPerfilUsuario(userId) {
        try {
            const result = await this.pool.query(`
                SELECT 
                    u.id, u.email, u.name, u.whatsapp, u.plan_type,
                    u.vip_status, u.balance_usd, u.commission_rate,
                    u.created_at, u.last_login,
                    COUNT(k.id) as total_api_keys,
                    COUNT(k.id) FILTER (WHERE k.is_active = true) as active_api_keys
                FROM users u
                LEFT JOIN user_api_keys k ON u.id = k.user_id
                WHERE u.id = $1
                GROUP BY u.id
            `, [userId]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];

        } catch (error) {
            console.error('❌ Erro ao obter perfil:', error.message);
            throw error;
        }
    }

    async atualizarSaldoUsuario(userId, novoSaldo) {
        try {
            await this.pool.query(`
                UPDATE users 
                SET balance_usd = $1, updated_at = NOW()
                WHERE id = $2
            `, [novoSaldo, userId]);

            console.log(`✅ Saldo atualizado para usuário ${userId}: $${novoSaldo}`);
            return true;

        } catch (error) {
            console.error('❌ Erro ao atualizar saldo:', error.message);
            throw error;
        }
    }

    async listarUsuariosAtivos() {
        try {
            const result = await this.pool.query(`
                SELECT 
                    u.id, u.name, u.email, u.vip_status, u.plan_type,
                    u.balance_usd, u.created_at,
                    COUNT(k.id) as total_chaves
                FROM users u
                LEFT JOIN user_api_keys k ON u.id = k.user_id
                WHERE u.is_active = true
                GROUP BY u.id
                ORDER BY u.balance_usd DESC
            `);

            return result.rows;

        } catch (error) {
            console.error('❌ Erro ao listar usuários:', error.message);
            throw error;
        }
    }

    async autenticarUsuario(email, senha) {
        try {
            console.log(`🔐 Autenticando usuário: ${email}`);
            
            // Buscar usuário por email
            const result = await this.pool.query(`
                SELECT id, email, password, name, is_active, vip_status, plan_type
                FROM users 
                WHERE email = $1 AND is_active = true
            `, [email]);

            if (result.rows.length === 0) {
                return { sucesso: false, motivo: 'Usuário não encontrado ou inativo' };
            }

            const usuario = result.rows[0];
            
            // Verificar senha (hash simples por enquanto)
            const senhaHash = crypto.createHash('sha256').update(senha).digest('hex');
            
            if (usuario.password !== senhaHash) {
                return { sucesso: false, motivo: 'Senha incorreta' };
            }

            // Atualizar último login
            await this.pool.query(`
                UPDATE users 
                SET last_login = NOW() 
                WHERE id = $1
            `, [usuario.id]);

            // Criar sessão
            const sessionToken = crypto.randomBytes(32).toString('hex');
            await this.criarSessao(usuario.id, sessionToken);

            this.metricas.logins_hoje++;

            return {
                sucesso: true,
                usuario: {
                    id: usuario.id,
                    email: usuario.email,
                    name: usuario.name,
                    vip_status: usuario.vip_status,
                    plan_type: usuario.plan_type
                },
                token: sessionToken
            };

        } catch (error) {
            console.error('❌ Erro na autenticação:', error.message);
            return { sucesso: false, motivo: 'Erro interno do servidor' };
        }
    }

    async obterDadosUsuario(userId) {
        try {
            console.log(`📊 Obtendo dados completos do usuário: ${userId}`);
            
            const result = await this.pool.query(`
                SELECT 
                    u.id, u.email, u.name, u.whatsapp, u.plan_type,
                    u.vip_status, u.balance_usd, u.commission_rate,
                    u.affiliate_level, u.is_active, u.created_at, u.last_login,
                    COUNT(DISTINCT k.id) as total_api_keys,
                    COUNT(DISTINCT k.id) FILTER (WHERE k.is_active = true) as active_api_keys,
                    COUNT(DISTINCT t.id) as total_trades,
                    COUNT(DISTINCT t.id) FILTER (WHERE t.pnl > 0) as profitable_trades,
                    COALESCE(SUM(t.pnl), 0) as total_pnl,
                    COALESCE(AVG(t.pnl), 0) as avg_pnl
                FROM users u
                LEFT JOIN user_api_keys k ON u.id = k.user_id
                LEFT JOIN trading_operations t ON u.id = t.user_id 
                    AND t.created_at >= NOW() - INTERVAL '30 days'
                WHERE u.id = $1
                GROUP BY u.id
            `, [userId]);

            if (result.rows.length === 0) {
                return null;
            }

            const dados = result.rows[0];
            
            // Calcular win rate
            const winRate = dados.total_trades > 0 
                ? (dados.profitable_trades / dados.total_trades) * 100 
                : 0;

            // Determinar nível de experiência
            const nivelExperiencia = this.determinarNivelExperiencia(dados.total_trades);
            
            // Calcular score de performance
            const scorePerformance = this.calcularScorePerformance(dados);

            return {
                ...dados,
                win_rate: parseFloat(winRate.toFixed(2)),
                nivel_experiencia: nivelExperiencia,
                score_performance: scorePerformance,
                limite_operacoes: this.niveis_vip[dados.plan_type]?.limite_operacoes || 10,
                taxa_comissao_atual: parseFloat(dados.commission_rate || 0)
            };

        } catch (error) {
            console.error('❌ Erro ao obter dados do usuário:', error.message);
            throw error;
        }
    }

    async criarSessao(userId, token) {
        try {
            // Criar ou atualizar tabela de sessões se não existir
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    session_token VARCHAR(64) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
                    is_active BOOLEAN DEFAULT true
                )
            `);

            // Inserir nova sessão
            await this.pool.query(`
                INSERT INTO user_sessions (user_id, session_token)
                VALUES ($1, $2)
            `, [userId, token]);

            this.metricas.sessoes_ativas++;

        } catch (error) {
            console.error('❌ Erro ao criar sessão:', error.message);
        }
    }

    determinarNivelExperiencia(totalTrades) {
        if (totalTrades < 10) return 'iniciante';
        if (totalTrades < 50) return 'intermediario';
        if (totalTrades < 200) return 'avancado';
        return 'expert';
    }

    calcularScorePerformance(dados) {
        let score = 50; // Base neutra

        // Fator PnL
        if (dados.total_pnl > 0) score += 20;
        else if (dados.total_pnl < 0) score -= 20;

        // Fator Win Rate - CRITÉRIO RIGOROSO (>80% EXCELENTE)
        const winRate = dados.total_trades > 0 
            ? (dados.profitable_trades / dados.total_trades) * 100 
            : 0;
        
        // NOVA CLASSIFICAÇÃO RIGOROSA:
        if (winRate > 80) score += 25;        // EXCELENTE (>80%)
        else if (winRate > 60) score += 15;   // BOM (60-80%)
        else if (winRate > 40) score += 5;    // REGULAR (40-60%)
        else if (winRate < 40) score -= 20;   // RUIM (<40%)

        // Fator atividade
        if (dados.total_trades > 100) score += 10;
        if (dados.active_api_keys > 0) score += 5;

        return Math.max(0, Math.min(100, score));
    }

    // ✅ MÉTODOS PARA CONFIGURAÇÕES PERSONALIZADAS DE TRADING
    
    async configurarParametrosTradingUsuario(userId, parametros) {
        try {
            console.log(`⚙️ Configurando parâmetros de trading para usuário ${userId}`);
            
            // Validar se usuário pode usar parâmetros personalizados
            const usuario = await this.obterPerfilUsuario(userId);
            if (!usuario) {
                throw new Error('Usuário não encontrado');
            }

            // ✅ Verificar se usuário REALMENTE quer personalizar (não apenas por plano)
            if (!parametros.ativarPersonalizacao && !parametros.forcar) {
                throw new Error('Para personalizar parâmetros, defina ativarPersonalizacao=true');
            }

            // Verificar permissões baseadas no plano
            const podePersonalizar = this.verificarPermissaoPersonalizacao(usuario.plan_type);
            if (!podePersonalizar && !parametros.forcar) {
                throw new Error(`Plano ${usuario.plan_type} não permite personalização completa`);
            }

            // Validar limites baseados no plano
            const limitesValidados = this.validarLimitesParametros(parametros, usuario.plan_type);
            
            // ✅ IMPORTANTE: Só ativar personalização se explicitamente solicitado
            const ativarCustom = parametros.ativarPersonalizacao === true || parametros.forcar === true;
            
            // Atualizar configurações no banco
            await this.pool.query(`
                UPDATE users SET 
                    custom_leverage = $1,
                    custom_stop_loss_percent = $2,
                    custom_take_profit_percent = $3,
                    custom_position_size_percent = $4,
                    allow_custom_params = $5,
                    trading_preferences = $6,
                    updated_at = NOW()
                WHERE id = $7
            `, [
                limitesValidados.leverage,
                limitesValidados.stopLoss,
                limitesValidados.takeProfit,
                limitesValidados.positionSize,
                ativarCustom, // ✅ Só ativa se explicitamente solicitado
                JSON.stringify(limitesValidados.preferences),
                userId
            ]);

            console.log(`✅ Parâmetros configurados:`);
            console.log(`   ⚡ Alavancagem: ${limitesValidados.leverage}x`);
            console.log(`   🔻 Stop Loss: ${limitesValidados.stopLoss}%`);
            console.log(`   🎯 Take Profit: ${limitesValidados.takeProfit}%`);
            console.log(`   💰 Tamanho posição: ${limitesValidados.positionSize}%`);
            console.log(`   🎛️ Personalização: ${ativarCustom ? 'ATIVADA' : 'DESATIVADA'}`);

            return {
                ...limitesValidados,
                isCustom: ativarCustom
            };

        } catch (error) {
            console.error('❌ Erro ao configurar parâmetros:', error.message);
            throw error;
        }
    }

    verificarPermissaoPersonalizacao(planType) {
        const permissoes = {
            'standard': false,          // Só padrões do sistema
            'vip': true,               // Personalização limitada
            'premium': true,           // Personalização avançada
            'elite': true              // Personalização completa
        };
        
        return permissoes[planType] || false;
    }

    validarLimitesParametros(parametros, planType) {
        const limites = {
            'standard': {
                maxLeverage: 5,
                maxStopLoss: 15,
                minStopLoss: 5,
                maxTakeProfit: 25,
                minTakeProfit: 10,
                maxPositionSize: 30
            },
            'vip': {
                maxLeverage: 10,
                maxStopLoss: 20,
                minStopLoss: 3,
                maxTakeProfit: 40,
                minTakeProfit: 8,
                maxPositionSize: 50
            },
            'premium': {
                maxLeverage: 20,
                maxStopLoss: 25,
                minStopLoss: 2,
                maxTakeProfit: 60,
                minTakeProfit: 5,
                maxPositionSize: 70
            },
            'elite': {
                maxLeverage: 50,
                maxStopLoss: 30,
                minStopLoss: 1,
                maxTakeProfit: 100,
                minTakeProfit: 3,
                maxPositionSize: 100
            }
        };

        const limite = limites[planType] || limites['standard'];
        
        return {
            leverage: Math.min(Math.max(parametros.leverage || 5, 1), limite.maxLeverage),
            stopLoss: Math.min(Math.max(parametros.stopLoss || 10, limite.minStopLoss), limite.maxStopLoss),
            takeProfit: Math.min(Math.max(parametros.takeProfit || 15, limite.minTakeProfit), limite.maxTakeProfit),
            positionSize: Math.min(Math.max(parametros.positionSize || 30, 5), limite.maxPositionSize),
            preferences: {
                autoCalculateTP: parametros.autoCalculateTP !== false,
                autoCalculateSL: parametros.autoCalculateSL !== false,
                riskManagement: parametros.riskManagement || 'conservative',
                allowOverride: parametros.allowOverride === true,
                ...parametros.preferences
            }
        };
    }

    async obterParametrosTradingUsuario(userId) {
        try {
            const result = await this.pool.query(`
                SELECT 
                    custom_leverage,
                    custom_stop_loss_percent,
                    custom_take_profit_percent,
                    custom_position_size_percent,
                    allow_custom_params,
                    trading_preferences,
                    plan_type
                FROM users 
                WHERE id = $1
            `, [userId]);

            if (result.rows.length === 0) {
                // Retornar parâmetros padrão se usuário não encontrado
                return this.obterParametrosPadrao();
            }

            const dados = result.rows[0];
            
            // ✅ SEMPRE usar padrões do sistema EXCETO se usuário EXPLICITAMENTE ativou personalização
            if (!dados.allow_custom_params || dados.allow_custom_params === false) {
                console.log(`📋 Usuário ${userId}: Usando configurações PADRÃO do sistema`);
                return {
                    ...this.obterParametrosPadrao(),
                    planType: dados.plan_type,
                    isCustom: false
                };
            }

            // Usuário tem personalização ATIVA - usar configurações customizadas
            console.log(`🎛️ Usuário ${userId}: Usando configurações PERSONALIZADAS`);
            return {
                leverage: parseFloat(dados.custom_leverage) || 5,
                stopLoss: parseFloat(dados.custom_stop_loss_percent) || 10,
                takeProfit: parseFloat(dados.custom_take_profit_percent) || 15,
                positionSize: parseFloat(dados.custom_position_size_percent) || 30,
                preferences: dados.trading_preferences || {},
                isCustom: true,
                planType: dados.plan_type
            };

        } catch (error) {
            console.error('❌ Erro ao obter parâmetros:', error.message);
            return this.obterParametrosPadrao();
        }
    }

    obterParametrosPadrao() {
        return {
            leverage: 5,              // ✅ Alavancagem padrão = 5x
            stopLoss: 10,            // ✅ SL = 2 × 5 = 10%
            takeProfit: 15,          // ✅ TP = 3 × 5 = 15%
            positionSize: 30,        // ✅ 30% do saldo
            preferences: {
                autoCalculateTP: true,
                autoCalculateSL: true,
                riskManagement: 'conservative',
                allowOverride: false
            },
            isCustom: false,
            planType: 'standard'
        };
    }

    async resetarParametrosUsuario(userId) {
        try {
            await this.pool.query(`
                UPDATE users SET 
                    custom_leverage = 5.00,
                    custom_stop_loss_percent = 10.00,
                    custom_take_profit_percent = 15.00,
                    custom_position_size_percent = 30.00,
                    allow_custom_params = false,
                    trading_preferences = '{}'::jsonb,
                    updated_at = NOW()
                WHERE id = $1
            `, [userId]);

            console.log(`🔄 Parâmetros resetados para padrão - Usuário ${userId}`);
            return true;

        } catch (error) {
            console.error('❌ Erro ao resetar parâmetros:', error.message);
            throw error;
        }
    }

    obterStatus() {
        return {
            id: this.id,
            nome: this.nome,
            tipo: this.tipo,
            status: this.status,
            metricas: this.metricas
        };
    }

    async finalizar() {
        console.log(`🔄 Finalizando ${this.nome}`);
        this.status = 'finalizado';
        await this.pool.end();
    }
}

// Inicializar se executado diretamente
if (require.main === module) {
    const componente = new UserManager();
    componente.inicializar().catch(console.error);
}

module.exports = UserManager;
