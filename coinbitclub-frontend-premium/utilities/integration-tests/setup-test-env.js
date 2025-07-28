#!/usr/bin/env node

/**
 * 🔧 CONFIGURADOR DO AMBIENTE DE TESTES - COINBITCLUB PREMIUM 🔧
 * 
 * Script para configurar automaticamente o ambiente de testes:
 * ✅ Instala dependências necessárias
 * ✅ Cria arquivo de configuração
 * ✅ Verifica pré-requisitos
 * ✅ Configura banco de dados de teste
 * 
 * @author CoinBitClub Development Team
 * @version 2.0.0
 * @date 2025-01-25
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

// Interface para input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuração padrão
const defaultConfig = {
  TEST_BASE_URL: 'http://localhost:3000',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'coinbitclub_test',
  DB_USER: 'postgres',
  DB_PASSWORD: '',
  HEADLESS: 'true',
  NODE_ENV: 'test'
};

/**
 * Executar configuração completa
 */
async function setupTestEnvironment() {
  printHeader();
  
  try {
    // 1. Verificar pré-requisitos
    await checkPrerequisites();
    
    // 2. Instalar dependências
    await installDependencies();
    
    // 3. Configurar ambiente
    await configureEnvironment();
    
    // 4. Criar estrutura de pastas
    await createTestStructure();
    
    // 5. Configurar banco de teste
    await configureDatabaseTest();
    
    // 6. Validar configuração
    await validateSetup();
    
    // 7. Finalizar
    printSuccessMessage();
    
  } catch (error) {
    log.error(`Erro durante configuração: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Imprimir cabeçalho
 */
function printHeader() {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bold}${colors.cyan}🔧 CONFIGURAÇÃO DO AMBIENTE DE TESTES${colors.reset}`);
  console.log('='.repeat(80));
  console.log(`${colors.magenta}📅 CoinBitClub Premium Testing Suite${colors.reset}`);
  console.log(`${colors.magenta}🎯 Configuração automática do ambiente${colors.reset}`);
  console.log('='.repeat(80));
  console.log();
}

/**
 * 1. Verificar pré-requisitos
 */
async function checkPrerequisites() {
  log.title('1. VERIFICANDO PRÉ-REQUISITOS');
  
  // Verificar Node.js
  await checkNodeVersion();
  
  // Verificar npm
  await checkNpmVersion();
  
  // Verificar PostgreSQL (opcional)
  await checkPostgreSQL();
  
  // Verificar Git
  await checkGit();
  
  console.log();
}

function checkNodeVersion() {
  return new Promise((resolve) => {
    exec('node --version', (error, stdout) => {
      if (error) {
        log.error('Node.js não está instalado');
        log.info('💡 Instale Node.js: https://nodejs.org/');
        resolve(false);
      } else {
        const version = stdout.trim();
        const majorVersion = parseInt(version.match(/v(\d+)/)[1]);
        
        if (majorVersion >= 14) {
          log.success(`Node.js ${version} (compatível)`);
        } else {
          log.warning(`Node.js ${version} (recomenda-se v14+)`);
        }
        resolve(true);
      }
    });
  });
}

function checkNpmVersion() {
  return new Promise((resolve) => {
    exec('npm --version', (error, stdout) => {
      if (error) {
        log.error('npm não está disponível');
        resolve(false);
      } else {
        log.success(`npm ${stdout.trim()}`);
        resolve(true);
      }
    });
  });
}

function checkPostgreSQL() {
  return new Promise((resolve) => {
    exec('psql --version', (error, stdout) => {
      if (error) {
        log.warning('PostgreSQL CLI não encontrado');
        log.info('💡 Instale PostgreSQL ou configure conexão remota');
      } else {
        log.success(`PostgreSQL ${stdout.trim().split(' ')[2]}`);
      }
      resolve(true); // Não obrigatório
    });
  });
}

function checkGit() {
  return new Promise((resolve) => {
    exec('git --version', (error, stdout) => {
      if (error) {
        log.warning('Git não encontrado');
      } else {
        log.success(`Git ${stdout.trim().split(' ')[2]}`);
      }
      resolve(true); // Não obrigatório
    });
  });
}

/**
 * 2. Instalar dependências
 */
async function installDependencies() {
  log.title('2. INSTALANDO DEPENDÊNCIAS');
  
  const dependencies = [
    'node-fetch',
    'pg',
    'puppeteer'
  ];
  
  log.info('Instalando dependências de teste...');
  
  for (const dep of dependencies) {
    await installPackage(dep);
  }
  
  console.log();
}

function installPackage(packageName) {
  return new Promise((resolve) => {
    log.info(`Instalando ${packageName}...`);
    
    const npm = spawn('npm', ['install', packageName, '--save-dev'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    npm.on('close', (code) => {
      if (code === 0) {
        log.success(`${packageName} instalado`);
      } else {
        log.warning(`Erro ao instalar ${packageName}`);
      }
      resolve();
    });
    
    npm.on('error', () => {
      log.warning(`Erro ao instalar ${packageName}`);
      resolve();
    });
  });
}

/**
 * 3. Configurar ambiente
 */
async function configureEnvironment() {
  log.title('3. CONFIGURANDO AMBIENTE');
  
  const envTestPath = path.join(process.cwd(), '.env.test');
  
  log.info('Configurando variáveis de ambiente de teste...');
  
  // Perguntar ao usuário sobre configurações
  const config = await gatherConfiguration();
  
  // Criar arquivo .env.test
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envTestPath, envContent);
  log.success('Arquivo .env.test criado');
  
  // Atualizar package.json com scripts de teste
  await updatePackageJson();
  
  console.log();
}

function gatherConfiguration() {
  return new Promise((resolve) => {
    log.info('Configuração interativa (pressione Enter para valores padrão):');
    
    const config = { ...defaultConfig };
    const questions = [
      { key: 'TEST_BASE_URL', prompt: 'URL do servidor de teste', default: config.TEST_BASE_URL },
      { key: 'DB_HOST', prompt: 'Host do PostgreSQL', default: config.DB_HOST },
      { key: 'DB_PORT', prompt: 'Porta do PostgreSQL', default: config.DB_PORT },
      { key: 'DB_NAME', prompt: 'Nome do banco de teste', default: config.DB_NAME },
      { key: 'DB_USER', prompt: 'Usuário do banco', default: config.DB_USER },
      { key: 'DB_PASSWORD', prompt: 'Senha do banco', default: config.DB_PASSWORD, hidden: true }
    ];
    
    askQuestions(questions, 0, config, resolve);
  });
}

function askQuestions(questions, index, config, resolve) {
  if (index >= questions.length) {
    resolve(config);
    return;
  }
  
  const question = questions[index];
  const prompt = `${question.prompt} (${question.default}): `;
  
  rl.question(prompt, (answer) => {
    config[question.key] = answer.trim() || question.default;
    askQuestions(questions, index + 1, config, resolve);
  });
}

async function updatePackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (fs.existsSync(packagePath)) {
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    packageData.scripts = packageData.scripts || {};
    packageData.scripts['test:all'] = 'node tests/run-all-tests.js';
    packageData.scripts['test:integration'] = 'node tests/integration-test-complete.js';
    packageData.scripts['test:database'] = 'node tests/database-test.js';
    packageData.scripts['test:frontend'] = 'node tests/frontend-test.js';
    packageData.scripts['test:setup'] = 'node tests/setup-test-env.js';
    
    fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
    log.success('Scripts de teste adicionados ao package.json');
  }
}

/**
 * 4. Criar estrutura de pastas
 */
async function createTestStructure() {
  log.title('4. CRIANDO ESTRUTURA DE TESTES');
  
  const directories = [
    'tests',
    'tests/reports',
    'tests/fixtures',
    'tests/mocks'
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log.success(`Criada pasta: ${dir}`);
    } else {
      log.info(`Pasta já existe: ${dir}`);
    }
  });
  
  // Criar arquivo .gitignore para testes
  const gitignorePath = path.join(process.cwd(), 'tests', '.gitignore');
  const gitignoreContent = `
# Test Reports
*.json
*.html
reports/
screenshots/

# Test Database
test.db
*.sqlite

# Logs
*.log
test-logs/
`;
  
  fs.writeFileSync(gitignorePath, gitignoreContent);
  log.success('Arquivo .gitignore criado para testes');
  
  console.log();
}

