#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
🌟 GESTOR UNIVERSAL DO SISTEMA
════════════════════════════════════
🎯 Gerenciando todos os componentes do CoinBitClub
🔧 Versão: 1.0.0
⚡ Sistema Híbrido Multi-usuário
`);

class UniversalManager {
    constructor() {
        this.components = new Map();
        this.initializeComponents();
    }

    initializeComponents() {
        // 📊 Dashboard Principal
        this.addComponent('dashboard', {
            name: '📊 Dashboard Principal',
            script: 'dashboard-robusto-final.js',
            port: 3009,
            critical: true,
            description: 'Interface principal com dados em tempo real'
        });

        // 🤖 Sistema de Trading
        this.addComponent('trading', {
            name: '🤖 Sistema de Trading',
            script: 'trading-system-real.js',
            critical: true,
            description: 'Execução de operações automáticas'
        });

        // 📡 Ingestor de Sinais
        this.addComponent('signals', {
            name: '📡 Ingestor de Sinais',
            script: 'signal-ingestor.js',
            critical: true,
            description: 'Captura e processamento de sinais'
        });

        // 🛡️ Gerenciador de Risco
        this.addComponent('risk', {
            name: '🛡️ Gerenciador de Risco',
            script: 'risk-manager.js',
            critical: true,
            description: 'Controle de exposição e limites'
        });

        // 📈 Gerenciador de Operações
        this.addComponent('operations', {
            name: '📈 Gerenciador de Operações',
            script: 'operations-manager.js',
            critical: true,
            description: 'Controle de posições e execuções'
        });

        // 💾 Serviço de Backup
        this.addComponent('backup', {
            name: '💾 Serviço de Backup',
            script: 'backup-service.js',
            critical: false,
            description: 'Backup automático de dados'
        });

        // 📊 Serviço de Monitoramento
        this.addComponent('monitoring', {
            name: '📊 Serviço de Monitoramento',
            script: 'monitoring-service.js',
            critical: false,
            description: 'Monitoramento de performance'
        });

        // 📈 API de Indicadores
        this.addComponent('indicators', {
            name: '📈 API de Indicadores',
            script: 'api-central-indicadores.js',
            port: 3012,
            critical: false,
            description: 'Cálculo de indicadores técnicos'
        });

        // 🌐 Servidor WebSocket
        this.addComponent('websocket', {
            name: '🌐 Servidor WebSocket',
            script: 'websocket-server.js',
            port: 3010,
            critical: false,
            description: 'Comunicação em tempo real'
        });

        // 🔒 Guardian AI
        this.addComponent('guardian', {
            name: '🔒 Guardian AI',
            script: 'ai-guardian-novo.js',
            critical: false,
            description: 'Proteção inteligente do sistema'
        });
    }

    addComponent(id, config) {
        this.components.set(id, {
            id,
            ...config,
            process: null,
            status: 'stopped',
            lastRestart: null,
            restartCount: 0
        });
    }

    async startComponent(componentId) {
        const component = this.components.get(componentId);
        if (!component) {
            console.log(`❌ Componente '${componentId}' não encontrado`);
            return false;
        }

        if (component.status === 'running') {
            console.log(`⚠️ ${component.name} já está rodando`);
            return true;
        }

        const scriptPath = path.join(__dirname, component.script);
        if (!fs.existsSync(scriptPath)) {
            console.log(`❌ Script '${component.script}' não encontrado para ${component.name}`);
            return false;
        }

        try {
            console.log(`🚀 Iniciando ${component.name}...`);
            
            const childProcess = spawn('node', [scriptPath], {
                detached: false,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            component.process = childProcess;
            component.status = 'starting';
            component.lastRestart = new Date();
            component.restartCount++;

            childProcess.stdout.on('data', (data) => {
                console.log(`📊 [${component.name}]: ${data.toString().trim()}`);
            });

            childProcess.stderr.on('data', (data) => {
                console.log(`❌ [${component.name}]: ${data.toString().trim()}`);
            });

            childProcess.on('exit', (code) => {
                component.status = 'stopped';
                component.process = null;
                
                if (code === 0) {
                    console.log(`✅ ${component.name} encerrado normalmente`);
                } else {
                    console.log(`💥 ${component.name} encerrado com erro (código: ${code})`);
                    
                    // Auto-restart para componentes críticos
                    if (component.critical && component.restartCount < 3) {
                        console.log(`🔄 Reiniciando ${component.name} automaticamente...`);
                        setTimeout(() => this.startComponent(componentId), 5000);
                    }
                }
            });

            // Aguardar inicialização
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (component.process && !component.process.killed) {
                component.status = 'running';
                console.log(`✅ ${component.name} iniciado com sucesso`);
                return true;
            } else {
                console.log(`❌ Falha ao iniciar ${component.name}`);
                return false;
            }

        } catch (error) {
            console.log(`❌ Erro ao iniciar ${component.name}: ${error.message}`);
            component.status = 'error';
            return false;
        }
    }

    async stopComponent(componentId) {
        const component = this.components.get(componentId);
        if (!component) {
            console.log(`❌ Componente '${componentId}' não encontrado`);
            return false;
        }

        if (component.status === 'stopped') {
            console.log(`⚠️ ${component.name} já está parado`);
            return true;
        }

        if (component.process) {
            console.log(`🛑 Parando ${component.name}...`);
            component.process.kill('SIGTERM');
            
            // Aguardar finalização graceful
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            if (component.process && !component.process.killed) {
                console.log(`💀 Forçando parada de ${component.name}...`);
                component.process.kill('SIGKILL');
            }
        }

        component.status = 'stopped';
        component.process = null;
        console.log(`✅ ${component.name} parado`);
        return true;
    }

    async startAll() {
        console.log(`
