// 🚀 TESTE COMPLETO DE PRODUÇÃO - VERIFICAÇÃO DE VARIÁVEIS E SISTEMA
// Validação de todas as configurações para ativação em produção

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

console.log('🔍 INICIANDO TESTE COMPLETO DE PRODUÇÃO');
console.log('=' .repeat(60));
console.log('⏰ Início:', new Date().toISOString());
console.log('');

// ===== CONFIGURAÇÕES DE TESTE =====

const testConfig = {
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
    timeout: 10000
  },
  endpoints: {
    health: ['/health', '/api/health'],
    status: ['/api/status'],
    fase3: ['/api/admin/fase3/status'],
    test_endpoints: ['/api/test/endpoints']
  },
  required_vars: [
    'DATABASE_URL',
    'NODE_ENV',
    'PORT'
  ],
  optional_vars: [
    'ADMIN_TOKEN',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'WHATSAPP_API_URL',
    'ZAPI_TOKEN'
  ]
};

// ===== VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE =====

function checkEnvironmentVariables() {
  console.log('🌍 1. VERIFICAÇÃO DAS VARIÁVEIS DE AMBIENTE');
  console.log('-'.repeat(50));
  
  const results = {
    required: { found: 0, missing: 0, details: [] },
    optional: { found: 0, missing: 0, details: [] },
    all_env_vars: {}
  };
  
  // Capturar todas as variáveis de ambiente
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('DATABASE_') || 
        key.startsWith('NODE_') || 
        key.startsWith('PORT') ||
        key.startsWith('ADMIN_') ||
        key.startsWith('JWT_') ||
        key.startsWith('STRIPE_') ||
        key.startsWith('WHATSAPP_') ||
        key.startsWith('ZAPI_') ||
        key.startsWith('RAILWAY_')) {
      results.all_env_vars[key] = process.env[key] ? '***SET***' : 'EMPTY';
    }
  });
  
  // Verificar variáveis obrigatórias
  console.log('📋 Variáveis Obrigatórias:');
  testConfig.required_vars.forEach(varName => {
    const value = process.env[varName];
    const isSet = value && value.trim().length > 0;
    
    console.log(`   ${isSet ? '✅' : '❌'} ${varName}: ${isSet ? 'SET' : 'MISSING'}`);
    
    if (isSet) {
      results.required.found++;
      results.required.details.push({ var: varName, status: 'found', value: value.substring(0, 20) + '...' });
    } else {
      results.required.missing++;
      results.required.details.push({ var: varName, status: 'missing', value: null });
    }
  });
  
  console.log('');
  console.log('🔧 Variáveis Opcionais:');
  testConfig.optional_vars.forEach(varName => {
    const value = process.env[varName];
    const isSet = value && value.trim().length > 0;
    
    console.log(`   ${isSet ? '✅' : '⚠️'} ${varName}: ${isSet ? 'SET' : 'NOT SET'}`);
    
    if (isSet) {
      results.optional.found++;
      results.optional.details.push({ var: varName, status: 'found', value: value.substring(0, 20) + '...' });
    } else {
      results.optional.missing++;
      results.optional.details.push({ var: varName, status: 'missing', value: null });
    }
  });
  
  console.log('');
  console.log('🌐 Todas as Variáveis de Ambiente do Sistema:');
  Object.keys(results.all_env_vars).sort().forEach(key => {
    console.log(`   ${key}: ${results.all_env_vars[key]}`);
  });
  
  console.log('');
  console.log(`📊 Resumo: ${results.required.found}/${testConfig.required_vars.length} obrigatórias, ${results.optional.found}/${testConfig.optional_vars.length} opcionais`);
  
  return results;
}

// ===== VERIFICAÇÃO DE ARQUIVOS DO SISTEMA =====

