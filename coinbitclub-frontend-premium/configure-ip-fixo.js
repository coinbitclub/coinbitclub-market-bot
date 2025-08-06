#!/usr/bin/env node
/**
 * 🎯 SCRIPT DE CONFIGURAÇÃO IP FIXO - TRADING AUTOMÁTICO
 * Automatiza a configuração necessária para conexão com Binance & Bybit
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 INICIANDO CONFIGURAÇÃO IP FIXO PARA TRADING AUTOMÁTICO');
console.log('=' .repeat(60));

// IP fixo do Railway identificado
const RAILWAY_IP = '132.255.160.140';

// Configurações das exchanges
const exchangeConfig = {
  binance: {
    mainnet: 'https://api.binance.com',
    testnet: 'https://testnet.binance.vision',
    futuresMainnet: 'https://fapi.binance.com',
    futuresTestnet: 'https://testnet.binancefuture.com'
  },
  bybit: {
    mainnet: 'https://api.bybit.com',
    testnet: 'https://api-testnet.bybit.com'
  }
};

// 1. Verificar IP atual
async function checkCurrentIP() {
  console.log('\n📍 VERIFICANDO IP ATUAL...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    
    console.log(`   🌐 IP Detectado: ${data.ip}`);
    
    if (data.ip === RAILWAY_IP) {
      console.log('   ✅ IP corresponde ao Railway fixo');
    } else {
      console.log('   ⚠️  IP diferente do Railway fixo esperado');
      console.log(`   📌 IP Railway esperado: ${RAILWAY_IP}`);
    }
    
    return data.ip;
  } catch (error) {
    console.log('   ❌ Erro ao verificar IP:', error.message);
    console.log(`   📌 Usando IP Railway configurado: ${RAILWAY_IP}`);
    return RAILWAY_IP;
  }
}

// 2. Testar conectividade com exchanges
async function testExchangeConnectivity() {
  console.log('\n🧪 TESTANDO CONECTIVIDADE COM EXCHANGES...');
  
  const fetch = (await import('node-fetch')).default;
  
  // Teste Binance
  try {
    console.log('   📊 Testando Binance...');
    const response = await fetch('https://api.binance.com/api/v3/ping', {
      timeout: 5000
    });
    
    if (response.ok) {
      console.log('   ✅ Binance: Conectividade OK');
    } else {
      console.log('   ❌ Binance: Erro de conectividade');
    }
  } catch (error) {
    console.log('   ❌ Binance: Erro -', error.message);
  }

  // Teste Bybit
  try {
    console.log('   📊 Testando Bybit...');
    const response = await fetch('https://api.bybit.com/v5/market/time', {
      timeout: 5000
    });
    
    if (response.ok) {
      console.log('   ✅ Bybit: Conectividade OK');
    } else {
      console.log('   ❌ Bybit: Erro de conectividade');
    }
  } catch (error) {
    console.log('   ❌ Bybit: Erro -', error.message);
  }
}

// 3. Gerar middleware de IP check
function generateIPMiddleware() {
  console.log('\n🔧 GERANDO MIDDLEWARE DE IP CHECK...');
  
  const middlewareCode = `
/**
 * Middleware para verificar IP autorizado em produção
 * IP fixo Railway: ${RAILWAY_IP}
 */
const ipWhitelist = (req, res, next) => {
  const clientIP = req.ip || 
                   req.connection.remoteAddress || 
                   req.headers['x-forwarded-for'] ||
                   req.headers['x-real-ip'];
  
  const authorizedIPs = [
    '${RAILWAY_IP}',        // Railway IP fixo
    '127.0.0.1',           // Local development
    'localhost',           // Local development
    '::1',                 // IPv6 localhost
    process.env.ADMIN_IP   // Admin IP adicional
  ];
  
  // Log do IP para debug
  console.log(\`🔍 IP Request: \${clientIP}\`);
  
  // Em produção, verificar whitelist
  if (process.env.NODE_ENV === 'production') {
    const isAuthorized = authorizedIPs.some(ip => 
      ip && (clientIP === ip || clientIP.includes(ip))
    );
    
    if (!isAuthorized) {
      console.error(\`🚫 IP não autorizado: \${clientIP}\`);
      return res.status(403).json({
        error: 'IP_NOT_ALLOWED',
        message: 'Seu IP não está autorizado para operações de trading',
        ip: clientIP,
        authorized_ips: authorizedIPs.filter(ip => ip),
        timestamp: new Date().toISOString()
      });
    }
  }
  
  console.log(\`✅ IP autorizado: \${clientIP}\`);
  next();
};

module.exports = ipWhitelist;
`;

  const filePath = path.join(process.cwd(), 'middleware', 'ipWhitelist.js');
  
  // Criar diretório se não existe
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, middlewareCode);
  console.log(`   ✅ Middleware criado: ${filePath}`);
}

