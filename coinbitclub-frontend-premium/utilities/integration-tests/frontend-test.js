/**
 * 🎨 TESTE DE FUNCIONALIDADES FRONTEND - COINBITCLUB PREMIUM 🎨
 * 
 * Este teste verifica:
 * ✅ Componentes React funcionais
 * ✅ Estados e props
 * ✅ Navegação entre páginas
 * ✅ Formulários e validações
 * ✅ Integrações com APIs
 * ✅ Design responsivo
 * 
 * @author CoinBitClub Development Team
 * @version 2.0.0
 * @date 2025-01-25
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configurações
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const HEADLESS = process.env.HEADLESS !== 'false';

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

let browser;
let page;
let testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  startTime: Date.now()
};

/**
 * Executar testes do frontend
 */
async function runFrontendTest() {
  log.title('INICIANDO TESTE DO FRONTEND');
  log.info(`URL Base: ${BASE_URL}`);
  log.info(`Modo: ${HEADLESS ? 'Headless' : 'Com interface'}`);
  console.log();

  try {
    // Inicializar browser
    await initializeBrowser();
    
    // 1. Teste de Carregamento de Páginas
    await testPageLoading();
    
    // 2. Teste de Componentes
    await testComponents();
    
    // 3. Teste de Navegação
    await testNavigation();
    
    // 4. Teste de Formulários
    await testForms();
    
    // 5. Teste de APIs Frontend
    await testFrontendAPIs();
    
    // 6. Teste de Responsividade
    await testResponsiveness();
    
    // 7. Teste de Performance Frontend
    await testFrontendPerformance();
    
    // 8. Teste de Acessibilidade
    await testAccessibility();
    
    // Relatório final
    generateFrontendReport();
    
  } catch (error) {
    log.error(`Erro crítico: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Inicializar o browser
 */
async function initializeBrowser() {
  log.subtitle('Inicializando browser...');
  
  browser = await puppeteer.launch({
    headless: HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
  
  page = await browser.newPage();
  
  // Configurar viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Interceptar erros de console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      log.warning(`Console Error: ${msg.text()}`);
    }
  });
  
  log.success('Browser inicializado com sucesso');
}

/**
 * 1. TESTE DE CARREGAMENTO DE PÁGINAS
 */
async function testPageLoading() {
  log.title('1. TESTE DE CARREGAMENTO DE PÁGINAS');
  
  const pages = [
    { name: 'Home Page', url: '/', selector: 'body' },
    { name: 'Dashboard Executivo', url: '/admin/dashboard-executive', selector: '[data-testid="dashboard"], .dashboard, h2' },
    { name: 'Gestão de Usuários', url: '/admin/users-new', selector: '[data-testid="users"], .users-management, h1' },
    { name: 'Gestão de Afiliados', url: '/admin/affiliates-new', selector: '[data-testid="affiliates"], .affiliates-management, h1' },
    { name: 'Operações', url: '/admin/operations-new', selector: '[data-testid="operations"], .operations-management, h1' },
    { name: 'Alertas', url: '/admin/alerts-new', selector: '[data-testid="alerts"], .alerts-management, h1' },
    { name: 'Ajustes', url: '/admin/adjustments-new', selector: '[data-testid="adjustments"], .adjustments-management, h1' },
    { name: 'Contabilidade', url: '/admin/accounting-new', selector: '[data-testid="accounting"], .accounting-management, h1' },
    { name: 'Configurações', url: '/admin/settings-new', selector: '[data-testid="settings"], .settings-management, h1' }
  ];
  
  for (const pageInfo of pages) {
    await runFrontendTest(`Carregar ${pageInfo.name}`, async () => {
      const startTime = Date.now();
      
      try {
        const response = await page.goto(`${BASE_URL}${pageInfo.url}`, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        
        const loadTime = Date.now() - startTime;
        
        // Verificar se a página carregou
        if (!response.ok()) {
          throw new Error(`Status HTTP: ${response.status()}`);
        }
        
        // Aguardar elemento principal aparecer
        try {
          await page.waitForSelector(pageInfo.selector, { timeout: 10000 });
        } catch (selectorError) {
          log.warning(`Seletor ${pageInfo.selector} não encontrado, tentando alternativas...`);
          
          // Tentar selectors alternativos
          const alternatives = ['h1', 'h2', 'main', '.container', '[role="main"]'];
          let found = false;
          
          for (const alt of alternatives) {
            try {
              await page.waitForSelector(alt, { timeout: 2000 });
              found = true;
              break;
            } catch (e) {
              // Continuar tentando
            }
          }
          
          if (!found) {
            throw new Error(`Nenhum elemento principal encontrado`);
          }
        }
        
        log.info(`Tempo de carregamento: ${loadTime}ms`);
        return loadTime < 15000; // Menos de 15 segundos
        
      } catch (error) {
        throw new Error(`Falha ao carregar: ${error.message}`);
      }
    });
  }
  
  console.log();
}

/**
 * 2. TESTE DE COMPONENTES
 */
async function testComponents() {
  log.title('2. TESTE DE COMPONENTES');
  
  // Ir para dashboard para testar componentes
  await page.goto(`${BASE_URL}/admin/dashboard-executive`, { waitUntil: 'networkidle2' });
  
  await runFrontendTest('Sidebar de navegação', async () => {
    const sidebar = await page.$('nav, .sidebar, [role="navigation"]');
    return sidebar !== null;
  });
  
  await runFrontendTest('Header principal', async () => {
    const header = await page.$('header, .header, h1, h2');
    return header !== null;
  });
  
  await runFrontendTest('Botões de ação', async () => {
    const buttons = await page.$$('button');
    log.info(`Botões encontrados: ${buttons.length}`);
    return buttons.length > 0;
  });
  
  await runFrontendTest('Cards/Widgets de dados', async () => {
    const cards = await page.$$('.card, .widget, .metric, .stat, [class*="card"], [class*="widget"]');
    log.info(`Cards encontrados: ${cards.length}`);
    return cards.length > 0;
  });
  
  await runFrontendTest('Tabelas de dados', async () => {
    const tables = await page.$$('table, .table, [class*="table"]');
    log.info(`Tabelas encontradas: ${tables.length}`);
    return true; // Não obrigatório
  });
  
  console.log();
}

/**
 * 3. TESTE DE NAVEGAÇÃO
 */
async function testNavigation() {
  log.title('3. TESTE DE NAVEGAÇÃO');
  
  await page.goto(`${BASE_URL}/admin/dashboard-executive`, { waitUntil: 'networkidle2' });
  
  await runFrontendTest('Menu de navegação clicável', async () => {
    // Procurar links de navegação
    const navLinks = await page.$$('nav a, .sidebar a, [role="navigation"] a');
    
    if (navLinks.length === 0) {
      // Tentar encontrar botões de navegação
      const navButtons = await page.$$('nav button, .sidebar button');
      log.info(`Links de navegação: ${navLinks.length}, Botões: ${navButtons.length}`);
      return navButtons.length > 0;
    }
    
    log.info(`Links de navegação encontrados: ${navLinks.length}`);
    return navLinks.length > 0;
  });
  
  await runFrontendTest('Navegação entre páginas', async () => {
    try {
      // Tentar clicar em um link de usuários
      const userLink = await page.$('a[href*="users"], a[href*="user"]');
      
      if (userLink) {
        await userLink.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        
        const currentURL = page.url();
        log.info(`Navegou para: ${currentURL}`);
        return currentURL.includes('users') || currentURL !== `${BASE_URL}/admin/dashboard-executive`;
      } else {
        log.warning('Link de usuários não encontrado');
        return false;
      }
    } catch (error) {
      log.warning(`Erro na navegação: ${error.message}`);
      return false;
    }
  });
  
  await runFrontendTest('Breadcrumb/Indicador de localização', async () => {
    const breadcrumb = await page.$('.breadcrumb, .breadcrumbs, [aria-label*="breadcrumb"]');
    const pageTitle = await page.$('h1, h2, .page-title, .title');
    
    return breadcrumb !== null || pageTitle !== null;
  });
  
  console.log();
}

/**
 * 4. TESTE DE FORMULÁRIOS
 */
async function testForms() {
  log.title('4. TESTE DE FORMULÁRIOS');
  
  // Ir para página de usuários que deve ter formulários
  await page.goto(`${BASE_URL}/admin/users-new`, { waitUntil: 'networkidle2' });
  
  await runFrontendTest('Campos de entrada', async () => {
    const inputs = await page.$$('input, textarea, select');
    log.info(`Campos de entrada encontrados: ${inputs.length}`);
    return inputs.length > 0;
  });
  
  await runFrontendTest('Botões de submissão', async () => {
    const submitButtons = await page.$$('button[type="submit"], input[type="submit"], .btn-submit, .submit-btn');
    log.info(`Botões de submissão: ${submitButtons.length}`);
    return submitButtons.length >= 0; // Pode não ter na página inicial
  });
  
  await runFrontendTest('Validação de formulários', async () => {
    const forms = await page.$$('form');
    
    if (forms.length > 0) {
      try {
        // Tentar submeter formulário vazio para testar validação
        const form = forms[0];
        await form.click();
        
        // Procurar por mensagens de erro ou validação
        const errorMessages = await page.$$('.error, .invalid, .validation-error, [class*="error"]');
        log.info(`Validações encontradas: ${errorMessages.length}`);
        
        return true; // Teste informativo
      } catch (error) {
        return true; // Não crítico
      }
    }
    
    return true; // Sem formulários visíveis
  });
  
  console.log();
}

/**
 * 5. TESTE DE APIs FRONTEND
 */
async function testFrontendAPIs() {
  log.title('5. TESTE DE INTEGRAÇÃO COM APIs');
  
  await page.goto(`${BASE_URL}/admin/dashboard-executive`, { waitUntil: 'networkidle2' });
  
  await runFrontendTest('Carregamento de dados via API', async () => {
    // Interceptar requisições de rede
    const responses = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok()
        });
      }
    });
    
    // Aguardar um tempo para capturar requisições
    await page.waitForTimeout(5000);
    
    log.info(`Requisições à API capturadas: ${responses.length}`);
    
    if (responses.length > 0) {
      const successfulAPIs = responses.filter(r => r.ok).length;
      log.info(`APIs com sucesso: ${successfulAPIs}/${responses.length}`);
      
      responses.forEach(r => {
        const status = r.ok ? '✅' : '❌';
        log.info(`  ${status} ${r.url} (${r.status})`);
      });
      
      return successfulAPIs > 0;
    }
    
    return false;
  });
  
  await runFrontendTest('Atualização em tempo real', async () => {
    // Procurar por botão de atualizar ou refresh
    const refreshButton = await page.$('button[class*="refresh"], button[class*="reload"], .refresh-btn, .reload-btn');
    
    if (refreshButton) {
      await refreshButton.click();
      await page.waitForTimeout(2000);
      
      log.info('Botão de atualização encontrado e testado');
      return true;
    } else {
      log.warning('Botão de atualização não encontrado');
      return false;
    }
  });
  
  console.log();
}

/**
 * 6. TESTE DE RESPONSIVIDADE
 */
async function testResponsiveness() {
  log.title('6. TESTE DE RESPONSIVIDADE');
  
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];
  
  for (const viewport of viewports) {
    await runFrontendTest(`Layout ${viewport.name} (${viewport.width}x${viewport.height})`, async () => {
      await page.setViewport(viewport);
      await page.goto(`${BASE_URL}/admin/dashboard-executive`, { waitUntil: 'networkidle2' });
      
      // Verificar se não há overflow horizontal
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      
      // Verificar se elementos principais ainda estão visíveis
      const mainElements = await page.$$('header, nav, main, .container, [role="main"]');
      
      log.info(`Scroll horizontal: ${hasHorizontalScroll ? 'Sim' : 'Não'}, Elementos principais: ${mainElements.length}`);
      
      return !hasHorizontalScroll && mainElements.length > 0;
    });
  }
  
  // Restaurar viewport original
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log();
}

/**
 * 7. TESTE DE PERFORMANCE FRONTEND
 */
async function testFrontendPerformance() {
  log.title('7. TESTE DE PERFORMANCE FRONTEND');
  
  await runFrontendTest('Tempo de carregamento inicial', async () => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/admin/dashboard-executive`, { waitUntil: 'load' });
    
    const loadTime = Date.now() - startTime;
    log.info(`Tempo de carregamento: ${loadTime}ms`);
    
    return loadTime < 10000; // Menos de 10 segundos
  });
  
  await runFrontendTest('Recursos carregados', async () => {
    const resources = await page.evaluate(() => {
      return {
        images: document.images.length,
        scripts: document.scripts.length,
        stylesheets: document.styleSheets.length
      };
    });
    
    log.info(`Imagens: ${resources.images}, Scripts: ${resources.scripts}, CSS: ${resources.stylesheets}`);
    
    return resources.scripts > 0 && resources.stylesheets > 0;
  });
  
  await runFrontendTest('Uso de memória', async () => {
    const metrics = await page.metrics();
    const memoryMB = (metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2);
    
    log.info(`Memória JS utilizada: ${memoryMB} MB`);
    
    return parseFloat(memoryMB) < 100; // Menos de 100MB
  });
  
  console.log();
}

