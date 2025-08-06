/**
 * 🚀 COINBITCLUB MARKET BOT V3 - ENTRADA PRINCIPAL
 * Sistema de Trading Automatizado com Orquestração Completa
 * Última tentativa de deployment - sobrescreve TUDO
 */

const path = require('path');

// Definir variáveis de ambiente forçadas
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '8080';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'coinbitclub-secret-2025';

console.log('✅ Configurações forçadas aplicadas:');
console.log('DATABASE_URL:', process.env.DATABASE_URL.substring(0, 50) + '...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('JWT_SECRET:', process.env.JWT_SECRET);

// Carregar o servidor principal do backend
require('./backend/main.js');
