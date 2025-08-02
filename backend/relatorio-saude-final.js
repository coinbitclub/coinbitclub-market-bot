const { exec } = require('child_process');
const { promisify } = require('util');
const http = require('http');
const execAsync = promisify(exec);

console.log(`
🏥 RELATÓRIO COMPLETO DE SAÚDE DO SISTEMA
═════════════════════════════════════════════
🎯 Verificação final de todos os componentes
📊 CoinBitClub Market Bot - Status Operacional
`);

class SystemHealthReporter {
    constructor() {
        this.services = [
            {
                name: '📊 Dashboard Principal',
                port: 3009,
                url: 'http://localhost:3009/health',
                critical: true,
                description: 'Interface principal com dados em tempo real'
            },
            {
                name: '🌐 WebSocket Server',
                port: 3015,
                url: 'http://localhost:3015/health',
                critical: true,
                description: 'Comunicação em tempo real'
            },
            {
                name: '📈 API de Indicadores',
                port: 3016,
                url: 'http://localhost:3016/health',
                critical: true,
                description: 'Cálculo de indicadores técnicos'
            },
            {
                name: '🤖 Sistema de Trading',
                port: 9003,
                url: 'http://localhost:9003/health',
                critical: true,
                description: 'Execução de operações automáticas'
            }
        ];
        
        this.report = {
            timestamp: new Date().toISOString(),
            totalServices: this.services.length,
            activeServices: 0,
            criticalServices: 0,
            healthPercentage: 0,
            services: [],
            systemInfo: {},
            recommendations: []
        };
    }

    async checkPortConnectivity(port) {
        try {
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
            return stdout.trim().includes('LISTENING');
        } catch (error) {
            return false;
        }
    }

    async checkServiceHealth(service) {
        const serviceResult = {
            ...service,
            status: 'UNKNOWN',
            portActive: false,
            apiResponse: null,
            responseTime: null,
            error: null
        };

        try {
            // Check port connectivity
            serviceResult.portActive = await this.checkPortConnectivity(service.port);
            
            if (!serviceResult.portActive) {
                serviceResult.status = 'PORT_CLOSED';
                serviceResult.error = 'Porta não está ouvindo';
                return serviceResult;
            }

            // Check API health if URL provided
            if (service.url) {
                const startTime = Date.now();
                
                try {
                    const response = await this.httpRequest(service.url);
                    serviceResult.responseTime = Date.now() - startTime;
                    serviceResult.apiResponse = response;
                    serviceResult.status = 'HEALTHY';
                } catch (apiError) {
                    serviceResult.status = 'API_ERROR';
                    serviceResult.error = apiError.message;
                    serviceResult.responseTime = Date.now() - startTime;
                }
            } else {
                serviceResult.status = 'PORT_ONLY';
            }

        } catch (error) {
            serviceResult.status = 'ERROR';
            serviceResult.error = error.message;
        }

        return serviceResult;
    }

    async httpRequest(url) {
        return new Promise((resolve, reject) => {
            const request = http.get(url, {
                timeout: 5000
            }, (response) => {
                let data = '';
                
                response.on('data', chunk => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (error) {
                        resolve({ status: 'OK', rawData: data });
                    }
                });
            });

            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });

