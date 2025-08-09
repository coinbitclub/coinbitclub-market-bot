#!/usr/bin/env node

const { execSync } = require('child_process');'
const fs = require('fs');'
const path = require('path');'

console.log('🧪 SISTEMA DE TESTES COMPLETO - COINBITCLUB');'
console.log('='.repeat(60));'

const colors = {
  red: '\x1b[31m','
  green: '\x1b[32m','
  yellow: '\x1b[33m','
  blue: '\x1b[34m','
  cyan: '\x1b[36m','
  reset: '\x1b[0m''
};

function log(message, color = 'white') {'
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  async runTest(name, testFn, level = 'error') {'
    this.results.total++;
    try {
      const result = await testFn();
      if (result.success) {
        this.results.passed++;
        log(`✅ ${name}`, 'green');'
      } else {
        if (level === 'warning') {'
          this.results.warnings++;
          log(`⚠️ ${name}: ${result.message}`, 'yellow');'
        } else {
          this.results.failed++;
          log(`❌ ${name}: ${result.message}`, 'red');'
        }
      }
      this.results.details.push({ name, ...result, level });
    } catch (error) {
      this.results.failed++;
      log(`❌ ${name}: ${error.message}`, 'red');'
      this.results.details.push({ name, success: false, message: error.message, level });
    }
  }

  getReport() {
    return this.results;
  }
}

const runner = new TestRunner();

// TESTE 1: Verificar estrutura de arquivos
async function testFileStructure() {
  const requiredFiles = [
    'package.json','
    'next.config.js','
    'tsconfig.json','
    'tailwind.config.js','
    'pages/_app.tsx','
    'pages/index.tsx''
  ];

  const missing = requiredFiles.filter(file => !fs.existsSync(file));
  
  return {
    success: missing.length === 0,
    message: missing.length > 0 ? `Arquivos faltando: ${missing.join(', ')}` : 'Estrutura completa''
  };
}

// TESTE 2: Verificar dependências críticas
async function testDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));'
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const critical = ['next', 'react', 'react-dom', 'typescript', '@types/react'];'
    const missing = critical.filter(dep => !deps[dep]);
    
    return {
      success: missing.length === 0,
      message: missing.length > 0 ? `Dependências faltando: ${missing.join(', ')}` : 'Dependências OK''
    };
  } catch (error) {
    return { success: false, message: 'Erro ao ler package.json' };'
  }
}

// TESTE 3: Verificar TypeScript
async function testTypeScript() {
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe', timeout: 30000 });'
    return { success: true, message: 'TypeScript OK' };'
  } catch (error) {
    const output = error.stdout ? error.stdout.toString() : error.message;
    const errorCount = (output.match(/error TS/g) || []).length;
    return { 
      success: false, 
      message: `${errorCount} erros de TypeScript encontrados`
    };
  }
}

// TESTE 4: Verificar ESLint
async function testESLint() {
  try {
    execSync('npx eslint . --ext .ts,.tsx --max-warnings 10', { stdio: 'pipe' });'
    return { success: true, message: 'ESLint OK' };'
  } catch (error) {
    const output = error.stdout ? error.stdout.toString() : error.message;
    const warningCount = (output.match(/warning/g) || []).length;
    const errorCount = (output.match(/error/g) || []).length;
    return { 
      success: errorCount === 0, 
      message: `${errorCount} erros, ${warningCount} avisos do ESLint`
    };
  }
}

// TESTE 5: Verificar páginas críticas
async function testCriticalPages() {
  const criticalPages = [
    'pages/index.tsx','
    'pages/login.tsx','
    'pages/dashboard-simple.tsx','
    'pages/_app.tsx''
  ];

  const issues = [];
  
  for (const page of criticalPages) {
    if (fs.existsSync(page)) {
      const content = fs.readFileSync(page, 'utf8');'
      if (content.trim().length === 0) {
        issues.push(`${page} está vazio`);
      } else if (!content.includes('export default')) {'
        issues.push(`${page} sem export default`);
      }
    } else {
      issues.push(`${page} não encontrado`);
    }
  }
  
  return {
    success: issues.length === 0,
    message: issues.length > 0 ? issues.join(', ') : 'Páginas críticas OK''
  };
}

// TESTE 6: Verificar APIs
async function testApiRoutes() {
  const apiDir = './pages/api';'
  if (!fs.existsSync(apiDir)) {
    return { success: false, message: 'Diretório de APIs não encontrado' };'
  }

  const issues = [];
  
  function scanApis(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanApis(fullPath);
      } else if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {'
        const content = fs.readFileSync(fullPath, 'utf8');'
        if (!content.includes('export default')) {'
          issues.push(`${fullPath} sem export default`);
        }
        if (!content.includes('NextApiRequest') && !content.includes('req:')) {'
          issues.push(`${fullPath} não parece ser uma API válida`);
        }
      }
    });
  }
  
  scanApis(apiDir);
  
  return {
    success: issues.length === 0,
    message: issues.length > 0 ? `${issues.length} APIs com problemas` : 'APIs OK''
  };
}

// TESTE 7: Verificar componentes
async function testComponents() {
  const componentsDir = './src/components';'
  if (!fs.existsSync(componentsDir)) {
    return { success: true, message: 'Diretório de componentes não encontrado (OK)' };'
  }

  const issues = [];
  
  function scanComponents(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanComponents(fullPath);
      } else if (file.name.endsWith('.tsx')) {'
        const content = fs.readFileSync(fullPath, 'utf8');'
        
        if (content.includes('<') && !content.includes('import React')) {'
          issues.push(`${fullPath} componente React sem import`);
        }
        
        if (!content.includes('export default') && !content.includes('export {')) {'
          issues.push(`${fullPath} sem export`);
        }
      }
    });
  }
  
  scanComponents(componentsDir);
  
  return {
    success: issues.length === 0,
    message: issues.length > 0 ? `${issues.length} componentes com problemas` : 'Componentes OK''
  };
}

