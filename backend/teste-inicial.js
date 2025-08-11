#!/usr/bin/env node

console.log('🔍 TESTE INICIAL DO SISTEMA');
console.log('===========================');

// Verificar se dependências estão disponíveis
try {
    require('dotenv').config();
    console.log('✅ dotenv carregado');
} catch (error) {
    console.log('❌ Erro ao carregar dotenv:', error.message);
}

try {
    const { Pool } = require('pg');
    console.log('✅ pg disponível');
} catch (error) {
    console.log('❌ Erro ao carregar pg:', error.message);
}

try {
    const fs = require('fs');
    console.log('✅ fs disponível');
} catch (error) {
    console.log('❌ Erro ao carregar fs:', error.message);
}

// Verificar variáveis de ambiente
console.log('\n📊 VARIÁVEIS DE AMBIENTE:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'CONFIGURADA' : 'FALTANDO');
console.log('ENABLE_REAL_TRADING:', process.env.ENABLE_REAL_TRADING || 'FALTANDO');
console.log('NODE_ENV:', process.env.NODE_ENV || 'FALTANDO');

// Verificar arquivos executores
console.log('\n⚡ VERIFICANDO EXECUTORES:');
const fs = require('fs');
const path = require('path');

const executorFiles = [
    'enhanced-signal-processor-with-execution.js',
    'order-execution-engine-v2.js',
    'order-executor-fixed.js'
];

executorFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}: Existe`);
    } else {
        console.log(`❌ ${file}: FALTANDO`);
    }
});

console.log('\n🔍 TESTE INICIAL CONCLUÍDO');
