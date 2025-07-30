/**
 * 📊 DASHBOARD DE MONITORAMENTO EM TEMPO REAL
 * 
 * Sistema completo para:
 * - Monitorar validações em tempo real
 * - Exibir estatísticas do sistema
 * - Alertas e notificações
 * - Controle de performance
 */

const { Pool } = require('pg');
const EventEmitter = require('events');

class RealTimeMonitor extends EventEmitter {
    constructor() {
        super();
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
        
        this.stats = {
            totalUsers: 0,
            activeKeys: 0,
            validKeys: 0,
            pendingValidations: 0,
            successfulValidations: 0,
            failedValidations: 0,
            lastUpdate: null
        };
        
        this.alerts = [];
        this.isMonitoring = false;
        
        console.log('📊 MONITOR EM TEMPO REAL INICIALIZADO');
        console.log('===================================');
    }
    
    /**
     * Iniciar monitoramento
     */
    async startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ Monitoramento já está ativo');
            return;
        }
        
        this.isMonitoring = true;
        console.log('🚀 Iniciando monitoramento em tempo real...');
        
        // Atualizar estatísticas a cada 5 segundos
        this.statsInterval = setInterval(() => {
            this.updateStats();
        }, 5000);
        
        // Verificar alertas a cada 10 segundos
        this.alertsInterval = setInterval(() => {
            this.checkAlerts();
        }, 10000);
        
        // Exibir dashboard a cada 30 segundos
        this.dashboardInterval = setInterval(() => {
            this.displayDashboard();
        }, 30000);
        
        // Primeira atualização imediata
        await this.updateStats();
        this.displayDashboard();
    }
    
    /**
     * Parar monitoramento
     */
    stopMonitoring() {
        this.isMonitoring = false;
        
        if (this.statsInterval) clearInterval(this.statsInterval);
        if (this.alertsInterval) clearInterval(this.alertsInterval);
        if (this.dashboardInterval) clearInterval(this.dashboardInterval);
        
        console.log('⏹️ Monitoramento interrompido');
    }
    
    /**
     * Atualizar estatísticas
     */
    async updateStats() {
        try {
            // Total de usuários ativos
            const usersResult = await this.pool.query(`
                SELECT COUNT(*) as total 
                FROM users 
                WHERE is_active = true
            `);
            this.stats.totalUsers = parseInt(usersResult.rows[0].total);
            
            // Chaves ativas
            const keysResult = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_active,
                    COUNT(CASE WHEN validation_status = 'valid' THEN 1 END) as valid,
                    COUNT(CASE WHEN validation_status = 'pending' THEN 1 END) as pending
                FROM user_api_keys 
                WHERE is_active = true
            `);
            
            const keyStats = keysResult.rows[0];
            this.stats.activeKeys = parseInt(keyStats.total_active);
            this.stats.validKeys = parseInt(keyStats.valid);
            this.stats.pendingValidations = parseInt(keyStats.pending);
            
            // Histórico de validações (últimas 24h)
            const validationsResult = await this.pool.query(`
                SELECT 
                    COUNT(CASE WHEN validation_status = 'valid' THEN 1 END) as successful,
                    COUNT(CASE WHEN validation_status = 'failed' THEN 1 END) as failed
                FROM user_api_keys 
                WHERE updated_at >= NOW() - INTERVAL '24 hours'
            `);
            
            const validationStats = validationsResult.rows[0];
            this.stats.successfulValidations = parseInt(validationStats.successful);
            this.stats.failedValidations = parseInt(validationStats.failed);
            
            this.stats.lastUpdate = new Date();
            
            // Emitir evento de atualização
            this.emit('statsUpdated', this.stats);
            
        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas:', error.message);
        }
    }
    
    /**
     * Verificar alertas
     */
    async checkAlerts() {
        try {
            this.alerts = [];
            
            // Alerta: Muitas validações pendentes
            if (this.stats.pendingValidations > 5) {
                this.addAlert('warning', `${this.stats.pendingValidations} validações pendentes`, 'VALIDAÇÃO');
            }
            
            // Alerta: Muitas validações falhando
            const failureRate = this.stats.failedValidations / (this.stats.successfulValidations + this.stats.failedValidations);
            if (failureRate > 0.3 && this.stats.failedValidations > 3) {
                this.addAlert('error', `Taxa de falha alta: ${(failureRate * 100).toFixed(1)}%`, 'VALIDAÇÃO');
            }
            
            // Alerta: Chaves inválidas antigas
            const oldInvalidResult = await this.pool.query(`
                SELECT COUNT(*) as total
                FROM user_api_keys 
                WHERE validation_status = 'failed' 
                AND updated_at <= NOW() - INTERVAL '1 day'
                AND is_active = true
            `);
            
            const oldInvalid = parseInt(oldInvalidResult.rows[0].total);
            if (oldInvalid > 0) {
                this.addAlert('warning', `${oldInvalid} chaves inválidas antigas`, 'LIMPEZA');
            }
            
            // Alerta: Usuários sem chaves válidas
            const usersWithoutKeysResult = await this.pool.query(`
                SELECT COUNT(*) as total
                FROM users u
                WHERE u.is_active = true
                AND NOT EXISTS (
                    SELECT 1 FROM user_api_keys uak
                    WHERE uak.user_id = u.id 
                    AND uak.validation_status = 'valid'
                    AND uak.is_active = true
                )
            `);
            
            const usersWithoutKeys = parseInt(usersWithoutKeysResult.rows[0].total);
            if (usersWithoutKeys > 0) {
                this.addAlert('info', `${usersWithoutKeys} usuários sem chaves válidas`, 'CONFIGURAÇÃO');
            }
            
            // Emitir eventos de alerta
            if (this.alerts.length > 0) {
                this.emit('alertsUpdated', this.alerts);
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar alertas:', error.message);
        }
    }
    
    /**
     * Adicionar alerta
     */
    addAlert(level, message, category) {
        this.alerts.push({
            id: Date.now(),
            level: level,
            message: message,
            category: category,
            timestamp: new Date()
        });
    }
    
    /**
     * Exibir dashboard
     */
    displayDashboard() {
        console.clear();
        console.log('📊 COINBITCLUB - DASHBOARD EM TEMPO REAL');
        console.log('=========================================');
        console.log(`🕒 Última atualização: ${this.stats.lastUpdate?.toLocaleString('pt-BR') || 'Nunca'}`);
        console.log('');
        
        // Estatísticas principais
        console.log('📈 ESTATÍSTICAS PRINCIPAIS');
        console.log('─────────────────────────');
        console.log(`👥 Usuários ativos: ${this.stats.totalUsers}`);
        console.log(`🔑 Chaves ativas: ${this.stats.activeKeys}`);
        console.log(`✅ Chaves válidas: ${this.stats.validKeys}`);
        console.log(`⏳ Validações pendentes: ${this.stats.pendingValidations}`);
        console.log('');
        
        // Performance de validação
        console.log('🎯 PERFORMANCE (24h)');
        console.log('─────────────────────');
        console.log(`✅ Validações bem-sucedidas: ${this.stats.successfulValidations}`);
        console.log(`❌ Validações falharam: ${this.stats.failedValidations}`);
        
        const total = this.stats.successfulValidations + this.stats.failedValidations;
        if (total > 0) {
            const successRate = (this.stats.successfulValidations / total * 100).toFixed(1);
            console.log(`📊 Taxa de sucesso: ${successRate}%`);
        }
        console.log('');
        
        // Alertas
        if (this.alerts.length > 0) {
            console.log('🚨 ALERTAS ATIVOS');
            console.log('─────────────────');
            this.alerts.forEach(alert => {
                const icon = this.getAlertIcon(alert.level);
                console.log(`${icon} [${alert.category}] ${alert.message}`);
            });
            console.log('');
        }
        
        // Status do sistema
        console.log('🔄 STATUS DO SISTEMA');
        console.log('────────────────────');
        console.log(`📡 Monitoramento: ${this.isMonitoring ? '🟢 ATIVO' : '🔴 INATIVO'}`);
        
        const healthScore = this.calculateHealthScore();
        console.log(`💚 Saúde do sistema: ${healthScore}%`);
        
        if (healthScore >= 90) {
            console.log('🎉 Sistema funcionando perfeitamente!');
        } else if (healthScore >= 70) {
            console.log('⚠️ Sistema funcionando com pequenos problemas');
        } else {
            console.log('🚨 Sistema precisa de atenção!');
        }
        
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Pressione Ctrl+C para parar o monitoramento');
    }
    
    /**
     * Obter ícone do alerta
     */
    getAlertIcon(level) {
        switch (level) {
            case 'error': return '🚨';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '🔔';
        }
    }
    
    /**
     * Calcular score de saúde do sistema
     */
    calculateHealthScore() {
        let score = 100;
        
        // Penalizar por validações pendentes
        if (this.stats.pendingValidations > 5) {
            score -= Math.min(20, this.stats.pendingValidations * 2);
        }
        
        // Penalizar por taxa de falha alta
        const total = this.stats.successfulValidations + this.stats.failedValidations;
        if (total > 0) {
            const failureRate = this.stats.failedValidations / total;
            if (failureRate > 0.1) {
                score -= failureRate * 50;
            }
        }
        
        // Penalizar por alertas críticos
        const criticalAlerts = this.alerts.filter(a => a.level === 'error').length;
        score -= criticalAlerts * 15;
        
        // Penalizar por usuários sem chaves
        const usersWithoutValidKeys = this.stats.totalUsers - (this.stats.validKeys > 0 ? this.stats.totalUsers : 0);
        if (usersWithoutValidKeys > 0 && this.stats.totalUsers > 0) {
            score -= (usersWithoutValidKeys / this.stats.totalUsers) * 20;
        }
        
        return Math.max(0, Math.round(score));
    }
    
    /**
     * Obter relatório detalhado
     */
    async getDetailedReport() {
        try {
            const report = {
                timestamp: new Date(),
                stats: this.stats,
                alerts: this.alerts,
                healthScore: this.calculateHealthScore()
            };
            
            // Detalhes por exchange
            const exchangeStats = await this.pool.query(`
                SELECT 
                    exchange,
                    COUNT(*) as total,
                    COUNT(CASE WHEN validation_status = 'valid' THEN 1 END) as valid,
                    COUNT(CASE WHEN validation_status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN validation_status = 'failed' THEN 1 END) as failed
                FROM user_api_keys 
                WHERE is_active = true
                GROUP BY exchange
                ORDER BY total DESC
            `);
            
            report.exchangeBreakdown = exchangeStats.rows;
            
            // Usuários mais ativos
            const activeUsers = await this.pool.query(`
                SELECT 
                    u.name,
                    u.email,
                    COUNT(uak.id) as total_keys,
                    COUNT(CASE WHEN uak.validation_status = 'valid' THEN 1 END) as valid_keys
                FROM users u
                LEFT JOIN user_api_keys uak ON u.id = uak.user_id AND uak.is_active = true
                WHERE u.is_active = true
                GROUP BY u.id, u.name, u.email
                ORDER BY total_keys DESC
                LIMIT 10
            `);
            
            report.topUsers = activeUsers.rows;
            
            return report;
            
        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error.message);
            return null;
        }
    }
    
    /**
     * Exportar dados para arquivo
     */
    async exportReport(filename = null) {
        try {
            const report = await this.getDetailedReport();
            const fs = require('fs');
            
            const exportFilename = filename || `coinbitclub-report-${Date.now()}.json`;
            fs.writeFileSync(exportFilename, JSON.stringify(report, null, 2));
            
            console.log(`📄 Relatório exportado: ${exportFilename}`);
            return exportFilename;
            
        } catch (error) {
            console.error('❌ Erro ao exportar relatório:', error.message);
            return null;
        }
    }
}

// Instância global do monitor
const monitor = new RealTimeMonitor();

// Eventos do monitor
monitor.on('statsUpdated', (stats) => {
    // console.log('📊 Estatísticas atualizadas');
});

monitor.on('alertsUpdated', (alerts) => {
    const criticalAlerts = alerts.filter(a => a.level === 'error');
    if (criticalAlerts.length > 0) {
        console.log('🚨 ALERTAS CRÍTICOS DETECTADOS!');
        criticalAlerts.forEach(alert => {
            console.log(`   🚨 [${alert.category}] ${alert.message}`);
        });
    }
});

// Função para testar o monitor
async function testMonitor() {
    console.log('🧪 TESTANDO MONITOR EM TEMPO REAL');
    console.log('=================================');
    
    await monitor.startMonitoring();
    
    // Executar por 2 minutos
    setTimeout(async () => {
        console.log('\n📄 Gerando relatório final...');
        const report = await monitor.getDetailedReport();
        
        if (report) {
            console.log('\n📋 RELATÓRIO FINAL:');
            console.log('─────────────────');
            console.log(`⏰ Timestamp: ${report.timestamp.toLocaleString('pt-BR')}`);
            console.log(`💚 Score de saúde: ${report.healthScore}%`);
            console.log(`🚨 Alertas ativos: ${report.alerts.length}`);
            
            if (report.exchangeBreakdown.length > 0) {
                console.log('\n🏦 BREAKDOWN POR EXCHANGE:');
                report.exchangeBreakdown.forEach(ex => {
                    console.log(`   ${ex.exchange}: ${ex.valid}/${ex.total} válidas`);
                });
            }
        }
        
        monitor.stopMonitoring();
        process.exit(0);
    }, 120000); // 2 minutos
}

// Executar se chamado diretamente
if (require.main === module) {
    testMonitor().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n⏹️ Encerrando monitor...');
        monitor.stopMonitoring();
        process.exit(0);
    });
}

module.exports = {
    RealTimeMonitor,
    monitor
};
