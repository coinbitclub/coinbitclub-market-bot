/**
 * 🔒 AUTHENTICATION SERVICE - COINBITCLUB MARKET BOT V3.0.0
 * Sistema de autenticação JWT e gerenciamento de sessões
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Configurações JWT
const JWT_SECRET = process.env.JWT_SECRET || 'coinbitclub-secret-key-2025-v3';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

console.log('🔒 AUTHENTICATION SERVICE - Iniciando...');

class AuthService {
    constructor() {
        this.activeSessions = new Map();
        this.failedAttempts = new Map();
        this.maxFailedAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutos
    }

    // Gerar hash de senha
    async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    // Verificar senha
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    // Gerar tokens JWT
    generateTokens(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            name: user.name,
            subscription_type: user.subscription_type,
            is_active: user.is_active
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'coinbitclub-api',
            audience: 'coinbitclub-users'
        });

        const refreshToken = jwt.sign(
            { userId: user.id, type: 'refresh' },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        );

        return { accessToken, refreshToken };
    }

    // Verificar token JWT
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET, {
                issuer: 'coinbitclub-api',
                audience: 'coinbitclub-users'
            });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expirado');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Token inválido');
            }
            throw error;
        }
    }

    // Registrar usuário
    async registerUser(userData) {
        try {
            const { name, email, password, phone } = userData;

            // Verificar se usuário já existe
            const existingUser = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );

            if (existingUser.rows.length > 0) {
                throw new Error('Usuário já existe com este email');
            }

            // Hash da senha
            const hashedPassword = await this.hashPassword(password);

            // Inserir usuário
            const result = await pool.query(`
                INSERT INTO users (
                    name, email, password_hash, phone, 
                    is_active, subscription_type, created_at
                ) VALUES ($1, $2, $3, $4, true, 'trial', NOW())
                RETURNING id, name, email, subscription_type, is_active
            `, [name, email, hashedPassword, phone]);

            const newUser = result.rows[0];

            // Gerar tokens
            const tokens = this.generateTokens(newUser);

            // Criar sessão
            await this.createSession(newUser.id, tokens.refreshToken);

            console.log(`✅ Usuário registrado: ${email}`);

            return {
                success: true,
                user: newUser,
                tokens
            };

        } catch (error) {
            console.error('❌ Erro no registro:', error.message);
            throw error;
        }
    }

    // Login de usuário
    async loginUser(email, password, deviceInfo = {}) {
        try {
            // Verificar bloqueio por tentativas falhadas
            const clientId = deviceInfo.ip || email;
            if (this.isAccountLocked(clientId)) {
                throw new Error('Conta temporariamente bloqueada devido a múltiplas tentativas de login');
            }

            // Buscar usuário
            const userResult = await pool.query(`
                SELECT id, name, email, password_hash, subscription_type, 
                       is_active, last_login, created_at
                FROM users 
                WHERE email = $1
            `, [email]);

            if (userResult.rows.length === 0) {
                this.recordFailedAttempt(clientId);
                throw new Error('Credenciais inválidas');
            }

            const user = userResult.rows[0];

            // Verificar se usuário está ativo
            if (!user.is_active) {
                throw new Error('Conta desativada');
            }

            // Verificar senha
            const passwordValid = await this.verifyPassword(password, user.password_hash);
            if (!passwordValid) {
                this.recordFailedAttempt(clientId);
                throw new Error('Credenciais inválidas');
            }

            // Limpar tentativas falhadas
            this.clearFailedAttempts(clientId);

            // Gerar tokens
            const tokens = this.generateTokens(user);

            // Criar sessão
            await this.createSession(user.id, tokens.refreshToken, deviceInfo);

            // Atualizar último login
            await pool.query(
                'UPDATE users SET last_login = NOW() WHERE id = $1',
                [user.id]
            );

            console.log(`✅ Login realizado: ${email}`);

            return {
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    subscription_type: user.subscription_type,
                    is_active: user.is_active
                },
                tokens
            };

        } catch (error) {
            console.error('❌ Erro no login:', error.message);
            throw error;
        }
    }

    // Criar sessão
    async createSession(userId, refreshToken, deviceInfo = {}) {
        try {
            const sessionId = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

            await pool.query(`
                INSERT INTO user_sessions (
                    id, user_id, refresh_token, device_info,
                    ip_address, user_agent, expires_at, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `, [
                sessionId,
                userId,
                refreshToken,
                JSON.stringify(deviceInfo),
                deviceInfo.ip || null,
                deviceInfo.userAgent || null,
                expiresAt
            ]);

            return sessionId;

        } catch (error) {
            console.error('❌ Erro ao criar sessão:', error.message);
            throw error;
        }
    }

    // Renovar token
    async refreshToken(refreshToken) {
        try {
            // Verificar refresh token
            const decoded = jwt.verify(refreshToken, JWT_SECRET);
            
            if (decoded.type !== 'refresh') {
                throw new Error('Token de refresh inválido');
            }

            // Verificar se sessão existe e está ativa
            const sessionResult = await pool.query(`
                SELECT s.*, u.name, u.email, u.subscription_type, u.is_active
                FROM user_sessions s
                INNER JOIN users u ON s.user_id = u.id
                WHERE s.refresh_token = $1 
                AND s.expires_at > NOW()
                AND u.is_active = true
            `, [refreshToken]);

            if (sessionResult.rows.length === 0) {
                throw new Error('Sessão inválida ou expirada');
            }

            const session = sessionResult.rows[0];
            const user = {
                id: session.user_id,
                name: session.name,
                email: session.email,
                subscription_type: session.subscription_type,
                is_active: session.is_active
            };

            // Gerar novos tokens
            const tokens = this.generateTokens(user);

            // Atualizar sessão com novo refresh token
            await pool.query(`
                UPDATE user_sessions 
                SET refresh_token = $1, updated_at = NOW()
                WHERE id = $2
            `, [tokens.refreshToken, session.id]);

            console.log(`✅ Token renovado para usuário: ${user.email}`);

            return {
                success: true,
                tokens
            };

        } catch (error) {
            console.error('❌ Erro ao renovar token:', error.message);
            throw error;
        }
    }

    // Logout
    async logout(refreshToken) {
        try {
            await pool.query(
                'DELETE FROM user_sessions WHERE refresh_token = $1',
                [refreshToken]
            );

            console.log('✅ Logout realizado com sucesso');
            return { success: true };

        } catch (error) {
            console.error('❌ Erro no logout:', error.message);
            throw error;
        }
    }

    // Verificar tentativas falhadas
    isAccountLocked(clientId) {
        const attempts = this.failedAttempts.get(clientId);
        if (!attempts) return false;

        if (attempts.count >= this.maxFailedAttempts) {
            const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
            return timeSinceLastAttempt < this.lockoutDuration;
        }

        return false;
    }

    // Registrar tentativa falhada
    recordFailedAttempt(clientId) {
        const now = Date.now();
        const attempts = this.failedAttempts.get(clientId) || { count: 0, lastAttempt: now };
        
        attempts.count++;
        attempts.lastAttempt = now;
        
        this.failedAttempts.set(clientId, attempts);

        console.log(`⚠️ Tentativa falhada registrada para: ${clientId} (${attempts.count}/${this.maxFailedAttempts})`);
    }

    // Limpar tentativas falhadas
    clearFailedAttempts(clientId) {
        this.failedAttempts.delete(clientId);
    }

    // Listar sessões ativas do usuário
    async getUserSessions(userId) {
        try {
            const result = await pool.query(`
                SELECT id, device_info, ip_address, user_agent, 
                       created_at, expires_at
                FROM user_sessions 
                WHERE user_id = $1 AND expires_at > NOW()
                ORDER BY created_at DESC
            `, [userId]);

            return result.rows;

        } catch (error) {
            console.error('❌ Erro ao buscar sessões:', error.message);
            throw error;
        }
    }

    // Revogar todas as sessões do usuário
    async revokeAllUserSessions(userId) {
        try {
            const result = await pool.query(
                'DELETE FROM user_sessions WHERE user_id = $1',
                [userId]
            );

            console.log(`✅ ${result.rowCount} sessões revogadas para usuário ${userId}`);
            return result.rowCount;

        } catch (error) {
            console.error('❌ Erro ao revogar sessões:', error.message);
            throw error;
        }
    }

    // Verificar e criar tabelas necessárias
    async initializeTables() {
        try {
            // Verificar se tabela user_sessions existe
            const tableExists = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'user_sessions'
                )
            `);

            if (!tableExists.rows[0].exists) {
                console.log('🔧 Criando tabela user_sessions...');
                
                await pool.query(`
                    CREATE TABLE user_sessions (
                        id UUID PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        refresh_token TEXT NOT NULL,
                        device_info JSONB,
                        ip_address INET,
                        user_agent TEXT,
                        expires_at TIMESTAMP NOT NULL,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW()
                    )
                `);

                // Criar índices
                await pool.query(`
                    CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
                    CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token);
                    CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
                `);

                console.log('✅ Tabela user_sessions criada com sucesso');
            }

            // Verificar se coluna password_hash existe na tabela users
            const columnExists = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'password_hash'
                )
            `);

            if (!columnExists.rows[0].exists) {
                console.log('🔧 Adicionando coluna password_hash...');
                
                await pool.query(`
                    ALTER TABLE users 
                    ADD COLUMN password_hash TEXT,
                    ADD COLUMN last_login TIMESTAMP
                `);

                console.log('✅ Colunas adicionadas com sucesso');
            }

        } catch (error) {
            console.error('❌ Erro ao inicializar tabelas:', error.message);
            throw error;
        }
    }
}

// Middleware de autenticação para Express
function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                success: false, 
                error: 'Token de acesso requerido' 
            });
        }

        const token = authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'Formato de token inválido' 
            });
        }

        const authService = new AuthService();
        const decoded = authService.verifyToken(token);
        
        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            error: error.message 
        });
    }
}

// Middleware para verificar assinatura ativa
function subscriptionMiddleware(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            error: 'Usuário não autenticado' 
        });
    }

    if (req.user.subscription_type === 'inactive' || !req.user.is_active) {
        return res.status(403).json({ 
            success: false, 
            error: 'Assinatura inativa ou usuário desabilitado' 
        });
    }

    next();
}

// Inicializar serviço
async function initializeAuthService() {
    try {
        const authService = new AuthService();
        await authService.initializeTables();
        console.log('🚀 Authentication Service inicializado com sucesso');
        return authService;
    } catch (error) {
        console.error('❌ Erro ao inicializar Authentication Service:', error.message);
        throw error;
    }
}

module.exports = {
    AuthService,
    authMiddleware,
    subscriptionMiddleware,
    initializeAuthService
};
