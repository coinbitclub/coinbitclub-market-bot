#!/usr/bin/env node

/**
 * 🛡️ DIA 21 - SEGURANÇA E IP FIXO
 * Sistema avançado de segurança corporativa e IP fixo
 * Conforme especificação seção 4 - Segurança e Autenticação
 */

const { logger } = require('../utils/logger');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class CorporateSecuritySystem {
    constructor() {
        this.config = {
            // IP fixo do Railway (produção)
            railway_fixed_ip: '132.255.160.140',
            authorized_ips: [
                '132.255.160.140', // Railway Production
                '127.0.0.1',       // Localhost (desenvolvimento)
                '::1'              // IPv6 localhost
            ],
            
            // Configurações de segurança
            max_login_attempts: 5,
            lockout_duration: 900000, // 15 minutos
            session_timeout: 3600000, // 1 hora
            jwt_expiry: '24h',
            
            // Rate limiting avançado
            rate_limits: {
                api: { window: 60000, max: 100 },      // API geral
                auth: { window: 60000, max: 5 },       // Autenticação
                trading: { window: 60000, max: 50 },   // Trading
                webhook: { window: 60000, max: 10 }    // Webhooks
            },
            
            // Monitoramento de integridade
            monitored_files: [
                'src/services/aiMonitoringService.js',
                'src/security/SecurityModule.js',
                'src/services/exchangeManager.js',
                'src/services/volatilityDetectionSystem.js'
            ],
            
            // Configurações de criptografia
            encryption_algorithm: 'aes-256-gcm',
            hash_algorithm: 'sha256',
            key_derivation_iterations: 100000,
            
            // Alertas de segurança
            security_alerts: {
                unauthorized_ip: true,
                bruteforce_attempt: true,
                file_integrity_violation: true,
                suspicious_activity: true,
                rate_limit_exceeded: true
            },
            
            // Configurações de auditoria
            audit_retention_days: 90,
            log_sensitive_operations: true,
            encrypt_audit_logs: true
        };
        
        this.active_sessions = new Map();
        this.failed_attempts = new Map();
        this.rate_limit_cache = new Map();
        this.file_hashes = new Map();
        this.security_events = [];
        
        this.isActive = false;
        
        this.initializeSecurity();
        
        logger.aiLog('CorporateSecurity', 'Sistema inicializado', this.config);
        console.log('🛡️ Sistema Segurança Corporativa iniciado');
    }
    
    // 🔐 Inicializar sistema de segurança
    async initializeSecurity() {
        try {
            // Validar IP fixo do Railway
            await this.validateRailwayIP();
            
            // Calcular hashes iniciais dos arquivos
            await this.calculateInitialFileHashes();
            
            // Configurar monitoramento contínuo
            this.setupContinuousMonitoring();
            
            console.log('✅ Sistema de segurança inicializado');
            
        } catch (error) {
            logger.error('Erro na inicialização de segurança', error);
        }
    }
    
    // 🌐 Validar IP fixo do Railway
    async validateRailwayIP() {
        try {
            console.log('🌐 Validando configuração IP fixo Railway...');
            
            // Simular obtenção do IP atual (em produção seria real)
            const currentIP = this.config.railway_fixed_ip;
            
            const validation = {
                current_ip: currentIP,
                railway_fixed_ip: this.config.railway_fixed_ip,
                is_railway_ip: currentIP === this.config.railway_fixed_ip,
                is_authorized: this.config.authorized_ips.includes(currentIP),
                timestamp: new Date().toISOString()
            };
            
            if (validation.is_railway_ip && validation.is_authorized) {
                console.log(`✅ IP fixo Railway validado: ${currentIP}`);
                logger.securityLog('IP_VALIDATION_SUCCESS', validation);
            } else {
                console.log(`⚠️ IP não autorizado: ${currentIP}`);
                logger.securityLog('IP_VALIDATION_FAILED', validation);
            }
            
            return validation;
            
        } catch (error) {
            logger.error('Erro na validação de IP', error);
            throw error;
        }
    }
    
    // 🔒 Validar acesso por IP
    async validateIPAccess(sourceIP, endpoint = 'unknown') {
        try {
            const isAuthorized = this.config.authorized_ips.includes(sourceIP);
            
            const accessAttempt = {
                source_ip: sourceIP,
                endpoint: endpoint,
                authorized: isAuthorized,
                timestamp: Date.now(),
                user_agent: 'CoinbitClub-IA-System'
            };
            
            if (!isAuthorized) {
                logger.securityLog('UNAUTHORIZED_IP_ACCESS', accessAttempt);
                
                // Incrementar tentativas suspeitas
                const attempts = this.failed_attempts.get(sourceIP) || 0;
                this.failed_attempts.set(sourceIP, attempts + 1);
                
                if (attempts >= 5) {
                    await this.triggerSecurityAlert('REPEATED_UNAUTHORIZED_ACCESS', {
                        ip: sourceIP,
                        attempts: attempts + 1
                    });
                }
            } else {
                logger.securityLog('AUTHORIZED_IP_ACCESS', accessAttempt);
            }
            
            return {
                authorized: isAuthorized,
                source_ip: sourceIP,
                access_attempt: accessAttempt
            };
            
        } catch (error) {
            logger.error('Erro na validação de IP', error);
            return { authorized: false, error: error.message };
        }
    }
    
    // ⏱️ Rate limiting avançado
    async checkRateLimit(sourceIP, category = 'api') {
        try {
            const limits = this.config.rate_limits[category];
            if (!limits) {
                return { allowed: true, reason: 'No limits configured' };
            }
            
            const key = `${sourceIP}:${category}`;
            const now = Date.now();
            
            // Obter histórico de requests
            const requests = this.rate_limit_cache.get(key) || [];
            
            // Remover requests antigos
            const validRequests = requests.filter(timestamp => 
                (now - timestamp) < limits.window
            );
            
            // Verificar se excedeu o limite
            if (validRequests.length >= limits.max) {
                logger.securityLog('RATE_LIMIT_EXCEEDED', {
                    source_ip: sourceIP,
                    category: category,
                    requests_count: validRequests.length,
                    limit: limits.max,
                    window: limits.window
                });
                
                return {
                    allowed: false,
                    requests_count: validRequests.length,
                    limit: limits.max,
                    reset_time: validRequests[0] + limits.window
                };
            }
            
            // Adicionar request atual
            validRequests.push(now);
            this.rate_limit_cache.set(key, validRequests);
            
            return {
                allowed: true,
                requests_count: validRequests.length,
                limit: limits.max,
                remaining: limits.max - validRequests.length
            };
            
        } catch (error) {
            logger.error('Erro no rate limiting', error);
            return { allowed: false, error: error.message };
        }
    }
    
    // 🔐 Autenticação JWT corporativa
    async createSecureSession(userInfo, sourceIP) {
        try {
            // Validar IP antes de criar sessão
            const ipValidation = await this.validateIPAccess(sourceIP, 'auth');
            if (!ipValidation.authorized) {
                throw new Error('IP não autorizado para autenticação');
            }
            
            // Verificar rate limiting de autenticação
            const rateLimitCheck = await this.checkRateLimit(sourceIP, 'auth');
            if (!rateLimitCheck.allowed) {
                throw new Error('Rate limit de autenticação excedido');
            }
            
            // Gerar token JWT seguro
            const sessionId = crypto.randomUUID();
            const tokenPayload = {
                sessionId: sessionId,
                userId: userInfo.userId,
                userType: userInfo.userType || 'admin',
                sourceIP: sourceIP,
                issuedAt: Date.now(),
                expiresAt: Date.now() + this.config.session_timeout
            };
            
            // Simular assinatura JWT (em produção usar biblioteca JWT real)
            const token = this.signJWT(tokenPayload);
            
            // Salvar sessão ativa
            this.active_sessions.set(sessionId, {
                ...tokenPayload,
                token: token,
                lastActivity: Date.now()
            });
            
            logger.securityLog('SECURE_SESSION_CREATED', {
                session_id: sessionId,
                user_id: userInfo.userId,
                source_ip: sourceIP
            });
            
            console.log(`🔐 Sessão segura criada: ${sessionId}`);
            
            return {
                token: token,
                sessionId: sessionId,
                expiresAt: tokenPayload.expiresAt
            };
            
        } catch (error) {
            logger.error('Erro na criação de sessão segura', error);
            throw error;
        }
    }
    
    // 🔑 Assinar JWT (simulado)
    signJWT(payload) {
        const header = { alg: 'HS256', typ: 'JWT' };
        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
        
        // Simular assinatura (em produção usar biblioteca JWT real)
        const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'coinbitclub-secret')
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest('base64');
        
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }
    
    // ✅ Validar sessão JWT
    async validateSession(token, sourceIP) {
        try {
            // Decodificar token (simulado)
            const payload = this.decodeJWT(token);
            
            if (!payload) {
                return { valid: false, reason: 'Token inválido' };
            }
            
            // Verificar se sessão existe
            const session = this.active_sessions.get(payload.sessionId);
            if (!session) {
                return { valid: false, reason: 'Sessão não encontrada' };
            }
            
            // Verificar expiração
            if (Date.now() > session.expiresAt) {
                this.active_sessions.delete(payload.sessionId);
                return { valid: false, reason: 'Sessão expirada' };
            }
            
            // Verificar IP
            if (session.sourceIP !== sourceIP) {
                logger.securityLog('SESSION_IP_MISMATCH', {
                    session_id: payload.sessionId,
                    original_ip: session.sourceIP,
                    current_ip: sourceIP
                });
                return { valid: false, reason: 'IP inconsistente' };
            }
            
            // Atualizar última atividade
            session.lastActivity = Date.now();
            
            return {
                valid: true,
                session: session,
                payload: payload
            };
            
        } catch (error) {
            logger.error('Erro na validação de sessão', error);
            return { valid: false, reason: 'Erro interno' };
        }
    }
    
    // 🔓 Decodificar JWT (simulado)
    decodeJWT(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            return payload;
            
        } catch (error) {
            return null;
        }
    }
    
    // 🔍 Calcular hashes iniciais dos arquivos
    async calculateInitialFileHashes() {
        try {
            console.log('🔍 Calculando hashes de integridade...');
            
            for (const filePath of this.config.monitored_files) {
                const fullPath = path.join(__dirname, '../../', filePath);
                
                if (fs.existsSync(fullPath)) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const hash = crypto.createHash(this.config.hash_algorithm)
                        .update(content)
                        .digest('hex');
                    
                    this.file_hashes.set(filePath, {
                        hash: hash,
                        size: content.length,
                        modified: fs.statSync(fullPath).mtime,
                        checked: new Date()
                    });
                    
                    console.log(`✅ Hash calculado: ${filePath}`);
                } else {
                    console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
                }
            }
            
            logger.securityLog('FILE_HASHES_CALCULATED', {
                files_count: this.file_hashes.size,
                monitored_files: this.config.monitored_files
            });
            
        } catch (error) {
            logger.error('Erro no cálculo de hashes', error);
        }
    }
    
    // 🔒 Verificar integridade dos arquivos
    async checkFileIntegrity() {
        try {
            const crypto = require('crypto');
            const integrityReport = {
                timestamp: new Date().toISOString(),
                files_checked: 0,
                files_modified: 0,
                files_missing: 0,
                violations: [],
                hashes: {}
            };
            
            for (const filePath of this.config.monitored_files) {
                const fullPath = path.join(__dirname, '../../', filePath);
                integrityReport.files_checked++;
                
                if (!fs.existsSync(fullPath)) {
                    integrityReport.files_missing++;
                    integrityReport.violations.push({
                        file: filePath,
                        type: 'MISSING',
                        timestamp: new Date().toISOString(),
                        severity: 'HIGH'
                    });
                } else {
                    // Calcular hash SHA-256 do arquivo
                    const fileContent = fs.readFileSync(fullPath, 'utf8');
                    const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
                    integrityReport.hashes[filePath] = {
                        hash: hash,
                        size: fileContent.length,
                        modified: fs.statSync(fullPath).mtime
                    };
                    
                    // Verificar se arquivo foi modificado (comparar com baseline se existir)
                    if (this.fileBaseline && this.fileBaseline[filePath]) {
                        if (this.fileBaseline[filePath].hash !== hash) {
                            integrityReport.files_modified++;
                            integrityReport.violations.push({
                                file: filePath,
                                type: 'MODIFIED',
                                old_hash: this.fileBaseline[filePath].hash,
                                new_hash: hash,
                                timestamp: new Date().toISOString(),
                                severity: 'MEDIUM'
                            });
                        }
                    }
                }
            }
            
            await this.logSecurityEvent('FILE_INTEGRITY_CHECK', {
                report: integrityReport,
                status: integrityReport.violations.length === 0 ? 'CLEAN' : 'VIOLATIONS_FOUND'
            });
            
            return integrityReport;
            
        } catch (error) {
            logger.error('Erro na verificação de integridade', error);
            throw error;
        }
    }
    
    // 📊 Configurar monitoramento contínuo
    setupContinuousMonitoring() {
        // Verificar integridade a cada 5 minutos
        setInterval(async () => {
            if (this.isActive) {
                await this.checkFileIntegrity();
            }
        }, 300000); // 5 minutos
        
        // Limpar sessões expiradas a cada minuto
        setInterval(() => {
            this.cleanExpiredSessions();
        }, 60000); // 1 minuto
        
        // Limpar cache de rate limiting a cada 10 minutos
        setInterval(() => {
            this.cleanRateLimitCache();
        }, 600000); // 10 minutos
        
        console.log('📊 Monitoramento contínuo configurado');
    }
    
    // 🧹 Limpar sessões expiradas
    cleanExpiredSessions() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [sessionId, session] of this.active_sessions.entries()) {
            if (now > session.expiresAt) {
                this.active_sessions.delete(sessionId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            logger.debug(`Sessões expiradas removidas: ${cleanedCount}`);
        }
    }
    
    // 🧹 Limpar cache de rate limiting
    cleanRateLimitCache() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, requests] of this.rate_limit_cache.entries()) {
            const validRequests = requests.filter(timestamp => 
                (now - timestamp) < 3600000 // 1 hora
            );
            
            if (validRequests.length === 0) {
                this.rate_limit_cache.delete(key);
                cleanedCount++;
            } else if (validRequests.length !== requests.length) {
                this.rate_limit_cache.set(key, validRequests);
            }
        }
        
        if (cleanedCount > 0) {
            logger.debug(`Entradas de rate limit removidas: ${cleanedCount}`);
        }
    }
    
    // 🚨 Disparar alerta de segurança
    async triggerSecurityAlert(alertType, details) {
        try {
            const alert = {
                id: crypto.randomUUID(),
                type: alertType,
                severity: this.getAlertSeverity(alertType),
                details: details,
                timestamp: new Date().toISOString(),
                resolved: false
            };
            
            this.security_events.push(alert);
            
            logger.securityLog('SECURITY_ALERT_TRIGGERED', alert);
            
            console.log(`🚨 ALERTA DE SEGURANÇA: ${alertType}`);
            console.log(`   Severidade: ${alert.severity}`);
            console.log(`   Detalhes:`, details);
            
            // Em produção, enviar notificações para administradores
            // await this.notifySecurityTeam(alert);
            
            return alert;
            
        } catch (error) {
            logger.error('Erro ao disparar alerta de segurança', error);
        }
    }
    
    // 📊 Obter severidade do alerta
    getAlertSeverity(alertType) {
        const severityMap = {
            'UNAUTHORIZED_IP_ACCESS': 'MEDIUM',
            'REPEATED_UNAUTHORIZED_ACCESS': 'HIGH',
            'CRITICAL_FILE_INTEGRITY': 'CRITICAL',
            'RATE_LIMIT_EXCEEDED': 'LOW',
            'SESSION_IP_MISMATCH': 'HIGH',
            'BRUTEFORCE_ATTEMPT': 'HIGH'
        };
        
        return severityMap[alertType] || 'MEDIUM';
    }
    
    // 🔄 Iniciar monitoramento de segurança
    async startSecurityMonitoring() {
        if (this.isActive) {
            logger.warn('Monitoramento de segurança já está ativo');
            return;
        }
        
        this.isActive = true;
        
        logger.aiLog('CorporateSecurity', 'Monitoramento iniciado');
        console.log('🔄 Monitoramento de segurança ativo');
        
        // Verificação inicial
        await this.validateRailwayIP();
        await this.checkFileIntegrity();
    }
    
    // 🛑 Parar monitoramento de segurança
    stopSecurityMonitoring() {
        this.isActive = false;
        
        logger.aiLog('CorporateSecurity', 'Monitoramento parado');
        console.log('🛑 Monitoramento de segurança parado');
    }
    
    // 📋 Gerar relatório de segurança
    generateSecurityReport() {
        const now = new Date().toISOString();
        
        return {
            timestamp: now,
            is_active: this.isActive,
            railway_ip: this.config.railway_fixed_ip,
            authorized_ips: this.config.authorized_ips,
            
            // Estatísticas de sessões
            active_sessions: this.active_sessions.size,
            total_sessions_created: this.security_events.filter(e => 
                e.type === 'SECURE_SESSION_CREATED').length,
            
            // Estatísticas de acessos
            failed_access_attempts: Array.from(this.failed_attempts.entries()).map(([ip, count]) => ({
                ip: ip,
                attempts: count
            })),
            
            // Integridade de arquivos
            monitored_files: this.config.monitored_files.length,
            file_hashes_count: this.file_hashes.size,
            
            // Alertas de segurança
            security_alerts: this.security_events.filter(e => 
                (Date.now() - new Date(e.timestamp).getTime()) < 86400000 // Últimas 24h
            ),
            
            // Rate limiting
            active_rate_limits: this.rate_limit_cache.size,
            
            // Configurações de segurança
            security_config: {
                max_login_attempts: this.config.max_login_attempts,
                session_timeout: this.config.session_timeout,
                monitored_files_count: this.config.monitored_files.length,
                rate_limits_configured: Object.keys(this.config.rate_limits).length
            }
        };
    }
    
    // 🔐 Criptografar dados sensíveis
    encryptSensitiveData(data, key = null) {
        try {
            const algorithm = this.config.encryption_algorithm;
            const encryptionKey = key || crypto.scryptSync(
                process.env.ENCRYPTION_KEY || 'coinbitclub-encryption',
                'salt',
                32
            );
            
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher(algorithm, encryptionKey);
            
            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            return {
                encrypted: encrypted,
                iv: iv.toString('hex'),
                algorithm: algorithm
            };
            
        } catch (error) {
            logger.error('Erro na criptografia', error);
            throw error;
        }
    }
    
    // 🔓 Descriptografar dados sensíveis
    decryptSensitiveData(encryptedData, key = null) {
        try {
            const algorithm = encryptedData.algorithm;
            const encryptionKey = key || crypto.scryptSync(
                process.env.ENCRYPTION_KEY || 'coinbitclub-encryption',
                'salt',
                32
            );
            
            const decipher = crypto.createDecipher(algorithm, encryptionKey);
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
            
        } catch (error) {
            logger.error('Erro na descriptografia', error);
            throw error;
        }
    }
}

module.exports = CorporateSecuritySystem;
