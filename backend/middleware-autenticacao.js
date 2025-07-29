/**
 * 🔐 MIDDLEWARE DE AUTENTICAÇÃO AVANÇADO
 * Sistema completo de autenticação, recuperação de senha e controle de acesso
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

console.log('🔐 MIDDLEWARE DE AUTENTICAÇÃO');
console.log('============================');

class MiddlewareAutenticacao {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.jwtSecret = process.env.JWT_SECRET || 'coinbitclub-jwt-secret-2025';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
        
        // Configurar email para recuperação de senha
        this.emailTransporter = this.configurarEmailTransporter();
        
        // URLs do frontend
        this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        
        // Configurações de segurança
        this.saltRounds = 12;
        this.tokenRecuperacaoExpira = 30 * 60 * 1000; // 30 minutos
        this.maxTentativasLogin = 5;
        this.bloqueioLoginDuracao = 15 * 60 * 1000; // 15 minutos

        // ========================================
        // ÁREAS DE ACESSO POR ROLE
        // ========================================
        this.areasAcesso = {
            admin: [
                '/admin',
                '/admin/usuarios',
                '/admin/operacoes',
                '/admin/configuracoes',
                '/admin/logs',
                '/admin/relatorios',
                '/admin/sistema',
                '/api/admin/*'
            ],
            user: [
                '/dashboard',
                '/trading',
                '/operacoes',
                '/perfil',
                '/saldos',
                '/historico',
                '/configuracoes',
                '/api/user/*',
                '/api/gestores/*'
            ],
            affiliate: [
                '/afiliados',
                '/dashboard-afiliado',
                '/comissoes',
                '/indicacoes',
                '/vinculacoes',
                '/perfil',
                '/api/affiliate/*',
                '/api/gestores/afiliados/*'
            ]
        };

        // Redirecionamentos após login por role
        this.redirecionamentosLogin = {
            admin: '/admin/dashboard',
            user: '/dashboard',
            affiliate: '/afiliados/dashboard'
        };
    }

    configurarEmailTransporter() {
        if (!process.env.EMAIL_HOST) {
            console.log('⚠️ Configurações de email não encontradas - emails simulados');
            return null;
        }

        return nodemailer.createTransporter({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    // ========================================
    // 1. REGISTRO DE USUÁRIOS
    // ========================================

    async registrarUsuario(dadosUsuario) {
        console.log(`👤 Registrando novo usuário: ${dadosUsuario.email}`);

        const client = await this.pool.connect();
        
        try {
            const { username, email, password, firstName, lastName, country } = dadosUsuario;

            // Verificar se email já existe
            const emailExiste = await client.query(
                'SELECT id FROM users WHERE email = $1', [email]
            );

            if (emailExiste.rows.length > 0) {
                throw new Error('Email já cadastrado no sistema');
            }

            // Verificar se username já existe
            const usernameExiste = await client.query(
                'SELECT id FROM users WHERE username = $1', [username]
            );

            if (usernameExiste.rows.length > 0) {
                throw new Error('Nome de usuário já existe');
            }

            // Criptografar senha
            const passwordHash = await bcrypt.hash(password, this.saltRounds);

            // Gerar token de confirmação de email
            const tokenConfirmacao = crypto.randomBytes(32).toString('hex');

            // Inserir usuário
            const resultado = await client.query(`
                INSERT INTO users (
                    username, email, password_hash, first_name, last_name,
                    country, role, status, subscription_plan, 
                    email_confirmation_token, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                RETURNING id, username, email, role, status
            `, [
                username, email, passwordHash, firstName, lastName,
                country, 'user', 'pending_confirmation', 'free',
                tokenConfirmacao
            ]);

            const novoUsuario = resultado.rows[0];

            // Enviar email de confirmação
            await this.enviarEmailConfirmacao(email, tokenConfirmacao, firstName);

            console.log(`✅ Usuário registrado - ID: ${novoUsuario.id}`);

            return {
                sucesso: true,
                usuario: {
                    id: novoUsuario.id,
                    username: novoUsuario.username,
                    email: novoUsuario.email,
                    status: novoUsuario.status
                },
                mensagem: 'Usuário registrado com sucesso. Verifique seu email para confirmar a conta.'
            };

        } catch (error) {
            console.error('❌ Erro no registro:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async confirmarEmail(token) {
        console.log('📧 Confirmando email com token');

        const client = await this.pool.connect();
        
        try {
            const resultado = await client.query(`
                UPDATE users 
                SET status = 'active', 
                    email_confirmation_token = NULL,
                    email_confirmed_at = NOW()
                WHERE email_confirmation_token = $1
                AND status = 'pending_confirmation'
                RETURNING id, username, email
            `, [token]);

            if (resultado.rows.length === 0) {
                throw new Error('Token de confirmação inválido ou expirado');
            }

            const usuario = resultado.rows[0];
            console.log(`✅ Email confirmado para usuário ${usuario.username}`);

            return {
                sucesso: true,
                usuario: usuario,
                mensagem: 'Email confirmado com sucesso. Você já pode fazer login.'
            };

        } catch (error) {
            console.error('❌ Erro na confirmação:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 2. LOGIN E AUTENTICAÇÃO
    // ========================================

    async fazerLogin(email, password) {
        console.log(`🔑 Tentativa de login: ${email}`);

        const client = await this.pool.connect();
        
        try {
            // Verificar se conta está bloqueada
            await this.verificarBloqueioLogin(email, client);

            // Buscar usuário
            const resultado = await client.query(`
                SELECT id, username, email, password_hash, role, status, 
                       subscription_plan, login_attempts, blocked_until
                FROM users WHERE email = $1
            `, [email]);

            if (resultado.rows.length === 0) {
                await this.registrarTentativaLogin(email, false, client);
                throw new Error('Email ou senha incorretos');
            }

            const usuario = resultado.rows[0];

            // Verificar status da conta
            if (usuario.status === 'pending_confirmation') {
                throw new Error('Conta pendente de confirmação. Verifique seu email.');
            }

            if (usuario.status === 'blocked') {
                throw new Error('Conta bloqueada. Entre em contato com o suporte.');
            }

            if (usuario.status !== 'active') {
                throw new Error('Conta inativa. Entre em contato com o suporte.');
            }

            // Verificar senha
            const senhaValida = await bcrypt.compare(password, usuario.password_hash);
            
            if (!senhaValida) {
                await this.registrarTentativaLogin(email, false, client);
                throw new Error('Email ou senha incorretos');
            }

            // Login bem-sucedido - limpar tentativas
            await this.limparTentativasLogin(email, client);

            // Gerar JWT
            const token = this.gerarJWT({
                id: usuario.id,
                username: usuario.username,
                email: usuario.email,
                role: usuario.role,
                subscriptionPlan: usuario.subscription_plan
            });

            // Atualizar último login
            await client.query(`
                UPDATE users 
                SET last_login = NOW(), 
                    login_attempts = 0,
                    blocked_until = NULL
                WHERE id = $1
            `, [usuario.id]);

            console.log(`✅ Login realizado com sucesso: ${usuario.username}`);

            return {
                sucesso: true,
                token: token,
                usuario: {
                    id: usuario.id,
                    username: usuario.username,
                    email: usuario.email,
                    role: usuario.role,
                    subscriptionPlan: usuario.subscription_plan
                },
                redirecionamento: this.obterRedirecionamentoPorRole(usuario.role)
            };

        } catch (error) {
            console.error('❌ Erro no login:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async verificarBloqueioLogin(email, client) {
        const resultado = await client.query(`
            SELECT login_attempts, blocked_until
            FROM users 
            WHERE email = $1
        `, [email]);

        if (resultado.rows.length > 0) {
            const { login_attempts, blocked_until } = resultado.rows[0];
            
            if (blocked_until && new Date(blocked_until) > new Date()) {
                const minutosBloqueio = Math.ceil((new Date(blocked_until) - new Date()) / (1000 * 60));
                throw new Error(`Conta temporariamente bloqueada. Tente novamente em ${minutosBloqueio} minutos.`);
            }
        }
    }

    async registrarTentativaLogin(email, sucesso, client) {
        if (sucesso) return;

        const resultado = await client.query(`
            UPDATE users 
            SET login_attempts = COALESCE(login_attempts, 0) + 1
            WHERE email = $1
            RETURNING login_attempts
        `, [email]);

        if (resultado.rows.length > 0) {
            const tentativas = resultado.rows[0].login_attempts;
            
            if (tentativas >= this.maxTentativasLogin) {
                const bloqueadoAte = new Date(Date.now() + this.bloqueioLoginDuracao);
                
                await client.query(`
                    UPDATE users 
                    SET blocked_until = $1
                    WHERE email = $2
                `, [bloqueadoAte, email]);

                console.log(`🚫 Conta bloqueada temporariamente: ${email}`);
            }
        }
    }

    async limparTentativasLogin(email, client) {
        await client.query(`
            UPDATE users 
            SET login_attempts = 0, 
                blocked_until = NULL
            WHERE email = $1
        `, [email]);
    }

    obterRedirecionamentoPorRole(role) {
        const redirecionamentos = {
            'admin': '/admin/dashboard',
            'user': '/dashboard',
            'affiliate': '/affiliate/dashboard',
            'premium': '/premium/dashboard',
            'vip': '/vip/dashboard'
        };

        return redirecionamentos[role] || '/dashboard';
    }

    // ========================================
    // 3. RECUPERAÇÃO DE SENHA
    // ========================================

    async solicitarRecuperacaoSenha(email) {
        console.log(`🔑 Solicitação de recuperação de senha: ${email}`);

        const client = await this.pool.connect();
        
        try {
            // Verificar se usuário existe
            const usuario = await client.query(`
                SELECT id, username, first_name 
                FROM users 
                WHERE email = $1 AND status = 'active'
            `, [email]);

            if (usuario.rows.length === 0) {
                // Por segurança, não revelar se email existe ou não
                console.log(`⚠️ Email não encontrado: ${email}`);
                return {
                    sucesso: true,
                    mensagem: 'Se o email estiver cadastrado, você receberá as instruções de recuperação.'
                };
            }

            const { id, username, first_name } = usuario.rows[0];

            // Gerar token de recuperação
            const tokenRecuperacao = crypto.randomBytes(32).toString('hex');
            const expiraEm = new Date(Date.now() + this.tokenRecuperacaoExpira);

            // Salvar token no banco
            await client.query(`
                UPDATE users 
                SET password_reset_token = $1,
                    password_reset_expires = $2
                WHERE id = $3
            `, [tokenRecuperacao, expiraEm, id]);

            // Enviar email de recuperação
            await this.enviarEmailRecuperacao(email, tokenRecuperacao, first_name);

            console.log(`✅ Token de recuperação enviado para: ${email}`);

            return {
                sucesso: true,
                mensagem: 'Instruções de recuperação enviadas para seu email.'
            };

        } catch (error) {
            console.error('❌ Erro na recuperação:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async redefinirSenha(token, novaSenha) {
        console.log('🔑 Redefinindo senha com token');

        const client = await this.pool.connect();
        
        try {
            // Verificar token
            const resultado = await client.query(`
                SELECT id, username, email
                FROM users 
                WHERE password_reset_token = $1
                AND password_reset_expires > NOW()
                AND status = 'active'
            `, [token]);

            if (resultado.rows.length === 0) {
                throw new Error('Token de recuperação inválido ou expirado');
            }

            const usuario = resultado.rows[0];

            // Criptografar nova senha
            const novaSenhaHash = await bcrypt.hash(novaSenha, this.saltRounds);

            // Atualizar senha e limpar token
            await client.query(`
                UPDATE users 
                SET password_hash = $1,
                    password_reset_token = NULL,
                    password_reset_expires = NULL,
                    login_attempts = 0,
                    blocked_until = NULL,
                    password_changed_at = NOW()
                WHERE id = $2
            `, [novaSenhaHash, usuario.id]);

            console.log(`✅ Senha redefinida para usuário: ${usuario.username}`);

            return {
                sucesso: true,
                usuario: {
                    username: usuario.username,
                    email: usuario.email
                },
                mensagem: 'Senha redefinida com sucesso. Você já pode fazer login.'
            };

        } catch (error) {
            console.error('❌ Erro na redefinição:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 4. MIDDLEWARE DE VERIFICAÇÃO
    // ========================================

    verificarAutenticacao(req, res, next) {
        try {
            const token = this.extrairToken(req);
            
            if (!token) {
                return res.status(401).json({
                    sucesso: false,
                    erro: 'Token de acesso necessário'
                });
            }

            const decoded = jwt.verify(token, this.jwtSecret);
            req.usuario = decoded;
            
            next();

        } catch (error) {
            return res.status(401).json({
                sucesso: false,
                erro: 'Token inválido ou expirado'
            });
        }
    }

    verificarPermissao(rolesPermitidos) {
        return async (req, res, next) => {
            try {
                if (!req.usuario) {
                    return res.status(401).json({
                        sucesso: false,
                        erro: 'Usuário não autenticado'
                    });
                }

                // Verificar se o usuário ainda está ativo
                const usuarioAtual = await this.verificarStatusUsuario(req.usuario.id);
                
                if (!usuarioAtual.ativo) {
                    return res.status(403).json({
                        sucesso: false,
                        erro: 'Conta inativa ou bloqueada'
                    });
                }

                // Verificar role
                if (!rolesPermitidos.includes(req.usuario.role)) {
                    return res.status(403).json({
                        sucesso: false,
                        erro: 'Permissão insuficiente'
                    });
                }

                // Verificar se usuário pode transacionar
                if (!usuarioAtual.podeTransacionar) {
                    req.podeTransacionar = false;
                } else {
                    req.podeTransacionar = true;
                }

                next();

            } catch (error) {
                return res.status(500).json({
                    sucesso: false,
                    erro: 'Erro na verificação de permissão'
                });
            }
        };
    }

    // ========================================
    // 5. VERIFICAÇÕES DE SEGURANÇA
    // ========================================

    async verificarStatusUsuario(userId) {
        const client = await this.pool.connect();
        
        try {
            const resultado = await client.query(`
                SELECT 
                    u.status,
                    u.subscription_plan,
                    u.email_confirmed_at,
                    COUNT(uak.id) as chaves_configuradas,
                    COUNT(ub.asset) as saldos_disponiveis
                FROM users u
                LEFT JOIN user_api_keys uak ON u.id = uak.user_id AND uak.status = 'active'
                LEFT JOIN user_balances ub ON u.id = ub.user_id AND ub.free_balance > 0
                WHERE u.id = $1
                GROUP BY u.id, u.status, u.subscription_plan, u.email_confirmed_at
            `, [userId]);

            if (resultado.rows.length === 0) {
                return { ativo: false, podeTransacionar: false };
            }

            const usuario = resultado.rows[0];
            const ativo = usuario.status === 'active';
            const emailConfirmado = usuario.email_confirmed_at !== null;
            const temChaves = usuario.chaves_configuradas > 0;
            const temSaldo = usuario.saldos_disponiveis > 0;
            const planoPermiteTransacao = usuario.subscription_plan !== 'free';

            return {
                ativo: ativo,
                emailConfirmado: emailConfirmado,
                podeTransacionar: ativo && emailConfirmado && temChaves && planoPermiteTransacao,
                temChaves: temChaves,
                temSaldo: temSaldo,
                subscriptionPlan: usuario.subscription_plan
            };

        } finally {
            client.release();
        }
    }

    extrairToken(req) {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        
        return req.headers['x-access-token'] || req.query.token;
    }

    gerarJWT(payload) {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiresIn,
            issuer: 'coinbitclub',
            audience: 'coinbitclub-users'
        });
    }

    // ========================================
    // 5.5. VERIFICAÇÃO DE ÁREA DE ACESSO
    // ========================================

    verificarAcessoArea(req, res, next) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    sucesso: false,
                    erro: 'Usuário não autenticado',
                    redirecionamento: '/login'
                });
            }

            const rotaAtual = req.path;
            const roleUsuario = req.usuario.role;

            // Verificar se usuário tem acesso à área
            const temPermissao = this.verificarPermissaoArea(roleUsuario, rotaAtual);
            
            if (!temPermissao) {
                const areaPermitida = this.obterRedirecionamentoPorRole(roleUsuario);
                
                return res.status(403).json({
                    sucesso: false,
                    erro: 'Acesso negado para esta área',
                    redirecionamento: areaPermitida,
                    areaPermitida: areaPermitida
                });
            }

            // Garantir que usuário só acesse suas próprias informações
            if (req.params.userId && req.params.userId !== req.usuario.id.toString()) {
                if (roleUsuario !== 'admin') {
                    return res.status(403).json({
                        sucesso: false,
                        erro: 'Acesso negado - dados de outro usuário'
                    });
                }
            }

            next();

        } catch (error) {
            console.error('❌ Erro na verificação de área:', error.message);
            return res.status(500).json({
                sucesso: false,
                erro: 'Erro interno na verificação de acesso'
            });
        }
    }

    verificarPermissaoArea(role, rota) {
        const areasPermitidas = this.areasAcesso[role] || [];
        
        // Verificar rotas exatas e wildcards
        return areasPermitidas.some(area => {
            if (area.endsWith('/*')) {
                const prefixo = area.replace('/*', '');
                return rota.startsWith(prefixo);
            } else {
                return rota === area || rota.startsWith(area + '/');
            }
        });
    }

    // Middleware específico para garantir acesso apenas aos próprios dados
    garantirAcessoProprioDados() {
        return (req, res, next) => {
            try {
                // Para rotas de API que incluem userId
                if (req.params.userId) {
                    const userIdRota = parseInt(req.params.userId);
                    const userIdToken = req.usuario.id;

                    // Admin pode acessar dados de qualquer usuário
                    if (req.usuario.role === 'admin') {
                        return next();
                    }

                    // Usuário só pode acessar seus próprios dados
                    if (userIdRota !== userIdToken) {
                        return res.status(403).json({
                            sucesso: false,
                            erro: 'Acesso negado - você só pode acessar seus próprios dados'
                        });
                    }
                }

                // Para consultas que incluem filtros por usuário
                if (req.query.userId && req.usuario.role !== 'admin') {
                    req.query.userId = req.usuario.id.toString();
                }

                // Para dados no corpo da requisição
                if (req.body.userId && req.usuario.role !== 'admin') {
                    req.body.userId = req.usuario.id;
                }

                next();

            } catch (error) {
                console.error('❌ Erro na verificação de dados próprios:', error.message);
                return res.status(500).json({
                    sucesso: false,
                    erro: 'Erro interno na verificação de acesso'
                });
            }
        };
    }

    // ========================================
    // 6. ENVIO DE EMAILS
    // ========================================

    async enviarEmailConfirmacao(email, token, firstName) {
        const linkConfirmacao = `${this.frontendUrl}/confirmar-email?token=${token}`;
        
        const html = this.templateEmailConfirmacao(firstName, linkConfirmacao);
        
        return this.enviarEmail(
            email,
            'Confirme sua conta - CoinbitClub',
            html
        );
    }

    async enviarEmailRecuperacao(email, token, firstName) {
        const linkRecuperacao = `${this.frontendUrl}/redefinir-senha?token=${token}`;
        
        const html = this.templateEmailRecuperacao(firstName, linkRecuperacao);
        
        return this.enviarEmail(
            email,
            'Recuperação de senha - CoinbitClub',
            html
        );
    }

    async enviarEmail(destinatario, assunto, html) {
        if (!this.emailTransporter) {
            console.log(`📧 EMAIL SIMULADO para ${destinatario}: ${assunto}`);
            return true;
        }

        try {
            await this.emailTransporter.sendMail({
                from: `"CoinbitClub" <${process.env.EMAIL_FROM}>`,
                to: destinatario,
                subject: assunto,
                html: html
            });

            console.log(`✅ Email enviado para: ${destinatario}`);
            return true;

        } catch (error) {
            console.error(`❌ Erro ao enviar email:`, error.message);
            return false;
        }
    }

    templateEmailConfirmacao(firstName, link) {
        return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">Bem-vindo ao CoinbitClub, ${firstName}!</h2>
            <p>Obrigado por se cadastrar. Para ativar sua conta, clique no botão abaixo:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${link}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Confirmar Email
                </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
                Se você não se cadastrou no CoinbitClub, ignore este email.
            </p>
        </div>`;
    }

    templateEmailRecuperacao(firstName, link) {
        return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">Recuperação de Senha</h2>
            <p>Olá ${firstName},</p>
            <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${link}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Redefinir Senha
                </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
                Este link expira em 30 minutos. Se você não solicitou esta recuperação, ignore este email.
            </p>
        </div>`;
    }

    // ========================================
    // 7. ROTAS DE AUTENTICAÇÃO
    // ========================================

    configurarRotas(app) {
        console.log('🛣️ Configurando rotas de autenticação...');

        // Registro
        app.post('/auth/register', async (req, res) => {
            try {
                const resultado = await this.registrarUsuario(req.body);
                res.json(resultado);
            } catch (error) {
                res.status(400).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Confirmação de email
        app.post('/auth/confirm-email', async (req, res) => {
            try {
                const { token } = req.body;
                const resultado = await this.confirmarEmail(token);
                res.json(resultado);
            } catch (error) {
                res.status(400).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Login
        app.post('/auth/login', async (req, res) => {
            try {
                const { email, password } = req.body;
                const resultado = await this.fazerLogin(email, password);
                res.json(resultado);
            } catch (error) {
                res.status(401).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Solicitação de recuperação
        app.post('/auth/forgot-password', async (req, res) => {
            try {
                const { email } = req.body;
                const resultado = await this.solicitarRecuperacaoSenha(email);
                res.json(resultado);
            } catch (error) {
                res.status(400).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Redefinição de senha
        app.post('/auth/reset-password', async (req, res) => {
            try {
                const { token, password } = req.body;
                const resultado = await this.redefinirSenha(token, password);
                res.json(resultado);
            } catch (error) {
                res.status(400).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Verificar status do usuário
        app.get('/auth/me', this.verificarAutenticacao.bind(this), async (req, res) => {
            try {
                const status = await this.verificarStatusUsuario(req.usuario.id);
                res.json({
                    sucesso: true,
                    usuario: req.usuario,
                    status: status
                });
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        console.log('✅ Rotas de autenticação configuradas');
    }
}

// Função auxiliar para redirecionamento por perfil (para testes)
function redirecionarPorPerfil(role) {
    const redirecionamentos = {
        admin: '/admin/dashboard',
        user: '/dashboard',
        affiliate: '/afiliados/dashboard',
        guest: '/'
    };
    
    return redirecionamentos[role] || '/';
}

// Função auxiliar para verificar token (para testes)
function verificarToken(token) {
    try {
        if (!token) {
            return { valido: false, erro: 'Token não fornecido' };
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'coinbitclub-secret-2025');
        return { valido: true, usuario: decoded };
    } catch (error) {
        return { valido: false, erro: error.message };
    }
}

module.exports = MiddlewareAutenticacao;
module.exports.redirecionarPorPerfil = redirecionarPorPerfil;
module.exports.verificarToken = verificarToken;
