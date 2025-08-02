#!/usr/bin/env node

/**
 * 🔬 TESTE DIRETO DE BROADCAST
 * ═══════════════════════════════════════════════
 * 
 * Conecta ao WebSocket e testa broadcast simultaneamente
 */

const WebSocket = require('ws');
const http = require('http');

console.log('🔬 TESTE DIRETO DE BROADCAST');
console.log('═══════════════════════════════════════════════');

// Conectar ao WebSocket
const ws = new WebSocket('ws://localhost:3015');
let received = false;

ws.on('open', () => {
    console.log('✅ WebSocket conectado');
    
    // Aguardar 2 segundos e então fazer broadcast
    setTimeout(() => {
        console.log('📡 Enviando broadcast...');
        
        const postData = JSON.stringify({
            type: 'systemData',
            data: {
                status: 'TEST_MANUAL',
                users: { total: 999 },
                message: 'Broadcast teste direto'
            }
        });
        
        const options = {
            hostname: 'localhost',
            port: 3015,
            path: '/api/broadcast',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('📤 Resposta do broadcast:', data);
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Erro no broadcast:', error.message);
        });
        
        req.write(postData);
        req.end();
        
    }, 2000);
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.log(`📨 Mensagem recebida: ${message.type}`);
        
        if (message.type === 'systemData') {
            received = true;
            console.log('🎉 SUCESSO! SystemData recebido via broadcast');
            console.log('📊 Dados:', JSON.stringify(message.data, null, 2));
            ws.close();
            process.exit(0);
        }
    } catch (error) {
        console.log('📨 Mensagem RAW:', data.toString());
    }
});

ws.on('error', (error) => {
    console.error('❌ Erro WebSocket:', error.message);
    process.exit(1);
});

ws.on('close', () => {
    console.log('🔌 WebSocket fechado');
    if (!received) {
        console.log('❌ Não recebeu broadcast - há problema na comunicação');
        process.exit(1);
    }
});

// Timeout de segurança
setTimeout(() => {
    console.log('⏰ Timeout - teste não concluído');
    if (!received) {
        console.log('❌ Broadcast não funcionou');
    }
    process.exit(1);
}, 10000);
