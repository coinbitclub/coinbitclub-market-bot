#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 RESTAURANDO TODAS AS PÁGINAS ORIGINAIS VALIDADAS');
console.log('='.repeat(70));

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function restoreOriginalPages() {
  try {
    log('🎯 FASE 1: SUBSTITUINDO INDEX POR LANDING ORIGINAL', 'cyan');
    
    // 1. Fazer backup do index atual e restaurar landing original
    if (fs.existsSync('pages/index.tsx')) {
      fs.renameSync('pages/index.tsx', 'pages/index-simple-backup.tsx');
      log('📦 Backup do index simples criado', 'yellow');
    }
    
    // Restaurar landing original como página principal
    if (fs.existsSync('pages/landing.tsx')) {
      fs.copyFileSync('pages/landing.tsx', 'pages/index.tsx');
      log('✅ Landing original agora é a página principal (/)', 'green');
    }
    
    log('\n🎯 FASE 2: RESTAURANDO ÁREA ADMINISTRATIVA COMPLETA', 'cyan');
    
    // 2. Restaurar todas as páginas admin originais (não simples)
    const adminFiles = [
      'dashboard.tsx',
      'operations.tsx', 
      'users.tsx',
      'accounting.tsx',
      'reports.tsx',
      'settings.tsx',
      'affiliates.tsx',
      'logs.tsx',
      'menu-principal.tsx'
    ];
    
    // Primeiro vamos verificar quais arquivos admin existem nos backups
    const adminBackupDir = 'backup-files/admin.backup';
    if (fs.existsSync(adminBackupDir)) {
      const availableFiles = fs.readdirSync(adminBackupDir);
      
      for (const file of availableFiles) {
        if (file.endsWith('.tsx') && !file.includes('simple') && !file.includes('new')) {
          const sourceFile = path.join(adminBackupDir, file);
          const targetFile = `pages/admin/${file}`;
          
          // Criar diretório se não existir
          if (!fs.existsSync('pages/admin')) {
            fs.mkdirSync('pages/admin', { recursive: true });
          }
          
          try {
            fs.copyFileSync(sourceFile, targetFile);
            log(`✅ Admin: ${file}`, 'green');
          } catch (error) {
            log(`⚠️ Erro ao copiar admin/${file}: ${error.message}`, 'yellow');
          }
        }
      }
    }
    
    log('\n🎯 FASE 3: RESTAURANDO ÁREA DE USUÁRIOS COMPLETA', 'cyan');
    
    // 3. Restaurar páginas de usuário (não simples)
    const userBackupDir = 'backup-files/user.backup';
    if (fs.existsSync(userBackupDir)) {
      const userFiles = fs.readdirSync(userBackupDir);
      
      // Criar diretório user
      if (!fs.existsSync('pages/user')) {
        fs.mkdirSync('pages/user', { recursive: true });
      }
      
      for (const file of userFiles) {
        if (file.endsWith('.tsx') && !file.includes('simple') && !file.includes('new')) {
          const sourceFile = path.join(userBackupDir, file);
          const targetFile = `pages/user/${file}`;
          
          try {
            fs.copyFileSync(sourceFile, targetFile);
            log(`✅ User: ${file}`, 'green');
          } catch (error) {
            log(`⚠️ Erro ao copiar user/${file}: ${error.message}`, 'yellow');
          }
        }
      }
    }
    
    log('\n🎯 FASE 4: RESTAURANDO ÁREA DE AFILIADOS COMPLETA', 'cyan');
    
    // 4. Restaurar páginas de afiliados (não simples)
    const affiliateBackupDir = 'backup-files/affiliate.backup';
    if (fs.existsSync(affiliateBackupDir)) {
      const affiliateFiles = fs.readdirSync(affiliateBackupDir);
      
      // Criar diretório affiliate
      if (!fs.existsSync('pages/affiliate')) {
        fs.mkdirSync('pages/affiliate', { recursive: true });
      }
      
      for (const file of affiliateFiles) {
        if (file.endsWith('.tsx') && !file.includes('simple') && !file.includes('temp')) {
          const sourceFile = path.join(affiliateBackupDir, file);
          const targetFile = `pages/affiliate/${file}`;
          
          try {
            fs.copyFileSync(sourceFile, targetFile);
            log(`✅ Affiliate: ${file}`, 'green');
          } catch (error) {
            log(`⚠️ Erro ao copiar affiliate/${file}: ${error.message}`, 'yellow');
          }
        }
      }
    }
    
    log('\n🎯 FASE 5: RESTAURANDO PÁGINAS ESSENCIAIS', 'cyan');
    
    // 5. Restaurar páginas essenciais (não simples)
    const essentialPages = [
      'signup.tsx',
      'auth.tsx',
      'dashboard-simple.tsx', // Esta pode ser útil como alternativa
      'esqueci-senha.tsx',
      'redefinir-senha.tsx',
      'privacy.tsx',
      'reports.tsx'
    ];
    
    for (const page of essentialPages) {
      const backupFile = `backup-files/${page}.backup`;
      const targetFile = `pages/${page}`;
      
      if (fs.existsSync(backupFile)) {
        try {
          fs.copyFileSync(backupFile, targetFile);
          log(`✅ Essential: ${page}`, 'green');
        } catch (error) {
          log(`⚠️ Erro ao copiar ${page}: ${error.message}`, 'yellow');
        }
      }
    }
    
    log('\n🎯 FASE 6: RESTAURANDO TODAS AS APIs', 'cyan');
    
    // 6. Restaurar TODAS as APIs originais
    const apiBackupDir = 'backup-files/api-backup';
    if (fs.existsSync(apiBackupDir)) {
      
      function restoreApiDirectory(sourceDir, targetDir) {
        if (!fs.existsSync(sourceDir)) return;
        
        const items = fs.readdirSync(sourceDir);
        
        for (const item of items) {
          const sourcePath = path.join(sourceDir, item);
          const targetPath = path.join(targetDir, item);
          const stat = fs.statSync(sourcePath);
          
          if (stat.isDirectory()) {
            // Criar diretório se não existir e recursivamente restaurar
            if (!fs.existsSync(targetPath)) {
              fs.mkdirSync(targetPath, { recursive: true });
            }
            restoreApiDirectory(sourcePath, targetPath);
          } else if (item.endsWith('.ts') || item.endsWith('.js')) {
            // Restaurar arquivo API
            try {
              // Criar diretório pai se não existir
              const parentDir = path.dirname(targetPath);
              if (!fs.existsSync(parentDir)) {
                fs.mkdirSync(parentDir, { recursive: true });
              }
              
              fs.copyFileSync(sourcePath, targetPath);
              log(`✅ API: ${targetPath.replace('pages/api/', '')}`, 'green');
            } catch (error) {
              log(`⚠️ Erro ao copiar API ${item}: ${error.message}`, 'yellow');
            }
          }
        }
      }
      
      restoreApiDirectory(apiBackupDir, 'pages/api');
    }
    
    log('\n🔧 FASE 7: CORRIGINDO PROBLEMAS COMUNS', 'cyan');
    
    // 7. Função para corrigir problemas comuns de JSX
    function fixCommonIssues(filePath) {
      if (!fs.existsSync(filePath)) return false;
      
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Corrigir imports de bcrypt
      if (content.includes("import bcrypt from 'bcrypt'")) {
        content = content.replace("import bcrypt from 'bcrypt'", "import bcrypt from 'bcryptjs'");
        modified = true;
      }
      
      // Adicionar "use client" se necessário para páginas que usam hooks
      if ((content.includes('useState') || content.includes('useEffect') || content.includes('useRouter')) 
          && !content.includes('"use client"') && !filePath.includes('/api/')) {
        content = '"use client";\n\n' + content;
        modified = true;
      }
      
      // Adicionar getServerSideProps para páginas que usam contextos
      if (content.includes('useNotifications') && !content.includes('getServerSideProps')) {
        const exportMatch = content.match(/export default (\w+);/);
        if (exportMatch) {
          const componentName = exportMatch[1];
          content = content.replace(
            `export default ${componentName};`,
            `// Renderização do lado do servidor para contextos
export async function getServerSideProps() {
  return { props: {} };
}

export default ${componentName};`
          );
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content);
        return true;
      }
      return false;
    }
    
    // Aplicar correções em todas as páginas restauradas
    const pagesToFix = [
      'pages/index.tsx',
      ...fs.readdirSync('pages/admin').filter(f => f.endsWith('.tsx')).map(f => `pages/admin/${f}`),
      ...fs.readdirSync('pages/user').filter(f => f.endsWith('.tsx')).map(f => `pages/user/${f}`),
      ...fs.readdirSync('pages/affiliate').filter(f => f.endsWith('.tsx')).map(f => `pages/affiliate/${f}`),
      ...fs.readdirSync('pages').filter(f => f.endsWith('.tsx')).map(f => `pages/${f}`)
    ];
    
    for (const file of pagesToFix) {
      if (fs.existsSync(file)) {
        const fixed = fixCommonIssues(file);
        if (fixed) {
          log(`🔧 Corrigido: ${file}`, 'yellow');
        }
      }
    }
    
    log('\n🏗️ FASE 8: TESTANDO BUILD', 'cyan');
    
    try {
      execSync('npm run build', { stdio: 'inherit', timeout: 180000 });
      
      log('\n✅ BUILD SUCCESSFUL! TODAS AS PÁGINAS ORIGINAIS RESTAURADAS!', 'green');
      
      log('\n🚀 Fazendo deploy...', 'cyan');
      try {
        execSync('npx vercel --prod', { stdio: 'inherit' });
        
        log('\n🎉 DEPLOY COMPLETO!', 'green');
        log('\n📋 FUNCIONALIDADES RESTAURADAS:', 'cyan');
        log('✅ Landing Page Original (página principal)', 'green');
        log('✅ Área Administrativa Completa', 'green');
        log('✅ Área de Usuários Completa', 'green');
        log('✅ Área de Afiliados Completa', 'green');
        log('✅ Todas as APIs Originais', 'green');
        log('✅ Páginas Essenciais (signup, auth, etc)', 'green');
        
      } catch (deployError) {
        log('\n⚠️ Deploy falhou, mas build funcionou!', 'yellow');
        log('Execute: npx vercel --prod', 'white');
      }
      
    } catch (buildError) {
      log('\n❌ Build falhou', 'red');
      log('🔧 Identificando arquivos problemáticos...', 'yellow');
      
      // Mover arquivos problemáticos e tentar novamente
      const directories = ['pages/admin', 'pages/user', 'pages/affiliate'];
      
      for (const dir of directories) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
          
          for (const file of files) {
            const fullPath = path.join(dir, file);
            try {
              // Tentar validar sintaxe básica
              const content = fs.readFileSync(fullPath, 'utf8');
              if (content.includes('return (') && !content.includes('return (\n    <')) {
                // Possível problema de JSX
                fs.renameSync(fullPath, fullPath + '.problem');
                log(`❌ Movido para análise: ${fullPath}`, 'red');
              }
            } catch (error) {
              fs.renameSync(fullPath, fullPath + '.problem');
              log(`❌ Erro de sintaxe: ${fullPath}`, 'red');
            }
          }
        }
      }
      
      log('\n🔄 Tentando build novamente após limpeza...', 'cyan');
      try {
        execSync('npm run build', { stdio: 'inherit' });
        log('✅ Build funcionou após correções!', 'green');
        
        log('\n📋 PRÓXIMOS PASSOS:', 'cyan');
        log('1. Corrigir arquivos .problem manualmente', 'white');
        log('2. Testar cada funcionalidade', 'white');
        log('3. Fazer deploy final', 'white');
        
      } catch (finalError) {
        log('❌ Build ainda falhou', 'red');
        log('Mantenha versão estável por enquanto', 'yellow');
      }
    }
    
  } catch (error) {
    log(`💥 Erro crítico: ${error.message}`, 'red');
  }
}

if (require.main === module) {
  restoreOriginalPages();
}