// 4. Gerar configuração das exchanges
function generateExchangeConfig() {
  console.log('\n⚙️ GERANDO CONFIGURAÇÃO DAS EXCHANGES...');
  
  const configCode = `
/**
 * Configuração das APIs das Exchanges com IP fixo
 * Railway IP: ${RAILWAY_IP}
 */

const exchangeConfig = {
  // Railway Configuration
  railway: {
    ip: '${RAILWAY_IP}',
    environment: process.env.NODE_ENV || 'development',
    region: 'us-west-2'
  },

  // Binance Configuration
  binance: {
    apiKey: process.env.BINANCE_API_KEY,
    secretKey: process.env.BINANCE_SECRET_KEY,
    
    // URLs baseadas no ambiente
    baseURL: process.env.USE_TESTNET === 'true' 
      ? '${exchangeConfig.binance.testnet}'
      : '${exchangeConfig.binance.mainnet}',
    
    futuresURL: process.env.USE_TESTNET === 'true'
      ? '${exchangeConfig.binance.futuresTestnet}'
      : '${exchangeConfig.binance.futuresMainnet}',
    
    // Configurações de segurança
    allowedIPs: ['${RAILWAY_IP}'],
    ipCheckEnabled: true,
    
    // Headers padrão
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'CoinBitClub-Bot/1.0',
      'X-Source-IP': '${RAILWAY_IP}',
      'X-Railway-Service': 'coinbitclub-market-bot'
    },
    
    // Timeouts
    timeout: 10000,
    retries: 3
  },

  // Bybit Configuration  
  bybit: {
    apiKey: process.env.BYBIT_API_KEY,
    secretKey: process.env.BYBIT_SECRET_KEY,
    
    // URLs baseadas no ambiente
    baseURL: process.env.USE_TESTNET === 'true'
      ? '${exchangeConfig.bybit.testnet}'
      : '${exchangeConfig.bybit.mainnet}',
    
    // Configurações de segurança
    allowedIPs: ['${RAILWAY_IP}'],
    ipCheckEnabled: true,
    
    // Headers padrão
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'CoinBitClub-Bot/1.0',
      'X-Source-IP': '${RAILWAY_IP}',
      'X-Railway-Service': 'coinbitclub-market-bot'
    },
    
    // Timeouts
    timeout: 10000,
    retries: 3
  }
};

// Função para obter headers específicos da exchange
function getExchangeHeaders(exchange, apiKey, additionalHeaders = {}) {
  const config = exchangeConfig[exchange];
  if (!config) {
    throw new Error(\`Exchange não suportada: \${exchange}\`);
  }

  const headers = { ...config.headers, ...additionalHeaders };

  if (exchange === 'binance') {
    headers['X-MBX-APIKEY'] = apiKey;
  } else if (exchange === 'bybit') {
    headers['X-BAPI-API-KEY'] = apiKey;
  }

  return headers;
}

// Função para validar configuração
function validateExchangeConfig(exchange) {
  const config = exchangeConfig[exchange];
  
  if (!config) {
    throw new Error(\`Configuração não encontrada para: \${exchange}\`);
  }

  if (!config.apiKey || !config.secretKey) {
    throw new Error(\`API Keys não configuradas para: \${exchange}\`);
  }

  console.log(\`✅ Configuração válida para \${exchange}\`);
  return true;
}

module.exports = {
  exchangeConfig,
  getExchangeHeaders,
  validateExchangeConfig
};
`;

  const filePath = path.join(process.cwd(), 'config', 'exchanges.js');
  
  // Criar diretório se não existe
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, configCode);
  console.log(`   ✅ Configuração criada: ${filePath}`);
}

