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

// Carregar servidor enterprise garantido (auto-start)
console.log('� Carregando enterprise server...');
require('./enterprise-server-garantido.js');
