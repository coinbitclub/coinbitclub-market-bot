/**
 * 🔐 MIDDLEWARE DE AUTENTICAÇÃO E REDIRECIONAMENTO
 * Controle de acesso por papel e isolamento por ID de usuário
 */

const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

console.log('🔐 MIDDLEWARE DE AUTENTICAÇÃO');
console.log('============================');

class MiddlewareAuth {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.jwtSecret = process.env.JWT_SECRET || 'coinbitclub-secret-2025';
        
        // Definir áreas de acesso por papel
        this.areasAcesso = {
            admin: {
                rotas: ['/admin/*', '/api/admin/*', '/relatorios/*'],
                dashboard: '/admin/dashboard',
                descricao: 'Área administrativa completa'
            },
            manager: {
                rotas: ['/manager/*', '/api/manager/*', '/api/usuarios/*'],
                dashboard: '/manager/dashboard',
                descricao: 'Área de gerenciamento'
            },
            user: {
                rotas: ['/user/*', '/api/user/*', '/trading/*'],
                dashboard: '/user/dashboard',
                descricao: 'Área do usuário'
            },
            affiliate: {
                rotas: ['/affiliate/*', '/api/affiliate/*'],
                dashboard: '/affiliate/dashboard',
                descricao: 'Área do afiliado'
            }
        };
    }

    // ========================================
    // 1. MIDDLEWARE DE AUTENTICAÇÃO PRINCIPAL
    // ========================================

    autenticar() {
        return async (req, res, next) => {
            try {
                console.log(`🔍 Autenticando acesso a: ${req.path}`);

                // Extrair token do header
                const token = this.extrairToken(req);
                
                if (!token) {
                    return res.status(401).json({
                        erro: 'Token de acesso não fornecido',
                        redirecionarPara: '/login'
                    });
                }

                // Verificar e decodificar token
                const dadosToken = jwt.verify(token, this.jwtSecret);
                
                // Buscar dados completos do usuário
                const usuario = await this.buscarUsuario(dadosToken.userId);
                
                if (!usuario || usuario.status !== 'active') {
                    return res.status(401).json({
                        erro: 'Usuário inválido ou inativo',
                        redirecionarPara: '/login'
                    });
                }

                // Adicionar dados do usuário à requisição
                req.usuario = {
                    id: usuario.id,
                    username: usuario.username,
                    email: usuario.email,
                    role: usuario.role,
                    status: usuario.status,
                    subscriptionPlan: usuario.subscription_plan,
                    createdAt: usuario.created_at
                };

                console.log(`✅ Usuário autenticado: ${usuario.username} (${usuario.role})`);
                next();

            } catch (error) {
                console.error('❌ Erro na autenticação:', error.message);
                
                return res.status(401).json({
                    erro: 'Token inválido ou expirado',
                    redirecionarPara: '/login'
                });
            }
        };
    }

    // ========================================
    // 2. MIDDLEWARE DE AUTORIZAÇÃO POR PAPEL
    // ========================================

    autorizarPapel(papeisPermitidos) {
        return (req, res, next) => {
            try {
                if (!req.usuario) {
                    return res.status(401).json({
                        erro: 'Usuário não autenticado',
                        redirecionarPara: '/login'
                    });
                }

                // Converter para array se for string
                const papeis = Array.isArray(papeisPermitidos) ? papeisPermitidos : [papeisPermitidos];
                
                if (!papeis.includes(req.usuario.role)) {
                    const areaPermitida = this.areasAcesso[req.usuario.role];
                    
                    return res.status(403).json({
                        erro: `Acesso negado. Papel '${req.usuario.role}' não autorizado para esta área`,
                        papelUsuario: req.usuario.role,
                        papeisNecessarios: papeis,
                        redirecionarPara: areaPermitida?.dashboard || '/dashboard'
                    });
                }

                console.log(`✅ Autorização confirmada para ${req.usuario.username} (${req.usuario.role})`);
                next();

            } catch (error) {
                console.error('❌ Erro na autorização:', error.message);
                
                return res.status(500).json({
                    erro: 'Erro interno na autorização'
                });
            }
        };
    }

    // ========================================
    // 3. MIDDLEWARE DE ISOLAMENTO POR ID
    // ========================================

    isolamentoPorUsuario() {
        return (req, res, next) => {
            try {
                if (!req.usuario) {
                    return res.status(401).json({
                        erro: 'Usuário não autenticado'
                    });
                }

                // Admins podem acessar dados de qualquer usuário
                if (req.usuario.role === 'admin') {
                    console.log('👑 Admin detectado - sem isolamento de dados');
                    next();
                    return;
                }

                // Para outros papéis, validar acesso aos dados
                const userIdRequisicao = this.extrairUserIdDaRequisicao(req);
                
                if (userIdRequisicao && userIdRequisicao !== req.usuario.id) {
                    return res.status(403).json({
                        erro: 'Acesso negado aos dados de outro usuário',
                        usuarioLogado: req.usuario.id,
                        usuarioSolicitado: userIdRequisicao
                    });
                }

                // Adicionar filtro automático por user_id
                req.filtroUsuario = { user_id: req.usuario.id };
                
                console.log(`🔒 Isolamento ativo para usuário ${req.usuario.id}`);
                next();

            } catch (error) {
                console.error('❌ Erro no isolamento:', error.message);
                next();
            }
        };
    }

    // ========================================
    // 4. REDIRECIONAMENTO POR LOGIN
    // ========================================

    configurarRedirecionamentoLogin(app) {
        console.log('🚪 Configurando redirecionamento por login...');

        // Endpoint de login
        app.post('/api/auth/login', async (req, res) => {
            try {
                const { username, password } = req.body;
                
                const resultado = await this.processarLogin(username, password);
                
                if (resultado.sucesso) {
                    const areaUsuario = this.areasAcesso[resultado.usuario.role];
                    
                    res.json({
                        sucesso: true,
                        token: resultado.token,
                        usuario: resultado.usuario,
                        redirecionarPara: areaUsuario.dashboard,
                        areaAcesso: areaUsuario.descricao
                    });
                } else {
                    res.status(401).json({
                        sucesso: false,
                        erro: resultado.erro
                    });
                }

            } catch (error) {
                console.error('❌ Erro no login:', error.message);
                res.status(500).json({
                    sucesso: false,
                    erro: 'Erro interno no login'
                });
            }
        });

        // Endpoint para obter informações do usuário logado
        app.get('/api/auth/me', this.autenticar(), (req, res) => {
            const areaUsuario = this.areasAcesso[req.usuario.role];
            
            res.json({
                usuario: req.usuario,
                areaAcesso: areaUsuario.descricao,
                dashboard: areaUsuario.dashboard,
                rotasPermitidas: areaUsuario.rotas
            });
        });

        // Endpoint de logout
        app.post('/api/auth/logout', (req, res) => {
            res.json({
                sucesso: true,
                mensagem: 'Logout realizado com sucesso',
                redirecionarPara: '/login'
            });
        });

        console.log('✅ Redirecionamento configurado');
    }

    // ========================================
    // 5. MÉTODOS AUXILIARES
    // ========================================

    extrairToken(req) {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        
        // Verificar em cookies também
        return req.cookies?.token || null;
    }

    extrairUserIdDaRequisicao(req) {
        // Verificar em diferentes locais onde o user_id pode estar
        return req.params.userId || 
               req.params.id || 
               req.body.userId || 
               req.query.userId || 
               null;
    }

    async buscarUsuario(userId) {
        const client = await this.pool.connect();
        try {
            const resultado = await client.query(`
                SELECT id, username, email, role, status, subscription_plan, created_at
                FROM users 
                WHERE id = $1
            `, [userId]);

            return resultado.rows[0] || null;

        } catch (error) {
            console.error('❌ Erro ao buscar usuário:', error.message);
            return null;
        } finally {
            client.release();
        }
    }

    async processarLogin(username, password) {
        const client = await this.pool.connect();
        try {
            // Buscar usuário
            const resultado = await client.query(`
                SELECT id, username, email, password_hash, role, status, subscription_plan
                FROM users 
                WHERE username = $1 OR email = $1
            `, [username]);

            if (resultado.rows.length === 0) {
                return {
                    sucesso: false,
                    erro: 'Usuário não encontrado'
                };
            }

            const usuario = resultado.rows[0];

            // Verificar status
            if (usuario.status !== 'active') {
                return {
                    sucesso: false,
                    erro: 'Usuário inativo'
                };
            }

            // Verificar senha (em produção, usar bcrypt)
            const senhaValida = await this.verificarSenha(password, usuario.password_hash);
            
            if (!senhaValida) {
                return {
                    sucesso: false,
                    erro: 'Senha incorreta'
                };
            }

            // Gerar token JWT
            const token = jwt.sign(
                { 
                    userId: usuario.id,
                    username: usuario.username,
                    role: usuario.role
                },
                this.jwtSecret,
                { expiresIn: '24h' }
            );

            // Registrar login
            await this.registrarLogin(usuario.id);

            return {
                sucesso: true,
                token,
                usuario: {
                    id: usuario.id,
                    username: usuario.username,
                    email: usuario.email,
                    role: usuario.role,
                    subscriptionPlan: usuario.subscription_plan
                }
            };

        } catch (error) {
            console.error('❌ Erro no processamento do login:', error.message);
            return {
                sucesso: false,
                erro: 'Erro interno no login'
            };
        } finally {
            client.release();
        }
    }

    async verificarSenha(senhaTexto, hash) {
        // Em produção, usar bcrypt.compare
        // Por simplicidade, comparação direta (APENAS PARA DESENVOLVIMENTO)
        return senhaTexto === hash || hash.includes(senhaTexto);
    }

    async registrarLogin(userId) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                INSERT INTO user_login_logs (user_id, login_time, ip_address)
                VALUES ($1, NOW(), $2)
            `, [userId, 'localhost']); // Em produção, capturar IP real

        } catch (error) {
            console.error('❌ Erro ao registrar login:', error.message);
        } finally {
            client.release();
        }
    }

    // ========================================
    // 6. MIDDLEWARE COMBINADO
    // ========================================

    protegerRota(papeisPermitidos = null, isolamento = true) {
        const middlewares = [this.autenticar()];
        
        if (papeisPermitidos) {
            middlewares.push(this.autorizarPapel(papeisPermitidos));
        }
        
        if (isolamento) {
            middlewares.push(this.isolamentoPorUsuario());
        }
        
        return middlewares;
    }

    // ========================================
    // 7. CONFIGURAÇÃO DE ROTAS PROTEGIDAS
    // ========================================

    configurarRotasProtegidas(app) {
        console.log('🛡️ Configurando rotas protegidas...');

        // Rotas do Admin
        app.use('/admin/*', this.protegerRota(['admin'], false));
        app.use('/api/admin/*', this.protegerRota(['admin'], false));

        // Rotas do Manager
        app.use('/manager/*', this.protegerRota(['admin', 'manager'], false));
        app.use('/api/manager/*', this.protegerRota(['admin', 'manager'], false));

        // Rotas do Usuário (com isolamento)
        app.use('/user/*', this.protegerRota(['user'], true));
        app.use('/api/user/*', this.protegerRota(['user'], true));

        // Rotas do Afiliado (com isolamento)
        app.use('/affiliate/*', this.protegerRota(['affiliate'], true));
        app.use('/api/affiliate/*', this.protegerRota(['affiliate'], true));

        // Rotas de trading (usuários autenticados)
        app.use('/api/trading/*', this.protegerRota(['user', 'admin'], true));

        // Rotas dos gestores (sem isolamento para admins)
        app.use('/api/gestores/*', this.protegerRota(['admin', 'manager'], false));

        console.log('✅ Rotas protegidas configuradas');
    }

    // ========================================
    // 8. RELATÓRIOS DE ACESSO
    // ========================================

    async gerarRelatorioAcessos(periodo = '24h') {
        console.log(`📊 Gerando relatório de acessos para ${periodo}...`);

        const client = await this.pool.connect();
        try {
            let whereClause = '';
            
            switch (periodo) {
                case '1h':
                    whereClause = "WHERE login_time >= NOW() - INTERVAL '1 hour'";
                    break;
                case '24h':
                    whereClause = "WHERE login_time >= NOW() - INTERVAL '24 hours'";
                    break;
                case '7d':
                    whereClause = "WHERE login_time >= NOW() - INTERVAL '7 days'";
                    break;
            }

            const estatisticas = await client.query(`
                SELECT 
                    COUNT(*) as total_logins,
                    COUNT(DISTINCT ull.user_id) as usuarios_unicos,
                    u.role,
                    COUNT(*) as logins_por_papel
                FROM user_login_logs ull
                JOIN users u ON ull.user_id = u.id
                ${whereClause}
                GROUP BY u.role
                ORDER BY logins_por_papel DESC
            `);

            return {
                periodo,
                estatisticas: estatisticas.rows
            };

        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = MiddlewareAuth;
