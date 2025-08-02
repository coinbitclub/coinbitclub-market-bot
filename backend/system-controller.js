#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const execAsync = promisify(exec);

console.log(`
🎛️ COINBITCLUB SYSTEM CONTROLLER
═══════════════════════════════════════
🚀 Controle completo do sistema
📊 Ativar/Desativar todos os componentes
`);

class SystemController {
    constructor() {
        this.services = [
            {
                id: 'dashboard',
                name: '📊 Dashboard Principal',
                script: 'dashboard-robusto-final.js',
                port: 3009,
                required: true
            },
            {
                id: 'websocket',
                name: '🌐 WebSocket Server',
                script: 'websocket-server-real.js',
                port: 3015,
                required: true
            },
            {
                id: 'indicators',
                name: '📈 API de Indicadores',
                script: 'api-indicadores-real.js',
                port: 3016,
                required: true
            },
            {
                id: 'trading',
                name: '🤖 Sistema de Trading',
                script: 'trading-system-real.js',
                port: 9003,
                required: true
            }
        ];
        
        this.processFile = path.join(__dirname, 'system-processes.json');
        this.logFile = path.join(__dirname, 'system.log');
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        
        // Append to log file
        try {
            fs.appendFileSync(this.logFile, logMessage + '\n');
        } catch (error) {
            // Ignore log file errors
        }
    }

    async isPortActive(port) {
        try {
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
            return stdout.trim().includes('LISTENING');
        } catch (error) {
            return false;
        }
    }