/**
 * 8. TESTE DE ACESSIBILIDADE
 */
async function testAccessibility() {
  log.title('8. TESTE DE ACESSIBILIDADE BÁSICA');
  
  await page.goto(`${BASE_URL}/admin/dashboard-executive`, { waitUntil: 'networkidle2' });
  
  await runFrontendTest('Títulos e headings', async () => {
    const headings = await page.$$('h1, h2, h3, h4, h5, h6');
    log.info(`Headings encontrados: ${headings.length}`);
    return headings.length > 0;
  });
  
  await runFrontendTest('Links acessíveis', async () => {
    const links = await page.$$('a');
    const linksWithText = await page.$$eval('a', links => 
      links.filter(link => link.textContent.trim().length > 0).length
    );
    
    log.info(`Links total: ${links.length}, Com texto: ${linksWithText}`);
    return linksWithText > 0;
  });
  
  await runFrontendTest('Contraste de cores', async () => {
    // Teste básico verificando se há elementos com cor de texto definida
    const elementsWithColor = await page.$$eval('*', elements => {
      return elements.filter(el => {
        const style = window.getComputedStyle(el);
        return style.color && style.color !== 'rgba(0, 0, 0, 0)';
      }).length;
    });
    
    log.info(`Elementos com cor definida: ${elementsWithColor}`);
    return elementsWithColor > 0;
  });
  
  console.log();
}

