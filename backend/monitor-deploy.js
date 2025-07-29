#!/usr/bin/env node

/**
 * Monitor de Deploy - Verificação contínua do Railway
 * Aguarda o novo sistema V3 ficar online
 */

const https = require('https');

const BASE_URL = 'https://coinbitclub-market-bot.up.railway.app';

console.log('🔄 MONITOR DE DEPLOY - AGUARDANDO SISTEMA V3');
console.log('=============================================');
console.log(`⏰ Iniciado em: ${new Date().toLocaleTimeString()}\n`);

let attempt = 1;
const maxAttempts = 20; // 10 minutos (30s cada)

function checkSystem() {
    console.log(`🔍 Tentativa ${attempt}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
    
    const req = https.get(BASE_URL + '/health', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log(`   📊 Status: ${res.statusCode}`);
                console.log(`   🏷️ Versão: ${json.version || 'N/A'}`);
                console.log(`   🔧 Serviço: ${json.service || 'N/A'}`);
                
                // Verificar se é o sistema V3 novo
                if (json.version && !json.version.includes('multiservice-hybrid')) {
                    console.log('\n🎉 SUCESSO! Sistema V3 detectado!');
                    console.log('✅ Novo sistema está rodando!');
                    console.log('🔗 Acesse: https://coinbitclub-market-bot.up.railway.app/control');
                    console.log('🎯 Para ativar o sistema de trading!');
                    process.exit(0);
                } else {
                    console.log('   ⏳ Ainda sistema antigo (multiservice-hybrid)');
                }
                
                // Testar endpoint /control para confirmar
                const controlReq = https.get(BASE_URL + '/control', (controlRes) => {
                    if (controlRes.statusCode === 200) {
                        console.log('   ✅ Endpoint /control disponível! Sistema V3 confirmado!');
                        console.log('\n🎉 SISTEMA V3 ATIVO!');
                        console.log('🔗 Acesse: https://coinbitclub-market-bot.up.railway.app/control');
                        process.exit(0);
                    } else {
                        console.log('   ❌ Endpoint /control ainda não disponível');
                    }
                });
                
                controlReq.on('error', () => {
                    console.log('   ❌ Erro ao testar /control');
                });
                
                controlReq.setTimeout(3000, () => {
                    controlReq.destroy();
                });
                
            } catch (e) {
                console.log(`   ❌ Erro ao parsear resposta: ${e.message}`);
            }
        });
    });
    
    req.on('error', (error) => {
        console.log(`   🚫 Erro de conexão: ${error.message}`);
    });
    
    req.setTimeout(10000, () => {
        console.log(`   ⏰ Timeout na requisição`);
        req.destroy();
    });
    
    attempt++;
    
    if (attempt <= maxAttempts) {
        console.log('   ⏳ Aguardando 30s para próxima verificação...\n');
        setTimeout(checkSystem, 30000);
    } else {
        console.log('\n⏰ Tempo limite atingido (10 minutos)');
        console.log('❌ Sistema V3 ainda não ativo');
        console.log('💡 Verifique os logs do Railway para mais detalhes');
        process.exit(1);
    }
}

console.log('🚀 Iniciando monitoramento...');
console.log('⏹️ Pressione Ctrl+C para parar\n');

checkSystem();
