#!/usr/bin/env node

/**
 * 🚂 GUIA DE LOGIN RAILWAY - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Comandos para fazer login no Railway e configurar as variáveis
 */

console.log('🚂 RAILWAY LOGIN E CONFIGURAÇÃO');
console.log('===============================');
console.log('');

console.log('📝 PASSO 1: INSTALAR RAILWAY CLI');
console.log('--------------------------------');
console.log('npm install -g @railway/cli');
console.log('');

console.log('🔐 PASSO 2: FAZER LOGIN NO RAILWAY');
console.log('----------------------------------');
console.log('railway login');
console.log('');

console.log('📂 PASSO 3: CONECTAR COM O PROJETO');
console.log('----------------------------------');
console.log('railway link');
console.log('# Ou se souber o ID do projeto:');
console.log('# railway link [PROJECT_ID]');
console.log('');

console.log('🔍 PASSO 4: VERIFICAR VARIÁVEIS ATUAIS');
console.log('--------------------------------------');
console.log('railway variables');
console.log('');

console.log('⚙️ PASSO 5: CONFIGURAR VARIÁVEIS CRÍTICAS');
console.log('-----------------------------------------');
console.log('# OpenAI (OBRIGATÓRIO)');
console.log('railway variables set OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxx');
console.log('');
console.log('# Bybit (OBRIGATÓRIO)');
console.log('railway variables set BYBIT_API_KEY=xxxxxxxxxxxxxxxxxx');
console.log('railway variables set BYBIT_SECRET_KEY=xxxxxxxxxxxxxxxxxx');
console.log('railway variables set BYBIT_TESTNET=false');
console.log('');
console.log('# Stripe (OBRIGATÓRIO)');
console.log('railway variables set STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxx');
console.log('railway variables set STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxx');
console.log('');

console.log('🚀 PASSO 6: FAZER DEPLOY');
console.log('------------------------');
console.log('railway up');
console.log('');

console.log('✅ PASSO 7: VERIFICAR SISTEMA');
console.log('-----------------------------');
console.log('# Depois do deploy, execute:');
console.log('node verificador-railway-conexao.js');
console.log('');

console.log('📋 COMANDOS ÚTEIS:');
console.log('------------------');
console.log('railway status          # Ver status do projeto');
console.log('railway logs            # Ver logs em tempo real');
console.log('railway shell           # Abrir shell no container');
console.log('railway variables       # Listar todas as variáveis');
console.log('railway variables get NOME_VARIAVEL  # Ver variável específica');
console.log('railway variables unset NOME_VARIAVEL  # Remover variável');
console.log('');

console.log('🎯 EXECUTAR AGORA:');
console.log('==================');
console.log('1️⃣ npm install -g @railway/cli');
console.log('2️⃣ railway login');
console.log('3️⃣ railway link');
console.log('');

console.log('💡 DICA: Abra outro terminal e execute os comandos acima!');
console.log('🔗 Se não funcionar, acesse: https://railway.app/dashboard');
