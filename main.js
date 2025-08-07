#!/usr/bin/env node

/**
 *  COINBITCLUB - FORÇA ANTI-CACHE v5.2.0 
 * =========================================
 * BYPASS RAILWAY CACHE - DEPLOY FORÇADO
 * Timestamp: 2025-08-07T00:15:00Z
 */

require("dotenv").config({ path: ".env.production" });
const CoinBitClubServer = require("./app.js");

// ANTI-CACHE FORCE
process.env.FORCE_DEPLOY = "RAILWAY_BYPASS_" + Date.now();
process.env.CACHE_BUSTER = Math.random().toString(36);
console.log(" FORÇA ANTI-CACHE:", process.env.FORCE_DEPLOY);

// Handlers de erro global  
process.on("uncaughtException", (error) => {
    console.error(" Erro não capturado:", error);
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error(" Promise rejeitada:", reason);
    process.exit(1);
});

process.on("SIGTERM", () => {
    console.log(" Recebido SIGTERM, finalizando servidor...");
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log(" Recebido SIGINT, finalizando servidor...");
    process.exit(0);
});

// INICIALIZAR COM ANTI-CACHE
const server = new CoinBitClubServer();
server.start().catch(error => {
    console.error(" Falha ao iniciar servidor:", error);
    process.exit(1);
});
