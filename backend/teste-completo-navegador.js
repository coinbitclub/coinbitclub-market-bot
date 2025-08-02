// Teste completo para simular o comportamento do navegador
const WebSocket = require('ws');

console.log('🌐 Simulando comportamento completo do navegador...');
console.log('🔌 Conectando ao WebSocket localhost:3015...');

const ws = new WebSocket('ws://localhost:3015');

ws.on('open', function() {
    console.log('✅ WebSocket conectado com sucesso!');
    console.log('⏰ Aguardando mensagens...');
});

ws.on('message', function(data) {
    try {
        const message = JSON.parse(data.toString());
        console.log('📨 Mensagem recebida:', {
            type: message.type,
            timestamp: message.timestamp,
            dataSize: message.data ? Object.keys(message.data).length : 0
        });
        
        if (message.type === 'systemData') {
            console.log('📊 SystemData recebido:', {
                users: message.data.users?.length || 0,
                trading: message.data.trading?.length || 0,
                logs: message.data.logs?.length || 0,
                status: message.data.status
            });
            console.log('🎉 SUCESSO! Dashboard receberia os dados agora!');
        } else if (message.type === 'welcome') {
            console.log('👋 Welcome message:', message.message);
            console.log('🆔 Client ID:', message.clientId);
        }
    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
        console.log('📄 Dados brutos:', data.toString());
    }
});

ws.on('error', function(error) {
    console.error('❌ Erro no WebSocket:', error.message);
});

ws.on('close', function(code, reason) {
    console.log('🔌 WebSocket desconectado:', code, reason.toString());
});

// Manter conexão por 15 segundos para testar
setTimeout(() => {
    console.log('⏱️ Teste finalizado, fechando conexão...');
    ws.close();
    process.exit(0);
}, 15000);

console.log('🧪 Teste iniciado, aguarde 15 segundos...');
