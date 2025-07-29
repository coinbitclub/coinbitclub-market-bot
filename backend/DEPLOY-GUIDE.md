# 🚀 GUIA DE DEPLOY PARA PRODUÇÃO

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
```bash
# O Railway fornece PostgreSQL automaticamente
# Não é necessário configuração manual
```

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
```bash
# Execute o script de deploy
./deploy.sh
```

### Método 2: Deploy Manual
```bash
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
```

## 🔧 Configuração Pós-Deploy

### 1. Verificar Logs
```bash
railway logs
```

### 2. Testar Endpoints
```bash
curl https://seu-app.railway.app/api/health
```

### 3. Configurar Monitoramento
- Configure alertas no Railway
- Adicione Sentry para tracking de erros
- Configure uptime monitoring

## 🧪 Testes de Produção

### Teste de Conectividade
```bash
node teste-producao-bybit.js
```

### Teste de APIs
```bash
node integrador-exchanges-real.js
```

### Teste Completo
```bash
npm run test:production
```

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
- Logs detalhados em `railway logs`
- Documentação das APIs das exchanges
- Suporte Railway: https://railway.app/help

---

**Última atualização:** 2025-07-28T20:40:41.352Z
**Versão:** 1.0.0
