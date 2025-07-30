#!/usr/bin/env node

/**
 * 🚀 CONFIGURADOR DE VARIÁVEIS RAILWAY - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Configura as variáveis essenciais para operação real no Railway
 */

console.log('🚀 CONFIGURADOR DE VARIÁVEIS RAILWAY');
console.log('===================================');
console.log('');

console.log('📋 VARIÁVEIS CRÍTICAS PARA OPERAÇÃO REAL:');
console.log('==========================================');
console.log('');

console.log('🤖 1. OPENAI (OBRIGATÓRIO)');
console.log('---------------------------');
console.log('railway variables set OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxx');
console.log('railway variables set OPENAI_ORG_ID=org-xxxxxxxxxxxxxxxxxx');
console.log('');

console.log('🔹 2. BYBIT EXCHANGE (OBRIGATÓRIO)'); 
console.log('----------------------------------');
console.log('railway variables set BYBIT_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxx');
console.log('railway variables set BYBIT_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxx');
console.log('railway variables set BYBIT_TESTNET=false');
console.log('');

console.log('💳 3. STRIPE PAGAMENTOS (OBRIGATÓRIO)');
console.log('-------------------------------------');
console.log('railway variables set STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxx');
console.log('railway variables set STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxx');
console.log('railway variables set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx');
console.log('');

console.log('📱 4. TWILIO WHATSAPP (OPCIONAL)');
console.log('--------------------------------');
console.log('railway variables set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx');
console.log('railway variables set TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxx');
console.log('railway variables set TWILIO_PHONE_NUMBER=+14155238886');
console.log('');

console.log('⚙️ 5. SISTEMA (RECOMENDADO)');
console.log('---------------------------');
console.log('railway variables set NODE_ENV=production');
console.log('railway variables set PORT=3000');
console.log('');

console.log('🎯 APÓS CONFIGURAR, EXECUTE:');
console.log('============================');
console.log('1. railway variables          # Verificar se todas foram salvas');
console.log('2. railway up                 # Fazer deploy');
console.log('3. node verificador-railway-conexao.js  # Testar conexões');
console.log('');

console.log('💡 DICAS IMPORTANTES:');
console.log('=====================');
console.log('• Substitua "xxxxxxxxxx" pelas chaves reais');
console.log('• Para PRODUCTION use chaves LIVE (não test)');
console.log('• BYBIT_TESTNET=false para operação real');
console.log('• Guarde as chaves em local seguro');
console.log('');

console.log('🔍 VERIFICAR VARIÁVEIS ATUAIS:');
console.log('==============================');
console.log('railway variables');
console.log('');

console.log('✅ SISTEMA ESTARÁ PRONTO QUANDO TODAS AS CRÍTICAS ESTIVEREM CONFIGURADAS!');
