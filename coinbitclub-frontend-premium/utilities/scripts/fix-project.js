#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 SCRIPT DE CORREÇÃO AUTOMÁTICA - COINBITCLUB');
console.log('='.repeat(60));

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 1. CORRIGIR ARQUIVOS VAZIOS
function fixEmptyFiles() {
  log('\n🔧 Corrigindo arquivos vazios...', 'cyan');
  
  const emptyPageTemplate = `import React from 'react';
import { NextPage } from 'next';

const Page: NextPage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Página em Desenvolvimento</h1>
        <p className="text-gray-400">Esta página está sendo desenvolvida.</p>
      </div>
    </div>
  );
};

export default Page;
`;

  const emptyApiTemplate = `import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'API em desenvolvimento' });
}
`;

  function scanAndFix(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanAndFix(fullPath);
      } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          if (content.trim().length === 0) {
            const isApi = fullPath.includes('/api/');
            const template = isApi ? emptyApiTemplate : emptyPageTemplate;
            
            fs.writeFileSync(fullPath, template);
            log(`✅ Corrigido: ${fullPath}`, 'green');
          }
          
        } catch (error) {
          log(`❌ Erro ao corrigir ${fullPath}: ${error.message}`, 'red');
        }
      }
    });
  }
  
  scanAndFix('./pages');
  scanAndFix('./src');
}

// 2. CORRIGIR IMPORTS REACT FALTANTES
function fixMissingReactImports() {
  log('\n🔧 Corrigindo imports React faltantes...', 'cyan');
  
  function scanAndFixImports(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanAndFixImports(fullPath);
      } else if (file.name.endsWith('.tsx')) {
        try {
          let content = fs.readFileSync(fullPath, 'utf8');
          
          // Se tem JSX mas não tem import React
          if (content.includes('<') && !content.includes('import React')) {
            content = `import React from 'react';\n${content}`;
            fs.writeFileSync(fullPath, content);
            log(`✅ Adicionado import React: ${fullPath}`, 'green');
          }
          
        } catch (error) {
          log(`❌ Erro ao corrigir imports ${fullPath}: ${error.message}`, 'red');
        }
      }
    });
  }
  
  scanAndFixImports('./pages');
  scanAndFixImports('./src');
}

// 3. CORRIGIR COMPONENTES SEM EXPORT
function fixMissingExports() {
  log('\n🔧 Corrigindo exports faltantes...', 'cyan');
  
  function scanAndFixExports(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanAndFixExports(fullPath);
      } else if (file.name.endsWith('.tsx') && !fullPath.includes('/_')) {
        try {
          let content = fs.readFileSync(fullPath, 'utf8');
          
          // Se não tem export default
          if (!content.includes('export default') && !content.includes('export {')) {
            // Tentar identificar o nome do componente
            const fileName = path.basename(file.name, '.tsx');
            const componentName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
            
            content += `\n\nexport default ${componentName};`;
            fs.writeFileSync(fullPath, content);
            log(`✅ Adicionado export default: ${fullPath}`, 'green');
          }
          
        } catch (error) {
          log(`❌ Erro ao corrigir exports ${fullPath}: ${error.message}`, 'red');
        }
      }
    });
  }
  
  scanAndFixExports('./pages');
  scanAndFixExports('./src/components');
}

