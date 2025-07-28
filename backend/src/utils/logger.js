#!/usr/bin/env node

/**
 * 📝 LOGGER UTILS - COINBITCLUB IA MONITORING
 * Sistema de logging centralizado para IA de Monitoramento
 * Conforme especificação Seção 3.3 - Logging e Auditoria
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.ensureLogDirectory();
        
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        
        this.currentLevel = this.logLevels.INFO;
        
        console.log('📝 Logger inicializado');
    }
    
    // 📁 Garantir que diretório de logs existe
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }
    
    // 📝 Log de informação
    info(message, data = null) {
        this.log('INFO', message, data);
    }
    
    // ⚠️ Log de aviso
    warn(message, data = null) {
        this.log('WARN', message, data);
    }
    
    // ❌ Log de erro
    error(message, error = null) {
        const errorData = error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : null;
        
        this.log('ERROR', message, errorData);
    }
    
    // 🐛 Log de debug
    debug(message, data = null) {
        if (this.currentLevel >= this.logLevels.DEBUG) {
            this.log('DEBUG', message, data);
        }
    }
    
    // 📊 Log para IA Monitoring
    aiLog(component, action, data = null) {
        const aiLogData = {
            component: component,
            action: action,
            data: data,
            timestamp: new Date().toISOString(),
            source: 'IA_MONITORING'
        };
        
        this.log('INFO', `[IA] ${component}: ${action}`, aiLogData);
        
        // Salvar em arquivo específico da IA
        this.saveToFile('ai-monitoring.log', aiLogData);
    }
    
    // 🔒 Log de segurança
    securityLog(event, details = null) {
        const securityData = {
            event: event,
            details: details,
            timestamp: new Date().toISOString(),
            source: 'SECURITY'
        };
        
        this.log('WARN', `[SECURITY] ${event}`, securityData);
        
        // Salvar em arquivo específico de segurança
        this.saveToFile('security.log', securityData);
    }
    
    // 💰 Log de trading
    tradeLog(action, orderData = null) {
        const tradeData = {
            action: action,
            orderData: orderData,
            timestamp: new Date().toISOString(),
            source: 'TRADING'
        };
        
        this.log('INFO', `[TRADE] ${action}`, tradeData);
        
        // Salvar em arquivo específico de trading
        this.saveToFile('trading.log', tradeData);
    }
    
    // 📝 Método principal de log
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp: timestamp,
            level: level,
            message: message,
            data: data,
            pid: process.pid,
            memory: this.getMemoryUsage()
        };
        
        // Exibir no console
        const consoleMessage = `${timestamp} [${level}] ${message}`;
        
        switch (level) {
            case 'ERROR':
                console.error(`❌ ${consoleMessage}`);
                break;
            case 'WARN':
                console.warn(`⚠️ ${consoleMessage}`);
                break;
            case 'INFO':
                console.log(`ℹ️ ${consoleMessage}`);
                break;
            case 'DEBUG':
                console.debug(`🐛 ${consoleMessage}`);
                break;
            default:
                console.log(consoleMessage);
        }
        
        // Salvar em arquivo
        this.saveToFile('application.log', logEntry);
    }
    
    // 💾 Salvar em arquivo específico
    saveToFile(filename, data) {
        try {
            const filePath = path.join(this.logDir, filename);
            const logLine = JSON.stringify(data) + '\n';
            
            fs.appendFileSync(filePath, logLine);
            
        } catch (error) {
            console.error('Erro ao salvar log:', error.message);
        }
    }
    
    // 📊 Obter uso de memória
    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
            external: Math.round(usage.external / 1024 / 1024 * 100) / 100 // MB
        };
    }
    
    // 📈 Estatísticas de logs
    getStats() {
        try {
            const logFiles = fs.readdirSync(this.logDir);
            const stats = {};
            
            for (const file of logFiles) {
                const filePath = path.join(this.logDir, file);
                const fileStats = fs.statSync(filePath);
                
                stats[file] = {
                    size: fileStats.size,
                    modified: fileStats.mtime,
                    lines: this.countLines(filePath)
                };
            }
            
            return stats;
            
        } catch (error) {
            this.error('Erro ao obter estatísticas de logs', error);
            return {};
        }
    }
    
    // 📏 Contar linhas do arquivo
    countLines(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.split('\n').length - 1;
        } catch (error) {
            return 0;
        }
    }
    
    // 🧹 Limpar logs antigos
    cleanOldLogs(daysOld = 7) {
        try {
            const logFiles = fs.readdirSync(this.logDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            let cleanedFiles = 0;
            
            for (const file of logFiles) {
                const filePath = path.join(this.logDir, file);
                const fileStats = fs.statSync(filePath);
                
                if (fileStats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    cleanedFiles++;
                    this.info(`Log antigo removido: ${file}`);
                }
            }
            
            this.info(`Limpeza concluída: ${cleanedFiles} arquivos removidos`);
            return cleanedFiles;
            
        } catch (error) {
            this.error('Erro na limpeza de logs', error);
            return 0;
        }
    }
    
    // 🔍 Buscar nos logs
    searchLogs(searchTerm, logFile = 'application.log') {
        try {
            const filePath = path.join(this.logDir, logFile);
            
            if (!fs.existsSync(filePath)) {
                return [];
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            const results = [];
            
            for (const line of lines) {
                if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
                    try {
                        const logEntry = JSON.parse(line);
                        results.push(logEntry);
                    } catch (parseError) {
                        // Linha não é JSON válido, ignorar
                    }
                }
            }
            
            return results;
            
        } catch (error) {
            this.error('Erro na busca de logs', error);
            return [];
        }
    }
    
    // 📊 Relatório de logs
    generateReport() {
        const stats = this.getStats();
        const memoryUsage = this.getMemoryUsage();
        
        const report = {
            timestamp: new Date().toISOString(),
            files: stats,
            memory: memoryUsage,
            uptime: process.uptime(),
            version: process.version,
            platform: process.platform
        };
        
        this.info('Relatório de logs gerado', report);
        this.saveToFile('logger-report.json', report);
        
        return report;
    }
}

// Exportar instância singleton
const logger = new Logger();

module.exports = {
    logger,
    info: (message, data) => logger.info(message, data),
    warn: (message, data) => logger.warn(message, data),
    error: (message, error) => logger.error(message, error),
    debug: (message, data) => logger.debug(message, data),
    aiLog: (component, action, data) => logger.aiLog(component, action, data),
    securityLog: (event, details) => logger.securityLog(event, details),
    tradeLog: (action, orderData) => logger.tradeLog(action, orderData)
};
