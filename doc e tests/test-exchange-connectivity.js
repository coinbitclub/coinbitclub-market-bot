/**
 * TESTE DE CONECTIVIDADE COM EXCHANGES
 * Validação pós IP fixo NGROK
 */

const axios = require('axios');

class ExchangeConnectivityTester {
    constructor() {
        this.ngrokDomain = 'marketbot.ngrok.app';
        this.results = {
            binance: { status: 'pending', tests: [] },
            bybit: { status: 'pending', tests: [] },
            tradingview: { status: 'pending', tests: [] },
            ipResolution: { status: 'pending', ips: [] }
        };
    }

    log(message, type = 'info') {
        const colors = {
            success: '\x1b[32m',
            error: '\x1b[31m', 
            warning: '\x1b[33m',
            info: '\x1b[36m',
            reset: '\x1b[0m'
        };
        
        const timestamp = new Date().toLocaleTimeString();
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async resolveNgrokIPs() {
        this.log('🌐 Resolvendo IPs do domínio NGROK...', 'info');
        
        try {
            // Simular resolução DNS (em produção usaria dns.resolve)
            const response = await axios.get(`https://dns.google/resolve?name=${this.ngrokDomain}&type=A`);
            
            if (response.data && response.data.Answer) {
                const ips = response.data.Answer
                    .filter(record => record.type === 1)
                    .map(record => record.data);
                
                this.results.ipResolution.ips = ips;
                this.results.ipResolution.status = 'success';
                
                this.log(`✅ IPs resolvidos: ${ips.join(', ')}`, 'success');
                return ips;
            }
            
            // Fallback para IPs conhecidos
            const fallbackIPs = [
                '132.255.160.131',
                '132.255.171.176', 
                '132.255.249.43'
            ];
            
            this.results.ipResolution.ips = fallbackIPs;
            this.results.ipResolution.status = 'fallback';
            
            this.log(`⚠️  Usando IPs conhecidos: ${fallbackIPs.join(', ')}`, 'warning');
            return fallbackIPs;
            
        } catch (error) {
            this.log(`❌ Erro na resolução DNS: ${error.message}`, 'error');
            this.results.ipResolution.status = 'error';
            return [];
        }
    }

    async testBinanceConnectivity() {
        this.log('🟡 Testando conectividade com Binance...', 'info');
        
        const tests = [
            {
                name: 'Binance Time',
                url: 'https://api.binance.com/api/v3/time',
                method: 'GET'
            },
            {
                name: 'Binance Server Status',
                url: 'https://api.binance.com/api/v3/ping',
                method: 'GET'
            },
            {
                name: 'Binance Exchange Info',
                url: 'https://api.binance.com/api/v3/exchangeInfo',
                method: 'GET'
            },
            {
                name: 'Binance 24hr Ticker',
                url: 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',
                method: 'GET'
            }
        ];

        for (const test of tests) {
            try {
                const startTime = Date.now();
                const response = await axios({
                    method: test.method,
                    url: test.url,
                    timeout: 10000,
                    headers: {
                        'User-Agent': `MarketBot/1.0 (${this.ngrokDomain})`
                    }
                });
                
                const responseTime = Date.now() - startTime;
                
                const result = {
                    name: test.name,
                    status: 'success',
                    responseTime: `${responseTime}ms`,
                    statusCode: response.status
                };
                
                this.results.binance.tests.push(result);
                this.log(`  ✅ ${test.name}: OK (${response.status}) - ${responseTime}ms`, 'success');
                
            } catch (error) {
                const result = {
                    name: test.name,
                    status: 'error',
                    error: error.message,
                    statusCode: error.response?.status || 'TIMEOUT'
                };
                
                this.results.binance.tests.push(result);
                this.log(`  ❌ ${test.name}: ERRO (${error.response?.status || 'TIMEOUT'})`, 'error');
            }
        }

        const successCount = this.results.binance.tests.filter(t => t.status === 'success').length;
        this.results.binance.status = successCount === tests.length ? 'success' : 'partial';
        
        this.log(`📊 Binance: ${successCount}/${tests.length} testes aprovados`, 
                 successCount === tests.length ? 'success' : 'warning');
    }

    async testBybitConnectivity() {
        this.log('🟠 Testando conectividade com Bybit...', 'info');
        
        const tests = [
            {
                name: 'Bybit Server Time',
                url: 'https://api.bybit.com/v5/market/time',
                method: 'GET'
            },
            {
                name: 'Bybit Market Status',
                url: 'https://api.bybit.com/v5/market/instruments-info?category=spot&symbol=BTCUSDT',
                method: 'GET'
            },
            {
                name: 'Bybit Ticker',
                url: 'https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT',
                method: 'GET'
            }
        ];

        for (const test of tests) {
            try {
                const startTime = Date.now();
                const response = await axios({
                    method: test.method,
                    url: test.url,
                    timeout: 10000,
                    headers: {
                        'User-Agent': `MarketBot/1.0 (${this.ngrokDomain})`
                    }
                });
                
                const responseTime = Date.now() - startTime;
                
                const result = {
                    name: test.name,
                    status: 'success',
                    responseTime: `${responseTime}ms`,
                    statusCode: response.status
                };
                
                this.results.bybit.tests.push(result);
                this.log(`  ✅ ${test.name}: OK (${response.status}) - ${responseTime}ms`, 'success');
                
            } catch (error) {
                const result = {
                    name: test.name,
                    status: 'error',
                    error: error.message,
                    statusCode: error.response?.status || 'TIMEOUT'
                };
                
                this.results.bybit.tests.push(result);
                this.log(`  ❌ ${test.name}: ERRO (${error.response?.status || 'TIMEOUT'})`, 'error');
            }
        }

        const successCount = this.results.bybit.tests.filter(t => t.status === 'success').length;
        this.results.bybit.status = successCount === tests.length ? 'success' : 'partial';
        
        this.log(`📊 Bybit: ${successCount}/${tests.length} testes aprovados`, 
                 successCount === tests.length ? 'success' : 'warning');
    }

    async testTradingViewWebhook() {
        this.log('📈 Testando webhook TradingView...', 'info');
        
        try {
            // Simular webhook do TradingView com autenticação
            const webhookPayload = {
                strategy: {
                    order_action: "buy",
                    market_position: "long",
                    market_position_size: "0",
                    prev_market_position: "flat",
                    prev_market_position_size: "0"
                },
                order: {
                    contracts: "1",
                    price: "50000"
                },
                ticker: "BINANCE:BTCUSDT",
                time: new Date().toISOString(),
                action: "buy",
                symbol: "BTCUSDT"
            };

            const response = await axios({
                method: 'POST',
                url: `https://${this.ngrokDomain}/webhooks/tradingview?token=tradingview-2024`,
                data: webhookPayload,
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'TradingView-Webhook'
                }
            });

            this.results.tradingview = {
                status: 'success',
                statusCode: response.status,
                response: response.data
            };

            this.log(`✅ TradingView Webhook: OK (${response.status})`, 'success');
            
        } catch (error) {
            this.results.tradingview = {
                status: 'error',
                error: error.message,
                statusCode: error.response?.status || 'TIMEOUT'
            };

            this.log(`❌ TradingView Webhook: ERRO (${error.response?.status || 'TIMEOUT'})`, 'error');
        }
    }

