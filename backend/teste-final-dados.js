// Teste mais prolongado para capturar a solicitação automática
const WebSocket = require('ws');

console.log('🌐 Simulando comportamento completo do navegador...');
console.log('🔌 Conectando ao WebSocket localhost:3015...');

const ws = new WebSocket('ws://localhost:3015');

ws.on('open', function() {
    console.log('✅ WebSocket conectado com sucesso!');
    console.log('⏰ Aguardando mensagens por 5 segundos...');
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
                status: message.data.status,
                users: message.data.users?.total || 0,
                operations: message.data.operations?.total || 0,
                connection: message.data.connectionName
            });
            console.log('🎉 SUCESSO TOTAL! Dashboard funcional!');
            // Fechar imediatamente após receber os dados
            ws.close();
            process.exit(0);
        } else if (message.type === 'welcome') {
            console.log('👋 Welcome message:', message.message);
            console.log('🆔 Client ID:', message.clientId);
        } else if (message.type === 'heartbeat') {
            console.log('💓 Heartbeat recebido');
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

// Timeout para caso não receba os dados
setTimeout(() => {
    console.log('⏱️ Timeout - não recebeu systemData');
    ws.close();
    process.exit(1);
}, 5000);

console.log('🧪 Teste iniciado, aguarde até 5 segundos...');
