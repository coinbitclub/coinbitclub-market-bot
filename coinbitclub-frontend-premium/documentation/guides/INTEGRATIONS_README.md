# CoinBitClub - Sistema de Trading Automatizado

## 🚀 Integrações Implementadas

Este sistema agora conta com **todas as integrações** necessárias para funcionamento completo:

### ✅ APIs de Trading
- **Binance** (Mainnet + Testnet)
- **Bybit** (Mainnet + Testnet) 
- Sistema de criptografia para chaves API
- Validação e teste de conexão
- Limite de 2 operações simultâneas por usuário

### ✅ Sistema de Pagamentos
- **Stripe** completo (produção + teste)
- Webhooks para processamento automático
- Planos mensais (R$120 BR / $40 USD)
- Planos prepagos (comissão 20%)
- Portal do cliente para gerenciar assinaturas

### ✅ Inteligência Artificial
- **OpenAI GPT-4** para relatórios RADAR DA ÁGUIA
- Análise automática de trades com prejuízo
- Recomendações personalizadas por nível
- Geração automática a cada 4 horas

### ✅ Dados de Mercado
- **CoinStats API** para preços em tempo real
- Dados globais e trending
- Notícias do mercado crypto
- Fear & Greed Index calculado

### ✅ Notificações
- **Z-API** para WhatsApp Business
- SMS e notificações push
- Alertas de trades em tempo real
- Relatórios IA por mensagem

---

## 🔧 Configuração das Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local` e configure:

```bash
# Base de Dados
DATABASE_URL=postgresql://user:password@host:5432/coinbitclub

# JWT
JWT_SECRET=sua-chave-super-secreta-aqui
JWT_EXPIRES_IN=7d

# Stripe (Produção) - CONFIGURADO
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51QCOIiBbdaDz4TVOX8Vh9KlFguewjyA2B2FNSSx5i5bUtzcei1aD399iUTyIk6PGQ3N8EW2lCO2lNRd1dWPp2E2X00ydaBMVUI
STRIPE_WEBHOOK_SECRET=whsec_cJ97DwC5rzz84PqCSbmTJfyQxykcrStU

# OpenAI - CONFIGURADO
OPENAI_API_KEY=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

# CoinStats - CONFIGURADO
COINSTATS_API_KEY=ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=

# Z-API WhatsApp - CONFIGURADO
ZAPI_INSTANCE=3E0819291FB89055AED996E82C2DBF10
ZAPI_TOKEN=2ECE7BD31B3B8E299FC68D6C

# Sistema
NEXT_PUBLIC_APP_URL=https://coinbitclub-market-bot-production.up.railway.app
SYSTEM_API_KEY=gere-uma-chave-para-cron-jobs
ENCRYPTION_KEY=sua-chave-de-criptografia-32-chars
```

---

## 🔑 Configuração das APIs de Trading

### 1. Chaves Binance/Bybit
Os usuários configuram suas próprias chaves através de:
```
/user/settings → Configurar APIs de Exchange
```

**Recursos disponíveis:**
- ✅ Binance Futures (Mainnet/Testnet)
- ✅ Bybit Unified Trading (Mainnet/Testnet) 
- ✅ Criptografia AES-256 das chaves
- ✅ Teste de conectividade automático
- ✅ Validação de permissões

### 2. Sistema Operacional
```javascript
// Máximo 2 operações simultâneas
// Stop Loss e Take Profit automáticos
// Análise IA para trades com prejuízo
// Notificações WhatsApp em tempo real
```

---

## 💳 Sistema de Pagamentos Stripe