    async getProcessByPort(port) {
        try {
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
            const lines = stdout.trim().split('\n');
            
            for (const line of lines) {
                if (line.includes('LISTENING')) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    return parseInt(pid);
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async killProcess(pid) {
        try {
            await execAsync(`taskkill /PID ${pid} /F`);
            return true;
        } catch (error) {
            this.log(`❌ Erro ao matar processo ${pid}: ${error.message}`);
            return false;
        }
    }

    async startService(service) {
        try {
            this.log(`🚀 Iniciando ${service.name}...`);
            
            // Check if already running
            const isActive = await this.isPortActive(service.port);
            if (isActive) {
                this.log(`⚠️ ${service.name} já está rodando na porta ${service.port}`);
                return true;
            }

            // Check if script exists
            const scriptPath = path.join(__dirname, service.script);
            if (!fs.existsSync(scriptPath)) {
                this.log(`❌ Script não encontrado: ${service.script}`);
                return false;
            }

            // Start process
            const child = spawn('node', [scriptPath], {
                detached: true,
                stdio: ['ignore', 'pipe', 'pipe'],
                cwd: __dirname
            });

            // Wait a moment for startup
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check if started successfully
            const started = await this.isPortActive(service.port);
            
            if (started) {
                this.log(`✅ ${service.name} iniciado com sucesso na porta ${service.port}`);
                child.unref(); // Allow parent to exit
                return true;
            } else {
                this.log(`❌ Falha ao iniciar ${service.name}`);
                child.kill();
                return false;
            }

        } catch (error) {
            this.log(`❌ Erro ao iniciar ${service.name}: ${error.message}`);
            return false;
        }
    }

    async stopService(service) {
        try {
            this.log(`🛑 Parando ${service.name}...`);
            
            const pid = await this.getProcessByPort(service.port);
            if (!pid) {
                this.log(`⚠️ ${service.name} não está rodando`);
                return true;
            }

            const killed = await this.killProcess(pid);
            if (killed) {
                this.log(`✅ ${service.name} parado com sucesso`);
                return true;
            } else {
                return false;
            }

        } catch (error) {
            this.log(`❌ Erro ao parar ${service.name}: ${error.message}`);
            return false;
        }
    }

    async startAll() {
        this.log('🚀 INICIANDO TODOS OS SERVIÇOS DO SISTEMA');
        this.log('═══════════════════════════════════════');
        
        let successCount = 0;
        
        for (const service of this.services) {
            const success = await this.startService(service);
            if (success) {
                successCount++;
            }
            
            // Small delay between services
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.log('');
        this.log(`📊 RESULTADO: ${successCount}/${this.services.length} serviços iniciados`);
        
        if (successCount === this.services.length) {
            this.log('🎯 Todos os serviços iniciados com sucesso!');
            this.log('📊 Dashboard disponível em: http://localhost:3009');
            await this.showStatus();
        } else {
            this.log('⚠️ Alguns serviços falharam ao iniciar');
        }
        
        return successCount === this.services.length;
    }

    async stopAll() {
        this.log('🛑 PARANDO TODOS OS SERVIÇOS DO SISTEMA');
        this.log('═══════════════════════════════════════');
        
        let successCount = 0;
        
        for (const service of this.services) {
            const success = await this.stopService(service);
            if (success) {
                successCount++;
            }
        }
        
        this.log('');
        this.log(`📊 RESULTADO: ${successCount}/${this.services.length} serviços parados`);
        
        if (successCount === this.services.length) {
            this.log('✅ Todos os serviços parados com sucesso!');
        } else {
            this.log('⚠️ Alguns serviços falharam ao parar');
        }
        
        return successCount === this.services.length;
    }

    async showStatus() {
        this.log('');
        this.log('📊 STATUS DOS SERVIÇOS:');
        this.log('═══════════════════════════════════════');
        
        let activeCount = 0;
        
        for (const service of this.services) {
            const isActive = await this.isPortActive(service.port);
            const statusIcon = isActive ? '🟢' : '🔴';
            const statusText = isActive ? 'ATIVO' : 'INATIVO';
            
            this.log(`${statusIcon} ${service.name}: ${statusText} (porta ${service.port})`);
            
            if (isActive) {
                activeCount++;
                const pid = await this.getProcessByPort(service.port);
                if (pid) {
                    this.log(`   🔧 PID: ${pid}`);
                }
            }
        }
        
        this.log('');
        this.log(`📈 RESUMO: ${activeCount}/${this.services.length} serviços ativos`);
        
        const healthPercentage = (activeCount / this.services.length * 100).toFixed(1);
        this.log(`🎯 Saúde do Sistema: ${healthPercentage}%`);
        
        if (healthPercentage == 100) {
            this.log('✅ Sistema funcionando perfeitamente!');
        } else if (healthPercentage >= 75) {
            this.log('⚠️ Sistema com problemas menores');
        } else {
            this.log('❌ Sistema com problemas críticos');
        }
    }

    async restart() {
        this.log('🔄 REINICIANDO SISTEMA COMPLETO');
        this.log('═══════════════════════════════════════');
        
        await this.stopAll();
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.startAll();
    }

    async healthCheck() {
        const execPath = path.join(__dirname, 'relatorio-saude-final.js');
        if (fs.existsSync(execPath)) {
            this.log('🏥 Executando verificação de saúde detalhada...');
            this.log('');
            
            try {
                const { stdout } = await execAsync(`node "${execPath}"`);
                console.log(stdout);
            } catch (error) {
                this.log(`❌ Erro na verificação de saúde: ${error.message}`);
            }
        } else {
            await this.showStatus();
        }
    }

    showHelp() {
        console.log(`
📖 COINBITCLUB SYSTEM CONTROLLER - AJUDA
═══════════════════════════════════════════

📋 COMANDOS DISPONÍVEIS:

🚀 CONTROLE BÁSICO:
   start         - Iniciar todos os serviços
   stop          - Parar todos os serviços
   restart       - Reiniciar todos os serviços
   status        - Mostrar status dos serviços

🏥 MONITORAMENTO:
   health        - Verificação de saúde completa
   logs          - Mostrar logs do sistema

💡 EXEMPLOS DE USO:
   node system-controller.js start
   node system-controller.js stop
   node system-controller.js status
   node system-controller.js health

🔗 SERVIÇOS GERENCIADOS:
   📊 Dashboard Principal (porta 3009)
   🌐 WebSocket Server (porta 3015) 
   📈 API de Indicadores (porta 3016)
   🤖 Sistema de Trading (porta 9003)

📝 LOGS:
   Os logs são salvos em: system.log
   
🎯 Para monitoramento contínuo, execute 'health' periodicamente
`);
    }

    showLogs() {
        if (fs.existsSync(this.logFile)) {
            const logs = fs.readFileSync(this.logFile, 'utf8');
            const lines = logs.trim().split('\n');
            
            this.log('📝 ÚLTIMOS LOGS DO SISTEMA:');
            this.log('═══════════════════════════════════════');
            
            // Show last 20 lines
            const recentLogs = lines.slice(-20);
            recentLogs.forEach(line => console.log(line));
        } else {
            this.log('📝 Nenhum log encontrado');
        }
    }
}

// Main execution
async function main() {
    const controller = new SystemController();
    const command = process.argv[2];

    switch (command) {
        case 'start':
            await controller.startAll();
            break;
            
        case 'stop':
            await controller.stopAll();
            break;
            
        case 'restart':
            await controller.restart();
            break;
            
        case 'status':
            await controller.showStatus();
            break;
            
        case 'health':
            await controller.healthCheck();
            break;
            
        case 'logs':
            controller.showLogs();
            break;
            
        case 'help':
        case '--help':
        case '-h':
            controller.showHelp();
            break;
            
        default:
            controller.showHelp();
            break;
    }
}

// Handle script execution
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Erro fatal:', error.message);
        process.exit(1);
    });
}

module.exports = SystemController;
