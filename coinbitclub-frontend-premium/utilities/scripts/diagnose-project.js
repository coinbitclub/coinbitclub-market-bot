#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 DIAGNÓSTICO COMPLETO DO PROJETO COINBITCLUB');
console.log('='.repeat(60));

// Cores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(50));
  log(title, 'cyan');
  console.log('='.repeat(50));
}

// 1. VERIFICAR ESTRUTURA DE ARQUIVOS
section('📁 VERIFICANDO ESTRUTURA DE ARQUIVOS');

const requiredDirs = [
  'pages',
  'pages/api',
  'src/components',
  'src/services',
  'src/types',
  'public',
  'styles'
];

const requiredFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  'tailwind.config.js'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    log(`✅ ${dir}`, 'green');
  } else {
    log(`❌ ${dir} - FALTANDO`, 'red');
  }
});

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    log(`✅ ${file}`, 'green');
  } else {
    log(`❌ ${file} - FALTANDO`, 'red');
  }
});

// 2. VERIFICAR DEPENDÊNCIAS
section('📦 VERIFICANDO DEPENDÊNCIAS');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  
  log(`✅ Dependencies: ${dependencies.length}`, 'green');
  log(`✅ DevDependencies: ${devDependencies.length}`, 'green');
  
  // Verificar dependências críticas
  const criticalDeps = ['next', 'react', 'react-dom', 'typescript'];
  criticalDeps.forEach(dep => {
    if (dependencies.includes(dep)) {
      log(`✅ ${dep}`, 'green');
    } else {
      log(`❌ ${dep} - FALTANDO`, 'red');
    }
  });
  
} catch (error) {
  log(`❌ Erro ao ler package.json: ${error.message}`, 'red');
}

// 3. VERIFICAR ARQUIVOS VAZIOS OU CORROMPIDOS
section('🔍 VERIFICANDO ARQUIVOS PROBLEMÁTICOS');

function scanDirectory(dir, issues = []) {
  if (!fs.existsSync(dir)) return issues;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      scanDirectory(fullPath, issues);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Verificar arquivos vazios
        if (content.trim().length === 0) {
          issues.push({
            type: 'EMPTY',
            file: fullPath,
            message: 'Arquivo vazio'
          });
        }
        
        // Verificar sintaxe básica
        if (file.name.endsWith('.tsx') && !content.includes('export default') && !content.includes('export {')) {
          issues.push({
            type: 'NO_EXPORT',
            file: fullPath,
            message: 'Arquivo sem export default ou named export'
          });
        }
        
        // Verificar imports React em componentes
        if (file.name.endsWith('.tsx') && content.includes('<') && !content.includes('import React')) {
          issues.push({
            type: 'MISSING_REACT_IMPORT',
            file: fullPath,
            message: 'Componente React sem import do React'
          });
        }
        
        // Verificar JSX mal formado
        const openTags = (content.match(/</g) || []).length;
        const closeTags = (content.match(/>/g) || []).length;
        if (openTags !== closeTags && content.includes('<')) {
          issues.push({
            type: 'MALFORMED_JSX',
            file: fullPath,
            message: 'Possível JSX mal formado'
          });
        }
        
      } catch (error) {
        issues.push({
          type: 'READ_ERROR',
          file: fullPath,
          message: `Erro ao ler arquivo: ${error.message}`
        });
      }
    }
  });
  
  return issues;
}

const issues = scanDirectory('./pages');
scanDirectory('./src', issues);

if (issues.length === 0) {
  log('✅ Nenhum problema encontrado nos arquivos', 'green');
} else {
  log(`❌ ${issues.length} problemas encontrados:`, 'red');
  issues.forEach(issue => {
    log(`  ${issue.type}: ${issue.file}`, 'yellow');
    log(`    ${issue.message}`, 'white');
  });
}

// 4. VERIFICAR TYPESCRIPT
section('🔧 VERIFICANDO TYPESCRIPT');

try {
  execSync('npm run type-check', { stdio: 'pipe' });
  log('✅ TypeScript check passou', 'green');
} catch (error) {
  log('❌ Erros de TypeScript encontrados:', 'red');
  console.log(error.stdout.toString());
}

// 5. VERIFICAR ESLINT
section('🔧 VERIFICANDO ESLINT');

try {
  execSync('npm run lint', { stdio: 'pipe' });
  log('✅ ESLint check passou', 'green');
} catch (error) {
  log('❌ Erros de ESLint encontrados:', 'red');
  console.log(error.stdout.toString());
}

// 6. VERIFICAR BUILD
section('🏗️ TESTANDO BUILD');

try {
  execSync('npm run build', { stdio: 'pipe' });
  log('✅ Build completado com sucesso', 'green');
} catch (error) {
  log('❌ Erros no build:', 'red');
  console.log(error.stdout.toString());
}

// 7. ANÁLISE DE BUNDLE
section('📊 ANÁLISE DE BUNDLE');

if (fs.existsSync('.next')) {
  log('✅ Pasta .next encontrada', 'green');
  
  // Verificar tamanhos de arquivos
  const buildManifest = path.join('.next', 'build-manifest.json');
  if (fs.existsSync(buildManifest)) {
    const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
    log(`✅ Build manifest gerado`, 'green');
  }
} else {
  log('❌ Pasta .next não encontrada - Build não foi executado', 'red');
}

// 8. VERIFICAR PÁGINAS CRÍTICAS
section('🌐 VERIFICANDO PÁGINAS CRÍTICAS');

const criticalPages = [
  'pages/index.tsx',
  'pages/_app.tsx',
  'pages/login.tsx',
  'pages/dashboard-simple.tsx'
];

criticalPages.forEach(page => {
  if (fs.existsSync(page)) {
    const content = fs.readFileSync(page, 'utf8');
    if (content.trim().length > 0) {
      log(`✅ ${page}`, 'green');
    } else {
      log(`❌ ${page} - VAZIO`, 'red');
    }
  } else {
    log(`⚠️ ${page} - NÃO ENCONTRADO`, 'yellow');
  }
});

// 9. VERIFICAR APIs
section('🔌 VERIFICANDO APIS');

function scanApiDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      scanApiDirectory(fullPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        if (content.includes('export default')) {
          log(`✅ ${fullPath}`, 'green');
        } else {
          log(`❌ ${fullPath} - SEM EXPORT DEFAULT`, 'red');
        }
        
      } catch (error) {
        log(`❌ ${fullPath} - ERRO AO LER`, 'red');
      }
    }
  });
}

scanApiDirectory('./pages/api');

// 10. RELATÓRIO FINAL
section('📋 RELATÓRIO FINAL');

const totalIssues = issues.length;

if (totalIssues === 0) {
  log('🎉 PROJETO PRONTO PARA DEPLOY!', 'green');
} else {
  log(`⚠️ ${totalIssues} problemas precisam ser corrigidos antes do deploy`, 'yellow');
  
  // Agrupar por tipo
  const issuesByType = {};
  issues.forEach(issue => {
    if (!issuesByType[issue.type]) {
      issuesByType[issue.type] = [];
    }
    issuesByType[issue.type].push(issue);
  });
  
  Object.keys(issuesByType).forEach(type => {
    log(`\n${type}: ${issuesByType[type].length} arquivos`, 'magenta');
    issuesByType[type].forEach(issue => {
      log(`  - ${issue.file}`, 'white');
    });
  });
}

console.log('\n' + '='.repeat(60));
log('DIAGNÓSTICO CONCLUÍDO', 'cyan');
console.log('='.repeat(60));
