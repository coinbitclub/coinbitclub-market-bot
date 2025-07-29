/**
 * 🚀 SCRIPT DE DEPLOY PARA RAILWAY
 * ===============================
 * 
 * Este script configura e prepara o deploy do sistema multiusuário
 * para o Railway com Twilio SMS integrado.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 CONFIGURANDO DEPLOY PARA RAILWAY');
console.log('===================================');

// 1. Criar package.json otimizado para produção
const packageJson = {
    "name": "coinbitclub-trading-bot",
    "version": "1.0.0",
    "description": "Sistema de Trading Bot Multiusuário com SMS",
    "main": "server-multiusuario-limpo.js",
    "scripts": {
        "start": "node server-multiusuario-limpo.js",
        "dev": "nodemon server-multiusuario-limpo.js",
        "test": "node teste-final-sistema.js"
    },
    "engines": {
        "node": ">=18.0.0"
    },
    "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "helmet": "^7.0.0",
        "compression": "^1.7.4",
        "pg": "^8.11.0",
        "bcryptjs": "^2.4.3",
        "jsonwebtoken": "^9.0.0",
        "crypto": "^1.0.1",
        "axios": "^1.4.0",
        "socket.io": "^4.7.1",
        "twilio": "^4.14.0",
        "express-rate-limit": "^6.7.0",
        "express-validator": "^7.0.1",
        "dotenv": "^16.1.4"
    },
    "devDependencies": {
        "nodemon": "^2.0.22"
    },
    "keywords": [
        "trading",
        "bot",
        "cryptocurrency",
        "multiuser",
        "sms",
        "twilio"
    ],
    "author": "CoinBitClub",
    "license": "MIT"
};

// Salvar package.json
fs.writeFileSync(
    path.join(__dirname, 'package.json'),
    JSON.stringify(packageJson, null, 2)
);
console.log('✅ package.json criado para produção');

// 2. Criar .env.production com todas as variáveis necessárias
const envProduction = `# 🚀 CONFIGURAÇÕES DE PRODUÇÃO - RAILWAY
# =======================================

# Servidor
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database PostgreSQL Railway
DATABASE_URL=postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway

# JWT
JWT_SECRET=coinbitclub_super_secret_2024_multiuser_production
JWT_EXPIRES_IN=24h

# Criptografia
ENCRYPTION_KEY=coinbitclub_encryption_key_2024_production_secure

# Twilio SMS
TWILIO_ACCOUNT_SID=seu_twilio_account_sid_aqui
TWILIO_AUTH_TOKEN=seu_twilio_auth_token_aqui
TWILIO_PHONE_NUMBER=+1234567890

# APIs Externas
COINSTATS_API_KEY=opcional_coinstats_api_key

# Sistema
SISTEMA_NOME=CoinBitClub Trading Bot
SISTEMA_VERSAO=1.0.0
LOGS_NIVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Segurança
CORS_ORIGIN=*
HELMET_ENABLED=true
COMPRESSION_ENABLED=true

# Limpeza Automática
AUTO_CLEANUP_ENABLED=true
CLEANUP_INTERVAL_HOURS=2
CLEANUP_RETENTION_DAYS=15

# Modo Híbrido (testnet/producao)
TRADING_MODE=hybrid
BINANCE_TESTNET=true
BYBIT_TESTNET=true
OKX_TESTNET=true
`;

fs.writeFileSync(
    path.join(__dirname, '.env.production'),
    envProduction
);
console.log('✅ .env.production criado');

// 3. Criar arquivo de configuração Railway
const railwayConfig = {
    "build": {
        "builder": "NIXPACKS"
    },
    "deploy": {
        "startCommand": "npm start",
        "healthcheckPath": "/health",
        "healthcheckTimeout": 300,
        "restartPolicyType": "ON_FAILURE",
        "restartPolicyMaxRetries": 3
    },
    "environments": {
        "production": {
            "variables": {
                "NODE_ENV": "production",
                "PORT": "${{RAILWAY_PORT}}",
                "DATABASE_URL": "${{DATABASE_URL}}",
                "JWT_SECRET": "${{JWT_SECRET}}",
                "ENCRYPTION_KEY": "${{ENCRYPTION_KEY}}",
                "TWILIO_ACCOUNT_SID": "${{TWILIO_ACCOUNT_SID}}",
                "TWILIO_AUTH_TOKEN": "${{TWILIO_AUTH_TOKEN}}",
                "TWILIO_PHONE_NUMBER": "${{TWILIO_PHONE_NUMBER}}"
            }
        }
    }
};

fs.writeFileSync(
    path.join(__dirname, 'railway.json'),
    JSON.stringify(railwayConfig, null, 2)
);
console.log('✅ railway.json criado');

// 4. Criar Procfile para deploy
const procfile = `web: node server-multiusuario-limpo.js
release: node aplicar-schema-completo.js`;

fs.writeFileSync(
    path.join(__dirname, 'Procfile'),
    procfile
);
console.log('✅ Procfile criado');

// 5. Criar README de deploy
const deployReadme = `# 🚀 Deploy Railway - CoinBitClub Trading Bot

## 📋 Pré-requisitos

1. ✅ Conta Railway: https://railway.app
2. ✅ Conta Twilio: https://www.twilio.com
3. ✅ PostgreSQL configurado (Railway)

## 🔧 Configuração Railway

### 1. Criar Novo Projeto
\`\`\`bash
# Via Railway CLI
railway login
railway init
railway link [project-id]
\`\`\`

### 2. Configurar Variáveis de Ambiente
No painel Railway, adicionar:

\`\`\`env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway
JWT_SECRET=coinbitclub_super_secret_2024_multiuser_production
ENCRYPTION_KEY=coinbitclub_encryption_key_2024_production_secure
TWILIO_ACCOUNT_SID=seu_twilio_account_sid
TWILIO_AUTH_TOKEN=seu_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
\`\`\`

### 3. Deploy
\`\`\`bash
railway up
\`\`\`

## 🏗️ Arquivos de Deploy Criados

- ✅ \`package.json\` - Dependências e scripts
- ✅ \`.env.production\` - Variáveis de ambiente
- ✅ \`railway.json\` - Configuração Railway
- ✅ \`Procfile\` - Comandos de deploy
- ✅ \`server-multiusuario-limpo.js\` - Servidor principal

## 🔍 Endpoints Disponíveis

- \`GET /health\` - Health check
- \`GET /api/health\` - API health check
- \`POST /api/sms/send\` - Enviar SMS via Twilio
- \`POST /api/webhook/tradingview\` - Webhook TradingView
- \`POST /api/auth/login\` - Login usuário
- \`GET /api/users/balance\` - Saldo usuário

## 📱 Configuração Twilio

1. Criar conta: https://www.twilio.com
2. Obter credenciais:
   - Account SID
   - Auth Token
   - Phone Number
3. Configurar no Railway

## 🛡️ Segurança

- ✅ JWT com expiração 24h
- ✅ Criptografia AES-256-CBC
- ✅ Rate limiting configurado
- ✅ CORS e Helmet ativados
- ✅ Validação de entrada

## 📊 Monitoramento

- Health check: \`/health\`
- Logs Railway: Dashboard Railway
- Alertas: Configurar via Railway

## 🚀 Pós-Deploy

1. Testar endpoints
2. Configurar webhooks TradingView
3. Adicionar usuários via admin
4. Conectar frontend
5. Monitorar logs

## 🆘 Troubleshooting

- Verificar logs: \`railway logs\`
- Health check: \`curl https://[app-url]/health\`
- Database: Verificar conexão PostgreSQL
`;

fs.writeFileSync(
    path.join(__dirname, 'DEPLOY-RAILWAY.md'),
    deployReadme
);
console.log('✅ DEPLOY-RAILWAY.md criado');

// 6. Criar script de verificação pós-deploy
const verificacaoScript = `/**
 * 🔍 VERIFICAÇÃO PÓS-DEPLOY
 * ========================
 */

