/**
 * 🚀 EXECUTOR PRINCIPAL DE TESTES - COINBITCLUB PREMIUM 🚀
 * 
 * Script principal que executa todos os testes de forma coordenada:
 * ✅ Teste de Integração Completo
 * ✅ Teste de Banco de Dados
 * ✅ Teste de Frontend
 * ✅ Relatório Consolidado
 * 
 * @author CoinBitClub Development Team
 * @version 2.0.0
 * @date 2025-01-25
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.bold}${colors.cyan}🎯 ${msg}${colors.reset}`),
  subtitle: (msg) => console.log(`${colors.magenta}📌 ${msg}${colors.reset}`)
};

// Configurações dos testes
const testSuites = [
  {
    name: 'Teste de Integração Completo',
    script: 'integration-test-complete.js',
    description: 'Testa APIs, rotas, CRUD e integrações',
    required: true
  },
  {
    name: 'Teste de Banco de Dados',
    script: 'database-test.js',
    description: 'Testa estrutura do PostgreSQL e queries',
    required: false // Pode falhar se banco não estiver configurado
  },
  {
    name: 'Teste de Frontend',
    script: 'frontend-test.js',
    description: 'Testa interface, componentes e navegação',
    required: false // Pode falhar se dependências não estiverem instaladas
  }
];

// Estatísticas globais
let globalStats = {
  totalSuites: testSuites.length,
  passedSuites: 0,
  failedSuites: 0,
  warningsSuites: 0,
  startTime: Date.now(),
  results: []
};

/**
 * Executar todos os testes
 */
async function runAllTests() {
  printHeader();
  
  // Verificar se está no servidor local
  await checkServerStatus();
  
  // Instalar dependências se necessário
  await installDependencies();
  
  // Executar cada suite de testes
  for (const suite of testSuites) {
    await runTestSuite(suite);
  }
  
  // Gerar relatório consolidado
  generateConsolidatedReport();
}

/**
 * Imprimir cabeçalho
 */
function printHeader() {
  console.log('\n' + '='.repeat(100));
  console.log(`${colors.bold}${colors.cyan}🚀 COINBITCLUB PREMIUM - SUITE COMPLETA DE TESTES 🚀${colors.reset}`);
  console.log('='.repeat(100));
  console.log(`${colors.magenta}📅 Data: ${new Date().toLocaleString('pt-BR')}${colors.reset}`);
  console.log(`${colors.magenta}🎯 Objetivo: Validar funcionamento completo do sistema${colors.reset}`);
  console.log(`${colors.magenta}📊 Suites de teste: ${testSuites.length}${colors.reset}`);
  console.log('='.repeat(100));
  console.log();
}

/**
 * Verificar se o servidor está rodando
 */
async function checkServerStatus() {
  log.title('VERIFICAÇÃO DO SERVIDOR');
  
  try {
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:3000', { timeout: 5000 });
    
    if (response.ok) {
      log.success('Servidor local está rodando na porta 3000');
    } else {
      log.warning(`Servidor respondeu com status: ${response.status}`);
    }
  } catch (error) {
    log.warning('Servidor local não está rodando ou não acessível');
    log.info('💡 Para melhores resultados, inicie o servidor com: npm run dev');
  }
  
  console.log();
}

/**
 * Instalar dependências necessárias
 */
async function installDependencies() {
  log.title('VERIFICAÇÃO DE DEPENDÊNCIAS');
  
  const dependencies = [
    { name: 'node-fetch', package: 'node-fetch' },
    { name: 'pg', package: 'pg' },
    { name: 'puppeteer', package: 'puppeteer' }
  ];
  
  for (const dep of dependencies) {
    try {
      require.resolve(dep.package);
      log.success(`${dep.name} está instalado`);
    } catch (error) {
      log.warning(`${dep.name} não está instalado`);
      log.info(`💡 Para instalar: npm install ${dep.package}`);
    }
  }
  
  console.log();
}

/**
 * Executar uma suite de testes
 */
