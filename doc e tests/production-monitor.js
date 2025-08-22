/**
 * MARKETBOT MONITORING SYSTEM
 * Sistema de monitoramento contínuo da produção
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class MarketBotMonitor {
    constructor() {
        this.config = {
            baseURL: 'http://localhost:3000',
            externalURL: 'https://marketbot.ngrok.app',
            interval: 60000, // 1 minuto
            logFile: 'monitoring.log',
            alertThreshold: 3 // Falhas consecutivas para alerta
        };
        
        this.stats = {
            totalChecks: 0,
            successCount: 0,
            failureCount: 0,
            consecutiveFailures: 0,
            lastCheck: null,
            uptime: 0,
            startTime: new Date()
        };
        
        this.endpoints = [
            { name: 'Health Check', url: '/health', critical: true },
            { name: 'API Base', url: '/api/v1', critical: true },
            { name: 'Cupons', url: '/api/v1/coupons-affiliates/validate-coupon/WELCOME10', critical: true },
            { name: 'Crédito BRL', url: '/api/v1/coupons-affiliates/validate-coupon/CREDIT250BRL', critical: true },
            { name: 'Crédito USD', url: '/api/v1/coupons-affiliates/validate-coupon/CREDIT50USD', critical: true },
            { name: 'Afiliados', url: '/api/v1/coupons-affiliates/affiliate/generate', critical: false, method: 'POST', data: { user_id: 'monitor-test' } },
            { name: 'Pagamentos Brasil', url: '/api/v1/payment/recharge-links/brasil', critical: false },
            { name: 'Pagamentos Global', url: '/api/v1/payment/recharge-links/global', critical: false }
        ];
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}\n`;
        
        console.log(`${this.getColorCode(level)}${logEntry.trim()}${this.getColorCode('reset')}`);
        
        // Salvar no arquivo
        fs.appendFileSync(this.config.logFile, logEntry);
    }

    getColorCode(level) {
        const colors = {
            'SUCCESS': '\x1b[32m', // Verde
            'ERROR': '\x1b[31m',   // Vermelho
            'WARNING': '\x1b[33m', // Amarelo
            'INFO': '\x1b[36m',    // Ciano
            'reset': '\x1b[0m'     // Reset
        };
        return colors[level] || '';
    }

    async checkEndpoint(endpoint, useExternal = false) {
        const baseURL = useExternal ? this.config.externalURL : this.config.baseURL;
        
        try {
            const config = {
                method: endpoint.method || 'GET',
                url: `${baseURL}${endpoint.url}`,
                timeout: 10000,
                validateStatus: () => true // Accept any status
            };

            if (endpoint.data) {
                config.data = endpoint.data;
                config.headers = { 'Content-Type': 'application/json' };
            }

            const response = await axios(config);
            
            const success = response.status >= 200 && response.status < 300;
            
            return {
                success,
                status: response.status,
                responseTime: response.headers['x-response-time'] || 'N/A',
                data: response.data
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: error.response?.status || 'TIMEOUT'
            };
        }
    }

    async runHealthCheck() {
        this.stats.totalChecks++;
        this.stats.lastCheck = new Date();
        
        const results = {
            timestamp: this.stats.lastCheck.toISOString(),
            local: { success: 0, total: 0, failures: [] },
            external: { success: 0, total: 0, failures: [] }
        };

        this.log('🔍 Executando verificação de saúde do sistema...', 'INFO');

        // Teste local
        for (const endpoint of this.endpoints) {
            results.local.total++;
            const result = await this.checkEndpoint(endpoint, false);
            
            if (result.success) {
                results.local.success++;
                this.log(`✅ LOCAL ${endpoint.name}: OK (${result.status})`, 'SUCCESS');
            } else {
                results.local.failures.push({ endpoint: endpoint.name, error: result.error || result.status });
                this.log(`❌ LOCAL ${endpoint.name}: FALHOU (${result.status}) - ${result.error || 'Unknown error'}`, 'ERROR');
            }
        }

        // Teste externo (apenas endpoints críticos)
        const criticalEndpoints = this.endpoints.filter(ep => ep.critical);
        for (const endpoint of criticalEndpoints) {
            results.external.total++;
            const result = await this.checkEndpoint(endpoint, true);
            
            if (result.success) {
                results.external.success++;
                this.log(`✅ EXTERNAL ${endpoint.name}: OK (${result.status})`, 'SUCCESS');
            } else {
                results.external.failures.push({ endpoint: endpoint.name, error: result.error || result.status });
                this.log(`❌ EXTERNAL ${endpoint.name}: FALHOU (${result.status}) - ${result.error || 'Unknown error'}`, 'ERROR');
            }
        }

        // Calcular estatísticas
        const localSuccess = results.local.success === results.local.total;
        const externalSuccess = results.external.success === results.external.total;
        const overallSuccess = localSuccess && externalSuccess;

        if (overallSuccess) {
            this.stats.successCount++;
            this.stats.consecutiveFailures = 0;
        } else {
            this.stats.failureCount++;
            this.stats.consecutiveFailures++;
        }

        // Verificar alertas
        if (this.stats.consecutiveFailures >= this.config.alertThreshold) {
            this.log(`🚨 ALERTA: ${this.stats.consecutiveFailures} falhas consecutivas detectadas!`, 'ERROR');
            this.sendAlert(results);
        }

        // Calcular uptime
        const totalTime = Date.now() - this.stats.startTime.getTime();
        this.stats.uptime = ((this.stats.successCount / this.stats.totalChecks) * 100).toFixed(2);

        // Log de resumo
        this.log(`📊 Resumo: Local ${results.local.success}/${results.local.total}, External ${results.external.success}/${results.external.total}, Uptime: ${this.stats.uptime}%`, 'INFO');

        return results;
    }

    sendAlert(results) {
        const alertData = {
            timestamp: new Date().toISOString(),
            message: `MarketBot System Alert: ${this.stats.consecutiveFailures} consecutive failures`,
            consecutiveFailures: this.stats.consecutiveFailures,
            uptime: this.stats.uptime,
            failures: [...results.local.failures, ...results.external.failures]
        };

        // Salvar alerta em arquivo
        const alertFile = 'alerts.log';
        fs.appendFileSync(alertFile, JSON.stringify(alertData, null, 2) + '\n');
        
        this.log(`🚨 Alerta salvo em ${alertFile}`, 'ERROR');
    }

    async testSpecificFeatures() {
        this.log('🧪 Testando funcionalidades específicas...', 'INFO');

        // Teste de cupons
        const coupons = ['WELCOME10', 'PROMO20', 'VIP25', 'CREDIT250BRL', 'CREDIT50USD'];
        for (const coupon of coupons) {
            const result = await this.checkEndpoint({
                name: `Coupon ${coupon}`,
                url: `/api/v1/coupons-affiliates/validate-coupon/${coupon}`
            });

            if (result.success) {
                this.log(`✅ Cupom ${coupon}: Válido`, 'SUCCESS');
            } else {
                this.log(`❌ Cupom ${coupon}: Erro`, 'ERROR');
            }
        }

        // Teste de geração de afiliado
        const affiliateResult = await this.checkEndpoint({
            name: 'Generate Affiliate',
            url: '/api/v1/coupons-affiliates/affiliate/generate',
            method: 'POST',
            data: { user_id: `monitor-${Date.now()}` }
        });

        if (affiliateResult.success) {
            this.log('✅ Geração de afiliado: OK', 'SUCCESS');
        } else {
            this.log('❌ Geração de afiliado: Erro', 'ERROR');
        }
    }

    generateReport() {
        const runtime = Date.now() - this.stats.startTime.getTime();
        const runtimeHours = (runtime / (1000 * 60 * 60)).toFixed(2);

        const report = {
            timestamp: new Date().toISOString(),
            runtime_hours: runtimeHours,
            total_checks: this.stats.totalChecks,
            success_count: this.stats.successCount,
            failure_count: this.stats.failureCount,
            uptime_percentage: this.stats.uptime,
            consecutive_failures: this.stats.consecutiveFailures,
            last_check: this.stats.lastCheck?.toISOString()
        };

        const reportFile = `report-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        this.log(`📄 Relatório gerado: ${reportFile}`, 'INFO');
        return report;
    }

    printStatus() {
        console.clear();
        console.log('🚀 MARKETBOT PRODUCTION MONITOR');
        console.log('=' * 50);
        console.log(`⏰ Executando desde: ${this.stats.startTime.toLocaleString()}`);
        console.log(`📊 Total de verificações: ${this.stats.totalChecks}`);
        console.log(`✅ Sucessos: ${this.stats.successCount}`);
        console.log(`❌ Falhas: ${this.stats.failureCount}`);
        console.log(`📈 Uptime: ${this.stats.uptime}%`);
        console.log(`🔥 Falhas consecutivas: ${this.stats.consecutiveFailures}`);
        console.log(`🕐 Última verificação: ${this.stats.lastCheck?.toLocaleString() || 'Nunca'}`);
        console.log('=' * 50);
    }

    async start() {
        this.log('🚀 Iniciando MarketBot Production Monitor...', 'INFO');
        this.log(`📍 Monitorando: ${this.config.baseURL} e ${this.config.externalURL}`, 'INFO');
        this.log(`⏱️  Intervalo: ${this.config.interval / 1000}s`, 'INFO');

        // Verificação inicial
        await this.runHealthCheck();
        await this.testSpecificFeatures();

        // Loop principal
        setInterval(async () => {
            try {
                await this.runHealthCheck();
                
                // Teste detalhado a cada 10 verificações
                if (this.stats.totalChecks % 10 === 0) {
                    await this.testSpecificFeatures();
                }

                // Relatório a cada 100 verificações
                if (this.stats.totalChecks % 100 === 0) {
                    this.generateReport();
                }

                this.printStatus();

            } catch (error) {
                this.log(`💥 Erro no monitor: ${error.message}`, 'ERROR');
            }
        }, this.config.interval);

        // Relatório inicial
        setTimeout(() => {
            this.generateReport();
        }, 5000);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const monitor = new MarketBotMonitor();
    
    // Capturar Ctrl+C para finalização limpa
    process.on('SIGINT', () => {
        monitor.log('🛑 Finalizando monitor...', 'WARNING');
        monitor.generateReport();
        process.exit(0);
    });

    monitor.start().catch(error => {
        console.error('💥 Falha crítica no monitor:', error);
        process.exit(1);
    });
}

module.exports = MarketBotMonitor;
