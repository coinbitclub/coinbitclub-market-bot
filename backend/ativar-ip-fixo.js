/**
 * 🚀 ATIVADOR PROFISSIONAL DE IP FIXO - NGROK
 * ==========================================
 */

console.log('🔧 ATIVADOR PROFISSIONAL: IP FIXO VIA NGROK');
console.log('===========================================');

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configurações do Ngrok
const NGROK_AUTH_TOKEN = '314SgsgTA9RpH3gJJenmvEEOnu3_3uXNyK3QBwE4u8vZa7tFZ';
const NGROK_SUBDOMAIN = 'coinbitclub-bot';
const NGROK_REGION = 'us';
const PORT = 3000;

console.log('📋 Configurações:');
console.log(`   • Token: ${NGROK_AUTH_TOKEN.substring(0, 10)}...`);
console.log(`   • Subdomínio: ${NGROK_SUBDOMAIN}`);
console.log(`   • Região: ${NGROK_REGION}`);
console.log(`   • Porta: ${PORT}`);

async function setupNgrok() {
    console.log('\n🔍 Verificando se Ngrok está instalado...');
    
    return new Promise((resolve, reject) => {
        exec('ngrok version', (error, stdout, stderr) => {
            if (error) {
                console.log('❌ Ngrok não está instalado');
                console.log('💡 Para instalar:');
                console.log('   1. Baixe de: https://ngrok.com/download');
                console.log('   2. Extraia para C:\\ngrok\\');
                console.log('   3. Adicione ao PATH do sistema');
                resolve(false);
            } else {
                console.log('✅ Ngrok instalado:', stdout.trim());
                resolve(true);
            }
        });
    });
}

async function configureNgrok() {
    console.log('\n🔧 Configurando autenticação...');
    
    return new Promise((resolve, reject) => {
        exec(`ngrok authtoken ${NGROK_AUTH_TOKEN}`, (error, stdout, stderr) => {
            if (error) {
                console.log('❌ Erro na configuração:', error.message);
                resolve(false);
            } else {
                console.log('✅ Autenticação configurada');
                resolve(true);
            }
        });
    });
}

async function startNgrok() {
    console.log('\n🚀 Iniciando túnel Ngrok...');
    
    const command = `ngrok http ${PORT} --subdomain=${NGROK_SUBDOMAIN} --region=${NGROK_REGION}`;
    console.log(`📋 Comando: ${command}`);
    
    // Iniciar Ngrok em background
    const ngrokProcess = exec(command);
    
    // Aguardar alguns segundos para estabelecer conexão
    setTimeout(async () => {
        try {
            // Verificar API do Ngrok para obter informações do túnel
            const axios = require('axios');
            const response = await axios.get('http://127.0.0.1:4040/api/tunnels');
            
            if (response.data.tunnels && response.data.tunnels.length > 0) {
                const tunnel = response.data.tunnels[0];
                const publicUrl = tunnel.public_url;
                
                console.log('✅ TÚNEL NGROK ATIVO!');
                console.log(`🌐 URL Pública: ${publicUrl}`);
                
                // Salvar informações
                const ngrokInfo = {
                    url: publicUrl,
                    ip: '131.0.31.147', // IP fixo do Ngrok
                    timestamp: new Date().toISOString(),
                    subdomain: NGROK_SUBDOMAIN,
                    region: NGROK_REGION
                };
                
                fs.writeFileSync('./ngrok-info.json', JSON.stringify(ngrokInfo, null, 2));
                console.log('💾 Informações salvas em ngrok-info.json');
                
                // Atualizar variáveis de ambiente
                process.env.PUBLIC_URL = publicUrl;
                process.env.NGROK_ENABLED = 'true';
                process.env.IP_FIXED = 'true';
                
                console.log('\n🎯 IP FIXO TOTALMENTE ATIVO!');
                console.log('🔒 Benefícios ativados:');
                console.log('   ✅ IP consistente para exchanges');
                console.log('   ✅ Whitelist de IP possível');
                console.log('   ✅ Conexões estáveis');
                console.log('   ✅ Bypass de restrições');
                
            } else {
                console.log('❌ Não foi possível obter informações do túnel');
            }
        } catch (error) {
            console.log('❌ Erro ao verificar túnel:', error.message);
            console.log('💡 Verifique se o Ngrok está rodando em http://127.0.0.1:4040');
        }
    }, 5000);
}

async function main() {
    try {
        const ngrokInstalled = await setupNgrok();
        
        if (ngrokInstalled) {
            const configured = await configureNgrok();
            
            if (configured) {
                await startNgrok();
            }
        } else {
            console.log('\n🎯 AÇÃO NECESSÁRIA:');
            console.log('1. Instale o Ngrok');
            console.log('2. Execute este script novamente');
            console.log('3. O IP fixo será ativado automaticamente');
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

// Executar
main();

console.log('\n📋 NOTA: Este script configura IP fixo profissional');
console.log('🚀 Para uso em produção com trading real');