    async testMarketBotAPI() {
        this.log('🤖 Testando API MarketBot via NGROK...', 'info');
        
        const tests = [
            {
                name: 'Health Check',
                url: `https://${this.ngrokDomain}/health`
            },
            {
                name: 'Market Intelligence',
                url: `https://${this.ngrokDomain}/api/v1/market/intelligence`
            },
            {
                name: 'Trading Status',
                url: `https://${this.ngrokDomain}/api/v1/trading/status`
            }
        ];

        let successCount = 0;

        for (const test of tests) {
            try {
                const response = await axios.get(test.url, { timeout: 10000 });
                this.log(`  ✅ ${test.name}: OK (${response.status})`, 'success');
                successCount++;
            } catch (error) {
                this.log(`  ❌ ${test.name}: ERRO (${error.response?.status || 'TIMEOUT'})`, 'error');
            }
        }

        return successCount === tests.length;
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            ngrok_domain: this.ngrokDomain,
            ip_resolution: this.results.ipResolution,
            exchange_connectivity: {
                binance: this.results.binance,
                bybit: this.results.bybit
            },
            webhook_status: this.results.tradingview,
            overall_status: this.calculateOverallStatus()
        };

        return report;
    }

    calculateOverallStatus() {
        const statuses = [
            this.results.binance.status,
            this.results.bybit.status,
            this.results.tradingview.status,
            this.results.ipResolution.status
        ];

        const successCount = statuses.filter(s => s === 'success').length;
        const totalCount = statuses.length;

        if (successCount === totalCount) return 'success';
        if (successCount >= totalCount * 0.75) return 'warning';
        return 'error';
    }

    async runFullTest() {
        console.clear();
        this.log('🚀 TESTE DE CONECTIVIDADE PÓS IP FIXO NGROK', 'info');
        this.log('=' * 60, 'info');
        this.log(`📍 Domínio NGROK: ${this.ngrokDomain}`, 'info');
        this.log(`⏰ Iniciado em: ${new Date().toLocaleString()}`, 'info');
        this.log('', 'info');

        // Resolver IPs
        await this.resolveNgrokIPs();
        this.log('', 'info');

        // Testar exchanges
        await this.testBinanceConnectivity();
        this.log('', 'info');
        
        await this.testBybitConnectivity();
        this.log('', 'info');

        // Testar webhook
        await this.testTradingViewWebhook();
        this.log('', 'info');

        // Testar API própria
        const apiStatus = await this.testMarketBotAPI();
        this.log('', 'info');

        // Gerar relatório
        const report = this.generateReport();
        
        // Salvar relatório
        const fs = require('fs');
        fs.writeFileSync('exchange-connectivity-report.json', JSON.stringify(report, null, 2));

        // Resultado final
        this.log('📊 RESULTADO FINAL:', 'info');
        this.log('=' * 40, 'info');
        
        const overallStatus = this.calculateOverallStatus();
        const statusEmoji = overallStatus === 'success' ? '✅' : 
                           overallStatus === 'warning' ? '⚠️' : '❌';
        
        this.log(`${statusEmoji} Status Geral: ${overallStatus.toUpperCase()}`, 
                 overallStatus === 'success' ? 'success' : 
                 overallStatus === 'warning' ? 'warning' : 'error');
        
        this.log(`📁 Relatório salvo: exchange-connectivity-report.json`, 'info');
        
        return report;
    }
}

// Executar teste
if (require.main === module) {
    const tester = new ExchangeConnectivityTester();
    
    tester.runFullTest()
        .then(report => {
            process.exit(report.overall_status === 'success' ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erro crítico:', error);
            process.exit(1);
        });
}

module.exports = ExchangeConnectivityTester;