function checkSystemFiles() {
  console.log('\n📁 2. VERIFICAÇÃO DOS ARQUIVOS DO SISTEMA');
  console.log('-'.repeat(50));
  
  const criticalFiles = [
    'server.js',
    'monitoring.js',
    'fase3-implementacao.js',
    'fase3-rotas-avancadas.js',
    'package.json'
  ];
  
  const routeFiles = [
    'routes/whatsappRoutes.js',
    'routes/zapiWebhookRoutes.js'
  ];
  
  const results = { critical: [], routes: [], total_size: 0 };
  
  console.log('🔧 Arquivos Críticos:');
  criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`   ✅ ${file} - ${sizeKB}KB`);
      results.critical.push({ file, exists: true, size: stats.size });
      results.total_size += stats.size;
    } else {
      console.log(`   ❌ ${file} - NÃO ENCONTRADO`);
      results.critical.push({ file, exists: false, size: 0 });
    }
  });
  
  console.log('');
  console.log('🌐 Arquivos de Rotas:');
  routeFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`   ✅ ${file} - ${sizeKB}KB`);
      results.routes.push({ file, exists: true, size: stats.size });
      results.total_size += stats.size;
    } else {
      console.log(`   ⚠️ ${file} - NÃO ENCONTRADO`);
      results.routes.push({ file, exists: false, size: 0 });
    }
  });
  
  console.log('');
  console.log(`📊 Tamanho total do sistema: ${(results.total_size / 1024).toFixed(1)}KB`);
  
  return results;
}

// ===== VERIFICAÇÃO DE SINTAXE DOS ARQUIVOS =====