// 5. Gerar script de teste
function generateTestScript() {
  console.log('\n🧪 GERANDO SCRIPT DE TESTE...');
  
  const testCode = `
#!/usr/bin/env node
/**
 * Script de teste para verificar conectividade com exchanges
 * Usa IP fixo Railway: ${RAILWAY_IP}
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

// Configuração
const RAILWAY_IP = '${RAILWAY_IP}';
const exchanges = ${JSON.stringify(exchangeConfig, null, 2)};

// Função para testar conectividade básica
async function testBasicConnectivity() {
  console.log('🔍 TESTE DE CONECTIVIDADE BÁSICA');
  console.log('-'.repeat(40));
  
  // Verificar IP atual
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    console.log(\`📍 IP Atual: \${ipData.ip}\`);
    console.log(\`📌 IP Esperado: \${RAILWAY_IP}\`);
    console.log(\`✅ Match: \${ipData.ip === RAILWAY_IP ? 'SIM' : 'NÃO'}\`);
  } catch (error) {
    console.log(\`❌ Erro ao verificar IP: \${error.message}\`);
  }
  
  // Testar Binance
  try {
    console.log('\\n📊 Testando Binance...');
    const response = await fetch('https://api.binance.com/api/v3/ping');
    if (response.ok) {
      console.log('   ✅ Binance: Conectividade OK');
      
      // Teste de tempo do servidor
      const timeResponse = await fetch('https://api.binance.com/api/v3/time');
      const timeData = await timeResponse.json();
      console.log(\`   ⏰ Server Time: \${new Date(timeData.serverTime).toISOString()}\`);
    } else {
      console.log(\`   ❌ Binance: HTTP \${response.status}\`);
    }
  } catch (error) {
    console.log(\`   ❌ Binance: \${error.message}\`);
  }
  
  // Testar Bybit
  try {
    console.log('\\n📊 Testando Bybit...');
    const response = await fetch('https://api.bybit.com/v5/market/time');
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Bybit: Conectividade OK');
      console.log(\`   ⏰ Server Time: \${new Date(parseInt(data.time)).toISOString()}\`);
    } else {
      console.log(\`   ❌ Bybit: HTTP \${response.status}\`);
    }
  } catch (error) {
    console.log(\`   ❌ Bybit: \${error.message}\`);
  }
}

// Função para testar API keys (se configuradas)
async function testAPIKeys() {
  console.log('\\n🔑 TESTE DE API KEYS');
  console.log('-'.repeat(40));
  
  const binanceKey = process.env.BINANCE_API_KEY;
  const bybitKey = process.env.BYBIT_API_KEY;
  
  if (!binanceKey && !bybitKey) {
    console.log('⚠️  Nenhuma API Key configurada - pulando testes');
    return;
  }
  
  // Teste Binance API Key
  if (binanceKey) {
    try {
      console.log('📊 Testando Binance API Key...');
      
      const timestamp = Date.now();
      const queryString = \`timestamp=\${timestamp}\`;
      const signature = crypto
        .createHmac('sha256', process.env.BINANCE_SECRET_KEY || '')
        .update(queryString)
        .digest('hex');
      
      const response = await fetch(
        \`https://api.binance.com/api/v3/account?\${queryString}&signature=\${signature}\`,
        {
          headers: {
            'X-MBX-APIKEY': binanceKey,
            'X-Source-IP': RAILWAY_IP
          }
        }
      );
      
      if (response.ok) {
        console.log('   ✅ Binance API Key: Válida');
      } else {
        const error = await response.text();
        console.log(\`   ❌ Binance API Key: \${response.status} - \${error}\`);
      }
    } catch (error) {
      console.log(\`   ❌ Binance API Test: \${error.message}\`);
    }
  }
  
  // Teste Bybit API Key  
  if (bybitKey) {
    try {
      console.log('📊 Testando Bybit API Key...');
      
      const timestamp = Date.now().toString();
      const params = { accountType: 'UNIFIED' };
      const queryString = Object.keys(params)
        .sort()
        .map(key => \`\${key}=\${params[key]}\`)
        .join('&');
      
      const signString = \`\${timestamp}\${bybitKey}\${queryString}\`;
      const signature = crypto
        .createHmac('sha256', process.env.BYBIT_SECRET_KEY || '')
        .update(signString)
        .digest('hex');
      
      const response = await fetch(
        \`https://api.bybit.com/v5/account/wallet-balance?\${queryString}\`,
        {
          headers: {
            'X-BAPI-API-KEY': bybitKey,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-SIGN': signature,
            'X-Source-IP': RAILWAY_IP
          }
        }
      );
      
      if (response.ok) {
        console.log('   ✅ Bybit API Key: Válida');
      } else {
        const error = await response.text();
        console.log(\`   ❌ Bybit API Key: \${response.status} - \${error}\`);
      }
    } catch (error) {
      console.log(\`   ❌ Bybit API Test: \${error.message}\`);
    }
  }
}

// Função principal
async function runTests() {
  console.log('🎯 TESTE DE CONFIGURAÇÃO IP FIXO - TRADING AUTOMÁTICO');
  console.log('=' .repeat(60));
  console.log(\`📅 \${new Date().toISOString()}\`);
  console.log(\`🌐 IP Railway: \${RAILWAY_IP}\`);
  
  await testBasicConnectivity();
  await testAPIKeys();
  
  console.log('\\n✅ TESTES CONCLUÍDOS');
  console.log('=' .repeat(60));
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testBasicConnectivity,
  testAPIKeys,
  runTests
};
`;

  const filePath = path.join(process.cwd(), 'scripts', 'test-exchange-connectivity.js');
  
  // Criar diretório se não existe
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, testCode);
  console.log(`   ✅ Script de teste criado: ${filePath}`);
  
  // Tornar executável no Unix
  if (process.platform !== 'win32') {
    fs.chmodSync(filePath, '755');
  }
}