// TESTE 8: Verificar build
async function testBuild() {
  try {
    // Limpar build anterior
    if (fs.existsSync('.next')) {'
      execSync('rm -rf .next', { stdio: 'pipe' });'
    }
    
    execSync('npm run build', { stdio: 'pipe', timeout: 120000 });'
    
    // Verificar se o build foi criado
    if (fs.existsSync('.next/build-manifest.json')) {'
      return { success: true, message: 'Build completado com sucesso' };'
    } else {
      return { success: false, message: 'Build não gerou arquivos esperados' };'
    }
  } catch (error) {
    const output = error.stdout ? error.stdout.toString() : error.message;
    const hasError = output.includes('Error:') || output.includes('Failed to compile');'
    return { 
      success: false, 
      message: hasError ? 'Erros no build' : 'Timeout ou erro no build''
    };
  }
}

// TESTE 9: Verificar imports e exports
async function testImportsExports() {
  const issues = [];
  
  function scanFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanFiles(fullPath);
      } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {'
        const content = fs.readFileSync(fullPath, 'utf8');'
        
        // Verificar imports relativos quebrados
        const importLines = content.match(/import .* from ['"].*/g) || [];"
        importLines.forEach(line => {
          if (line.includes('./') || line.includes('../')) {'
            const match = line.match(/from ['"](.*)['"];?/);"
            if (match) {
              const importPath = match[1];
              const resolvedPath = path.resolve(path.dirname(fullPath), importPath);
              
              // Verificar se existe .ts, .tsx, .js, .jsx ou index.*
              const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];'
              const exists = extensions.some(ext => fs.existsSync(resolvedPath + ext));
              
              if (!exists && !fs.existsSync(resolvedPath)) {
                issues.push(`${fullPath}: import quebrado - ${importPath}`);
              }
            }
          }
        });
      }
    });
  }
  
  scanFiles('./pages');'
  scanFiles('./src');'
  
  return {
    success: issues.length === 0,
    message: issues.length > 0 ? `${issues.length} imports quebrados` : 'Imports OK''
  };
}

// TESTE 10: Verificar configurações
async function testConfigurations() {
  const issues = [];
  
  // Verificar next.config.js
  try {
    const nextConfig = require('./next.config.js');'
    if (typeof nextConfig !== 'object') {'
      issues.push('next.config.js inválido');'
    }
  } catch (error) {
    issues.push('next.config.js com erro');'
  }
  
  // Verificar tsconfig.json
  try {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));'
    if (!tsConfig.compilerOptions) {
      issues.push('tsconfig.json sem compilerOptions');'
    }
  } catch (error) {
    issues.push('tsconfig.json inválido');'
  }
  
  // Verificar tailwind.config.js
  try {
    const tailwindConfig = require('./tailwind.config.js');'
    if (!tailwindConfig.content) {
      issues.push('tailwind.config.js sem content');'
    }
  } catch (error) {
    issues.push('tailwind.config.js com erro');'
  }
  
  return {
    success: issues.length === 0,
    message: issues.length > 0 ? issues.join(', ') : 'Configurações OK''
  };
}

// EXECUTAR TODOS OS TESTES
async function runAllTests() {
  log('🧪 Iniciando bateria completa de testes...', 'cyan');'
  
  await runner.runTest('Estrutura de Arquivos', testFileStructure);'
  await runner.runTest('Dependências Críticas', testDependencies);'
  await runner.runTest('Configurações', testConfigurations);'
  await runner.runTest('Páginas Críticas', testCriticalPages);'
  await runner.runTest('Componentes', testComponents);'
  await runner.runTest('APIs', testApiRoutes);'
  await runner.runTest('Imports/Exports', testImportsExports);'
  await runner.runTest('TypeScript', testTypeScript);'
  await runner.runTest('ESLint', testESLint, 'warning');'
  await runner.runTest('Build', testBuild);'
  
  const report = runner.getReport();
  
  console.log('\n' + '='.repeat(60));'
  log('📊 RELATÓRIO FINAL DOS TESTES', 'cyan');'
  console.log('='.repeat(60));'
  
  log(`Total: ${report.total}`, 'blue');'
  log(`✅ Passou: ${report.passed}`, 'green');'
  log(`❌ Falhou: ${report.failed}`, 'red');'
  log(`⚠️ Avisos: ${report.warnings}`, 'yellow');'
  
  const score = Math.round((report.passed / report.total) * 100);
  log(`\n📈 Score: ${score}%`, score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red');'
  
  if (score >= 90) {
    log('🎉 PROJETO PRONTO PARA DEPLOY!', 'green');'
  } else if (score >= 70) {
    log('⚠️ Projeto quase pronto, algumas correções necessárias', 'yellow');'
  } else {
    log('❌ Projeto precisa de correções significativas', 'red');'
  }
  
  // Mostrar detalhes dos erros
  const failures = report.details.filter(d => !d.success && d.level === 'error');'
  if (failures.length > 0) {
    log('\n🔍 ERROS QUE PRECISAM SER CORRIGIDOS:', 'red');'
    failures.forEach(f => {
      log(`  - ${f.name}: ${f.message}`, 'white');'
    });
  }
  
  return report;
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().then(report => {
    process.exit(report.failed > 0 ? 1 : 0);
  });
}

module.exports = { runAllTests, TestRunner };