🚀 INICIANDO TODOS OS COMPONENTES
═══════════════════════════════════
`);

        // Iniciar componentes críticos primeiro
        const criticalComponents = Array.from(this.components.entries())
            .filter(([_, comp]) => comp.critical)
            .map(([id, _]) => id);

        for (const componentId of criticalComponents) {
            await this.startComponent(componentId);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Depois componentes não críticos
        const nonCriticalComponents = Array.from(this.components.entries())
            .filter(([_, comp]) => !comp.critical)
            .map(([id, _]) => id);

        for (const componentId of nonCriticalComponents) {
            await this.startComponent(componentId);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`
✅ TODOS OS COMPONENTES INICIADOS
═══════════════════════════════════
`);
        this.showStatus();
    }

    async stopAll() {
        console.log(`
🛑 PARANDO TODOS OS COMPONENTES
════════════════════════════════
`);

        const promises = Array.from(this.components.keys()).map(id => 
            this.stopComponent(id)
        );

        await Promise.all(promises);

        console.log(`
✅ TODOS OS COMPONENTES PARADOS
════════════════════════════════
`);
    }

    showStatus() {
        console.log(`
📊 STATUS DOS COMPONENTES
═══════════════════════════════════
`);

        let running = 0;
        let stopped = 0;
        let errors = 0;

        for (const [id, component] of this.components) {
            const statusIcon = {
                'running': '🟢',
                'stopped': '🔴',
                'starting': '🟡',
                'error': '💥'
            }[component.status] || '❓';

            const portInfo = component.port ? ` (porta ${component.port})` : '';
            const criticalMark = component.critical ? ' 🔥' : '';
            
            console.log(`${statusIcon} ${component.name}${portInfo}${criticalMark}`);
            console.log(`   📝 ${component.description}`);
            console.log(`   🔄 Reinicializações: ${component.restartCount}`);
            
            if (component.lastRestart) {
                console.log(`   ⏰ Último restart: ${component.lastRestart.toLocaleString()}`);
            }
            
            console.log();

            // Contadores
            switch (component.status) {
                case 'running': running++; break;
                case 'stopped': stopped++; break;
                case 'error': errors++; break;
            }
        }

        console.log(`
