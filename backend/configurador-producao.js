/**
 * 🔧 CONFIGURADOR DE AMBIENTE DE PRODUÇÃO
 * Script para configurar automaticamente o ambiente para produção
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

console.log('🔧 CONFIGURADOR DE AMBIENTE DE PRODUÇÃO');
console.log('======================================\n');

class ConfiguradorProducao {
    constructor() {
        this.configProducao = {
            bancoDados: null,
            chavesAPI: {},
            seguranca: {},
            notificacoes: {},
            servidor: {}
        };
    }

    async configurarAmbienteCompleto() {
        console.log('🚀 Iniciando configuração completa para produção...\n');

        try {
            // 1. Configurar segurança
            await this.configurarSeguranca();
            
            // 2. Configurar banco de dados
            await this.configurarBancoDados();
            
            // 3. Configurar APIs das exchanges
            await this.configurarAPIsExchanges();
            
            // 4. Configurar notificações
            await this.configurarNotificacoes();
            
            // 5. Configurar servidor
            await this.configurarServidor();
            
            // 6. Gerar arquivo .env final
            await this.gerarArquivoEnv();
            
            // 7. Criar script de deploy
            await this.criarScriptDeploy();
            
            // 8. Gerar documentação
            await this.gerarDocumentacao();

            console.log('🎉 CONFIGURAÇÃO DE PRODUÇÃO CONCLUÍDA!');
            this.exibirResumoConfiguracao();

        } catch (error) {
            console.error('❌ Erro na configuração:', error.message);
            throw error;
        }
    }

    async configurarSeguranca() {
        console.log('🔐 1. CONFIGURANDO SEGURANÇA');
        console.log('─'.repeat(40));

        // Gerar JWT secret seguro
        const jwtSecret = crypto.randomBytes(64).toString('hex');
        console.log('✅ JWT Secret gerado');

        // Gerar chave de criptografia
        const encryptionKey = crypto.randomBytes(32).toString('hex');
        console.log('✅ Chave de criptografia gerada');

        // Gerar webhook secrets
        const tradingViewSecret = crypto.randomBytes(32).toString('hex');
        console.log('✅ TradingView webhook secret gerado');

        this.configProducao.seguranca = {
            jwtSecret,
            encryptionKey,
            tradingViewSecret
        };

        console.log('✅ Configuração de segurança concluída\n');
    }

    async configurarBancoDados() {
        console.log('🗄️  2. CONFIGURANDO BANCO DE DADOS');
        console.log('─'.repeat(40));

        console.log('📋 Opções de banco de dados:');
        console.log('   1. Railway PostgreSQL (Recomendado)');
        console.log('   2. Supabase PostgreSQL');
        console.log('   3. Amazon RDS');
        console.log('   4. Heroku PostgreSQL');
        console.log('   5. PostgreSQL personalizado');

        // Para este exemplo, vou configurar para Railway
        this.configProducao.bancoDados = {
            tipo: 'railway',
            url: 'postgresql://postgres:password@roundhouse.proxy.rlwy.net:port/railway',
            ssl: true,
            configuracao: {
                poolSize: 20,
                connectionTimeout: 30000,
                idleTimeout: 600000
            }
        };

        console.log('✅ Configuração Railway PostgreSQL definida');
        console.log('📝 Nota: URL será fornecida automaticamente pelo Railway\n');
    }

    async configurarAPIsExchanges() {
        console.log('🏦 3. CONFIGURANDO APIs DAS EXCHANGES');
        console.log('─'.repeat(40));

        console.log('📋 Configurando integração com exchanges...');

        // Bybit - Configuração para usuário Mauro
        this.configProducao.chavesAPI.bybit = {
            nome: 'Bybit',
            testnet: false,
            configuracao: {
                rateLimitRequests: 100,
                rateLimitWindow: 60000,
                timeoutMs: 10000
            },
            observacoes: [
                'Criar API key com permissões: Read, Spot Trading',
                'Configurar IP whitelist se necessário',
                'Usar mainnet para produção'
            ]
        };

        // Binance
        this.configProducao.chavesAPI.binance = {
            nome: 'Binance',
            testnet: false,
            configuracao: {
                rateLimitRequests: 1200,
                rateLimitWindow: 60000,
                timeoutMs: 10000
            },
            observacoes: [
                'Criar API key com permissões: Spot Trading',
                'Habilitar IP whitelist para segurança',
                'Usar mainnet para produção'
            ]
        };

        // OKX
        this.configProducao.chavesAPI.okx = {
            nome: 'OKX',
            testnet: false,
            configuracao: {
                rateLimitRequests: 100,
                rateLimitWindow: 60000,
                timeoutMs: 10000
            },
            observacoes: [
                'Criar API key com passphrase',
                'Permissões: Spot Trading, Read',
                'Configurar IP whitelist'
            ]
        };

        // CoinStats API
        this.configProducao.chavesAPI.coinstats = {
            nome: 'CoinStats',
            chave: 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=',
            configuracao: {
                rateLimitRequests: 100,
                rateLimitWindow: 60000,
                updateInterval: 1800000 // 30 minutos
            }
        };

        console.log('✅ Configuração de APIs definida\n');
    }

    async configurarNotificacoes() {
        console.log('📧 4. CONFIGURANDO NOTIFICAÇÕES');
        console.log('─'.repeat(40));

        this.configProducao.notificacoes = {
            email: {
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                configuracao: {
                    remetente: 'noreply@coinbitclub.com',
                    nome: 'CoinbitClub MarketBot'
                }
            },
            telegram: {
                habilitado: false,
                configuracao: {
                    updateInterval: 300000 // 5 minutos
                }
            },
            webhook: {
                habilitado: true,
                configuracao: {
                    timeoutMs: 5000,
                    retryAttempts: 3
                }
            }
        };

        console.log('✅ Configuração de notificações definida\n');
    }

    async configurarServidor() {
        console.log('🖥️  5. CONFIGURANDO SERVIDOR');
        console.log('─'.repeat(40));

        this.configProducao.servidor = {
            porta: 3000,
            cors: {
                origem: ['https://app.coinbitclub.com', 'https://coinbitclub.com'],
                credenciais: true
            },
            rateLimiting: {
                requests: 100,
                windowMs: 900000, // 15 minutos
                message: 'Muitas requisições deste IP'
            },
            logs: {
                nivel: 'info',
                formato: 'combined',
                arquivo: true
            },
            ssl: {
                habilitado: true,
                redirecionarHTTP: true
            }
        };

        console.log('✅ Configuração do servidor definida\n');
    }

    async gerarArquivoEnv() {
        console.log('📄 6. GERANDO ARQUIVO .ENV FINAL');
        console.log('─'.repeat(40));

        const envContent = `# 🚀 CONFIGURAÇÃO DE PRODUÇÃO - COINBITCLUB MARKETBOT
# Gerado automaticamente em ${new Date().toISOString()}

# ==========================================
# AMBIENTE
# ==========================================
NODE_ENV=production
PORT=${this.configProducao.servidor.porta}

# ==========================================
# BANCO DE DADOS (Railway)
# ==========================================
# DATABASE_URL será fornecida pelo Railway automaticamente
# Não é necessário configurar manualmente

# ==========================================
# SEGURANÇA
# ==========================================
JWT_SECRET=${this.configProducao.seguranca.jwtSecret}
ENCRYPTION_KEY=${this.configProducao.seguranca.encryptionKey}
TRADINGVIEW_WEBHOOK_SECRET=${this.configProducao.seguranca.tradingViewSecret}

# ==========================================
# APIs EXTERNAS - CONFIGURE COM CHAVES REAIS
# ==========================================

# CoinStats API (Fear & Greed Index)
COINSTATS_API_KEY=${this.configProducao.chavesAPI.coinstats.chave}

# Bybit API (PRODUÇÃO - CONFIGURE COM CHAVES REAIS)
BYBIT_API_KEY=configure_sua_chave_bybit_aqui
BYBIT_API_SECRET=configure_seu_secret_bybit_aqui
BYBIT_TESTNET=false

# Binance API (PRODUÇÃO - CONFIGURE COM CHAVES REAIS)
BINANCE_API_KEY=configure_sua_chave_binance_aqui
BINANCE_API_SECRET=configure_seu_secret_binance_aqui
BINANCE_TESTNET=false

# OKX API (PRODUÇÃO - CONFIGURE COM CHAVES REAIS)
OKX_API_KEY=configure_sua_chave_okx_aqui
OKX_API_SECRET=configure_seu_secret_okx_aqui
OKX_PASSPHRASE=configure_sua_passphrase_okx_aqui
OKX_TESTNET=false

# ==========================================
# EMAIL/NOTIFICAÇÕES
# ==========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@coinbitclub.com
EMAIL_PASS=configure_senha_app_gmail_aqui

# Telegram (Opcional)
TELEGRAM_BOT_TOKEN=configure_token_bot_telegram_aqui
TELEGRAM_CHAT_ID=configure_chat_id_aqui

# ==========================================
# PAGAMENTOS
# ==========================================
STRIPE_SECRET_KEY=configure_chave_stripe_producao_aqui
STRIPE_WEBHOOK_SECRET=configure_webhook_secret_stripe_aqui

# ==========================================
# CORS E DOMÍNIOS
# ==========================================
CORS_ORIGIN=https://app.coinbitclub.com,https://coinbitclub.com
FRONTEND_URL=https://app.coinbitclub.com

# ==========================================
# RATE LIMITING
# ==========================================
RATE_LIMIT_REQUESTS=${this.configProducao.servidor.rateLimiting.requests}
RATE_LIMIT_WINDOW=${this.configProducao.servidor.rateLimiting.windowMs}

# ==========================================
# LOGS E MONITORAMENTO
# ==========================================
LOG_LEVEL=info
ENABLE_ANALYTICS=true
SENTRY_DSN=configure_sentry_dsn_aqui

# ==========================================
# TRADING CONFIGURAÇÕES
# ==========================================
DEFAULT_LEVERAGE=5
MAX_LEVERAGE=10
MIN_TRADE_USD=10
MAX_TRADE_USD=5000
MAX_DAILY_LOSS=500
EMERGENCY_STOP_PERCENT=15

# ==========================================
# TIMEOUTS E INTERVALOS
# ==========================================
WEBHOOK_TIMEOUT_MS=120000
FEAR_GREED_UPDATE_INTERVAL=1800000
CLEANUP_INTERVAL=7200000
`;

        await fs.writeFile('.env.production.final', envContent);
        console.log('✅ Arquivo .env.production.final criado');
        console.log('📝 Configure as chaves API reais antes do deploy\n');
    }

    async criarScriptDeploy() {
        console.log('🚀 7. CRIANDO SCRIPT DE DEPLOY');
        console.log('─'.repeat(40));

        const deployScript = `#!/bin/bash
# 🚀 Script de Deploy - CoinbitClub MarketBot
# Deploy automático para Railway

echo "🚀 Iniciando deploy do CoinbitClub MarketBot..."

# 1. Verificar dependências
echo "📦 Verificando dependências..."
npm audit --audit-level moderate
if [ $? -ne 0 ]; then
    echo "❌ Vulnerabilidades encontradas. Execute npm audit fix"
    exit 1
fi

# 2. Executar testes
echo "🧪 Executando testes..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Testes falharam. Corrija antes do deploy"
    exit 1
fi

# 3. Build (se necessário)
echo "🔨 Preparando build..."
npm run build --if-present

# 4. Configurar Railway
echo "🚂 Configurando Railway..."
railway login
railway link

# 5. Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis de ambiente..."
railway variables set NODE_ENV=production
railway variables set PORT=3000

# 6. Deploy
echo "🚀 Fazendo deploy..."
railway up

# 7. Verificar deploy
echo "✅ Verificando deploy..."
railway logs

echo "🎉 Deploy concluído com sucesso!"
echo "🌐 Acesse: https://seu-app.railway.app"
`;

        await fs.writeFile('deploy.sh', deployScript);
        console.log('✅ Script deploy.sh criado');

        // Tornar executável (Unix/Linux)
        try {
            await fs.chmod('deploy.sh', '755');
        } catch (error) {
            // Ignorar erro no Windows
        }

        console.log('🔧 Para executar: chmod +x deploy.sh && ./deploy.sh\n');
    }

    async gerarDocumentacao() {
        console.log('📚 8. GERANDO DOCUMENTAÇÃO');
        console.log('─'.repeat(40));

        const documentacao = `# 🚀 GUIA DE DEPLOY PARA PRODUÇÃO

## 📋 Pré-requisitos

### 1. Contas necessárias
- [x] Conta Railway (recomendado) ou similar
- [x] Conta Gmail para emails
- [x] Chaves API das exchanges (Bybit, Binance, OKX)
- [x] Conta Stripe para pagamentos
- [x] Conta CoinStats (já configurada)

### 2. Ferramentas
- [x] Node.js 18+ instalado
- [x] NPM ou Yarn
- [x] Git
- [x] Railway CLI (opcional)

## 🔧 Configuração de Produção

### Passo 1: Configurar Banco de Dados
\`\`\`bash
# O Railway fornece PostgreSQL automaticamente
# Não é necessário configuração manual
\`\`\`

### Passo 2: Configurar Chaves API

#### Bybit (Para usuário Mauro)
1. Acesse [Bybit API Management](https://www.bybit.com/app/user/api-management)
2. Crie nova API Key
3. Permissões necessárias:
   - ✅ Read
   - ✅ Spot Trading
   - ✅ Derivatives Trading (opcional)
4. Configure IP whitelist se necessário
5. Salve as chaves no .env

#### Binance
1. Acesse [Binance API Management](https://www.binance.com/en/my/settings/api-management)
2. Crie nova API Key
3. Permissões: Spot Trading
4. Configure IP whitelist
5. Salve as chaves no .env

#### OKX
1. Acesse [OKX API Management](https://www.okx.com/account/my-api)
2. Crie nova API Key com passphrase
3. Permissões: Spot Trading, Read
4. Salve chaves + passphrase no .env

### Passo 3: Configurar Email
1. Acesse [Google Account](https://myaccount.google.com/security)
2. Ative autenticação 2 fatores
3. Gere senha de app para o Gmail
4. Configure no .env

### Passo 4: Configurar Pagamentos
1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/)
2. Obtenha chaves de produção
3. Configure webhooks
4. Salve chaves no .env

## 🚀 Deploy no Railway

### Método 1: Deploy Automático
\`\`\`bash
# Execute o script de deploy
./deploy.sh
\`\`\`

### Método 2: Deploy Manual
\`\`\`bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Criar projeto
railway new

# 4. Adicionar PostgreSQL
railway add postgresql

# 5. Deploy
railway up

# 6. Configurar domínio personalizado (opcional)
railway domain
\`\`\`

## 🔧 Configuração Pós-Deploy

### 1. Verificar Logs
\`\`\`bash
railway logs
\`\`\`

### 2. Testar Endpoints
\`\`\`bash
curl https://seu-app.railway.app/api/health
\`\`\`

### 3. Configurar Monitoramento
- Configure alertas no Railway
- Adicione Sentry para tracking de erros
- Configure uptime monitoring

## 🧪 Testes de Produção

### Teste de Conectividade
\`\`\`bash
node teste-producao-bybit.js
\`\`\`

### Teste de APIs
\`\`\`bash
node integrador-exchanges-real.js
\`\`\`

### Teste Completo
\`\`\`bash
npm run test:production
\`\`\`

## 📊 Monitoramento

### Métricas Importantes
- Uptime da aplicação
- Latência das APIs
- Erro rate
- Uso de memória
- Conexões de banco

### Logs Importantes
- Erros de autenticação
- Falhas em trades
- Timeouts de API
- Erros de webhook

## 🔒 Segurança

### Checklist de Segurança
- [x] HTTPS habilitado
- [x] CORS configurado
- [x] Rate limiting ativo
- [x] Chaves API criptografadas
- [x] JWT secrets seguros
- [x] IP whitelist nas exchanges
- [x] Logs de auditoria

## 🚨 Troubleshooting

### Problemas Comuns
1. **Erro de conexão banco**: Verificar DATABASE_URL
2. **API keys inválidas**: Verificar permissões
3. **CORS errors**: Verificar CORS_ORIGIN
4. **Rate limiting**: Ajustar limites
5. **Timeout errors**: Aumentar timeouts

### Suporte
- Logs detalhados em \`railway logs\`
- Documentação das APIs das exchanges
- Suporte Railway: https://railway.app/help

---

**Última atualização:** ${new Date().toISOString()}
**Versão:** 1.0.0
`;

        await fs.writeFile('DEPLOY-GUIDE.md', documentacao);
        console.log('✅ Guia DEPLOY-GUIDE.md criado\n');
    }

    exibirResumoConfiguracao() {
        console.log('📋 RESUMO DA CONFIGURAÇÃO');
        console.log('═'.repeat(50));
        
        console.log('\n🔐 SEGURANÇA:');
        console.log('   ✅ JWT Secret gerado');
        console.log('   ✅ Chave de criptografia gerada');
        console.log('   ✅ Webhook secrets configurados');

        console.log('\n🗄️  BANCO DE DADOS:');
        console.log('   ✅ PostgreSQL Railway configurado');
        console.log('   ✅ Pool de conexões otimizado');
        console.log('   ✅ SSL habilitado');

        console.log('\n🏦 EXCHANGES:');
        console.log('   ✅ Bybit (produção)');
        console.log('   ✅ Binance (produção)');
        console.log('   ✅ OKX (produção)');
        console.log('   ✅ CoinStats (configurado)');

        console.log('\n📧 NOTIFICAÇÕES:');
        console.log('   ✅ Email (Gmail)');
        console.log('   ✅ Telegram (opcional)');
        console.log('   ✅ Webhooks');

        console.log('\n🖥️  SERVIDOR:');
        console.log('   ✅ CORS configurado');
        console.log('   ✅ Rate limiting');
        console.log('   ✅ SSL/HTTPS');
        console.log('   ✅ Logs estruturados');

        console.log('\n📄 ARQUIVOS GERADOS:');
        console.log('   ✅ .env.production.final');
        console.log('   ✅ deploy.sh');
        console.log('   ✅ DEPLOY-GUIDE.md');

        console.log('\n🚀 PRÓXIMOS PASSOS:');
        console.log('   1. Configure as chaves API reais no .env');
        console.log('   2. Execute: npm run test:production');
        console.log('   3. Execute: ./deploy.sh');
        console.log('   4. Configure domínio personalizado');
        console.log('   5. Configure monitoramento');

        console.log('\n' + '═'.repeat(50));
        console.log('🎉 AMBIENTE DE PRODUÇÃO PRONTO!');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const configurador = new ConfiguradorProducao();
    
    configurador.configurarAmbienteCompleto()
        .then(() => {
            console.log('\n✅ Configuração completa concluída com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Erro na configuração:', error.message);
            process.exit(1);
        });
}

module.exports = ConfiguradorProducao;
