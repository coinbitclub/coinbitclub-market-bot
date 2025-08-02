const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const PORT = 3015; // Porta livre para WebSocket

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

console.log(`🌐 Servidor WebSocket Real iniciando na porta ${PORT}`);

app.use(express.json());

// Store connected clients
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    const clientId = Date.now() + Math.random();
    console.log(`🔌 Cliente conectado via WebSocket (ID: ${clientId})`);
    console.log(`📊 Total de clientes conectados: ${clients.size + 1}`);
    clients.add(ws);
    
    // Send welcome message
    try {
        ws.send(JSON.stringify({
            type: 'welcome',
            message: 'Conectado ao CoinBitClub WebSocket',
            timestamp: new Date().toISOString(),
            clientId: clientId
        }));
        console.log(`📨 Welcome message enviada para cliente ${clientId}`);
    } catch (error) {
        console.error(`❌ Erro ao enviar welcome message: ${error.message}`);
    }
    
    // Solicitar dados imediatos do dashboard
    setTimeout(() => {
        console.log('📞 Solicitando dados imediatos do dashboard...');
        
        const http = require('http');
        
        const options = {
            hostname: 'localhost',
            port: 3009,
            path: '/api/trigger-broadcast',
            method: 'GET'
        };
        
        const req = http.request(options, (res) => {
            console.log('📊 Dashboard respondeu com status:', res.statusCode);
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('📊 Resposta do dashboard:', data);
            });
        });
        
        req.on('error', (error) => {
            console.log('⚠️ Erro na solicitação ao dashboard:', error.message);
        });
        
        req.end();
        
    }, 1000); // Aguardar 1 segundo após conexão
    
    // Handle messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('📨 Mensagem:', data.type);
            
            // Broadcast to others
            broadcastToOthers(ws, {
                type: 'broadcast',
                data: data,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Formato inválido',
                timestamp: new Date().toISOString()
            }));
        }
    });
    
    ws.on('close', (code, reason) => {
        console.log(`🔌 Cliente desconectado (ID: ${clientId}, código: ${code})`);
        console.log(`📝 Motivo: ${reason || 'Não especificado'}`);
        clients.delete(ws);
        console.log(`📊 Total de clientes restantes: ${clients.size}`);
    });
    
    ws.on('error', (error) => {
        console.error(`❌ Erro WebSocket (ID: ${clientId}): ${error.message}`);
        console.error(`🔧 Stack trace:`, error.stack);
        clients.delete(ws);
    });
});

function broadcastToOthers(sender, message) {
    clients.forEach(client => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

function broadcastToAll(message) {
    let sentCount = 0;
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(JSON.stringify(message));
                sentCount++;
            } catch (error) {
                console.error(`❌ Erro ao enviar para cliente: ${error.message}`);
                clients.delete(client);
            }
        } else {
            console.log(`⚠️ Cliente com readyState: ${client.readyState} - removendo`);
            clients.delete(client);
        }
    });
    
    if (message.type !== 'heartbeat') {
        console.log(`📤 Mensagem '${message.type}' enviada para ${sentCount}/${clients.size} clientes`);
    }
}

// REST API
app.post('/api/broadcast', (req, res) => {
    try {
        console.log(`📡 Recebida solicitação de broadcast: ${req.body.type}`);
        console.log(`👥 Clientes conectados: ${clients.size}`);
        
        const message = {
            type: req.body.type || 'broadcast',
            data: req.body.data,
            timestamp: new Date().toISOString(),
            source: 'api'
        };
        
        broadcastToAll(message);
        console.log(`✅ Broadcast enviado para ${clients.size} clientes`);
        
        res.json({
            success: true,
            clientCount: clients.size
        });
    } catch (error) {
        console.error(`❌ Erro no broadcast: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para solicitar dados imediatos
app.post('/api/request-data', (req, res) => {
    try {
        console.log('📞 Solicitação de dados recebida - notificando dashboard');
        
        // Notificar dashboard para enviar dados
        const http = require('http');
        const postData = JSON.stringify({
            action: 'request_immediate_data'
        });
        
        const options = {
            hostname: 'localhost',
            port: 3009,
            path: '/api/request-data',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (dashRes) => {
            console.log('📊 Dashboard notificado para envio imediato');
        });
        
        req.on('error', (error) => {
            console.log('⚠️ Dashboard não respondeu à solicitação:', error.message);
        });
        
        req.write(postData);
        req.end();
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'WebSocket Server Real',
        port: PORT,
        clients: clients.size,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Heartbeat
setInterval(() => {
    broadcastToAll({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        clients: clients.size
    });
}, 30000);

server.listen(PORT, () => {
    console.log(`✅ WebSocket Server rodando na porta ${PORT}`);
    console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
});

// Error handling
wss.on('error', (error) => {
    console.error('❌ Erro no WebSocket Server:', error);
});

server.on('error', (error) => {
    console.error('❌ Erro no HTTP Server:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`🔥 Porta ${PORT} já está em uso!`);
        process.exit(1);
    }
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('📍 Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando WebSocket Server...');
    broadcastToAll({
        type: 'shutdown',
        message: 'Servidor encerrando',
        timestamp: new Date().toISOString()
    });
    
    setTimeout(() => {
        server.close(() => {
            console.log('✅ WebSocket Server encerrado');
            process.exit(0);
        });
    }, 1000);
});

module.exports = { broadcastToAll, clients };
