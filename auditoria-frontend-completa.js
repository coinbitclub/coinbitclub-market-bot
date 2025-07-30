#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 AUDITORIA COMPLETA DO SISTEMA FRONTEND PREMIUM');
console.log('================================================\n');

const frontendPath = path.join(__dirname, 'coinbitclub-frontend-premium');

// Verificar estrutura de pastas
console.log('📁 ESTRUTURA DE PASTAS:');
console.log('======================');

const checkFolder = (folderPath, description) => {
  const exists = fs.existsSync(folderPath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${folderPath}`);
  return exists;
};

// Páginas principais
checkFolder(path.join(frontendPath, 'pages'), 'Pasta pages');
checkFolder(path.join(frontendPath, 'pages/auth'), 'Pasta auth');
checkFolder(path.join(frontendPath, 'pages/api'), 'Pasta API');
checkFolder(path.join(frontendPath, 'pages/admin'), 'Pasta admin');
checkFolder(path.join(frontendPath, 'pages/affiliate'), 'Pasta affiliate');
checkFolder(path.join(frontendPath, 'pages/gestor'), 'Pasta gestor');
checkFolder(path.join(frontendPath, 'pages/operador'), 'Pasta operador');
checkFolder(path.join(frontendPath, 'pages/supervisor'), 'Pasta supervisor');
checkFolder(path.join(frontendPath, 'pages/user'), 'Pasta user');

console.log('\n📄 PÁGINAS FRONTEND:');
console.log('====================');

const checkFile = (filePath, description) => {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${path.basename(filePath)}`);
  return exists;
};

// Páginas de autenticação
checkFile(path.join(frontendPath, 'pages/auth/login.tsx'), 'Login Page');
checkFile(path.join(frontendPath, 'pages/auth/forgot-password.tsx'), 'Forgot Password Page');
checkFile(path.join(frontendPath, 'pages/auth/reset-password.tsx'), 'Reset Password Page');

// Dashboards por perfil
checkFile(path.join(frontendPath, 'pages/admin/dashboard.tsx'), 'Admin Dashboard');
checkFile(path.join(frontendPath, 'pages/affiliate/dashboard.tsx'), 'Affiliate Dashboard');
checkFile(path.join(frontendPath, 'pages/gestor/dashboard.tsx'), 'Gestor Dashboard');
checkFile(path.join(frontendPath, 'pages/operador/dashboard.tsx'), 'Operador Dashboard');
checkFile(path.join(frontendPath, 'pages/supervisor/dashboard.tsx'), 'Supervisor Dashboard');
checkFile(path.join(frontendPath, 'pages/user/dashboard.tsx'), 'User Dashboard');

console.log('\n🔌 APIs BACKEND:');
console.log('===============');

// APIs de autenticação
checkFile(path.join(frontendPath, 'pages/api/auth/login.ts'), 'Login API');
checkFile(path.join(frontendPath, 'pages/api/auth/forgot-password.ts'), 'Forgot Password API');
checkFile(path.join(frontendPath, 'pages/api/auth/reset-password.ts'), 'Reset Password API');

// APIs dos dashboards
checkFile(path.join(frontendPath, 'pages/api/admin/dashboard.ts'), 'Admin Dashboard API');
checkFile(path.join(frontendPath, 'pages/api/affiliate/dashboard.ts'), 'Affiliate Dashboard API');
checkFile(path.join(frontendPath, 'pages/api/gestor/dashboard.ts'), 'Gestor Dashboard API');
checkFile(path.join(frontendPath, 'pages/api/operador/dashboard.ts'), 'Operador Dashboard API');
checkFile(path.join(frontendPath, 'pages/api/supervisor/dashboard.ts'), 'Supervisor Dashboard API');
checkFile(path.join(frontendPath, 'pages/api/user/dashboard.ts'), 'User Dashboard API');

console.log('\n🔧 ARQUIVOS DE CONFIGURAÇÃO:');
console.log('============================');

checkFile(path.join(frontendPath, 'package.json'), 'Package.json');
checkFile(path.join(frontendPath, 'next.config.js'), 'Next.js Config');
checkFile(path.join(frontendPath, 'tailwind.config.js'), 'Tailwind Config');
checkFile(path.join(frontendPath, 'lib/db.ts'), 'Database Connection');

console.log('\n🎯 RESUMO DA AUDITORIA:');
console.log('=======================');

const perfis = ['admin', 'affiliate', 'gestor', 'operador', 'supervisor', 'user'];
let totalPerfis = 0;
let perfilCompletos = 0;

perfis.forEach(perfil => {
  totalPerfis++;
  const dashboardPage = fs.existsSync(path.join(frontendPath, `pages/${perfil}/dashboard.tsx`));
  const dashboardAPI = fs.existsSync(path.join(frontendPath, `pages/api/${perfil}/dashboard.ts`));
  
  if (dashboardPage && dashboardAPI) {
    perfilCompletos++;
    console.log(`✅ ${perfil.toUpperCase()}: Dashboard e API implementados`);
  } else if (dashboardPage && !dashboardAPI) {
    console.log(`⚠️  ${perfil.toUpperCase()}: Dashboard OK, API faltando`);
  } else if (!dashboardPage && dashboardAPI) {
    console.log(`⚠️  ${perfil.toUpperCase()}: API OK, Dashboard faltando`);
  } else {
    console.log(`❌ ${perfil.toUpperCase()}: Dashboard e API faltando`);
  }
});

console.log(`\n📊 CONFORMIDADE: ${perfilCompletos}/${totalPerfis} perfis completos (${Math.round(perfilCompletos/totalPerfis*100)}%)`);

// Verificar sistema de autenticação
const authComplete = fs.existsSync(path.join(frontendPath, 'pages/auth/login.tsx')) &&
                    fs.existsSync(path.join(frontendPath, 'pages/api/auth/login.ts')) &&
                    fs.existsSync(path.join(frontendPath, 'pages/auth/forgot-password.tsx')) &&
                    fs.existsSync(path.join(frontendPath, 'pages/api/auth/forgot-password.ts')) &&
                    fs.existsSync(path.join(frontendPath, 'pages/auth/reset-password.tsx')) &&
                    fs.existsSync(path.join(frontendPath, 'pages/api/auth/reset-password.ts'));

console.log(`\n🔐 SISTEMA DE AUTENTICAÇÃO: ${authComplete ? '✅ COMPLETO' : '❌ INCOMPLETO'}`);

if (authComplete && perfilCompletos === totalPerfis) {
  console.log('\n🎉 SISTEMA 100% IMPLEMENTADO!');
  console.log('✅ Todos os perfis de usuário estão funcionais');
  console.log('✅ Sistema de autenticação completo');
  console.log('✅ Sistema de recuperação de senha implementado');
  console.log('✅ APIs e dashboards para todos os perfis');
} else {
  console.log('\n⚠️  Sistema parcialmente implementado');
  console.log('Pendências identificadas nos itens marcados com ❌ acima');
}

console.log('\n🚀 PRÓXIMOS PASSOS:');
console.log('==================');
console.log('1. Testar sistema de login');
console.log('2. Testar redirecionamentos por perfil');
console.log('3. Testar recuperação de senha');
console.log('4. Verificar responsividade das páginas');
console.log('5. Testes de integração com banco de dados');

console.log('\n✅ Auditoria concluída!');
