#!/usr/bin/env node

/**
 * RAILWAY ENTRY POINT - CoinBitClub Market Bot
 * Este é o ponto de entrada principal para o Railway
 */

console.log('🚀 Iniciando CoinBitClub Market Bot...');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔧 Port:', process.env.PORT || 3000);

try {
    // Importar e inicializar o servidor
    const CoinBitClubServer = require('./app.js');
    
    console.log('✅ Módulo app.js carregado com sucesso');
    
    // Criar e iniciar instância do servidor
    const server = new CoinBitClubServer();
    
    console.log('🔄 Iniciando servidor...');
    server.start().catch(error => {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    });
    
} catch (error) {
    console.error('❌ ERRO CRÍTICO ao carregar aplicação:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
}

// Tratamento de sinais para shutdown graceful
process.on('SIGTERM', () => {
    console.log('📤 SIGTERM recebido. Iniciando shutdown graceful...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📤 SIGINT recebido. Iniciando shutdown graceful...');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