// 6. Gerar arquivo de variáveis de ambiente
function generateEnvironmentFile() {
  console.log('\n📋 GERANDO ARQUIVO DE VARIÁVEIS DE AMBIENTE...');
  
  const envContent = `# 🎯 CONFIGURAÇÃO IP FIXO - TRADING AUTOMÁTICO
# Railway IP: ${RAILWAY_IP}
# Data: ${new Date().toISOString()}

# ===== RAILWAY CONFIGURATION =====
NODE_ENV=production
PORT=8080
RAILWAY_STATIC_IP=${RAILWAY_IP}

# ===== EXCHANGE CONFIGURATION =====
# Use testnet para testes, produção para trading real
USE_TESTNET=false

# IPs permitidos para exchanges
BINANCE_ALLOWED_IPS=${RAILWAY_IP}
BYBIT_ALLOWED_IPS=${RAILWAY_IP}

# ===== BINANCE API =====
# Configure suas próprias chaves em: https://binance.com/en/my/settings/api-management
BINANCE_API_KEY=sua_binance_api_key_aqui
BINANCE_SECRET_KEY=sua_binance_secret_key_aqui

# ===== BYBIT API =====
# Configure suas próprias chaves em: https://bybit.com/app/user/api-management
BYBIT_API_KEY=sua_bybit_api_key_aqui
BYBIT_SECRET_KEY=sua_bybit_secret_key_aqui

# ===== SECURITY =====
JWT_SECRET=sua_jwt_secret_super_forte_aqui
SYSTEM_API_KEY=sua_system_api_key_aqui
ENCRYPTION_KEY=sua_encryption_key_32_chars_aqui

# ===== CORS =====
FRONTEND_URL=https://coinbitclub-market-bot.vercel.app
BACKEND_URL=https://coinbitclub-market-bot.up.railway.app
ALLOWED_ORIGINS=https://coinbitclub-market-bot.vercel.app,https://coinbitclub-market-bot.up.railway.app

# ===== DATABASE =====
# Configure no Railway: https://railway.app/dashboard
DATABASE_URL=sua_database_url_postgresql_aqui

# ===== MONITORING =====
LOG_LEVEL=info
SAVE_EXCHANGE_LOGS=true
MONITOR_IP_CHANGES=true

# ===== TRADINGVIEW WEBHOOK =====
TRADINGVIEW_WEBHOOK_SECRET=210406
WEBHOOK_TOKEN=210406

# ===== NOTIFICAÇÕES =====
# WhatsApp Z-API
ZAPI_INSTANCE=sua_zapi_instance
ZAPI_TOKEN=sua_zapi_token

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_app_password

# ===== INTEGRATIONS =====
# OpenAI
OPENAI_API_KEY=sua_openai_api_key

# CoinStats
COINSTATS_API_KEY=sua_coinstats_api_key

# Stripe
STRIPE_SECRET_KEY=sua_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=sua_stripe_publishable_key
`;

  const filePath = path.join(process.cwd(), '.env.railway');
  fs.writeFileSync(filePath, envContent);
  console.log(`   ✅ Arquivo de ambiente criado: ${filePath}`);
  
  // Criar também .env.example
  const examplePath = path.join(process.cwd(), '.env.example');
  fs.writeFileSync(examplePath, envContent);
  console.log(`   ✅ Exemplo criado: ${examplePath}`);
}

