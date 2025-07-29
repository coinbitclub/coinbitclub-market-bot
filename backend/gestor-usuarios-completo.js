/**
 * 👥 GESTOR DE USUÁRIOS COMPLETO
 * Sistema completo para gerenciamento de usuários, perfis e permissões
 * Conforme especificação técnica com saldos mínimos por país
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

console.log('👥 GESTOR DE USUÁRIOS COMPLETO');
console.log('=============================');

class GestorUsuarios {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.configuracoes = {
            saldo_minimo: {
                brasil: 60.00,
                internacional: 20.00
            },
            saldos_minimos: {
                brasil: { valor: 60.00, moeda: 'BRL' },
                outros: { valor: 20.00, moeda: 'USD' }
            },
            perfis: {
                free: {
                    nome: 'Usuário Free',
                    limits: { operations_per_day: 5, max_balance: 1000 },
                    comissao: 0.20 // 20%
                },
                premium: {
                    nome: 'Usuário Premium',
                    limits: { operations_per_day: 50, max_balance: 10000 },
                    comissao: 0.10 // 10%
                },
                admin: {
                    nome: 'Administrador',
                    limits: { operations_per_day: -1, max_balance: -1 },
                    comissao: 0.05 // 5%
                },
                // Nomes alternativos para compatibilidade
                usuario_free: {
                    nome: 'Usuário Free',
                    limits: { operations_per_day: 5, max_balance: 1000 },
                    comissao: 0.20 // 20%
                },
                usuario_premium: {
                    nome: 'Usuário Premium',
                    limits: { operations_per_day: 50, max_balance: 10000 },
                    comissao: 0.10 // 10%
                },
                administrador: {
                    nome: 'Administrador',
                    limits: { operations_per_day: -1, max_balance: -1 },
                    comissao: 0.05 // 5%
                }
            },
            validacao: {
                password_min_length: 8,
                username_min_length: 3,
                session_duration: 24 * 60 * 60 * 1000, // 24 horas
                max_login_attempts: 5,
                lockout_duration: 30 * 60 * 1000 // 30 minutos
            },
            operacoes: {
                max_operations: 2,             // Máximo 2 operações simultâneas
                max_daily_operations: 10       // Máximo 10 operações por dia
            },
            parametrizacao: {
                balance_percentage: 30,        // 30% do saldo por operação
                leverage_default: 5,           // 5x alavancagem padrão
                take_profit_multiplier: 3,     // TP = 3x alavancagem
                stop_loss_multiplier: 2,       // SL = 2x alavancagem
                max_operations: 2              // Máximo 2 operações simultâneas
            }
        };

        this.estatisticas = {
            usuarios_total: 0,
            usuarios_ativos: 0,
            usuarios_verificados: 0,
            logins_hoje: 0,
            registros_hoje: 0
        };
    }

    // ========================================
    // 1. REGISTRO DE USUÁRIOS
    // ========================================

    async registrarUsuario(dadosUsuario) {
        console.log(`👤 Registrando usuário: ${dadosUsuario.username}`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Validar dados básicos
            await this.validarDadosRegistro(dadosUsuario, client);

            // Hash da senha
            const senhaHash = await bcrypt.hash(dadosUsuario.password, 12);

            // Determinar país e saldo mínimo
            const pais = this.detectarPais(dadosUsuario.phone || dadosUsuario.country);
            const saldoMinimo = pais === 'BR' ? 
                this.configuracoes.saldos_minimos.brasil :
                this.configuracoes.saldos_minimos.outros;

            // Criar usuário
            const usuario = await client.query(`
                INSERT INTO users (
                    username, email, password_hash, phone, country,
                    first_name, last_name, status, profile_type,
                    balance_minimum, balance_currency,
                    created_at, email_verified, phone_verified
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', 'usuario_free', $8, $9, NOW(), false, false)
                RETURNING id, username, email;
            `, [
                dadosUsuario.username,
                dadosUsuario.email,
                senhaHash,
                dadosUsuario.phone,
                pais,
                dadosUsuario.first_name || '',
                dadosUsuario.last_name || '',
                saldoMinimo.valor,
                saldoMinimo.moeda
            ]);

            const userId = usuario.rows[0].id;

            // Criar saldo inicial
            await client.query(`
                INSERT INTO user_balances_local (
                    user_id, balance, currency, updated_at
                ) VALUES ($1, 0.00, $2, NOW());
            `, [userId, saldoMinimo.moeda]);

            // Criar parametrização padrão
            await this.criarParametrizacaoPadrao(userId, client);

            // Criar configurações de segurança
            await this.criarConfiguracaoSeguranca(userId, client);

            // Registrar evento
            await this.registrarEvento(userId, 'user_registration', {
                username: dadosUsuario.username,
                country: pais,
                registration_ip: dadosUsuario.ip || 'unknown'
            }, client);

            await client.query('COMMIT');

            console.log(`✅ Usuário ${dadosUsuario.username} registrado com sucesso (ID: ${userId})`);

            this.estatisticas.usuarios_total++;
            this.estatisticas.registros_hoje++;

            return {
                success: true,
                user_id: userId,
                username: dadosUsuario.username,
                country: pais,
                balance_minimum: saldoMinimo,
                requires_phone_verification: true,
                requires_email_verification: true
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao registrar usuário:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async validarDadosRegistro(dados, client) {
        // Validar username único
        const usernameExiste = await client.query(`
            SELECT id FROM users WHERE username = $1;
        `, [dados.username]);

        if (usernameExiste.rows.length > 0) {
            throw new Error('Username já está em uso');
        }

        // Validar email único
        const emailExiste = await client.query(`
            SELECT id FROM users WHERE email = $1;
        `, [dados.email]);

        if (emailExiste.rows.length > 0) {
            throw new Error('Email já está em uso');
        }

        // Validar telefone único se fornecido
        if (dados.phone) {
            const phoneExiste = await client.query(`
                SELECT id FROM users WHERE phone = $1;
            `, [dados.phone]);

            if (phoneExiste.rows.length > 0) {
                throw new Error('Telefone já está em uso');
            }
        }

        // Validar formato de dados
        if (dados.username.length < this.configuracoes.validacao.username_min_length) {
            throw new Error('Username muito curto');
        }

        if (dados.password.length < this.configuracoes.validacao.password_min_length) {
            throw new Error('Senha muito curta');
        }

        if (!this.validarEmail(dados.email)) {
            throw new Error('Email inválido');
        }
    }

    // ========================================
    // 2. AUTENTICAÇÃO E LOGIN
    // ========================================

    async autenticarUsuario(credential, password, ip = 'unknown') {
        console.log(`🔐 Tentativa de login: ${credential}`);

        const client = await this.pool.connect();
        try {
            // Buscar usuário por username ou email
            const usuario = await client.query(`
                SELECT 
                    id, username, email, password_hash, status,
                    profile_type, login_attempts, locked_until,
                    phone_verified, email_verified, country
                FROM users 
                WHERE username = $1 OR email = $1;
            `, [credential]);

            if (usuario.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            }

            const user = usuario.rows[0];

            // Verificar se conta está bloqueada
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                const tempoRestante = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
                throw new Error(`Conta bloqueada. Tente novamente em ${tempoRestante} minutos`);
            }

            // Verificar status da conta
            if (user.status !== 'active') {
                throw new Error('Conta inativa ou suspensa');
            }

            // Verificar senha
            const senhaValida = await bcrypt.compare(password, user.password_hash);
            
            if (!senhaValida) {
                // Incrementar tentativas de login
                await this.incrementarTentativasLogin(user.id, client);
                throw new Error('Senha inválida');
            }

            // Reset tentativas de login
            await client.query(`
                UPDATE users 
                SET login_attempts = 0, locked_until = NULL, last_login = NOW()
                WHERE id = $1;
            `, [user.id]);

            // Criar sessão
            const sessionToken = await this.criarSessao(user.id, ip, client);

            // Registrar evento de login
            await this.registrarEvento(user.id, 'user_login', {
                ip,
                user_agent: 'unknown',
                success: true
            }, client);

            console.log(`✅ Login bem-sucedido: ${user.username}`);

            this.estatisticas.logins_hoje++;

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    profile_type: user.profile_type,
                    phone_verified: user.phone_verified,
                    email_verified: user.email_verified,
                    country: user.country
                },
                session_token: sessionToken,
                expires_at: new Date(Date.now() + this.configuracoes.validacao.session_duration)
            };

        } catch (error) {
            // Registrar tentativa falhada se usuário existe
            if (error.message !== 'Usuário não encontrado') {
                await this.registrarEvento(null, 'login_failed', {
                    credential,
                    ip,
                    error: error.message
                }, client);
            }

            console.error('Erro na autenticação:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async incrementarTentativasLogin(userId, client) {
        const resultado = await client.query(`
            UPDATE users 
            SET login_attempts = login_attempts + 1
            WHERE id = $1
            RETURNING login_attempts;
        `, [userId]);

        const tentativas = resultado.rows[0].login_attempts;

        // Bloquear conta se muitas tentativas
        if (tentativas >= this.configuracoes.validacao.max_login_attempts) {
            const lockedUntil = new Date(Date.now() + this.configuracoes.validacao.lockout_duration);
            
            await client.query(`
                UPDATE users 
                SET locked_until = $1
                WHERE id = $2;
            `, [lockedUntil, userId]);

            console.log(`🔒 Conta bloqueada por tentativas excessivas: ${userId}`);
        }
    }

    // ========================================
    // 3. GESTÃO DE SESSÕES
    // ========================================

    async criarSessao(userId, ip, client) {
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + this.configuracoes.validacao.session_duration);

        await client.query(`
            INSERT INTO user_sessions (
                user_id, session_token, ip_address, expires_at, created_at
            ) VALUES ($1, $2, $3, $4, NOW());
        `, [userId, sessionToken, ip, expiresAt]);

        return sessionToken;
    }

    async validarSessao(sessionToken) {
        const client = await this.pool.connect();
        try {
            const sessao = await client.query(`
                SELECT 
                    us.user_id, us.expires_at, us.ip_address,
                    u.username, u.status, u.profile_type
                FROM user_sessions us
                JOIN users u ON us.user_id = u.id
                WHERE us.session_token = $1
                AND us.expires_at > NOW()
                AND u.status = 'active';
            `, [sessionToken]);

            if (sessao.rows.length === 0) {
                return null;
            }

            // Atualizar última atividade
            await client.query(`
                UPDATE user_sessions 
                SET last_activity = NOW()
                WHERE session_token = $1;
            `, [sessionToken]);

            return sessao.rows[0];

        } finally {
            client.release();
        }
    }

    async invalidarSessao(sessionToken) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                DELETE FROM user_sessions 
                WHERE session_token = $1;
            `, [sessionToken]);

            console.log('🚪 Sessão invalidada');

        } finally {
            client.release();
        }
    }

    // ========================================
    // 4. PARAMETRIZAÇÃO DE USUÁRIOS
    // ========================================

    async criarParametrizacaoPadrao(userId, client) {
        const config = this.configuracoes.parametrizacao;
        
        await client.query(`
            INSERT INTO user_configurations (
                user_id, balance_percentage, leverage_default,
                take_profit_multiplier, stop_loss_multiplier,
                max_simultaneous_operations, auto_trading_enabled,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW());
        `, [
            userId,
            config.balance_percentage,
            config.leverage_default,
            config.take_profit_multiplier,
            config.stop_loss_multiplier,
            config.max_operations
        ]);

        console.log(`⚙️ Parametrização padrão criada para usuário ${userId}`);
    }

    async atualizarParametrizacao(userId, novaParametrizacao) {
        const client = await this.pool.connect();
        try {
            const campos = [];
            const valores = [];
            let contador = 1;

            // Construir query dinâmica
            for (const [campo, valor] of Object.entries(novaParametrizacao)) {
                if (this.configuracoes.parametrizacao.hasOwnProperty(campo.replace('_default', '').replace('_multiplier', '').replace('_percentage', '').replace('max_', '').replace('_operations', ''))) {
                    campos.push(`${campo} = $${contador}`);
                    valores.push(valor);
                    contador++;
                }
            }

            if (campos.length === 0) {
                throw new Error('Nenhum campo válido para atualização');
            }

            valores.push(userId);
            
            await client.query(`
                UPDATE user_configurations 
                SET ${campos.join(', ')}, updated_at = NOW()
                WHERE user_id = $${contador};
            `, valores);

            // Registrar evento
            await this.registrarEvento(userId, 'configuration_updated', novaParametrizacao, client);

            console.log(`⚙️ Parametrização atualizada para usuário ${userId}`);

            return { success: true };

        } catch (error) {
            console.error('Erro ao atualizar parametrização:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 5. GESTÃO DE PERFIS
    // ========================================

    async alterarPerfilUsuario(userId, novoPerfil, adminId) {
        if (!this.configuracoes.perfis[novoPerfil]) {
            throw new Error('Perfil inválido');
        }

        const client = await this.pool.connect();
        try {
            // Verificar se admin tem permissão
            const admin = await client.query(`
                SELECT profile_type FROM users WHERE id = $1;
            `, [adminId]);

            if (admin.rows.length === 0 || admin.rows[0].profile_type !== 'administrador') {
                throw new Error('Permissão negada');
            }

            // Atualizar perfil
            await client.query(`
                UPDATE users 
                SET profile_type = $1, updated_at = NOW()
                WHERE id = $2;
            `, [novoPerfil, userId]);

            // Registrar evento
            await this.registrarEvento(userId, 'profile_changed', {
                new_profile: novoPerfil,
                changed_by: adminId
            }, client);

            console.log(`👑 Perfil alterado para ${novoPerfil} (usuário ${userId})`);

            return { success: true };

        } catch (error) {
            console.error('Erro ao alterar perfil:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async verificarPermissoes(userId, acao) {
        const client = await this.pool.connect();
        try {
            const usuario = await client.query(`
                SELECT profile_type FROM users WHERE id = $1;
            `, [userId]);

            if (usuario.rows.length === 0) {
                return false;
            }

            const perfil = this.configuracoes.perfis[usuario.rows[0].profile_type];
            
            // Definir permissões por ação
            const permissoes = {
                'create_operation': ['usuario_free', 'usuario_premium', 'administrador'],
                'modify_settings': ['usuario_premium', 'administrador'],
                'admin_panel': ['administrador'],
                'view_all_users': ['administrador'],
                'manage_api_keys': ['usuario_premium', 'administrador']
            };

            return permissoes[acao]?.includes(usuario.rows[0].profile_type) || false;

        } finally {
            client.release();
        }
    }

    // ========================================
    // 6. VERIFICAÇÃO E VALIDAÇÃO
    // ========================================

    async verificarEmail(userId, token) {
        const client = await this.pool.connect();
        try {
            // Buscar token de verificação
            const verificacao = await client.query(`
                SELECT id FROM email_verifications 
                WHERE user_id = $1 AND token = $2 
                AND expires_at > NOW() AND verified_at IS NULL;
            `, [userId, token]);

            if (verificacao.rows.length === 0) {
                throw new Error('Token de verificação inválido ou expirado');
            }

            // Marcar email como verificado
            await client.query(`
                UPDATE users 
                SET email_verified = true, email_verified_at = NOW()
                WHERE id = $1;
            `, [userId]);

            // Marcar verificação como usada
            await client.query(`
                UPDATE email_verifications 
                SET verified_at = NOW()
                WHERE id = $1;
            `, [verificacao.rows[0].id]);

            console.log(`✅ Email verificado para usuário ${userId}`);

            return { success: true };

        } catch (error) {
            console.error('Erro ao verificar email:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async verificarSaldoMinimo(userId) {
        const client = await this.pool.connect();
        try {
            const dados = await client.query(`
                SELECT 
                    u.balance_minimum, u.balance_currency, u.country,
                    ubl.balance
                FROM users u
                LEFT JOIN user_balances_local ubl ON u.id = ubl.user_id
                WHERE u.id = $1;
            `, [userId]);

            if (dados.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            }

            const user = dados.rows[0];
            const saldoAtual = parseFloat(user.balance || 0);
            const minimoRequerido = parseFloat(user.balance_minimum);

            return {
                tem_saldo_minimo: saldoAtual >= minimoRequerido,
                saldo_atual: saldoAtual,
                minimo_requerido: minimoRequerido,
                moeda: user.balance_currency,
                pais: user.country
            };

        } finally {
            client.release();
        }
    }

    // ========================================
    // 7. UTILITÁRIOS
    // ========================================

    detectarPais(entrada) {
        if (!entrada) return 'US';
        
        // Detectar por telefone
        if (entrada.startsWith('+55')) return 'BR';
        if (entrada.startsWith('+1')) return 'US';
        
        // Detectar por código de país
        if (entrada.toUpperCase() === 'BR' || entrada.toUpperCase() === 'BRASIL') return 'BR';
        
        return 'US'; // Default
    }

    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    async criarConfiguracaoSeguranca(userId, client) {
        await client.query(`
            INSERT INTO user_security_settings (
                user_id, two_factor_enabled, login_notifications,
                withdrawal_notifications, api_notifications,
                created_at, updated_at
            ) VALUES ($1, false, true, true, true, NOW(), NOW());
        `, [userId]);
    }

    async registrarEvento(userId, tipo, dados, client) {
        await client.query(`
            INSERT INTO user_events (
                user_id, event_type, event_data, created_at
            ) VALUES ($1, $2, $3, NOW());
        `, [userId, tipo, JSON.stringify(dados)]);
    }

    // ========================================
    // 8. RELATÓRIOS E ESTATÍSTICAS
    // ========================================

    async obterEstatisticasUsuarios() {
        const client = await this.pool.connect();
        try {
            const stats = await client.query(`
                SELECT 
                    COUNT(*) as total_usuarios,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as usuarios_ativos,
                    COUNT(CASE WHEN email_verified = true THEN 1 END) as emails_verificados,
                    COUNT(CASE WHEN phone_verified = true THEN 1 END) as telefones_verificados,
                    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as registros_hoje,
                    COUNT(CASE WHEN DATE(last_login) = CURRENT_DATE THEN 1 END) as logins_hoje
                FROM users;
            `);

            const perfisPorTipo = await client.query(`
                SELECT 
                    profile_type,
                    COUNT(*) as quantidade
                FROM users
                GROUP BY profile_type;
            `);

            const paisesDistribuicao = await client.query(`
                SELECT 
                    country,
                    COUNT(*) as quantidade
                FROM users
                GROUP BY country
                ORDER BY quantidade DESC;
            `);

            return {
                estatisticas_gerais: stats.rows[0],
                distribuicao_perfis: perfisPorTipo.rows,
                distribuicao_paises: paisesDistribuicao.rows,
                configuracoes_sistema: this.configuracoes
            };

        } finally {
            client.release();
        }
    }

    obterStatus() {
        return {
            estatisticas: this.estatisticas,
            configuracoes_ativas: Object.keys(this.configuracoes),
            perfis_disponiveis: Object.keys(this.configuracoes.perfis)
        };
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const gestorUsuarios = new GestorUsuarios();
    
    console.log('✅ Gestor de Usuários iniciado');
    console.log('📊 Status:', gestorUsuarios.obterStatus());
}

module.exports = GestorUsuarios;