### 1. Produtos Configurados
Criar no [Dashboard Stripe](https://dashboard.stripe.com):

**Plano Mensal Brasil:**
- Preço: R$ 120,00/mês
- ID: `price_monthly_brl_prod`

**Plano Mensal Internacional:**
- Preço: $40,00/mês  
- ID: `price_monthly_usd_prod`

### 2. Webhooks
Configurar endpoint no Stripe:
```
URL: https://seu-dominio.com/api/webhooks/stripe
Eventos: checkout.session.completed, customer.subscription.*, invoice.payment_*
```

---

## 🤖 Automação com IA

### 1. Relatórios RADAR DA ÁGUIA
Executar a cada 4 horas via cron job:
```bash
curl -X POST https://seu-dominio.com/api/cron/automated-tasks \
  -H "x-system-key: SUA_CHAVE_SISTEMA" \
  -d '{"action": "generate_radar_report"}'
```

### 2. Monitoramento de Trades
Executar a cada 15 minutos:
```bash
curl -X POST https://seu-dominio.com/api/cron/automated-tasks \
  -H "x-system-key: SUA_CHAVE_SISTEMA" \
  -d '{"action": "check_active_trades"}'
```

---

## 📱 Notificações WhatsApp

### 1. Configurar Z-API
1. Acesse [Z-API](https://www.z-api.io)
2. Crie uma instância
3. Configure as credenciais no `.env`
4. Conecte via QR Code em `/api/zapi/connect`

### 2. Tipos de Mensagens
- 📊 Relatórios IA automáticos
- 🎯 Alertas de trades 
- 💰 Atualizações de saldo
- 📈 Resumos diários
- 🆘 Central de ajuda

---

## 🗄️ Banco de Dados

### 1. Schema Completo
Execute o arquivo `database/complete_schema.sql` no PostgreSQL:

```bash
psql -U usuario -d coinbitclub -f database/complete_schema.sql
```

### 2. Tabelas Principais
- `users` - Usuários e planos
- `user_exchanges` - Configurações das APIs
- `trade_operations` - Operações de trading
- `ai_reports` - Relatórios gerados pela IA
- `affiliate_commissions` - Sistema de afiliados
- `transactions` - Histórico financeiro

---

## 🚀 Deploy e Produção

### 1. Configurar Cron Jobs
No servidor (Railway/Vercel/VPS):

```bash
# Relatórios IA (a cada 4 horas)
0 */4 * * * curl -X POST https://seu-dominio.com/api/cron/automated-tasks -H "x-system-key: SUA_CHAVE" -d '{"action": "generate_radar_report"}'

# Verificar trades (a cada 15 min)
*/15 * * * * curl -X POST https://seu-dominio.com/api/cron/automated-tasks -H "x-system-key: SUA_CHAVE" -d '{"action": "check_active_trades"}'

# Resumo diário (18h)
0 18 * * * curl -X POST https://seu-dominio.com/api/cron/automated-tasks -H "x-system-key: SUA_CHAVE" -d '{"action": "send_daily_summary"}'

# Pagamentos afiliados (dia 5)
0 0 5 * * curl -X POST https://seu-dominio.com/api/cron/automated-tasks -H "x-system-key: SUA_CHAVE" -d '{"action": "process_affiliate_payments"}'
```

### 2. Variáveis de Produção
- ✅ Stripe Production Mode
- ✅ OpenAI API configurada
- ✅ CoinStats API ativa
- ✅ Z-API WhatsApp conectado
- ✅ Database PostgreSQL
- ✅ Encryption keys seguras

---

## 📋 Checklist de Funcionamento

### ✅ Sistema Base
- [x] Autenticação JWT
- [x] Planos e pricing
- [x] Dashboard completo
- [x] Operações de trading
- [x] Sistema de afiliados

### ✅ Integrações Externas  
- [x] Binance API (mainnet/testnet)
- [x] Bybit API (mainnet/testnet)
- [x] Stripe pagamentos
- [x] OpenAI GPT-4
- [x] CoinStats dados
- [x] Z-API WhatsApp

### ✅ Automação
- [x] Relatórios IA automáticos
- [x] Monitoramento de trades
- [x] Notificações em tempo real
- [x] Pagamentos de afiliados
- [x] Backup e auditoria

---

## 🔒 Segurança

### 1. Proteções Implementadas
- Criptografia AES-256 para API keys
- Validação JWT em todas as rotas
- Rate limiting nas APIs
- Sanitização de inputs
- Logs de auditoria

### 2. Boas Práticas
- Nunca expor chaves no frontend
- Validar webhooks com assinaturas
- Usar HTTPS em produção
- Backup regular do banco
- Monitoramento de erros

---

## 🆘 Suporte e Manutenção

### 1. Logs Importantes
```bash
# API de trading
tail -f logs/trading.log

# Relatórios IA  
tail -f logs/ai-reports.log

# Webhooks Stripe
tail -f logs/stripe-webhooks.log
```

### 2. Troubleshooting
- Verificar conectividade das exchanges em `/api/user/exchanges`
- Testar webhooks Stripe em `/api/webhooks/stripe`
- Validar IA reports em `/api/cron/automated-tasks`
- Monitorar WhatsApp em `/api/zapi/status`

---

**🎯 Sistema 100% Operacional!**

Todas as integrações estão implementadas e prontas para produção. Configure as variáveis de ambiente e execute o deploy para ter a plataforma completamente funcional.

Para dúvidas técnicas ou suporte, consulte a documentação das APIs integradas ou entre em contato com a equipe de desenvolvimento.
