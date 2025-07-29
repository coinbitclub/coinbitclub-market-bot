/**
 * 🔍 VERIFICADOR COM VARIÁVEIS DE PRODUÇÃO
 * =======================================
 * 
 * Carrega as variáveis do .env.production e testa integração
 */

require('dotenv').config({ path: '.env.production' });

const verificador = require('./verificar-railway-integracao');

console.log('🔧 CARREGANDO VARIÁVEIS DE PRODUÇÃO...');
console.log('=====================================');

// Mostrar quais variáveis foram carregadas
const variaveisCarregadas = [
    'NODE_ENV',
    'DATABASE_URL', 
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER'
];

console.log('📋 Variáveis carregadas do .env.production:');
variaveisCarregadas.forEach(nome => {
    const valor = process.env[nome];
    if (valor) {
        let valorMascarado = valor;
        if (nome.includes('SECRET') || nome.includes('TOKEN') || nome.includes('KEY')) {
            valorMascarado = valor.substring(0, 8) + '***';
        } else if (nome === 'DATABASE_URL') {
            valorMascarado = 'postgresql://***@maglev.proxy.rlwy.net:42095/railway';
        }
        console.log(`✅ ${nome}: ${valorMascarado}`);
    } else {
        console.log(`❌ ${nome}: Não encontrada`);
    }
});

console.log('\n🔍 Executando verificação com variáveis carregadas...\n');

// Executar verificação
verificador.executarVerificacao().catch(console.error);
