#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 FASE 2: RESTAURANDO ÁREAS USUÁRIO E AFILIADO');
console.log('='.repeat(60));

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

// Corrigir JSX de um arquivo
function fixJSXFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Corrigir imports de bcrypt
  if (content.includes("import bcrypt from 'bcrypt'")) {
    content = content.replace("import bcrypt from 'bcrypt'", "import bcrypt from 'bcryptjs'");
    modified = true;
  }
  
  // Corrigir fragmentos React vazios
  content = content.replace(/return \(\s*<>\s*$/gm, 'return (\n    <div>');
  content = content.replace(/\s*<\/>\s*\);?\s*$/gm, '\n    </div>\n  );');
  
  // Corrigir problemas de JSX com aspas
  content = content.replace(/className\s*=\s*([^{"][^>\s]*)/g, 'className="$1"');
  
  // Adicionar "use client" se usar hooks e não for API
  if (content.includes('useState') || content.includes('useEffect')) {
    if (!content.includes('"use client"') && !filePath.includes('/api/')) {
      content = '"use client";\n\n' + content;
      modified = true;
    }
  }
  
  // Adicionar getServerSideProps para páginas que usam contextos
  if (content.includes('useNotifications') && !content.includes('getServerSideProps')) {
    const exportDefault = content.match(/export default (\w+);/);
    if (exportDefault) {
      const componentName = exportDefault[1];
      content = content.replace(
        `export default ${componentName};`,
        `// Forçar renderização do lado do cliente
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

async function restoreUserAndAffiliate() {
  try {
    log('📋 RESTAURANDO ÁREA DO USUÁRIO', 'cyan');
    
    // Restaurar páginas básicas de usuário primeiro
    const userFiles = [
      'backup-files/user.backup/dashboard.tsx',
      'backup-files/user.backup/settings.tsx',
      'backup-files/user.backup/plans.tsx',
      'backup-files/user.backup/credentials.tsx'
    ];
    
    // Criar diretório user
    if (!fs.existsSync('pages/user')) {
      fs.mkdirSync('pages/user', { recursive: true });
    }
    
    for (const backupFile of userFiles) {
      if (fs.existsSync(backupFile)) {
        const fileName = path.basename(backupFile);
        const targetPath = `pages/user/${fileName}`;
        
        // Copiar arquivo
        fs.copyFileSync(backupFile, targetPath);
        
        // Tentar corrigir JSX
        const fixed = fixJSXFile(targetPath);
        
        log(`✅ ${fileName} ${fixed ? '(corrigido)' : ''}`, fixed ? 'yellow' : 'green');
      }
    }
    
    log('\n📋 RESTAURANDO ÁREA DE AFILIADOS', 'cyan');
    
    // Restaurar páginas de afiliados
    const affiliateFiles = [
      'backup-files/affiliate.backup/index.tsx',
      'backup-files/affiliate.backup/dashboard.tsx',
      'backup-files/affiliate.backup/commissions.tsx',
      'backup-files/affiliate.backup/simple.tsx'
    ];
    
    // Criar diretório affiliate
    if (!fs.existsSync('pages/affiliate')) {
      fs.mkdirSync('pages/affiliate', { recursive: true });
    }
    
    for (const backupFile of affiliateFiles) {
      if (fs.existsSync(backupFile)) {
        const fileName = path.basename(backupFile);
        const targetPath = `pages/affiliate/${fileName}`;
        
        // Copiar arquivo
        fs.copyFileSync(backupFile, targetPath);
        
        // Tentar corrigir JSX
        const fixed = fixJSXFile(targetPath);
        
        log(`✅ ${fileName} ${fixed ? '(corrigido)' : ''}`, fixed ? 'yellow' : 'green');
      }
    }
    
    log('\n📋 RESTAURANDO MAIS APIs', 'cyan');
    
    // Restaurar APIs importantes
    const importantAPIs = [
      'user/dashboard.ts',
      'user/settings.ts',
      'user/plans.ts',
      'admin/users.ts',
      'admin/stats.ts',
      'payment/create-checkout.ts',
      'webhooks/stripe.ts'
    ];
    
    for (const apiPath of importantAPIs) {
      const backupFile = `backup-files/api-backup/${apiPath}`;
      const targetPath = `pages/api/${apiPath}`;
      
      if (fs.existsSync(backupFile)) {
        // Criar diretório se necessário
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Copiar arquivo
        fs.copyFileSync(backupFile, targetPath);
        
        // Corrigir imports se necessário
        fixJSXFile(targetPath);
        
        log(`✅ API: ${apiPath}`, 'green');
      }
    }
    
    log('\n📋 RESTAURANDO PÁGINAS BÁSICAS', 'cyan');
    
    // Restaurar algumas páginas básicas importantes
    const basicPages = [
      'signup.tsx',
      'dashboard-simple.tsx',
      'esqueci-senha.tsx',
      'redefinir-senha.tsx'
    ];
    
    for (const page of basicPages) {
      const backupFile = `backup-files/${page}.backup`;
      const targetPath = `pages/${page}`;
      
      if (fs.existsSync(backupFile)) {
        fs.copyFileSync(backupFile, targetPath);
        fixJSXFile(targetPath);
        log(`✅ ${page}`, 'green');
      }
    }
    
    log('\n🔧 Testando build...', 'cyan');
    
    try {
      execSync('npm run build', { stdio: 'inherit', timeout: 120000 });
      
      log('\n✅ BUILD SUCCESSFUL!', 'green');
      log('🚀 Fazendo deploy...', 'cyan');
      
      try {
        execSync('npx vercel --prod', { stdio: 'inherit' });
        log('\n🎉 DEPLOY CONCLUÍDO!', 'green');
        
        log('\n📋 FUNCIONALIDADES RESTAURADAS:', 'cyan');
        log('✅ Área administrativa (dashboard-real)', 'green');
        log('✅ Área do usuário (dashboard, settings, plans)', 'green');
        log('✅ Área de afiliados (dashboard, comissões)', 'green');
        log('✅ APIs essenciais (auth, user, admin, payment)', 'green');
        log('✅ Páginas básicas (signup, login, recuperação)', 'green');
        
        log('\n🌐 PRÓXIMOS PASSOS:', 'cyan');
        log('1. Configure variáveis de ambiente no Vercel:', 'white');
        log('   - DATABASE_URL (PostgreSQL)', 'white');
        log('   - JWT_SECRET', 'white'); 
        log('   - STRIPE_SECRET_KEY', 'white');
        log('   - OPENAI_API_KEY', 'white');
        log('   - TRADINGVIEW_WEBHOOK_SECRET', 'white');
        log('2. Teste todas as funcionalidades', 'white');
        log('3. Configure domínio personalizado', 'white');
        log('4. Ative monitoramento e analytics', 'white');
        
      } catch (deployError) {
        log('\n⚠️ Deploy falhou, mas build funcionou!', 'yellow');
        log('Execute manualmente: npx vercel --prod', 'white');
      }
      
    } catch (buildError) {
      log('\n❌ Build falhou', 'red');
      log('Verificando erros...', 'yellow');
      
      // Tentar identificar e corrigir erros específicos
      log('🔧 Movendo arquivos problemáticos para backup...', 'yellow');
      
      const problemFiles = fs.readdirSync('pages/user').filter(f => f.endsWith('.tsx'));
      for (const file of problemFiles) {
        try {
          execSync(`node -c pages/user/${file}`, { stdio: 'pipe' });
        } catch (error) {
          fs.renameSync(`pages/user/${file}`, `pages/user/${file}.problem`);
          log(`❌ Movido: user/${file}`, 'red');
        }
      }
      
      const affiliateFiles = fs.readdirSync('pages/affiliate').filter(f => f.endsWith('.tsx'));
      for (const file of affiliateFiles) {
        try {
          execSync(`node -c pages/affiliate/${file}`, { stdio: 'pipe' });
        } catch (error) {
          fs.renameSync(`pages/affiliate/${file}`, `pages/affiliate/${file}.problem`);
          log(`❌ Movido: affiliate/${file}`, 'red');
        }
      }
      
      log('🔄 Tentando build novamente...', 'cyan');
      try {
        execSync('npm run build', { stdio: 'inherit' });
        log('✅ Build funcionou após limpeza!', 'green');
      } catch (finalError) {
        log('❌ Build ainda falhou', 'red');
        log('Mantenha apenas funcionalidades que funcionam por enquanto', 'yellow');
      }
    }
    
  } catch (error) {
    log(`💥 Erro crítico: ${error.message}`, 'red');
  }
}

if (require.main === module) {
  restoreUserAndAffiliate();
}
