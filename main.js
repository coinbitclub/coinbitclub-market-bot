#!/usr/bin/env node

/**
 *  COINBITCLUB MARKET BOT V3 - MAIN ENTRY POINT
 * Entry point que chama o servidor principal do backend
 */

console.log(' CoinBitClub Market Bot V3 - Iniciando...');
console.log('===============================================');

// Importar e iniciar o servidor principal
const CoinBitClubServer = require('./backend/app.js');

// Criar e iniciar o servidor
const server = new CoinBitClubServer();
server.start().catch(error => {
    console.error(' Erro fatal ao iniciar servidor:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n Recebido SIGINT, encerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n Recebido SIGTERM, encerrando servidor...');
    process.exit(0);
});
