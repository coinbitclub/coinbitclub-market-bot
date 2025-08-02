#!/usr/bin/env node

/**
 * 🔌 TESTADOR PROLONGADO DE WEBSOCKET
 * ═══════════════════════════════════════════════
 * 
 * Testa WebSocket por tempo prolongado para capturar systemData
 */

const WebSocket = require('ws');

console.log('🔌 TESTADOR PROLONGADO DE WEBSOCKET');
console.log('═══════════════════════════════════════════════');
console.log('🎯 Conectando e aguardando por 60 segundos...');
console.log('');

const ws = new WebSocket('ws://localhost:3015');
let messageCount = 0;
let systemDataReceived = false;

ws.on('open', () => {
    console.log('✅ CONECTADO com sucesso!');
    console.log('📡 Aguardando mensagens por 60 segundos...');
    console.log('');
});

ws.on('message', (data) => {
    messageCount++;
    try {
        const message = JSON.parse(data.toString());
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`[${timestamp}] 📨 Mensagem #${messageCount}: ${message.type}`);
        
        if (message.type === 'systemData') {
            systemDataReceived = true;
            console.log('🎉 DADOS DO SISTEMA RECEBIDOS!');
            console.log('📊 Status:', message.data.status);
            console.log('👥 Usuários:', message.data.users.total);
            console.log('💰 Saldo Total:', message.data.balances.total);
            console.log('🔑 API Keys:', message.data.apiKeys.total);
            console.log('📈 Operações:', message.data.operations.total);
            console.log('📡 Sinais:', message.data.signals.total);
            console.log('🌐 Conexão:', message.data.connectionName);
            console.log('');
        } else if (message.type === 'heartbeat') {
            console.log(`   💓 Heartbeat - Clientes: ${message.clients || 'N/A'}`);
        } else if (message.type === 'welcome') {
            console.log(`   👋 Welcome - ClientID: ${message.clientId}`);
        } else {
            console.log(`   📦 Dados:`, JSON.stringify(message, null, 2));
        }
        
    } catch (error) {
        console.log(`📨 Mensagem RAW: ${data.toString()}`);
    }
});

ws.on('error', (error) => {
    console.error('❌ Erro WebSocket:', error.message);
});

ws.on('close', (code, reason) => {
    console.log(`🔌 Conexão fechada (código: ${code})`);
    console.log(`📝 Motivo: ${reason || 'Não especificado'}`);
    
    console.log('\n📊 RESUMO DA SESSÃO:');
    console.log(`📨 Total de mensagens: ${messageCount}`);
    console.log(`🎯 SystemData recebido: ${systemDataReceived ? 'SIM ✅' : 'NÃO ❌'}`);
    
    if (!systemDataReceived) {
        console.log('\n💡 POSSÍVEIS CAUSAS:');
        console.log('• Dashboard não está enviando dados para WebSocket');
        console.log('• Intervalo de broadcast é muito longo (45s)');
        console.log('• Problema na comunicação entre Dashboard e WebSocket Server');
    }
    
    process.exit(systemDataReceived ? 0 : 1);
});

// Fechar após 60 segundos
setTimeout(() => {
    console.log('\n⏰ Tempo limite atingido (60 segundos)');
    ws.close();
}, 60000);

// Log a cada 10 segundos
let seconds = 0;
const timer = setInterval(() => {
    seconds += 10;
    console.log(`⏱️ ${seconds}s - Mensagens recebidas: ${messageCount}, SystemData: ${systemDataReceived ? 'SIM' : 'NÃO'}`);
    
    if (seconds >= 60) {
        clearInterval(timer);
    }
}, 10000);
