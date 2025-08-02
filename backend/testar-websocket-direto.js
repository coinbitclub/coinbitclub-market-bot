#!/usr/bin/env node

/**
 * 🔌 TESTADOR DIRETO DE WEBSOCKET
 * ═══════════════════════════════════════════════
 * 
 * Testa diretamente a conexão WebSocket para debug
 * Simula o comportamento do dashboard
 */

const WebSocket = require('ws');

console.log('🔌 TESTADOR DIRETO DE WEBSOCKET');
console.log('═══════════════════════════════════════════════');
console.log('🎯 Testando conexão ws://localhost:3015');
console.log('');

let connectionAttempts = 0;
const maxAttempts = 3;

function testWebSocketConnection() {
    connectionAttempts++;
    console.log(`🔄 Tentativa ${connectionAttempts}/${maxAttempts} de conexão...`);
    
    const ws = new WebSocket('ws://localhost:3015');
    const startTime = Date.now();
    
    ws.on('open', () => {
        const connectTime = Date.now() - startTime;
        console.log(`✅ CONECTADO com sucesso! (${connectTime}ms)`);
        console.log('📡 Aguardando mensagens...');
        
        // Aguardar mensagens por 10 segundos
        setTimeout(() => {
            console.log('⏱️ Encerrando teste após 10 segundos');
            ws.close();
        }, 10000);
    });
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('📨 Mensagem recebida:', {
                type: message.type,
                timestamp: message.timestamp || 'N/A',
                dataKeys: message.data ? Object.keys(message.data) : 'N/A'
            });
        } catch (error) {
            console.log('📨 Mensagem recebida (raw):', data.toString());
        }
    });
    
    ws.on('error', (error) => {
        console.log(`❌ ERRO na conexão: ${error.message}`);
        console.log('🔧 Detalhes do erro:', error.code || 'N/A');
        
        if (connectionAttempts < maxAttempts) {
            console.log(`🔄 Tentando novamente em 3 segundos...`);
            setTimeout(testWebSocketConnection, 3000);
        } else {
            console.log('❌ Máximo de tentativas alcançado');
            process.exit(1);
        }
    });
    
    ws.on('close', (code, reason) => {
        console.log(`🔌 Conexão fechada (código: ${code})`);
        console.log(`📝 Motivo: ${reason || 'Não especificado'}`);
        
        if (code !== 1000 && connectionAttempts < maxAttempts) {
            console.log(`🔄 Tentando reconectar em 3 segundos...`);
            setTimeout(testWebSocketConnection, 3000);
        } else {
            console.log('🏁 Teste finalizado');
            process.exit(code === 1000 ? 0 : 1);
        }
    });
    
    // Timeout para conexão
    setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
            console.log('⏰ TIMEOUT na conexão');
            ws.terminate();
            
            if (connectionAttempts < maxAttempts) {
                console.log(`🔄 Tentando novamente em 3 segundos...`);
                setTimeout(testWebSocketConnection, 3000);
            } else {
                console.log('❌ Máximo de tentativas alcançado');
                process.exit(1);
            }
        }
    }, 10000);
}

// Verificar se WebSocket server está rodando primeiro
const http = require('http');

console.log('🔍 Verificando se WebSocket server está ativo...');

const req = http.get('http://localhost:3015/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const health = JSON.parse(data);
            console.log(`✅ WebSocket server ativo (uptime: ${health.uptime}s)`);
            console.log(`📊 Clientes conectados: ${health.clients}`);
            console.log('');
            
            // Iniciar teste de conexão
            testWebSocketConnection();
        } catch (error) {
            console.log('❌ Resposta inválida do health check');
            process.exit(1);
        }
    });
});

req.on('error', (error) => {
    console.log(`❌ WebSocket server não está rodando: ${error.message}`);
    console.log('💡 Execute: node system-controller.js start');
    process.exit(1);
});

req.setTimeout(5000, () => {
    req.destroy();
    console.log('⏰ Timeout no health check');
    process.exit(1);
});