// 4. CORRIGIR PROBLEMAS DE JSX
function fixJSXIssues() {
  log('\n🔧 Corrigindo problemas de JSX...', 'cyan');
  
  function scanAndFixJSX(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanAndFixJSX(fullPath);
      } else if (file.name.endsWith('.tsx')) {
        try {
          let content = fs.readFileSync(fullPath, 'utf8');
          let modified = false;
          
          // Corrigir tags não fechadas comuns
          const fixPatterns = [
            { from: /<br>/g, to: '<br />' },
            { from: /<hr>/g, to: '<hr />' },
            { from: /<img([^>]*)>/g, to: '<img$1 />' },
            { from: /<input([^>]*)>/g, to: '<input$1 />' },
          ];
          
          fixPatterns.forEach(pattern => {
            if (pattern.from.test(content)) {
              content = content.replace(pattern.from, pattern.to);
              modified = true;
            }
          });
          
          if (modified) {
            fs.writeFileSync(fullPath, content);
            log(`✅ Corrigido JSX: ${fullPath}`, 'green');
          }
          
        } catch (error) {
          log(`❌ Erro ao corrigir JSX ${fullPath}: ${error.message}`, 'red');
        }
      }
    });
  }
  
  scanAndFixJSX('./pages');
  scanAndFixJSX('./src');
}

// 5. REMOVER ARQUIVOS DUPLICADOS/PROBLEMATICOS
function removeProblematicFiles() {
  log('\n🔧 Removendo arquivos problemáticos...', 'cyan');
  
  const problematicFiles = [
    // Arquivos que podem estar causando conflitos
    './pages/test-*.tsx',
    './pages/debug-*.tsx',
    './pages/*-temp.tsx',
    './pages/*-old.tsx',
  ];
  
  const { glob } = require('glob');
  
  problematicFiles.forEach(pattern => {
    try {
      const files = glob.sync(pattern);
      files.forEach(file => {
        if (fs.existsSync(file)) {
          // Fazer backup antes de remover
          const backupFile = file + '.backup';
          fs.renameSync(file, backupFile);
          log(`✅ Movido para backup: ${file}`, 'yellow');
        }
      });
    } catch (error) {
      log(`❌ Erro ao processar pattern ${pattern}: ${error.message}`, 'red');
    }
  });
}

// 6. CRIAR ARQUIVOS CRÍTICOS FALTANTES
function createMissingCriticalFiles() {
  log('\n🔧 Criando arquivos críticos faltantes...', 'cyan');
  
  // _app.tsx
  if (!fs.existsSync('./pages/_app.tsx')) {
    const appContent = `import React from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
`;
    fs.writeFileSync('./pages/_app.tsx', appContent);
    log('✅ Criado: pages/_app.tsx', 'green');
  }
  
  // _document.tsx
  if (!fs.existsSync('./pages/_document.tsx')) {
    const documentContent = `import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
`;
    fs.writeFileSync('./pages/_document.tsx', documentContent);
    log('✅ Criado: pages/_document.tsx', 'green');
  }
  
  // 404.tsx
  if (!fs.existsSync('./pages/404.tsx')) {
    const notFoundContent = `import React from 'react';
import { NextPage } from 'next';

const NotFound: NextPage = () => {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">Página não encontrada</p>
        <a href="/" className="bg-yellow-500 text-black px-6 py-3 rounded-lg hover:bg-yellow-400">
          Voltar ao Início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
`;
    fs.writeFileSync('./pages/404.tsx', notFoundContent);
    log('✅ Criado: pages/404.tsx', 'green');
  }
}

// EXECUTAR TODAS AS CORREÇÕES
function runAllFixes() {
  log('🚀 Iniciando correções automáticas...', 'cyan');
  
  try {
    fixEmptyFiles();
    fixMissingReactImports();
    fixMissingExports();
    fixJSXIssues();
    removeProblematicFiles();
    createMissingCriticalFiles();
    
    log('\n✅ Todas as correções foram aplicadas!', 'green');
    log('📋 Execute o diagnóstico novamente para verificar:', 'yellow');
    log('   node scripts/diagnose-project.js', 'yellow');
    
  } catch (error) {
    log(`❌ Erro durante as correções: ${error.message}`, 'red');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllFixes();
}

module.exports = {
  fixEmptyFiles,
  fixMissingReactImports,
  fixMissingExports,
  fixJSXIssues,
  removeProblematicFiles,
  createMissingCriticalFiles,
  runAllFixes
};
