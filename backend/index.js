const express = require('express');

console.log('� RAILWAY SIMPLE START');
console.log('Port:', process.env.PORT || 3000);

// Tentar importar o servidor principal
try {
    const CoinBitClubServer = require('./app.js');
    const server = new CoinBitClubServer();
    server.start();
} catch (error) {
    console.error('❌ Erro ao carregar servidor principal, usando fallback:', error.message);
    
    // Fallback simples
    const app = express();
    const port = process.env.PORT || 3000;
    
    app.get('/', (req, res) => {
        res.send('<h1>🚀 CoinBitClub Market Bot</h1><p>Server running but dashboard loading...</p>');
    });
    
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    app.listen(port, '0.0.0.0', () => {
        console.log(`✅ Fallback server running on port ${port}`);
    });
}
