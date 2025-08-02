#!/usr/bin/env node

/**
 * 🎯 VALIDADOR FINAL DO SISTEMA FRONTEND
 * ═══════════════════════════════════════════════════
 * 
 * Teste completo da conectividade do dashboard
 * Validação WebSocket, API e conexão de dados
 * 
 * Criado: 31/07/2025
 * Autor: CoinBitClub Development Team
 */

const http = require('http');
const WebSocket = require('ws');

console.log('🎯 VALIDADOR FINAL DO SISTEMA FRONTEND');
console.log('═══════════════════════════════════════════════════');
console.log('📊 Testando conectividade completa do dashboard');
console.log('🔍 Validando WebSocket, API e dados\n');

async function testHTTP(url, name) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const req = http.get(url, (res) => {
            const responseTime = Date.now() - startTime;
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ ${name}: OK (${responseTime}ms)`);
                    resolve({ success: true, responseTime, data });
                } else {
                    console.log(`❌ ${name}: FALHOU (Status: ${res.statusCode})`);
                    resolve({ success: false, responseTime, error: `Status ${res.statusCode}` });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ ${name}: ERRO (${error.message})`);
            resolve({ success: false, error: error.message });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            console.log(`⏰ ${name}: TIMEOUT`);
            resolve({ success: false, error: 'Timeout' });
        });
    });
}

async function testWebSocket() {
    return new Promise((resolve) => {
        console.log('🔄 Testando WebSocket na porta 3015...');
        
        const ws = new WebSocket('ws://localhost:3015');
        const startTime = Date.now();
        
        ws.on('open', () => {
            const responseTime = Date.now() - startTime;
            console.log(`✅ WebSocket Connection: OK (${responseTime}ms)`);
            ws.close();
            resolve({ success: true, responseTime });
        });
        
        ws.on('error', (error) => {
            console.log(`❌ WebSocket Connection: ERRO (${error.message})`);
            resolve({ success: false, error: error.message });
        });
        
        ws.on('close', () => {
            console.log('🔌 WebSocket desconectado');
        });
        
        setTimeout(() => {
            if (ws.readyState === WebSocket.CONNECTING) {
                ws.terminate();
                console.log('⏰ WebSocket Connection: TIMEOUT');
                resolve({ success: false, error: 'Timeout' });
            }
        }, 10000);
    });
}

async function runValidation() {
    console.log('🚀 Iniciando validação completa...\n');
    
    const tests = [
        { url: 'http://localhost:3009', name: '📊 Dashboard Principal' },
        { url: 'http://localhost:3009/api/system-data', name: '📈 API de Dados do Sistema' },
        { url: 'http://localhost:3015/health', name: '🌐 WebSocket Health Check' },
        { url: 'http://localhost:3016/health', name: '📊 API Indicadores Health' },
        { url: 'http://localhost:9003', name: '🤖 Trading System Status' }
    ];
    
    const results = [];
    
    // Testar HTTP endpoints
    for (const test of tests) {
        const result = await testHTTP(test.url, test.name);
        results.push({ ...test, ...result });
    }
    
    console.log('');
    
    // Testar WebSocket
    const wsResult = await testWebSocket();
    results.push({ name: '🔌 WebSocket Connection', ...wsResult });
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RELATÓRIO FINAL DE VALIDAÇÃO');
    console.log('═══════════════════════════════════════════════════');
    
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const healthPercentage = ((successful / total) * 100).toFixed(1);
    
    console.log(`🎯 Conectividade Geral: ${healthPercentage}%`);
    console.log(`✅ Serviços Funcionais: ${successful}/${total}`);
    console.log('');
    
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
        const error = result.error ? ` - ${result.error}` : '';
        console.log(`${status} ${result.name}${time}${error}`);
    });
    
    console.log('\n🔗 LINKS DE ACESSO:');
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 Dashboard: http://localhost:3009');
    console.log('📈 API Dados: http://localhost:3009/api/system-data');
    console.log('🌐 WebSocket: ws://localhost:3015');
    console.log('📊 Indicadores: http://localhost:3016/health');
    console.log('🤖 Trading: http://localhost:9003');
    
    if (healthPercentage === '100.0') {
        console.log('\n🎉 SISTEMA 100% OPERACIONAL!');
        console.log('✅ Frontend conectado corretamente');
        console.log('✅ WebSocket funcionando perfeitamente');
        console.log('✅ Todos os serviços ativos e responsivos');
        console.log('\n🚀 Dashboard pronto para uso em: http://localhost:3009');
    } else {
        console.log('\n⚠️ ALGUNS PROBLEMAS DETECTADOS');
        console.log('🔧 Verifique os serviços com falha acima');
        console.log('💡 Execute: node system-controller.js start');
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log(`🕐 Validação concluída: ${new Date().toLocaleString('pt-BR')}`);
    console.log('═══════════════════════════════════════════════════');
}

// Executar validação
runValidation().catch(console.error);
