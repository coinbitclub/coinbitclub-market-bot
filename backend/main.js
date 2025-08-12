#!/usr/bin/env node

/**
 * 🚀 COINBITCLUB ENTERPRISE SERVER - MAIN ENTRY POINT
 * ===================================================
 * 
 * Ponto de entrada principal - executa servidor enterprise
 */

require('dotenv').config({ path: '.env.production' });

console.log('🚀 COINBITCLUB ENTERPRISE - INICIANDO...');
console.log('========================================');

// Carregar servidor enterprise garantido
require('./enterprise-server-garantido.js');

// Handlers de erro global
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada:', reason);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, finalizando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recebido SIGINT, finalizando servidor...');
    process.exit(0);
});

// Inicializar servidor
const server = new CoinBitClubServer();
server.start().catch(error => {
    console.error('💥 Falha ao iniciar servidor:', error);
    process.exit(1);
});
