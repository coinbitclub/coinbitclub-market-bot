#!/usr/bin/env node
/**
 * 🔍 VERIFICAÇÃO COMPLETA PÓS-DEPLOY
 * 
 * Script para validar que o sistema está funcionando corretamente
 * em produção após o deploy completo
 */

const https = require('https');
const http = require('http');

console.log('🔍 VERIFICAÇÃO COMPLETA PÓS-DEPLOY');
console.log('===================================');

// URLs para verificar
const URLS = {
    backend: 'https://coinbitclub-market-bot.up.railway.app',
    frontend: 'https://coinbitclub-frontend-premium.vercel.app',
    github: 'https://github.com/coinbitclub/coinbitclub-market-bot'
};

async function verificarURL(nome, url) {
    return new Promise((resolve) => {
        const protocolo = url.startsWith('https') ? https : http;
        
        console.log(`\n🔄 Verificando ${nome}...`);
        console.log(`   URL: ${url}`);
        
        const req = protocolo.get(url, (res) => {
            console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
            
            if (res.statusCode >= 200 && res.statusCode < 400) {
                console.log(`   ✅ ${nome}: ONLINE`);
                resolve({ nome, status: 'online', code: res.statusCode });
            } else {
                console.log(`   ⚠️ ${nome}: Status ${res.statusCode}`);
                resolve({ nome, status: 'warning', code: res.statusCode });
            }
        });
        
        req.on('error', (error) => {
            console.log(`   ❌ ${nome}: OFFLINE - ${error.message}`);
            resolve({ nome, status: 'offline', error: error.message });
        });
        
        req.setTimeout(10000, () => {
            console.log(`   ❌ ${nome}: TIMEOUT`);
            req.destroy();
            resolve({ nome, status: 'timeout' });
        });
    });
}

async function verificarAPIEndpoints() {
    console.log('\n🌐 VERIFICANDO ENDPOINTS DA API:');
    console.log('================================');
    
    const endpoints = [
        '/health',
        '/api/status',
        '/api/test'
    ];
    
    const resultados = [];
    
    for (const endpoint of endpoints) {
        const url = `${URLS.backend}${endpoint}`;
        const resultado = await verificarURL(`API ${endpoint}`, url);
        resultados.push(resultado);
    }
    
    return resultados;
}

async function verificarSistemas() {
    console.log('\n🖥️ VERIFICANDO SISTEMAS PRINCIPAIS:');
    console.log('====================================');
    
    const resultados = [];
    
    for (const [nome, url] of Object.entries(URLS)) {
        const resultado = await verificarURL(nome.toUpperCase(), url);
        resultados.push(resultado);
    }
    
    return resultados;
}

async function gerarRelatorioFinal(sistemaResultados, apiResultados) {
    console.log('\n📊 RELATÓRIO FINAL DE DEPLOY:');
    console.log('=============================');
    
    let sistemasOnline = 0;
    let apisOnline = 0;
    let totalSistemas = sistemaResultados.length;
    let totalAPIs = apiResultados.length;
    
    console.log('\n🖥️ SISTEMAS PRINCIPAIS:');
    sistemaResultados.forEach(resultado => {
        const emoji = resultado.status === 'online' ? '✅' : 
                     resultado.status === 'warning' ? '⚠️' : '❌';
        console.log(`   ${emoji} ${resultado.nome}: ${resultado.status.toUpperCase()}`);
        if (resultado.status === 'online') sistemasOnline++;
    });
    
    console.log('\n🌐 ENDPOINTS DA API:');
    apiResultados.forEach(resultado => {
        const emoji = resultado.status === 'online' ? '✅' : 
                     resultado.status === 'warning' ? '⚠️' : '❌';
        console.log(`   ${emoji} ${resultado.nome}: ${resultado.status.toUpperCase()}`);
        if (resultado.status === 'online') apisOnline++;
    });
    
    console.log('\n📈 ESTATÍSTICAS:');
    console.log(`   🖥️ Sistemas online: ${sistemasOnline}/${totalSistemas} (${((sistemasOnline/totalSistemas)*100).toFixed(1)}%)`);
    console.log(`   🌐 APIs online: ${apisOnline}/${totalAPIs} (${((apisOnline/totalAPIs)*100).toFixed(1)}%)`);
    
    const totalOnline = sistemasOnline + apisOnline;
    const totalServicos = totalSistemas + totalAPIs;
    const percentualGeral = ((totalOnline/totalServicos)*100).toFixed(1);
    
    console.log(`   📊 Total geral: ${totalOnline}/${totalServicos} (${percentualGeral}%)`);
    
    console.log('\n🎯 RESULTADO FINAL:');
    if (percentualGeral >= 90) {
        console.log('   🟢 DEPLOY REALIZADO COM SUCESSO!');
        console.log('   ✅ Sistema operacional e pronto para uso');
    } else if (percentualGeral >= 70) {
        console.log('   🟡 DEPLOY PARCIALMENTE FUNCIONAL');
        console.log('   ⚠️ Alguns serviços podem precisar de atenção');
    } else {
        console.log('   🔴 PROBLEMAS IDENTIFICADOS NO DEPLOY');
        console.log('   ❌ Verificar logs e configurações');
    }
    
    console.log('\n🔗 LINKS IMPORTANTES:');
    console.log(`   🌐 Frontend: ${URLS.frontend}`);
    console.log(`   ⚙️ Backend: ${URLS.backend}`);
    console.log(`   📂 GitHub: ${URLS.github}`);
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('   1. Verificar logs dos serviços offline (se houver)');
    console.log('   2. Testar funcionalidades críticas manualmente');
    console.log('   3. Configurar monitoramento contínuo');
    console.log('   4. Ativar alertas de downtime');
    
    return {
        sistemasOnline,
        apisOnline,
        totalSistemas,
        totalAPIs,
        percentualGeral: parseFloat(percentualGeral),
        status: percentualGeral >= 90 ? 'success' : percentualGeral >= 70 ? 'warning' : 'error'
    };
}

async function executarVerificacao() {
    try {
        console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
        console.log(`🕒 Iniciando verificação pós-deploy...`);
        
        // Aguardar um pouco para os serviços estabilizarem
        console.log('\n⏳ Aguardando serviços estabilizarem (5 segundos)...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verificar sistemas principais
        const sistemaResultados = await verificarSistemas();
        
        // Verificar endpoints da API
        const apiResultados = await verificarAPIEndpoints();
        
        // Gerar relatório final
        const relatorio = await gerarRelatorioFinal(sistemaResultados, apiResultados);
        
        console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA!');
        console.log(`📊 Status final: ${relatorio.status.toUpperCase()}`);
        
        return relatorio;
        
    } catch (error) {
        console.error('\n❌ Erro durante verificação:', error.message);
        console.error(error.stack);
        return null;
    }
}

// Executar verificação
executarVerificacao()
    .then(resultado => {
        if (resultado && resultado.status === 'success') {
            process.exit(0); // Sucesso
        } else {
            process.exit(1); // Falha
        }
    })
    .catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