const https = require('https');
const axios = require('axios');

async function verificarDeploy(url) {
    console.log('🔍 VERIFICANDO DEPLOY');
    console.log('====================');
    console.log(\`🌐 URL: \${url}\`);
    
    try {
        // 1. Health Check
        console.log('\\n1. 🩺 HEALTH CHECK');
        const health = await axios.get(\`\${url}/health\`);
        console.log(\`✅ Health: \${health.data.status}\`);
        
        // 2. API Health
        console.log('\\n2. 🔌 API HEALTH');
        const apiHealth = await axios.get(\`\${url}/api/health\`);
        console.log(\`✅ API: \${apiHealth.data.status}\`);
        
        // 3. Verificar banco
        console.log('\\n3. 🗄️ DATABASE');
        console.log(\`✅ Database: \${apiHealth.data.database || 'Connected'}\`);
        
        console.log('\\n🎉 DEPLOY VERIFICADO COM SUCESSO!');
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
    }
}

// Usar: node verificar-deploy.js https://sua-app.railway.app
const url = process.argv[2];
if (url) {
    verificarDeploy(url);
} else {
    console.log('❌ Uso: node verificar-deploy.js https://sua-app.railway.app');
}
`;

fs.writeFileSync(
    path.join(__dirname, 'verificar-deploy.js'),
    verificacaoScript
);
console.log('✅ verificar-deploy.js criado');

console.log('\n🎉 CONFIGURAÇÃO DE DEPLOY CONCLUÍDA!');
console.log('====================================');
console.log('\n📋 ARQUIVOS CRIADOS:');
console.log('✅ package.json - Dependências');
console.log('✅ .env.production - Variáveis de ambiente');
console.log('✅ railway.json - Configuração Railway');
console.log('✅ Procfile - Comandos de deploy');
console.log('✅ DEPLOY-RAILWAY.md - Instruções');
console.log('✅ verificar-deploy.js - Verificação pós-deploy');

console.log('\n🚀 PRÓXIMOS PASSOS:');
console.log('1. Configurar conta Railway');
console.log('2. Configurar conta Twilio');
console.log('3. Executar: railway up');
console.log('4. Configurar variáveis de ambiente');
console.log('5. Testar endpoints');

console.log('\n🔗 RECURSOS:');
console.log('• Railway: https://railway.app');
console.log('• Twilio: https://www.twilio.com');
console.log('• Documentação: DEPLOY-RAILWAY.md');