/**
 * 5. Configurar banco de teste
 */
async function configureDatabaseTest() {
  log.title('5. CONFIGURANDO BANCO DE TESTE');
  
  // Criar script de setup do banco
  const setupSQL = `
-- Setup do banco de dados de teste
-- CoinBitClub Premium Testing Database

-- Criar banco de teste (executar como superuser)
-- CREATE DATABASE coinbitclub_test;

-- Conectar ao banco de teste
\\c coinbitclub_test;

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'basic',
    status VARCHAR(50) DEFAULT 'active',
    country VARCHAR(100),
    phone VARCHAR(20),
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de afiliados
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    tier VARCHAR(50) DEFAULT 'bronze',
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    status VARCHAR(50) DEFAULT 'active',
    affiliate_code VARCHAR(50) UNIQUE,
    total_referrals INTEGER DEFAULT 0,
    total_commission DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de operações
CREATE TABLE IF NOT EXISTS operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    entry_price DECIMAL(15,2),
    exit_price DECIMAL(15,2),
    stop_loss DECIMAL(15,2),
    take_profit DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'pending',
    pnl DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de alertas
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    channels JSONB DEFAULT '[]',
    read_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de ajustes financeiros
CREATE TABLE IF NOT EXISTS adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    reference_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    approved_by UUID,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending',
    description TEXT,
    reference_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    key VARCHAR(255) NOT NULL,
    value JSONB,
    description TEXT,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(category, key)
);

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_operations_symbol ON operations(symbol);
CREATE INDEX IF NOT EXISTS idx_operations_status ON operations(status);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_adjustments_user_id ON adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Dados de exemplo para testes
INSERT INTO users (name, email, plan, status, country) VALUES
('Admin User', 'admin@coinbitclub.com', 'premium', 'active', 'Brazil'),
('Test User 1', 'test1@coinbitclub.com', 'basic', 'active', 'Brazil'),
('Test User 2', 'test2@coinbitclub.com', 'professional', 'active', 'USA')
ON CONFLICT (email) DO NOTHING;

INSERT INTO settings (category, key, value, description) VALUES
('general', 'site_name', '"CoinBitClub Premium"', 'Nome do site'),
('trading', 'max_operations', '10', 'Máximo de operações simultâneas'),
('security', 'session_timeout', '3600', 'Timeout da sessão em segundos')
ON CONFLICT (category, key) DO NOTHING;

-- Confirmar criação
SELECT 'Database setup completed successfully!' as status;
`;
  
  const sqlPath = path.join(process.cwd(), 'tests', 'setup-database.sql');
  fs.writeFileSync(sqlPath, setupSQL);
  log.success('Script SQL de setup criado: tests/setup-database.sql');
  
  log.info('Para configurar o banco, execute:');
  log.info(`  psql -U postgres -f ${sqlPath}`);
  
  console.log();
}

