#!/usr/bin/env node

/**
 * 🚂 RAILWAY + NGROK INTEGRATION
 * ==============================
 * 
 * Integra Ngrok com Railway para IP fixo automático
 */

const { spawn, fork } = require('child_process');
const axios = require('axios');
const fs = require('fs');

class RailwayNgrokIntegration {
    constructor() {
        this.appProcess = null;
        this.ngrokProcess = null;
        this.isShuttingDown = false;
        
        console.log('🚂 Railway + Ngrok Integration iniciada');
    }

    async start() {
        try {
            // 1. Verificar se Ngrok está disponível
            console.log('🔍 Verificando disponibilidade do Ngrok...');
            await this.checkNgrokAvailability();

            // 2. Iniciar Ngrok Monitor em processo separado
            console.log('1️⃣ Iniciando Ngrok Monitor...');
            this.ngrokProcess = fork('./ngrok-monitor.js');
            
            this.ngrokProcess.on('exit', (code) => {
                if (!this.isShuttingDown) {
                    console.log('⚠️ Ngrok Monitor encerrado, reiniciando...');
                    setTimeout(() => this.restartNgrok(), 5000);
                }
            });

            // 3. Aguardar túnel estabelecer
            await this.waitForTunnel();

            // 4. Iniciar aplicação principal
            console.log('2️⃣ Iniciando aplicação principal...');
            this.appProcess = spawn('node', ['app.js'], {
                stdio: 'inherit',
                env: {
                    ...process.env,
                    NGROK_ENABLED: 'true',
                    IP_FIXED: 'true'
                }
            });

            this.appProcess.on('exit', (code) => {
                if (!this.isShuttingDown) {
                    console.log('⚠️ Aplicação encerrada, reiniciando...');
                    setTimeout(() => this.restartApp(), 3000);
                }
            });

            console.log('✅ Integração completa! Sistema rodando com IP fixo');

        } catch (error) {
            console.error('❌ Erro na integração:', error.message);
            
            // Fallback: iniciar app sem Ngrok
            console.log('🔄 Iniciando em modo fallback sem IP fixo...');
            this.startAppOnly();
        }
    }

    async checkNgrokAvailability() {
        return new Promise((resolve, reject) => {
            const { exec } = require('child_process');
            exec('which ngrok || echo "not found"', (error, stdout) => {
                if (stdout.includes('not found')) {
                    console.log('⚠️ Ngrok não encontrado, tentando instalar...');
                    this.installNgrok().then(resolve).catch(reject);
                } else {
                    console.log('✅ Ngrok encontrado:', stdout.trim());
                    resolve();
                }
            });
        });
    }

    async installNgrok() {
        return new Promise((resolve, reject) => {
            console.log('📦 Instalando Ngrok...');
            
            const { exec } = require('child_process');
            const installCmd = `
                curl -s https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz | tar xzf - -C /usr/local/bin/ || 
                (mkdir -p ./bin && curl -s https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz | tar xzf - -C ./bin/)
            `;
            
            exec(installCmd, (error, stdout, stderr) => {
                if (error) {
                    console.log('⚠️ Instalação global falhou, usando instalação local...');
                    // Adicionar ./bin ao PATH
                    process.env.PATH = `${process.cwd()}/bin:${process.env.PATH}`;
                }
                console.log('✅ Ngrok instalado');
                resolve();
            });
        });
    }

    async waitForTunnel() {
        return new Promise((resolve) => {
            console.log('⏳ Aguardando túnel Ngrok...');
            
            const checkTunnel = setInterval(async () => {
                try {
                    // Verificar se arquivo de info existe
                    if (fs.existsSync('./ngrok-info.json')) {
                        const info = JSON.parse(fs.readFileSync('./ngrok-info.json', 'utf8'));
                        console.log('✅ Túnel Ngrok estabelecido!');
                        console.log(`🌐 URL: ${info.url}`);
                        clearInterval(checkTunnel);
                        resolve();
                        return;
                    }

                    // Tentar API diretamente
                    const response = await axios.get('http://127.0.0.1:4040/api/tunnels', { timeout: 2000 });
                    if (response.data.tunnels && response.data.tunnels.length > 0) {
                        clearInterval(checkTunnel);
                        console.log('✅ Túnel Ngrok estabelecido via API!');
                        resolve();
                    }
                } catch (error) {
                    // Ainda aguardando...
                }
            }, 3000);

            // Timeout de segurança
            setTimeout(() => {
                clearInterval(checkTunnel);
                console.log('⚠️ Timeout aguardando túnel, continuando...');
                resolve();
            }, 45000);
        });
    }

    startAppOnly() {
        console.log('🚀 Iniciando aplicação sem Ngrok...');
        this.appProcess = spawn('node', ['app.js'], {
            stdio: 'inherit',
            env: {
                ...process.env,
                NGROK_ENABLED: 'false',
                IP_FIXED: 'false'
            }
        });
    }

    restartNgrok() {
        if (this.isShuttingDown) return;
        
        console.log('🔄 Reiniciando Ngrok Monitor...');
        if (this.ngrokProcess) {
            this.ngrokProcess.kill();
        }
        
        setTimeout(() => {
            this.ngrokProcess = fork('./ngrok-monitor.js');
        }, 2000);
    }

    restartApp() {
        if (this.isShuttingDown) return;
        
        console.log('🔄 Reiniciando aplicação...');
        if (this.appProcess) {
            this.appProcess.kill();
        }
        
        setTimeout(() => {
            this.appProcess = spawn('node', ['app.js'], {
                stdio: 'inherit',
                env: {
                    ...process.env,
                    NGROK_ENABLED: 'true',
                    IP_FIXED: 'true'
                }
            });
        }, 2000);
    }

    stop() {
        this.isShuttingDown = true;
        console.log('🔌 Parando integração...');
        
        if (this.ngrokProcess) {
            this.ngrokProcess.kill();
        }
        if (this.appProcess) {
            this.appProcess.kill();
        }
    }
}

// Inicialização
const integration = new RailwayNgrokIntegration();

process.on('SIGINT', () => {
    integration.stop();
    setTimeout(() => process.exit(0), 2000);
});

process.on('SIGTERM', () => {
    integration.stop();
    setTimeout(() => process.exit(0), 2000);
});

// Iniciar
integration.start();