async function runTestSuite(suite) {
  log.title(`EXECUTANDO: ${suite.name.toUpperCase()}`);
  log.info(`Descrição: ${suite.description}`);
  log.info(`Script: ${suite.script}`);
  log.info(`Obrigatório: ${suite.required ? 'Sim' : 'Não'}`);
  console.log();
  
  const startTime = Date.now();
  
  try {
    const scriptPath = path.join(__dirname, suite.script);
    
    // Verificar se o script existe
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script não encontrado: ${scriptPath}`);
    }
    
    // Executar o script
    const result = await executeScript(scriptPath);
    
    const duration = Date.now() - startTime;
    
    if (result.success) {
      globalStats.passedSuites++;
      log.success(`${suite.name} concluído com sucesso em ${(duration/1000).toFixed(2)}s`);
    } else {
      if (suite.required) {
        globalStats.failedSuites++;
        log.error(`${suite.name} falhou (obrigatório)`);
      } else {
        globalStats.warningsSuites++;
        log.warning(`${suite.name} falhou (opcional)`);
      }
    }
    
    globalStats.results.push({
      name: suite.name,
      script: suite.script,
      required: suite.required,
      success: result.success,
      duration: duration,
      output: result.output,
      error: result.error
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (suite.required) {
      globalStats.failedSuites++;
      log.error(`${suite.name} falhou: ${error.message}`);
    } else {
      globalStats.warningsSuites++;
      log.warning(`${suite.name} falhou: ${error.message}`);
    }
    
    globalStats.results.push({
      name: suite.name,
      script: suite.script,
      required: suite.required,
      success: false,
      duration: duration,
      output: '',
      error: error.message
    });
  }
  
  console.log();
  console.log('-'.repeat(80));
  console.log();
}

/**
 * Executar script Node.js
 */
function executeScript(scriptPath) {
  return new Promise((resolve) => {
    let output = '';
    let errorOutput = '';
    
    const child = spawn('node', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text); // Mostrar output em tempo real
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });
    
    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output,
        error: errorOutput
      });
    });
    
    child.on('error', (error) => {
      resolve({
        success: false,
        output: output,
        error: error.message
      });
    });
  });
}

/**
 * Gerar relatório consolidado
 */
function generateConsolidatedReport() {
  const endTime = Date.now();
  const totalDuration = (endTime - globalStats.startTime) / 1000;
  
  console.log('\n' + '='.repeat(100));
  log.title('RELATÓRIO CONSOLIDADO FINAL');
  console.log('='.repeat(100));
  
  // Estatísticas gerais
  console.log(`${colors.bold}📊 ESTATÍSTICAS GERAIS:${colors.reset}`);
  console.log(`   Total de suites: ${colors.cyan}${globalStats.totalSuites}${colors.reset}`);
  console.log(`   ✅ Aprovadas: ${colors.green}${globalStats.passedSuites}${colors.reset}`);
  console.log(`   ❌ Falharam: ${colors.red}${globalStats.failedSuites}${colors.reset}`);
  console.log(`   ⚠️  Avisos: ${colors.yellow}${globalStats.warningsSuites}${colors.reset}`);
  console.log(`   ⏱️  Duração total: ${colors.magenta}${totalDuration.toFixed(2)}s${colors.reset}`);
  
  const successRate = ((globalStats.passedSuites / globalStats.totalSuites) * 100).toFixed(1);
  console.log(`   📈 Taxa de sucesso: ${colors.bold}${successRate}%${colors.reset}`);
  
  console.log();
  
  // Detalhes por suite
  console.log(`${colors.bold}📋 DETALHES POR SUITE:${colors.reset}`);
  globalStats.results.forEach((result, index) => {
    const status = result.success ? '✅' : (result.required ? '❌' : '⚠️');
    const duration = (result.duration / 1000).toFixed(2);
    
    console.log(`   ${index + 1}. ${status} ${result.name} (${duration}s)`);
    
    if (!result.success && result.error) {
      console.log(`      ${colors.red}Erro: ${result.error}${colors.reset}`);
    }
  });
  
  console.log();
  console.log('='.repeat(100));
  
  // Status final
  if (globalStats.failedSuites === 0) {
    log.success('🎉 TODOS OS TESTES OBRIGATÓRIOS PASSARAM!');
    if (globalStats.warningsSuites > 0) {
      log.info(`💡 ${globalStats.warningsSuites} teste(s) opcional(is) falharam - não crítico`);
    }
  } else {
    log.error(`❌ ${globalStats.failedSuites} teste(s) obrigatório(s) falharam`);
    log.warning('🔧 Sistema precisa de correções antes de entrar em produção');
  }
  
  console.log('='.repeat(100));
  
  // Salvar relatório JSON
  const consolidatedReport = {
    timestamp: new Date().toISOString(),
    duration: totalDuration,
    stats: globalStats,
    success_rate: parseFloat(successRate),
    overall_status: globalStats.failedSuites === 0 ? 'SUCCESS' : 'FAILURE',
    production_ready: globalStats.failedSuites === 0
  };
  
  const reportPath = path.join(__dirname, 'consolidated-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(consolidatedReport, null, 2));
  
  log.info(`📄 Relatório consolidado salvo em: ${reportPath}`);
  
  // Gerar relatório HTML (opcional)
  generateHTMLReport(consolidatedReport);
}

/**
 * Gerar relatório HTML
 */
function generateHTMLReport(report) {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Testes - CoinBitClub Premium</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
            color: #ffffff;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
        }
        h1 {
            text-align: center;
            color: #FFD700;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .subtitle {
            text-align: center;
            color: #3B82F6;
            font-size: 1.2em;
            margin-bottom: 30px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: linear-gradient(135deg, #2d2d2d, #1a1a1a);
            border: 2px solid #FFD700;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #FFD700;
        }
        .stat-label {
            color: #3B82F6;
            margin-top: 5px;
        }
        .success { color: #10B981; }
        .error { color: #EF4444; }
        .warning { color: #F59E0B; }
        .suite-results {
            margin-top: 30px;
        }
        .suite-item {
            background: rgba(255, 255, 255, 0.05);
            border-left: 4px solid #3B82F6;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 5px;
        }
        .suite-item.success {
            border-left-color: #10B981;
        }
        .suite-item.error {
            border-left-color: #EF4444;
        }
        .suite-item.warning {
            border-left-color: #F59E0B;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #FFD700;
            color: #EC4899;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 CoinBitClub Premium</h1>
        <div class="subtitle">Relatório de Testes Automatizados</div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${report.stats.totalSuites}</div>
                <div class="stat-label">Total de Suites</div>
            </div>
            <div class="stat-card">
                <div class="stat-value success">${report.stats.passedSuites}</div>
                <div class="stat-label">Aprovadas</div>
            </div>
            <div class="stat-card">
                <div class="stat-value error">${report.stats.failedSuites}</div>
                <div class="stat-label">Falharam</div>
            </div>
            <div class="stat-card">
                <div class="stat-value warning">${report.stats.warningsSuites}</div>
                <div class="stat-label">Avisos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${report.success_rate}%</div>
                <div class="stat-label">Taxa de Sucesso</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${report.duration.toFixed(2)}s</div>
                <div class="stat-label">Duração Total</div>
            </div>
        </div>
        
        <h2 style="color: #FFD700;">📋 Resultados por Suite</h2>
        <div class="suite-results">
            ${report.stats.results.map((result, index) => `
                <div class="suite-item ${result.success ? 'success' : (result.required ? 'error' : 'warning')}">
                    <h3>${result.success ? '✅' : (result.required ? '❌' : '⚠️')} ${result.name}</h3>
                    <p><strong>Duração:</strong> ${(result.duration / 1000).toFixed(2)}s</p>
                    <p><strong>Status:</strong> ${result.success ? 'Sucesso' : 'Falhou'}</p>
                    ${result.error ? `<p style="color: #EF4444;"><strong>Erro:</strong> ${result.error}</p>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p><strong>Status Geral:</strong> <span class="${report.overall_status === 'SUCCESS' ? 'success' : 'error'}">${report.overall_status}</span></p>
            <p><strong>Pronto para Produção:</strong> <span class="${report.production_ready ? 'success' : 'error'}">${report.production_ready ? 'Sim' : 'Não'}</span></p>
            <p>Relatório gerado em: ${new Date(report.timestamp).toLocaleString('pt-BR')}</p>
        </div>
    </div>
</body>
</html>
  `;
  
  const htmlPath = path.join(__dirname, 'test-report.html');
  fs.writeFileSync(htmlPath, html);
  
  log.info(`📄 Relatório HTML salvo em: ${htmlPath}`);
  log.info(`🌐 Para visualizar: file://${htmlPath}`);
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(error => {
    log.error(`Erro fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  globalStats
};