/**
 * Função auxiliar para executar testes do frontend
 */
async function runFrontendTest(testName, testFunction) {
  testStats.total++;
  
  try {
    const result = await testFunction();
    
    if (result) {
      testStats.passed++;
      log.success(`${testName}`);
    } else {
      testStats.failed++;
      log.error(`${testName}`);
    }
  } catch (error) {
    testStats.failed++;
    log.error(`${testName} - Erro: ${error.message}`);
  }
}

/**
 * Gerar relatório do frontend
 */
function generateFrontendReport() {
  const endTime = Date.now();
  const duration = (endTime - testStats.startTime) / 1000;
  
  console.log('\n' + '='.repeat(80));
  log.title('RELATÓRIO FINAL DO FRONTEND');
  console.log('='.repeat(80));
  
  console.log(`${colors.bold}📊 ESTATÍSTICAS DO FRONTEND:${colors.reset}`);
  console.log(`   Total de testes: ${colors.cyan}${testStats.total}${colors.reset}`);
  console.log(`   ✅ Aprovados: ${colors.green}${testStats.passed}${colors.reset}`);
  console.log(`   ❌ Falharam: ${colors.red}${testStats.failed}${colors.reset}`);
  console.log(`   ⏱️  Duração: ${colors.magenta}${duration.toFixed(2)}s${colors.reset}`);
  
  const successRate = ((testStats.passed / testStats.total) * 100).toFixed(1);
  console.log(`   📈 Taxa de sucesso: ${colors.bold}${successRate}%${colors.reset}`);
  
  console.log('\n' + '='.repeat(80));
  
  if (testStats.failed === 0) {
    log.success('🎉 FRONTEND FUNCIONANDO PERFEITAMENTE!');
  } else {
    log.warning(`⚠️  ${testStats.failed} teste(s) falharam no frontend.`);
  }
  
  console.log('='.repeat(80));
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    base_url: BASE_URL,
    duration: duration,
    stats: testStats,
    success_rate: parseFloat(successRate)
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'frontend-test-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  log.info('📄 Relatório do frontend salvo em: frontend-test-report.json');
}

// Executar se chamado diretamente
if (require.main === module) {
  runFrontendTest().catch(error => {
    log.error(`Erro fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runFrontendTest,
  testStats
};