            request.on('error', (error) => {
                reject(error);
            });
        });
    }

    async generateSystemInfo() {
        try {
            // Process information
            const { stdout: processInfo } = await execAsync('tasklist /fi "IMAGENAME eq node.exe" /fo csv');
            const processLines = processInfo.trim().split('\n');
            
            const nodeProcesses = processLines.slice(1).map(line => {
                const fields = line.split(',').map(f => f.replace(/"/g, ''));
                return {
                    pid: fields[1],
                    memory: fields[4],
                    sessionName: fields[2],
                    sessionNumber: fields[3]
                };
            });

            // System uptime (approximate)
            const { stdout: uptimeInfo } = await execAsync('wmic os get lastbootuptime /value');
            
            this.report.systemInfo = {
                nodeProcesses: nodeProcesses.length,
                totalNodeMemory: nodeProcesses.reduce((total, proc) => {
                    const memory = parseFloat(proc.memory.replace(/[^\d,]/g, '').replace(',', '.'));
                    return total + (isNaN(memory) ? 0 : memory);
                }, 0),
                processes: nodeProcesses,
                timestamp: new Date().toISOString(),
                platform: process.platform,
                nodeVersion: process.version
            };

        } catch (error) {
            this.report.systemInfo.error = error.message;
        }
    }

    async generateReport() {
        console.log('🔍 Iniciando verificação de saúde...\n');

        // Check all services
        for (const service of this.services) {
            console.log(`🔄 Verificando ${service.name}...`);
            const result = await this.checkServiceHealth(service);
            this.report.services.push(result);

            if (result.status === 'HEALTHY' || result.status === 'PORT_ONLY') {
                this.report.activeServices++;
                if (service.critical) {
                    this.report.criticalServices++;
                }
            }

            // Log individual result
            const statusIcon = {
                'HEALTHY': '✅',
                'PORT_ONLY': '🟡',
                'PORT_CLOSED': '❌',
                'API_ERROR': '⚠️',
                'ERROR': '💥',
                'UNKNOWN': '❓'
            }[result.status] || '❓';

            console.log(`   ${statusIcon} ${result.name}: ${result.status}`);
            if (result.responseTime) {
                console.log(`      ⏱️ Tempo de resposta: ${result.responseTime}ms`);
            }
            if (result.error) {
                console.log(`      ❌ Erro: ${result.error}`);
            }
            console.log();
        }

        // Generate system info
        await this.generateSystemInfo();

        // Calculate health percentage
        this.report.healthPercentage = (this.report.activeServices / this.report.totalServices * 100);

        // Generate recommendations
        this.generateRecommendations();

        // Display final report
        this.displayReport();
    }

    generateRecommendations() {
        const failing = this.report.services.filter(s => s.status !== 'HEALTHY' && s.status !== 'PORT_ONLY');
        
        if (failing.length === 0) {
            this.report.recommendations.push('✅ Todos os serviços estão funcionando perfeitamente!');
            this.report.recommendations.push('🔄 Continue monitorando periodicamente');
            this.report.recommendations.push('📊 Dashboard disponível em: http://localhost:3009');
        } else {
            this.report.recommendations.push(`⚠️ ${failing.length} serviço(s) com problemas detectados`);
            
            failing.forEach(service => {
                if (service.status === 'PORT_CLOSED') {
                    this.report.recommendations.push(`🔧 Reiniciar ${service.name} na porta ${service.port}`);
                } else if (service.status === 'API_ERROR') {
                    this.report.recommendations.push(`🛠️ Verificar logs de erro de ${service.name}`);
                }
            });
        }

        // Performance recommendations
        if (this.report.systemInfo.totalNodeMemory > 200) {
            this.report.recommendations.push('⚠️ Alto uso de memória pelos processos Node.js');
        }

        if (this.report.healthPercentage >= 80) {
            this.report.recommendations.push('🎯 Sistema operacional e saudável');
        } else if (this.report.healthPercentage >= 50) {
            this.report.recommendations.push('⚠️ Sistema com problemas menores');
        } else {
            this.report.recommendations.push('🚨 Sistema com problemas críticos');
        }
    }

    displayReport() {
        console.log(`
╔═════════════════════════════════════════════════════════════════════╗
║                    📊 RELATÓRIO FINAL DE SAÚDE                    ║
╚═════════════════════════════════════════════════════════════════════╝

🎯 RESUMO EXECUTIVO:
═══════════════════════════════════════════════════════════════════════
📊 Saúde Geral do Sistema: ${this.report.healthPercentage.toFixed(1)}%
🟢 Serviços Ativos: ${this.report.activeServices}/${this.report.totalServices}
🔥 Serviços Críticos: ${this.report.criticalServices}/${this.services.filter(s => s.critical).length}
🕐 Verificação realizada: ${new Date(this.report.timestamp).toLocaleString('pt-BR')}

🔧 DETALHES DOS SERVIÇOS:
═══════════════════════════════════════════════════════════════════════`);

        this.report.services.forEach(service => {
            const statusIcon = {
                'HEALTHY': '✅',
                'PORT_ONLY': '🟡',
                'PORT_CLOSED': '❌',
                'API_ERROR': '⚠️',
                'ERROR': '💥',
                'UNKNOWN': '❓'
            }[service.status] || '❓';

            console.log(`${statusIcon} ${service.name}`);
            console.log(`   📍 Porta: ${service.port} | Status: ${service.status}`);
            console.log(`   📝 ${service.description}`);
            
            if (service.responseTime) {
                console.log(`   ⏱️ Resposta: ${service.responseTime}ms`);
            }
            
            if (service.apiResponse && service.apiResponse.uptime) {
                console.log(`   🕐 Uptime: ${Math.floor(service.apiResponse.uptime)}s`);
            }
            
            if (service.error) {
                console.log(`   ❌ Erro: ${service.error}`);
            }
            
            console.log();
        });

        console.log(`🖥️ INFORMAÇÕES DO SISTEMA:
═══════════════════════════════════════════════════════════════════════
🔧 Processos Node.js: ${this.report.systemInfo.nodeProcesses || 0}
💾 Memória Total Node: ${this.report.systemInfo.totalNodeMemory?.toFixed(1) || 0} MB
🌐 Versão Node: ${this.report.systemInfo.nodeVersion || 'N/A'}
🖥️ Plataforma: ${this.report.systemInfo.platform || 'N/A'}

🎯 RECOMENDAÇÕES:
═══════════════════════════════════════════════════════════════════════`);

        this.report.recommendations.forEach(rec => {
            console.log(rec);
        });

        console.log(`
🔗 LINKS ÚTEIS:
═══════════════════════════════════════════════════════════════════════
📊 Dashboard: http://localhost:3009
🌐 WebSocket: ws://localhost:3015
📈 API Indicadores: http://localhost:3016/api/indicators
🤖 Trading API: http://localhost:9003/api/status

═══════════════════════════════════════════════════════════════════════
✅ Relatório de saúde concluído em ${new Date().toLocaleString('pt-BR')}
═══════════════════════════════════════════════════════════════════════
`);
    }
}

// Execute health check
async function main() {
    const reporter = new SystemHealthReporter();
    await reporter.generateReport();
}

main().catch(error => {
    console.error('❌ Erro ao gerar relatório:', error.message);
});
