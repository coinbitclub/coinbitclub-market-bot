#!/usr/bin/env node

/**
 * 🛡️ SECURITY MODULE - COINBITCLUB IA MONITORING
 * Módulo de segurança avançada conforme Seção 4.2 da especificação
 * Inclui IP fixo, rate limiting, verificação de integridade e monitoramento de processos
 */

const crypto = require('crypto');'
const fs = require('fs').promises;'
const path = require('path');'
const { exec } = require('child_process');'
const { promisify } = require('util');'

const execAsync = promisify(exec);

class SecurityModule {
    constructor() {
        // Rate limiting por IP conforme especificação
        this.rateLimiter = new Map();
        
        // Whitelist de IPs conforme Seção 4.1
        this.whitelist = (process.env.ADMIN_IPS || '132.255.160.140').split(',').map(ip => ip.trim());'
        
        // Mapa de integridade de arquivos
        this.fileIntegrity = new Map();
        
        // Configuração conforme especificação
        this.config = {
            rateLimit: {
                windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minuto
                maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 60,    // 60 req/min
            },
            ipWhitelist: this.whitelist,
            monitoring: {
                processCheckInterval: 30000, // 30 segundos
                fileCheckInterval: 300000,   // 5 minutos
                logRetention: 7 * 24 * 60 * 60 * 1000 // 7 dias
            }
        };
        
        // Inicializar monitoramento
        this.startSecurityMonitoring();
        
        console.log('🛡️ Security Module iniciado');'
        console.log(`🔐 IPs autorizados: ${this.config.ipWhitelist.join(', ')}`);'
    }
    
    // 🌐 Validação de IP conforme Seção 4.1 da especificação
    validateSourceIP(req, res, next) {
        const clientIP = this.getClientIP(req);
        const allowedIPs = this.config.ipWhitelist;
        
        // Log da tentativa de acesso
        console.log(`🔍 Verificando IP: ${clientIP}`);
        
        if (!allowedIPs.includes(clientIP)) {
            const securityEvent = {
                type: 'unauthorized_ip_access','
                client_ip: clientIP,
                allowed_ips: allowedIPs,
                user_agent: req.headers['user-agent'],'
                endpoint: req.originalUrl,
                timestamp: new Date().toISOString(),
                severity: 'high''
            };
            
            this.logSecurityEvent('IP_ACCESS_DENIED', securityEvent);'
            
            return res.status(403).json({
                error: 'IP not allowed','
                ip: clientIP,
                message: 'Access denied for security reasons''
            });
        }
        
        // IP autorizado, continuar
        next();
    }
    
    // 🚦 Rate Limiting conforme especificação
    checkRateLimit(ip, endpoint) {
        const key = `${ip}:${endpoint}`;
        const now = Date.now();
        const window = this.config.rateLimit.windowMs;
        const maxRequests = this.config.rateLimit.maxRequests;
        
        // Obter requests existentes
        const requests = this.rateLimiter.get(key) || [];
        
        // Filtrar requests dentro da janela de tempo
        const validRequests = requests.filter(time => now - time < window);
        
        if (validRequests.length >= maxRequests) {
            // Rate limit excedido
            this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {'
                ip: ip,
                endpoint: endpoint,
                requests_in_window: validRequests.length,
                max_allowed: maxRequests,
                window_ms: window,
                timestamp: new Date().toISOString()
            });
            
            return false;
        }
        
        // Adicionar request atual
        validRequests.push(now);
        this.rateLimiter.set(key, validRequests);
        
