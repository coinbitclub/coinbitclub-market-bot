require('dotenv').config();

// Forçar as configurações corretas de banco
process.env.DATABASE_URL = 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway';
process.env.POSTGRES_URL = 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway';
process.env.NODE_ENV = 'production';
process.env.PORT = '8080';

console.log('✅ Configurações forçadas aplicadas:');
console.log('DATABASE_URL:', process.env.DATABASE_URL.substring(0, 50) + '...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Carregar o servidor principal
require('./main.js');
