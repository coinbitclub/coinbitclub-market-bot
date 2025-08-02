// Teste com cliente persistente que aguarda por mais tempo
const WebSocket = require('ws');

console.log('🌐 Teste de cliente persistente...');
console.log('🔌 Conectando ao WebSocket localhost:3015...');

const ws = new WebSocket('ws://localhost:3015');
let receivedData = false;

ws.on('open', function() {
    console.log('✅ WebSocket conectado com sucesso!');
    console.log('⏰ Aguardando mensagens por até 10 segundos...');
});

ws.on('message', function(data) {
    try {
        const message = JSON.parse(data.toString());
        console.log('📨 Mensagem recebida:', {
            type: message.type,
            timestamp: new Date(message.timestamp).toLocaleTimeString(),
            hasData: !!message.data
        });
        
        if (message.type === 'systemData') {
            receivedData = true;
            console.log('🎉 SUCESSO! SystemData recebido:');
            console.log('📊 Status:', message.data.status);
            console.log('👥 Usuários:', message.data.users?.total || 'N/A');
            console.log('⚡ Operações:', message.data.operations?.total || 'N/A');
            console.log('🔗 Conexão:', message.data.connectionName);
            console.log('🏆 DASHBOARD TOTALMENTE FUNCIONAL!');
            
            // Aguardar mais um pouco para ver se recebe mais dados
            setTimeout(() => {
                ws.close();
                process.exit(0);
            }, 2000);
            
        } else if (message.type === 'welcome') {
            console.log('👋 Conectado com ID:', message.clientId);
        } else if (message.type === 'heartbeat') {
            console.log('💓 Heartbeat');
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
    console.log('🔌 Conexão fechada:', code, reason.toString());
    if (receivedData) {
        console.log('✅ Teste concluído com SUCESSO!');
        process.exit(0);
    } else {
        console.log('❌ Não recebeu dados do sistema');
        process.exit(1);
    }
});

// Timeout para garantir que aguarda tempo suficiente
setTimeout(() => {
    if (!receivedData) {
        console.log('⏱️ Timeout após 10 segundos - encerrando teste');
        ws.close();
    }
}, 10000);

console.log('🧪 Teste iniciado - cliente persistente por 10s...');