📈 RESUMO:
🟢 Rodando: ${running}
🔴 Parados: ${stopped}
💥 Erros: ${errors}
📊 Total: ${this.components.size}
`);
    }

    async restartComponent(componentId) {
        console.log(`🔄 Reiniciando componente: ${componentId}`);
        await this.stopComponent(componentId);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await this.startComponent(componentId);
    }

    async healthCheck() {
        console.log(`
🏥 VERIFICAÇÃO DE SAÚDE DO SISTEMA
═══════════════════════════════════
`);

        let healthyCount = 0;
        let totalComponents = this.components.size;

        for (const [id, component] of this.components) {
            const isHealthy = component.status === 'running' || 
                             (!component.critical && component.status === 'stopped');
            
            if (isHealthy) {
                healthyCount++;
                console.log(`✅ ${component.name}: Saudável`);
            } else {
                console.log(`❌ ${component.name}: Problema detectado (${component.status})`);
            }
        }

        const healthPercentage = (healthyCount / totalComponents * 100).toFixed(1);
        console.log(`
🎯 SAÚDE GERAL DO SISTEMA: ${healthPercentage}%
`);

        return healthPercentage >= 80;
    }
}

// Função principal
async function main() {
    const manager = new UniversalManager();

    // Processar argumentos da linha de comando
    const args = process.argv.slice(2);
    const command = args[0];
    const target = args[1];

    switch (command) {
        case 'start':
            if (target) {
                await manager.startComponent(target);
            } else {
                await manager.startAll();
            }
            break;

        case 'stop':
            if (target) {
                await manager.stopComponent(target);
            } else {
                await manager.stopAll();
            }
            break;

        case 'restart':
            if (target) {
                await manager.restartComponent(target);
            } else {
                await manager.stopAll();
                await new Promise(resolve => setTimeout(resolve, 3000));
                await manager.startAll();
            }
            break;

        case 'status':
            manager.showStatus();
            break;

        case 'health':
            await manager.healthCheck();
            break;

        case 'list':
            console.log(`
📋 COMPONENTES DISPONÍVEIS:
═══════════════════════════
`);
            for (const [id, component] of manager.components) {
                const criticalMark = component.critical ? ' 🔥' : '';
                console.log(`🔧 ${id}: ${component.name}${criticalMark}`);
            }
            break;

        default:
            console.log(`
📖 USO DO GESTOR UNIVERSAL:
═══════════════════════════
node gestor-universal.js <comando> [componente]

📋 COMANDOS:
  start [componente]    - Iniciar todos ou componente específico
  stop [componente]     - Parar todos ou componente específico  
  restart [componente]  - Reiniciar todos ou componente específico
  status               - Mostrar status de todos os componentes
  health               - Verificação de saúde do sistema
  list                 - Listar todos os componentes

💡 EXEMPLOS:
  node gestor-universal.js start          # Inicia todos
  node gestor-universal.js start dashboard # Inicia apenas dashboard
  node gestor-universal.js status         # Mostra status
  node gestor-universal.js health         # Verifica saúde
`);
            break;
    }

    // Manter processo vivo se iniciou componentes
    if (command === 'start' && !target) {
        console.log(`
🔄 GESTOR UNIVERSAL ATIVO
═══════════════════════════
Pressione Ctrl+C para parar todos os componentes
`);

        // Verificação de saúde periódica
        setInterval(async () => {
            const isHealthy = await manager.healthCheck();
            if (!isHealthy) {
                console.log(`⚠️ Sistema não está saudável. Verifique os componentes.`);
            }
        }, 60000); // A cada minuto

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log(`
🛑 ENCERRANDO GESTOR UNIVERSAL...
═══════════════════════════════════
`);
            await manager.stopAll();
            process.exit(0);
        });

        // Manter processo vivo
        await new Promise(() => {});
    }
}

// Executar se foi chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = UniversalManager;