// 7. Gerar instruções para as exchanges
function generateExchangeInstructions() {
  console.log('\n📖 GERANDO INSTRUÇÕES PARA CONFIGURAÇÃO NAS EXCHANGES...');
  
  const instructions = `# 🎯 INSTRUÇÕES PARA CONFIGURAR IP FIXO NAS EXCHANGES

## IP FIXO RAILWAY
\`\`\`
${RAILWAY_IP}
\`\`\`

## 🟡 BINANCE

### 1. Acesso às Configurações
1. Faça login em: https://binance.com/
2. Vá para: Profile → API Management
3. Selecione sua API Key ou crie uma nova

### 2. Configurar IP Whitelist
1. Clique em "Edit restrictions" na sua API Key
2. Enable "Restrict access to trusted IPs only"
3. Adicionar IP: \`${RAILWAY_IP}\`
4. Salvar alterações

### 3. Permissões Necessárias
- ✅ Enable Reading
- ✅ Enable Futures (para trading de futuros)
- ✅ Enable Spot & Margin Trading (opcional)

### 4. Testar Configuração
\`\`\`bash
curl -X GET 'https://api.binance.com/api/v3/ping'
\`\`\`

---

## 🟣 BYBIT

### 1. Acesso às Configurações
1. Faça login em: https://bybit.com/
2. Vá para: Profile → API Management
3. Selecione sua API Key ou crie uma nova

### 2. Configurar IP Whitelist
1. Clique em "Edit" na sua API Key
2. Enable "IP Restriction"
3. Adicionar IP: \`${RAILWAY_IP}\`
4. Salvar alterações

### 3. Permissões Necessárias
- ✅ Read (consultar dados da conta)
- ✅ Trade (executar ordens)
- ✅ Wallet (consultar saldo)

### 4. Testar Configuração
\`\`\`bash
curl -X GET 'https://api.bybit.com/v5/market/time'
\`\`\`

---

## 🚨 PONTOS IMPORTANTES

### Segurança
- ⚠️ Nunca compartilhe suas API keys
- ⚠️ Use apenas o IP ${RAILWAY_IP}
- ⚠️ Monitore os logs de acesso

### Timing
- ⏱️ Aguarde até 5 minutos para propagação das configurações
- ⏱️ Teste antes de usar em produção
- ⏱️ Mantenha backup das configurações

### Troubleshooting
- 🔍 Verifique se o IP está exatamente: ${RAILWAY_IP}
- 🔍 Confirme que as permissões estão habilitadas
- 🔍 Teste primeiro com pequenos valores

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### Binance
- [ ] API Key criada
- [ ] IP ${RAILWAY_IP} adicionado na whitelist
- [ ] Permissões "Reading" e "Futures" habilitadas
- [ ] Teste de conectividade realizado

### Bybit
- [ ] API Key criada
- [ ] IP ${RAILWAY_IP} adicionado na whitelist
- [ ] Permissões "Read", "Trade" e "Wallet" habilitadas
- [ ] Teste de conectividade realizado

### Railway
- [ ] Variáveis de ambiente configuradas
- [ ] IP ${RAILWAY_IP} confirmado
- [ ] Script de teste executado
- [ ] Logs monitorados

---

## 🆘 SUPORTE

Em caso de problemas:
1. Verificar logs do Railway
2. Executar script de teste: \`npm run test:exchanges\`
3. Verificar configurações nas exchanges
4. Aguardar propagação (até 5 minutos)
`;

  const filePath = path.join(process.cwd(), 'INSTRUCOES-EXCHANGES.md');
  fs.writeFileSync(filePath, instructions);
  console.log(`   ✅ Instruções criadas: ${filePath}`);
}

// 8. Função principal
async function main() {
  try {
    // Verificar IP atual
    const currentIP = await checkCurrentIP();
    
    // Testar conectividade
    await testExchangeConnectivity();
    
    // Gerar arquivos de configuração
    generateIPMiddleware();
    generateExchangeConfig();
    generateTestScript();
    generateEnvironmentFile();
    generateExchangeInstructions();
    
    console.log('\n🎉 CONFIGURAÇÃO IP FIXO CONCLUÍDA!');
    console.log('=' .repeat(60));
    console.log(`📍 IP Railway: ${RAILWAY_IP}`);
    console.log(`🌐 IP Atual: ${currentIP}`);
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Configure as API keys nas variáveis de ambiente');
    console.log('2. Configure IP whitelist nas exchanges (ver INSTRUCOES-EXCHANGES.md)');
    console.log('3. Execute o teste: node scripts/test-exchange-connectivity.js');
    console.log('4. Monitore os logs por 24h');
    console.log('\n✅ Todos os arquivos foram criados!');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  RAILWAY_IP,
  exchangeConfig,
  checkCurrentIP,
  testExchangeConnectivity
};