function checkSyntax() {
  console.log('\n✨ 3. VERIFICAÇÃO DE SINTAXE');
  console.log('-'.repeat(50));
  
  const jsFiles = [
    'server.js',
    'monitoring.js',
    'fase3-implementacao.js',
    'fase3-rotas-avancadas.js'
  ];
  
  const results = [];
  
  jsFiles.forEach(file => {
    try {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Verificações básicas de sintaxe
        const syntaxChecks = [
          { name: 'Parênteses balanceados', test: (content) => {
            const open = (content.match(/\(/g) || []).length;
            const close = (content.match(/\)/g) || []).length;
            return open === close;
          }},
          { name: 'Chaves balanceadas', test: (content) => {
            const open = (content.match(/\{/g) || []).length;
            const close = (content.match(/\}/g) || []).length;
            return open === close;
          }},
          { name: 'Colchetes balanceados', test: (content) => {
            const open = (content.match(/\[/g) || []).length;
            const close = (content.match(/\]/g) || []).length;
            return open === close;
          }},
          { name: 'Exports válidos', test: (content) => {
            return content.includes('module.exports') || content.includes('exports.');
          }}
        ];
        
        const fileResults = { file, checks: [], passed: 0, failed: 0 };
        
        syntaxChecks.forEach(check => {
          const passed = check.test(content);
          fileResults.checks.push({ name: check.name, passed });
          if (passed) fileResults.passed++;
          else fileResults.failed++;
        });
        
        console.log(`📄 ${file}:`);
        fileResults.checks.forEach(check => {
          console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}`);
        });
        
        results.push(fileResults);
      } else {
        console.log(`📄 ${file}: ❌ ARQUIVO NÃO ENCONTRADO`);
        results.push({ file, checks: [], passed: 0, failed: 1 });
      }
    } catch (error) {
      console.log(`📄 ${file}: ❌ ERRO: ${error.message}`);
      results.push({ file, checks: [], passed: 0, failed: 1, error: error.message });
    }
  });
  
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  
  console.log('');
  console.log(`📊 Verificações de sintaxe: ${totalPassed}/${totalPassed + totalFailed} passaram`);
  
  return results;
}

// ===== TESTE DE CONECTIVIDADE COM SERVIDOR =====

async function testServerConnectivity() {
  console.log('\n🌐 4. TESTE DE CONECTIVIDADE DO SERVIDOR');
  console.log('-'.repeat(50));
  
  return new Promise((resolve) => {
    const results = {
      server_running: false,
      endpoints_tested: 0,
      endpoints_working: 0,
      response_times: {},
      errors: []
    };
    
    // Primeiro verificar se algo está rodando na porta
    const testPort = () => {
      const req = http.request({
        hostname: 'localhost',
        port: testConfig.server.port,
        path: '/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        results.server_running = true;
        console.log(`✅ Servidor respondendo na porta ${testConfig.server.port}`);
        console.log(`📡 Status Code: ${res.statusCode}`);
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log(`📋 Response: ${JSON.stringify(response, null, 2)}`);
          } catch (e) {
            console.log(`📋 Response (text): ${data}`);
          }
          resolve(results);
        });
      });
      
      req.on('error', (error) => {
        results.server_running = false;
        results.errors.push(`Erro de conexão: ${error.message}`);
        console.log(`❌ Servidor não está rodando na porta ${testConfig.server.port}`);
        console.log(`🔍 Erro: ${error.message}`);
        console.log('');
        console.log('💡 Para iniciar o servidor:');
        console.log('   node server.js');
        resolve(results);
      });
      
      req.on('timeout', () => {
        results.server_running = false;
        results.errors.push('Timeout na conexão');
        console.log(`⏰ Timeout - Servidor não respondeu em 5 segundos`);
        req.destroy();
        resolve(results);
      });
      
      req.end();
    };
    
    testPort();
  });
}

// ===== VERIFICAÇÃO DE DEPENDÊNCIAS =====

function checkDependencies() {
  console.log('\n📦 5. VERIFICAÇÃO DE DEPENDÊNCIAS');
  console.log('-'.repeat(50));
  
  const results = { package_json: false, dependencies: [], dev_dependencies: [] };
  
  try {
    const packagePath = path.join(__dirname, 'package.json');
    
    if (fs.existsSync(packagePath)) {
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      results.package_json = true;
      
      console.log(`📋 Nome do projeto: ${packageContent.name || 'N/A'}`);
      console.log(`🏷️ Versão: ${packageContent.version || 'N/A'}`);
      console.log(`📝 Descrição: ${packageContent.description || 'N/A'}`);
      console.log('');
      
      if (packageContent.dependencies) {
        console.log('📦 Dependências de Produção:');
        Object.keys(packageContent.dependencies).forEach(dep => {
          console.log(`   ✅ ${dep}: ${packageContent.dependencies[dep]}`);
          results.dependencies.push({ name: dep, version: packageContent.dependencies[dep] });
        });
      }
      
      console.log('');
      
      if (packageContent.devDependencies) {
        console.log('🔧 Dependências de Desenvolvimento:');
        Object.keys(packageContent.devDependencies).forEach(dep => {
          console.log(`   🔧 ${dep}: ${packageContent.devDependencies[dep]}`);
          results.dev_dependencies.push({ name: dep, version: packageContent.devDependencies[dep] });
        });
      }
      
      console.log('');
      console.log(`📊 Total: ${results.dependencies.length} produção, ${results.dev_dependencies.length} desenvolvimento`);
      
    } else {
      console.log('❌ package.json não encontrado');
    }
    
  } catch (error) {
    console.log(`❌ Erro ao ler package.json: ${error.message}`);
    results.error = error.message;
  }
  
  return results;
}

// ===== EXECUTAR TODOS OS TESTES =====

async function runProductionTest() {
  console.log('🚀 EXECUTANDO TESTE COMPLETO DE PRODUÇÃO');
  console.log('');
  
  const results = {};
  
  // 1. Variáveis de ambiente
  results.environment = checkEnvironmentVariables();
  
  // 2. Arquivos do sistema
  results.files = checkSystemFiles();
  
  // 3. Sintaxe
  results.syntax = checkSyntax();
  
  // 4. Dependências
  results.dependencies = checkDependencies();
  
  // 5. Conectividade do servidor
  results.connectivity = await testServerConnectivity();
  
  // ===== RESUMO FINAL =====
  
  console.log('\n📊 RESUMO DO TESTE DE PRODUÇÃO');
  console.log('=' .repeat(60));
  
  const envScore = (results.environment.required.found / testConfig.required_vars.length) * 100;
  const filesScore = (results.files.critical.filter(f => f.exists).length / results.files.critical.length) * 100;
  const syntaxScore = results.syntax.length > 0 ? 
    (results.syntax.reduce((sum, r) => sum + r.passed, 0) / 
     results.syntax.reduce((sum, r) => sum + r.passed + r.failed, 0)) * 100 : 0;
  
  console.log(`🌍 Variáveis de Ambiente: ${envScore.toFixed(1)}% (${results.environment.required.found}/${testConfig.required_vars.length} obrigatórias)`);
  console.log(`📁 Arquivos do Sistema: ${filesScore.toFixed(1)}% (${results.files.critical.filter(f => f.exists).length}/${results.files.critical.length} críticos)`);
  console.log(`✨ Sintaxe dos Arquivos: ${syntaxScore.toFixed(1)}% das verificações`);
  console.log(`📦 Dependências: ${results.dependencies.package_json ? 'OK' : 'PROBLEMA'} (${results.dependencies.dependencies.length} deps)`);
  console.log(`🌐 Servidor: ${results.connectivity.server_running ? 'RODANDO' : 'PARADO'}`);
  
  const overallScore = (envScore + filesScore + syntaxScore + 
    (results.dependencies.package_json ? 100 : 0) + 
    (results.connectivity.server_running ? 100 : 0)) / 5;
  
  console.log('');
  console.log(`🎯 SCORE GERAL: ${overallScore.toFixed(1)}%`);
  
  if (overallScore >= 90) {
    console.log('🏆 SISTEMA PRONTO PARA PRODUÇÃO!');
    console.log('✅ Todos os componentes estão operacionais');
  } else if (overallScore >= 70) {
    console.log('⚠️ SISTEMA PARCIALMENTE PRONTO');
    console.log('🔧 Alguns ajustes podem ser necessários');
  } else {
    console.log('❌ SISTEMA NÃO ESTÁ PRONTO');
    console.log('🚨 Múltiplas correções necessárias');
  }
  
  // Instruções para ativação
  console.log('');
  console.log('🚀 INSTRUÇÕES PARA ATIVAÇÃO:');
  
  if (!results.connectivity.server_running) {
    console.log('1. 🔧 Iniciar o servidor:');
    console.log('   node server.js');
    console.log('');
  }
  
  if (results.environment.required.missing > 0) {
    console.log('2. 🌍 Configurar variáveis de ambiente faltantes:');
    results.environment.required.details
      .filter(d => d.status === 'missing')
      .forEach(d => console.log(`   export ${d.var}="valor"`));
    console.log('');
  }
  
  console.log('3. 🧪 Testar endpoints principais:');
  console.log(`   curl http://localhost:${testConfig.server.port}/health`);
  console.log(`   curl http://localhost:${testConfig.server.port}/api/status`);
  console.log('');
  
  console.log('⏰ Teste finalizado em:', new Date().toISOString());
  
  return {
    overall_score: overallScore,
    ready_for_production: overallScore >= 90,
    server_running: results.connectivity.server_running,
    critical_issues: results.environment.required.missing + 
      results.files.critical.filter(f => !f.exists).length,
    results
  };
}

// ===== EXECUÇÃO =====

if (require.main === module) {
  runProductionTest()
    .then(result => {
      console.log(`\n💾 Score final: ${result.overall_score.toFixed(1)}%`);
      process.exit(result.ready_for_production ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro durante teste de produção:', error);
      process.exit(1);
    });
}

module.exports = { runProductionTest };
