# CoinBitClub Market Bot - Railway Deployment

Este repositório contém o backend do CoinBitClub Market Bot configurado para deploy no Railway.

## 🏗️ Arquitetura

O sistema é composto por microserviços:

- **API Gateway** (porta 8080) - Ponto de entrada principal
- **Admin Panel** (porta 9015) - Painel administrativo  
- **Signal Ingestor** (porta 9001) - Ingestão de sinais
- **Signal Processor** - Processamento de sinais
- **Decision Engine** - Engine de decisões AI
- **Order Executor** - Execução de ordens
- **Accounting** - Sistema de contabilidade
- **Notifications** - Sistema de notificações

## 🚀 Deploy no Railway

### 1. Configuração de Variáveis de Ambiente

No Railway, configure as seguintes variáveis:

#### Banco de Dados (PostgreSQL)
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

#### Message Queue (CloudAMQP)
```bash
CLOUDAMQP_URL=${{CLOUDAMQP_URL}}
```

#### Redis Cloud
```bash
REDIS_URL=${{REDIS_URL}}
```

#### APIs Externas
```bash
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret
BYBIT_API_KEY=your_bybit_api_key
BYBIT_SECRET=your_bybit_secret
OPENAI_API_KEY=your_openai_api_key
```

#### Segurança
```bash
JWT_SECRET=your_super_secret_jwt_key
WEBHOOK_SECRET=your_webhook_secret
SESSION_SECRET=your_session_secret
```

#### Email (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

#### Telegram (Opcional)
```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 2. Recursos Necessários no Railway

1. **PostgreSQL Database** - Para dados principais
2. **CloudAMQP** - Para message queue (RabbitMQ)
3. **Redis Cloud** - Para cache e sessões

### 3. Deploy Steps

1. Conecte seu repositório GitHub ao Railway
2. Configure as variáveis de ambiente
3. Adicione os recursos (PostgreSQL, CloudAMQP, Redis)
4. O Railway irá detectar automaticamente o Dockerfile e fazer o build

### 4. Configuração Multi-Service

Para deployar múltiplos serviços, você pode criar projects separados no Railway:

1. **Main API** - API Gateway + Admin Panel
2. **Processing** - Signal Processor + Decision Engine  
3. **Trading** - Order Executor + Accounting
4. **Communications** - Notifications + Signal Ingestor

### 5. Health Checks

Todos os serviços incluem health checks em `/health`:

```bash
curl https://your-app.railway.app/health
```

### 6. Logs e Monitoramento

Use o Railway dashboard para:
- Visualizar logs em tempo real
- Monitorar métricas de performance
- Configurar alertas

## 🔧 Comandos Úteis

### Local Development
```bash
npm run install:all    # Instalar todas as dependências
npm run dev            # Rodar em modo desenvolvimento
npm run db:setup       # Configurar banco de dados
```

### Production
```bash
npm run build          # Build dos serviços
npm start              # Iniciar produção
```

## 📊 Estrutura do Banco

O sistema usa PostgreSQL com as seguintes tabelas principais:
- users, plans, subscriptions
- signals, orders, financial_transactions  
- ai_decisions, audit_logs
- notifications, system_settings

## 🔐 Segurança

- JWT para autenticação
- Rate limiting configurado
- Helmet.js para headers de segurança
- CORS configurado para produção
- Validação de entrada com Joi

## 📈 Escalabilidade

- Arquitetura de microserviços
- Message queue para comunicação assíncrona
- Redis para cache distribuído
- Logs estruturados para análise

## 🆘 Troubleshooting

### Problemas Comuns

1. **Database Connection Error**
   - Verifique se o PostgreSQL está configurado
   - Confirme a variável DATABASE_URL

2. **Message Queue Error**  
   - Verifique a configuração do CloudAMQP
   - Confirme a variável CLOUDAMQP_URL

3. **Port Issues**
   - Railway automaticamente configura a PORT
   - Não altere a configuração de portas manualmente

### Logs

Acesse os logs pelo Railway dashboard ou CLI:
```bash
railway logs
```
