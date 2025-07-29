# 🚀 Deploy Railway - CoinBitClub Trading Bot

## 📋 Pré-requisitos

1. ✅ Conta Railway: https://railway.app
2. ✅ Conta Twilio: https://www.twilio.com
3. ✅ PostgreSQL configurado (Railway)

## 🔧 Configuração Railway

### 1. Criar Novo Projeto
```bash
# Via Railway CLI
railway login
railway init
railway link [project-id]
```

### 2. Configurar Variáveis de Ambiente
No painel Railway, adicionar:

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway
JWT_SECRET=coinbitclub_super_secret_2024_multiuser_production
ENCRYPTION_KEY=coinbitclub_encryption_key_2024_production_secure
TWILIO_ACCOUNT_SID=seu_twilio_account_sid
TWILIO_AUTH_TOKEN=seu_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Deploy
```bash
railway up
```

## 🏗️ Arquivos de Deploy Criados

- ✅ `package.json` - Dependências e scripts
- ✅ `.env.production` - Variáveis de ambiente
- ✅ `railway.json` - Configuração Railway
- ✅ `Procfile` - Comandos de deploy
- ✅ `server-multiusuario-limpo.js` - Servidor principal

## 🔍 Endpoints Disponíveis

- `GET /health` - Health check
- `GET /api/health` - API health check
- `POST /api/sms/send` - Enviar SMS via Twilio
- `POST /api/webhook/tradingview` - Webhook TradingView
- `POST /api/auth/login` - Login usuário
- `GET /api/users/balance` - Saldo usuário

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

- Health check: `/health`
- Logs Railway: Dashboard Railway
- Alertas: Configurar via Railway

## 🚀 Pós-Deploy

1. Testar endpoints
2. Configurar webhooks TradingView
3. Adicionar usuários via admin
4. Conectar frontend
5. Monitorar logs

## 🆘 Troubleshooting

- Verificar logs: `railway logs`
- Health check: `curl https://[app-url]/health`
- Database: Verificar conexão PostgreSQL