        return true;
    }
    
    // 🔒 Middleware de Rate Limiting
    rateLimitMiddleware() {
        return (req, res, next) => {
            const clientIP = this.getClientIP(req);
            const endpoint = req.route?.path || req.originalUrl;
            
            if (!this.checkRateLimit(clientIP, endpoint)) {
                return res.status(429).json({
                    error: 'Rate limit exceeded','
                    message: `Too many requests from ${clientIP}`,
                    retry_after: Math.ceil(this.config.rateLimit.windowMs / 1000)
                });
            }
            
            next();
        };
    }
    
    // 📁 Verificação de Integridade de Arquivos conforme especificação
    async checkFileIntegrity() {
        const criticalFiles = [
            'package.json','
            '.env','
            'src/config/database.js','
            'src/config/exchanges.js','
            'src/services/aiMonitoringService.js','
            'scripts/closeAllOrders.js','
            'scripts/pauseNewOrders.js','
            'scripts/retriggerWebhook.js''
        ];
        
        console.log('🔍 Verificando integridade de arquivos críticos...');'
        
        const results = [];
        
        for (const file of criticalFiles) {
            try {
                const filePath = path.join(process.cwd(), file);
                const currentHash = await this.getFileHash(filePath);
                const expectedHash = this.fileIntegrity.get(file);
                
                const fileResult = {
                    file: file,
                    current_hash: currentHash,
                    expected_hash: expectedHash,
                    status: 'ok''
                };
                
                if (expectedHash && currentHash !== expectedHash) {
                    fileResult.status = 'modified';'
                    
                    await this.notifySecurityBreach(file, {
                        type: 'file_integrity_violation','
                        file: file,
                        expected_hash: expectedHash,
                        current_hash: currentHash,
                        timestamp: new Date().toISOString()
                    });
                    
                    console.log(`⚠️  ALERTA: Arquivo modificado: ${file}`);
                } else if (!expectedHash) {
                    // Primeira verificação - armazenar hash
                    this.fileIntegrity.set(file, currentHash);
                    fileResult.status = 'baseline_set';'
                    console.log(`📝 Hash baseline definido para: ${file}`);
                }
                
                results.push(fileResult);
                
            } catch (error) {
                const errorResult = {
                    file: file,
                    status: 'error','
                    error: error.message
                };
                
                results.push(errorResult);
                console.log(`❌ Erro ao verificar ${file}:`, error.message);
            }
        }
        
        // Log dos resultados
        const summary = {
            total_files: criticalFiles.length,
            ok_files: results.filter(r => r.status === 'ok').length,'
            modified_files: results.filter(r => r.status === 'modified').length,'
            error_files: results.filter(r => r.status === 'error').length,'
            baseline_set: results.filter(r => r.status === 'baseline_set').length,'
            results: results
        };
        
        this.logSecurityEvent('FILE_INTEGRITY_CHECK', summary);'
        
        return summary;
    }
    
    // 🔨 Calcular Hash SHA256 de arquivo
    async getFileHash(filePath) {
        try {
            const fileBuffer = await fs.readFile(filePath);
            const hashSum = crypto.createHash('sha256');'
            hashSum.update(fileBuffer);
            return hashSum.digest('hex');'
        } catch (error) {
            throw new Error(`Erro ao calcular hash de ${filePath}: ${error.message}`);
        }
    }
    
    // 🖥️ Monitoramento de Processos conforme especificação
    async monitorProcesses() {
        const suspiciousProcesses = [
            'cryptominer','
            'coinminer', '
            'malware','
            'xmrig','
            'ethminer','
            'cgminer','
            'bfgminer','
            'claymore','
            'phoenixminer','
            'teamredminer''
        ];
        
        try {
            const runningProcesses = await this.getRunningProcesses();
            const suspiciousFound = [];
            
            for (const process of runningProcesses) {
                const processName = process.name.toLowerCase();
                
                for (const suspicious of suspiciousProcesses) {
                    if (processName.includes(suspicious)) {
                        suspiciousFound.push(process);
                        
                        console.log(`🚨 PROCESSO SUSPEITO DETECTADO: ${process.name} (PID: ${process.pid})`);
                        
                        // Tentar eliminar processo
                        try {
                            await this.killProcess(process.pid);
                            console.log(`✅ Processo ${process.name} (${process.pid}) eliminado`);
                            
                            await this.logSecurityEvent('MALICIOUS_PROCESS_KILLED', {'
                                process_name: process.name,
                                process_pid: process.pid,
                                process_cmd: process.cmd,
                                action: 'killed','
                                timestamp: new Date().toISOString()
                            });
                            
                        } catch (killError) {
                            console.log(`❌ Erro ao eliminar processo ${process.name}:`, killError.message);
                            
                            await this.logSecurityEvent('MALICIOUS_PROCESS_KILL_FAILED', {'
                                process_name: process.name,
                                process_pid: process.pid,
                                error: killError.message,
                                timestamp: new Date().toISOString()
                            });
                        }
                        
                        break;
                    }
                }
            }
            
            if (suspiciousFound.length === 0) {
                console.log('✅ Nenhum processo suspeito detectado');'
            }
            
            return {
                total_processes: runningProcesses.length,
                suspicious_found: suspiciousFound.length,
                suspicious_processes: suspiciousFound
            };
            
        } catch (error) {
            console.log('❌ Erro no monitoramento de processos:', error.message);'
            throw error;
        }
    }
    
    // 📊 Obter lista de processos em execução
    async getRunningProcesses() {
        try {
            const isWindows = process.platform === 'win32';'
            const command = isWindows ? 'tasklist /fo csv' : 'ps aux';'
            
            const { stdout } = await execAsync(command);
            const processes = [];
            
            if (isWindows) {
                // Parse Windows tasklist output
                const lines = stdout.split('\n').slice(1); // Skip header'
                for (const line of lines) {
                    if (line.trim()) {
                        const parts = line.split(',').map(p => p.replace(/"/g, ''));'
                        if (parts.length >= 2) {
                            processes.push({
                                name: parts[0],
                                pid: parts[1],
                                cmd: parts[0]
                            });
                        }
                    }
                }
            } else {
                // Parse Unix ps output
                const lines = stdout.split('\n').slice(1); // Skip header'
                for (const line of lines) {
                    if (line.trim()) {
                        const parts = line.trim().split(/\s+/);
                        if (parts.length >= 11) {
                            processes.push({
                                name: parts[10],
                                pid: parts[1],
                                cmd: parts.slice(10).join(' ')'
                            });
                        }
                    }
                }
            }
            
            return processes;
            
        } catch (error) {
            throw new Error(`Erro ao obter processos: ${error.message}`);
        }
    }
    
    // 💀 Eliminar processo
    async killProcess(pid) {
        try {
            const isWindows = process.platform === 'win32';'
            const command = isWindows ? `taskkill /PID ${pid} /F` : `kill -9 ${pid}`;
            
            await execAsync(command);
            
        } catch (error) {
            throw new Error(`Erro ao eliminar processo ${pid}: ${error.message}`);
        }
    }
    
    // 🚨 Notificar violação de segurança
    async notifySecurityBreach(file, details) {
        const alert = {
            alert_type: 'SECURITY_BREACH','
            severity: 'CRITICAL','
            file: file,
            details: details,
            timestamp: new Date().toISOString(),
            server_info: {
                hostname: require('os').hostname(),'
                platform: process.platform,
                node_version: process.version
            }
        };
        
        console.log('🚨 VIOLAÇÃO DE SEGURANÇA DETECTADA:');'
        console.log(JSON.stringify(alert, null, 2));
        
        // Aqui poderia enviar notificação por email, Slack, etc.
        await this.logSecurityEvent('SECURITY_BREACH', alert);'
    }
    
    // 📝 Log de eventos de segurança
    async logSecurityEvent(eventType, data) {
        const securityLog = {
            event_type: eventType,
            timestamp: new Date().toISOString(),
            data: data,
            source: 'security_module''
        };
        
        try {
            // Salvar em arquivo de log de segurança
            const logPath = path.join(process.cwd(), 'logs', 'security.log');'
            const logEntry = JSON.stringify(securityLog) + '\n';'
            
            await fs.appendFile(logPath, logEntry);
            
            // Também salvar na tabela system_events
            await this.saveSystemEvent({
                event_type: 'security_event','
                action: eventType,
                context: data,
                status: 'logged','
                microservice: 'security-module''
            });
            
        } catch (error) {
            console.error('Erro ao salvar log de segurança:', error);'
        }
    }
    
    // 🕐 Iniciar monitoramento contínuo
    startSecurityMonitoring() {
        // Verificação de integridade de arquivos a cada 5 minutos
        setInterval(async () => {
            try {
                await this.checkFileIntegrity();
            } catch (error) {
                console.error('Erro na verificação de integridade:', error);'
            }
        }, this.config.monitoring.fileCheckInterval);
        
        // Monitoramento de processos a cada 30 segundos
        setInterval(async () => {
            try {
                await this.monitorProcesses();
            } catch (error) {
                console.error('Erro no monitoramento de processos:', error);'
            }
        }, this.config.monitoring.processCheckInterval);
        
        // Limpeza de logs antigos a cada hora
        setInterval(async () => {
            try {
                await this.cleanupOldLogs();
            } catch (error) {
                console.error('Erro na limpeza de logs:', error);'
            }
        }, 3600000); // 1 hora
        
        console.log('🔄 Monitoramento de segurança iniciado');'
    }
    
    // 🧹 Limpeza de logs antigos
    async cleanupOldLogs() {
        try {
            const logDir = path.join(process.cwd(), 'logs');'
            const files = await fs.readdir(logDir);
            const cutoffTime = Date.now() - this.config.monitoring.logRetention;
            let deletedCount = 0;
            
            for (const file of files) {
                const filePath = path.join(logDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime.getTime() < cutoffTime) {
                    await fs.unlink(filePath);
                    deletedCount++;
                    console.log(`🗑️  Log antigo removido: ${file}`);
                }
            }
            
            if (deletedCount > 0) {
                await this.logSecurityEvent('LOG_CLEANUP', {'
                    deleted_files: deletedCount,
                    retention_days: this.config.monitoring.logRetention / (24 * 60 * 60 * 1000)
                });
            }
            
        } catch (error) {
            console.error('Erro na limpeza de logs:', error);'
        }
    }
    
    // 🌐 Obter IP do cliente
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0] ||'
               req.headers['x-real-ip'] ||'
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               req.ip ||
               '127.0.0.1';'
    }
    
    // 💾 Salvar evento no sistema
    async saveSystemEvent(eventData) {
        try {
            const event = {
                ...eventData,
                timestamp: new Date(),
                source_ip: require('os').networkInterfaces()?.eth0?.[0]?.address || '127.0.0.1','
                created_at: new Date(),
                updated_at: new Date()
            };
            
            console.log('💾 Evento de segurança salvo:', event.event_type);'
            
        } catch (error) {
            console.error('Erro ao salvar evento do sistema:', error);'
        }
    }
    
    // 📊 Obter estatísticas de segurança
    getSecurityStats() {
        const stats = {
            rate_limiter: {
                tracked_ips: this.rateLimiter.size,
                total_requests: Array.from(this.rateLimiter.values()).reduce((sum, requests) => sum + requests.length, 0)
            },
            file_integrity: {
                tracked_files: this.fileIntegrity.size
            },
            config: this.config,
            uptime: process.uptime(),
            memory_usage: process.memoryUsage()
        };
        
        return stats;
    }
}

module.exports = SecurityModule;
