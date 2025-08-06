#!/usr/bin/env node
/**
 * COINBITCLUB MARKET BOT - ENTRY POINT
 * ====================================
 * Entry point principal que carrega o servidor do backend
 */
const CoinBitClubServer = require('./backend/app.js');

async function main() {
    try {
        console.log(' Iniciando CoinBitClub Market Bot...');
        const server = new CoinBitClubServer();
        await server.start();
        
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log(' SIGTERM recebido, encerrando servidor...');
            process.exit(0);
        });
        
        process.on('SIGINT', () => {
            console.log(' SIGINT recebido, encerrando servidor...');
            process.exit(0);
        });
        
    } catch (error) {
        console.error(' Erro crítico:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}