/**
 * 6. Validar configuração
 */
async function validateSetup() {
  log.title('6. VALIDANDO CONFIGURAÇÃO');
  
  // Verificar arquivos criados
  const requiredFiles = [
    '.env.test',
    'tests/run-all-tests.js',
    'tests/integration-test-complete.js',
    'tests/database-test.js',
    'tests/frontend-test.js',
    'tests/setup-database.sql'
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log.success(`Arquivo presente: ${file}`);
    } else {
      log.error(`Arquivo faltando: ${file}`);
    }
  });
  
  // Verificar scripts no package.json
  const packagePath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const testScripts = Object.keys(packageData.scripts || {}).filter(s => s.startsWith('test:'));
    
    if (testScripts.length > 0) {
      log.success(`Scripts de teste: ${testScripts.join(', ')}`);
    } else {
      log.warning('Nenhum script de teste encontrado');
    }
  }
  
  console.log();
}

/**
 * Imprimir mensagem de sucesso
 */
function printSuccessMessage() {
  console.log('\n' + '='.repeat(80));
  log.title('🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('='.repeat(80));
  
  console.log(`${colors.green}✅ Ambiente de testes configurado${colors.reset}`);
  console.log(`${colors.green}✅ Dependências instaladas${colors.reset}`);
  console.log(`${colors.green}✅ Scripts adicionados${colors.reset}`);
  console.log(`${colors.green}✅ Estrutura criada${colors.reset}`);
  
  console.log();
  console.log(`${colors.bold}📋 PRÓXIMOS PASSOS:${colors.reset}`);
  console.log();
  console.log(`${colors.cyan}1. Configurar banco de dados:${colors.reset}`);
  console.log(`   psql -U postgres -f tests/setup-database.sql`);
  console.log();
  console.log(`${colors.cyan}2. Iniciar servidor de desenvolvimento:${colors.reset}`);
  console.log(`   npm run dev`);
  console.log();
  console.log(`${colors.cyan}3. Executar testes:${colors.reset}`);
  console.log(`   npm run test:all`);
  console.log();
  console.log(`${colors.cyan}4. Ver relatórios:${colors.reset}`);
  console.log(`   Abrir tests/test-report.html no navegador`);
  
  console.log();
  console.log('='.repeat(80));
  console.log(`${colors.magenta}🚀 CoinBitClub Premium Testing Suite configurado!${colors.reset}`);
  console.log('='.repeat(80));
}

// Executar se chamado diretamente
if (require.main === module) {
  setupTestEnvironment().catch(error => {
    log.error(`Erro fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  setupTestEnvironment
};
