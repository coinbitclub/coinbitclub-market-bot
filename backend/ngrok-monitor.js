#!/usr/bin/env node

/**
 * 🌐 NGROK MONITOR & AUTO-RESTART
 * ===============================
 * 
 * Monitora túnel Ngrok e reconecta automaticamente
 * Ideal para manter IP fixo 24/7
 */

const { exec, spawn } = require('child_process');
const axios = require('axios');

class NgrokMonitor {
    constructor() {
        this.ngrokProcess = null;
        this.currentIP = null;
        this.isRunning = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        console.log('🌐 Ngrok Monitor iniciado');
    }

    async start() {
        console.log('🚀 Iniciando túnel Ngrok...');
        
        try {
            // Matar processos Ngrok existentes
            await this.killExistingNgrok();
            
            // Iniciar novo túnel
            await this.startNgrokTunnel();
            
            // Monitoramento contínuo
            this.startMonitoring();
            
        } catch (error) {
            console.error('❌ Erro ao iniciar Ngrok:', error.message);
            this.reconnect();
        }
    }

    async killExistingNgrok() {
        return new Promise((resolve) => {
            exec('pkill -f ngrok', () => {
                setTimeout(resolve, 2000); // Aguardar cleanup
            });
        });
    }

    async startNgrokTunnel() {
        return new Promise((resolve, reject) => {
            console.log('🔗 Estabelecendo túnel...');
            
            // Iniciar ngrok via HTTP simples (mais confiável)
            this.ngrokProcess = spawn('ngrok', ['http', '3000', '--region=us'], {
                detached: false,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let output = '';

            this.ngrokProcess.stdout.on('data', (data) => {
                output += data.toString();
                console.log('📡 Ngrok output:', data.toString().trim());
            });

            this.ngrokProcess.stderr.on('data', (data) => {
                const error = data.toString();
                console.log('📡 Ngrok stderr:', error.trim());
            });

            this.ngrokProcess.on('exit', (code) => {
                console.log(`🔌 Processo Ngrok encerrado (código: ${code})`);
                this.isRunning = false;
                if (code !== 0) {
                    setTimeout(() => this.reconnect(), 5000);
                }
            });

            // Aguardar túnel estar pronto
            setTimeout(() => this.getTunnelInfo(), 5000);
            resolve();
        });
    }

    async getTunnelInfo() {
        try {
            console.log('🔍 Obtendo informações do túnel...');
            const response = await axios.get('http://127.0.0.1:4040/api/tunnels');
            const tunnels = response.data.tunnels;

            if (tunnels && tunnels.length > 0) {
                const httpTunnel = tunnels.find(t => t.proto === 'https') || tunnels[0];
                const publicUrl = httpTunnel.public_url;
                const newIP = this.extractIPFromURL(publicUrl);

                console.log('\n🌐 INFORMAÇÕES DO TÚNEL:');
                console.log('========================');
                console.log(`📡 URL Pública: ${publicUrl}`);
                console.log(`🔢 IP/Subdomain: ${newIP}`);
                console.log(`🌍 Região: US East`);
                console.log(`🔒 HTTPS: Ativo`);

                this.currentIP = newIP;
                this.isRunning = true;
                this.reconnectAttempts = 0;

                // Atualizar variáveis de ambiente
                process.env.PUBLIC_IP = newIP;
                process.env.PUBLIC_URL = publicUrl;
                process.env.NGROK_URL = publicUrl;

                console.log('✅ IP fixo estabelecido com sucesso!');

                // Salvar informações em arquivo para o app principal
                const fs = require('fs');
                fs.writeFileSync('./ngrok-info.json', JSON.stringify({
                    url: publicUrl,
                    ip: newIP,
                    timestamp: new Date().toISOString(),
                    region: 'us'
                }, null, 2));

            } else {
                throw new Error('Nenhum túnel ativo encontrado');
            }

        } catch (error) {
            console.error('❌ Erro ao obter info do túnel:', error.message);
            setTimeout(() => this.reconnect(), 5000);
        }
    }

    extractIPFromURL(url) {
        // Extrair subdomínio do ngrok que funciona como IP único
        const match = url.match(/https:\/\/([^.]+)\.ngrok[\-free]*\.app|https:\/\/([^.]+)\.ngrok\.io/);
        return match ? (match[1] || match[2]) : 'unknown';
    }

    startMonitoring() {
        console.log('📊 Iniciando monitoramento contínuo...');
        
        setInterval(async () => {
            try {
                await axios.get('http://127.0.0.1:4040/api/tunnels', { timeout: 5000 });
                if (!this.isRunning) {
                    console.log('🔄 Túnel reconectado automaticamente');
                    this.getTunnelInfo();
                }
            } catch (error) {
                console.log('⚠️ Túnel perdido, reconectando...');
                this.isRunning = false;
                this.reconnect();
            }
        }, 30000); // Check a cada 30 segundos
    }

    async reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Máximo de tentativas de reconexão atingido');
            process.exit(1);
        }

        this.reconnectAttempts++;
        console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);

        setTimeout(() => {
            this.start();
        }, 10000 * this.reconnectAttempts); // Backoff exponencial
    }

    async stop() {
        console.log('🔌 Parando túnel Ngrok...');
        if (this.ngrokProcess) {
            this.ngrokProcess.kill();
        }
        await this.killExistingNgrok();
    }
}

// Inicialização
const monitor = new NgrokMonitor();

// Handlers de sinal
process.on('SIGINT', async () => {
    await monitor.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await monitor.stop();
    process.exit(0);
});

// Iniciar apenas se executado diretamente
if (require.main === module) {
    monitor.start();
}

module.exports = NgrokMonitor;
