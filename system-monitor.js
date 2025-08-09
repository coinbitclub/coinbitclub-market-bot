/**
 * 🔍 MONITOR DE SISTEMA - IP FIXO E EXCHANGES
 * 
 * Script para monitoramento contínuo da conectividade
 * e status das exchanges Binance e Bybit
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

const EXPECTED_IP = '132.255.160.140';
const CHECK_INTERVAL = 30000; // 30 segundos

class SystemMonitor {
    constructor() {
        this.lastIP = null;
        this.lastCheck = null;
        this.errors = [];
        this.successCount = 0;
        this.errorCount = 0;
    }

    async start() {
        console.log('🔍 MONITOR DE SISTEMA INICIADO');
        console.log('==============================');
        console.log(`📍 IP Esperado: ${EXPECTED_IP}`);
        console.log(`⏱️ Intervalo: ${CHECK_INTERVAL / 1000}s`);
        console.log('');

        // Primeira verificação
        await this.performCheck();

        // Agendar verificações periódicas
        setInterval(async () => {
            await this.performCheck();
        }, CHECK_INTERVAL);
    }

    async performCheck() {
        const timestamp = new Date().toISOString();
        console.log(`🔄 [${timestamp}] Verificando sistema...`);

        try {
            // 1. Verificar IP atual
            const currentIP = await this.checkCurrentIP();
            
            // 2. Verificar conectividade das exchanges
            const exchangeStatus = await this.checkExchangeConnectivity();
            
            // 3. Verificar status das chaves API
            const apiKeysStatus = await this.checkAPIKeysHealth();
            
            // 4. Gerar relatório
            await this.generateStatusReport(currentIP, exchangeStatus, apiKeysStatus);
            
            this.successCount++;
            
        } catch (error) {
            console.error('❌ Erro no monitoramento:', error.message);
            this.errors.push({ timestamp, error: error.message });
            this.errorCount++;
        }

        console.log(''); // Linha em branco para separação
    }

    async checkCurrentIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            
            if (this.lastIP && this.lastIP !== data.ip) {
                console.log('🚨 ALERTA: IP MUDOU!');
                console.log(`   Anterior: ${this.lastIP}`);
                console.log(`   Atual: ${data.ip}`);
                
                // Registrar mudança de IP no banco
                await this.logIPChange(this.lastIP, data.ip);
            }
            
            this.lastIP = data.ip;
            
            if (data.ip === EXPECTED_IP) {
                console.log(`✅ IP: ${data.ip} (correto)`);
            } else {
                console.log(`⚠️ IP: ${data.ip} (diferente do esperado: ${EXPECTED_IP})`);
            }
            
            return data.ip;
        } catch (error) {
            console.log('❌ Erro ao verificar IP:', error.message);
            return null;
        }
    }

    async checkExchangeConnectivity() {
        const results = {
            binance: await this.testBinanceConnectivity(),
            bybit: await this.testBybitConnectivity()
        };
        
        return results;
    }

    async testBinanceConnectivity() {
        try {
            const response = await fetch('https://api.binance.com/api/v3/ping', {
                timeout: 5000
            });
            
            if (response.ok) {
                console.log('✅ Binance: Conectividade OK');
                return { status: 'ok', latency: null };
            } else {
                console.log(`⚠️ Binance: HTTP ${response.status}`);
                return { status: 'warning', error: `HTTP ${response.status}` };
            }
        } catch (error) {
            console.log(`❌ Binance: ${error.message}`);
            return { status: 'error', error: error.message };
        }
    }

    async testBybitConnectivity() {
        try {
            const response = await fetch('https://api.bybit.com/v5/market/time', {
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.retCode === 0) {
                    console.log('✅ Bybit: Conectividade OK');
                    return { status: 'ok', data: data };
                } else {
                    console.log(`⚠️ Bybit: Código ${data.retCode}`);
                    return { status: 'warning', error: data.retMsg };
                }
            } else {
                console.log(`⚠️ Bybit: HTTP ${response.status}`);
                return { status: 'warning', error: `HTTP ${response.status}` };
            }
        } catch (error) {
            console.log(`❌ Bybit: ${error.message}`);
            return { status: 'error', error: error.message };
        }
    }

    async checkAPIKeysHealth() {
        try {
            const keysQuery = `
                SELECT 
                    exchange,
                    COUNT(*) as total,
                    COUNT(CASE WHEN validation_status = 'valid' THEN 1 END) as valid,
                    COUNT(CASE WHEN validation_status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN validation_status IS NULL OR validation_status = '' THEN 1 END) as unknown
                FROM user_api_keys
                WHERE is_active = true
                GROUP BY exchange
            `;
            
            const result = await pool.query(keysQuery);
            
            const status = {};
            for (const row of result.rows) {
                status[row.exchange] = {
                    total: parseInt(row.total),
                    valid: parseInt(row.valid),
                    pending: parseInt(row.pending),
                    unknown: parseInt(row.unknown)
                };
                
                const validPercent = row.total > 0 ? (row.valid / row.total * 100).toFixed(1) : 0;
                console.log(`📊 ${row.exchange.toUpperCase()}: ${row.valid}/${row.total} válidas (${validPercent}%)`);
            }
            
            return status;
        } catch (error) {
            console.log('❌ Erro ao verificar chaves API:', error.message);
            return {};
        }
    }

    async generateStatusReport(currentIP, exchangeStatus, apiKeysStatus) {
        const report = {
            timestamp: new Date().toISOString(),
            ip: {
                current: currentIP,
                expected: EXPECTED_IP,
                isCorrect: currentIP === EXPECTED_IP
            },
            exchanges: exchangeStatus,
            apiKeys: apiKeysStatus,
            statistics: {
                totalChecks: this.successCount + this.errorCount,
                successRate: this.successCount / (this.successCount + this.errorCount) * 100,
                errors: this.errors.slice(-5) // Últimos 5 erros
            }
        };

        // Salvar relatório no banco de dados
        await this.saveReport(report);
        
        // Exibir resumo
        this.displaySummary(report);
    }

    async saveReport(report) {
        try {
            await pool.query(`
                INSERT INTO system_health_reports (
                    timestamp, ip_current, ip_expected, ip_correct,
                    binance_status, bybit_status, api_keys_status,
                    report_data
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                report.timestamp,
                report.ip.current,
                report.ip.expected,
                report.ip.isCorrect,
                report.exchanges.binance?.status || 'unknown',
                report.exchanges.bybit?.status || 'unknown',
                JSON.stringify(report.apiKeys),
                JSON.stringify(report)
            ]);
        } catch (error) {
            // Se a tabela não existe, não é um erro crítico
            if (!error.message.includes('relation "system_health_reports" does not exist')) {
                console.log('⚠️ Erro ao salvar relatório:', error.message);
            }
        }
    }

    displaySummary(report) {
        const uptime = this.successCount > 0 ? (this.successCount / (this.successCount + this.errorCount) * 100).toFixed(1) : 0;
        
        console.log('📈 RESUMO:');
        console.log(`   🟢 Sistema: ${uptime}% uptime`);
        console.log(`   🌐 IP: ${report.ip.isCorrect ? '✅' : '⚠️'} ${report.ip.current}`);
        console.log(`   🏦 Exchanges: Binance ${this.getStatusIcon(report.exchanges.binance?.status)} | Bybit ${this.getStatusIcon(report.exchanges.bybit?.status)}`);
        
        if (Object.keys(report.apiKeys).length > 0) {
            const totalKeys = Object.values(report.apiKeys).reduce((sum, ex) => sum + ex.total, 0);
            const validKeys = Object.values(report.apiKeys).reduce((sum, ex) => sum + ex.valid, 0);
            console.log(`   🔑 API Keys: ${validKeys}/${totalKeys} válidas`);
        }
    }

    getStatusIcon(status) {
        switch (status) {
            case 'ok': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return '❓';
        }
    }

    async logIPChange(oldIP, newIP) {
        try {
            await pool.query(`
                INSERT INTO ip_change_log (old_ip, new_ip, detected_at, requires_action)
                VALUES ($1, $2, NOW(), $3)
            `, [oldIP, newIP, newIP !== EXPECTED_IP]);
            
            console.log('📝 Mudança de IP registrada no log');
        } catch (error) {
            // Falha não crítica
            console.log('⚠️ Não foi possível registrar mudança de IP');
        }
    }

    async stop() {
        console.log('🛑 Monitor de sistema parado');
        await pool.end();
    }
}

// Criar e iniciar monitor
const monitor = new SystemMonitor();

// Capturar sinais de interrupção
process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando monitor...');
    await monitor.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Encerrando monitor...');
    await monitor.stop();
    process.exit(0);
});

// Iniciar monitoramento
monitor.start().catch(console.error);
