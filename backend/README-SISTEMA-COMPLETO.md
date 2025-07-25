# CoinBitClub Market Bot - Sistema de Pagamentos Completo

## 🚀 Visão Geral

Sistema completo de pagamentos e gerenciamento financeiro para a CoinBitClub, incluindo:

- ✅ **Sistema de Assinaturas** - Planos mensais e anuais
- ✅ **Pagamentos Pré-pagos** - Recarga de saldo com bônus
- ✅ **Sistema de Afiliados** - Comissões automáticas
- ✅ **Dashboard Administrativo** - Controle financeiro completo
- ✅ **Integração Stripe** - Processamento de pagamentos
- ✅ **Sistema de Saques** - Controle de retiradas
- ✅ **Conversão de Moedas** - USD/BRL automática
- ✅ **Notificações WhatsApp** - Via Zapi
- ✅ **Auditoria Completa** - Logs e reconciliação

## 📋 Funcionalidades Principais

### 💳 Sistema de Pagamentos
- **Payment Links**: Links diretos para pagamento
- **Checkout Integrado**: Página de checkout completa
- **Produtos Stripe**: Catálogo completo de planos
- **Códigos Promocionais**: Sistema de descontos
- **Webhook Processing**: Processamento automático

### 👥 Sistema de Usuários
- **Contas Gratuitas**: Usuários free com limitações
- **Migração de Planos**: Upgrade automático
- **Saldo Pré-pago**: Sistema de créditos
- **Extratos Financeiros**: Histórico completo

### 🤝 Sistema de Afiliados
- **Comissões por Lucro**: Apenas em operações positivas
- **Saldo como Crédito**: Usar comissões como saldo
- **Pagamentos sob Demanda**: Controle pela CoinBitClub
- **Relatórios Detalhados**: Performance completa

### 🎛️ Dashboard Administrativo
- **Métricas em Tempo Real**: KPIs financeiros
- **Controle de Usuários**: Gestão completa
- **Análise de Receita**: Por moeda e período
- **Reconciliação**: Verificação de consistência
- **Exportação de Dados**: Relatórios completos

## 🏗️ Arquitetura

```
backend/
├── services/
│   ├── paymentLinkService.js        # Payment Links Stripe
│   ├── stripeProductService.js      # Produtos e Checkout
│   ├── productCatalogService.js     # Catálogo de Produtos
│   ├── adminFinancialService.js     # Dashboard Admin
│   ├── currencyConversionService.js # Conversão USD/BRL
│   ├── financialStatementService.js # Extratos
│   ├── affiliateCreditService.js    # Créditos de Afiliado
│   └── whatsappService.js           # Notificações
├── controllers/
│   ├── adminFinancialController.js  # API Admin
│   ├── stripeProductController.js   # API Produtos
│   └── productCatalogController.js  # API Catálogo
├── routes/
│   ├── adminFinancial.js           # Rotas Admin
│   ├── stripeProducts.js           # Rotas Stripe
│   └── catalog.js                  # Rotas Catálogo
├── public/
│   ├── checkout.html               # Página de Checkout
│   └── admin-dashboard.html        # Dashboard Admin
├── scripts/
│   └── init-catalog.js             # Inicializar Produtos
└── migrations/                     # Schema do Banco
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Currency APIs
FIXER_API_KEY=your_fixer_key
EXCHANGE_RATE_API_KEY=your_exchange_key

# WhatsApp (Zapi)
ZAPI_TOKEN=your_zapi_token
ZAPI_INSTANCE_ID=your_instance_id

# JWT
JWT_SECRET=your_jwt_secret

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000
```

### 2. Instalação e Setup

```powershell
# Clone o repositório
git clone <repository-url>
cd coinbitclub-market-bot/backend

# Execute o setup completo com novos planos
.\setup-system.ps1 -All

# Ou passo a passo:
.\setup-system.ps1 -RunMigrations
.\setup-system.ps1 -SetupStripe
.\setup-system.ps1 -InitCatalog
.\setup-system.ps1 -StartServer
```

### 3. Inicialização Manual

```bash
# Instalar dependências
npm install

# Executar migrações
node migrate.js

# Atualizar catálogo com novos planos
node scripts/update-catalog.js

# Iniciar servidor
node api-gateway/index.js
```

## 📊 Produtos e Planos

### Planos de Assinatura

#### 🇧🇷 Brasil
1. **Plano Mensal** - R$ 200/mês + 10% comissão sobre lucros
   - Trading automatizado completo
   - Sinais profissionais
   - IA avançada
   - Suporte prioritário

2. **Apenas Comissão** - R$ 0/mês + 20% comissão sobre lucros
   - Todos os recursos do plano mensal
   - Sem mensalidade
   - Comissão maior sobre lucros

#### 🌎 Internacional
1. **Monthly Plan** - $40/month + 10% commission on profits
   - Complete automated trading
   - Professional signals
   - Advanced AI
   - Priority support

2. **Commission Only** - $0/month + 20% commission on profits
   - All monthly plan features
   - No monthly fee
   - Higher commission on profits

### Sistema de Recarga

#### 🇧🇷 Brasil (mínimo R$ 60)
- **Recarga livre** a partir de R$ 60
- **Descontos promocionais:**
  - R$ 600 - R$ 5.999: **5% desconto**
  - R$ 6.000 - R$ 20.000: **10% desconto**

#### 🌎 Internacional (minimum $40)
- **Free recharge** starting from $40
- **Promotional discounts:**
  - $150 - $1,499: **5% discount**
  - $1,500+: **10% discount**

### Códigos Promocionais

- **RECARGA5** - 5% desconto para recargas BRL R$ 600+
- **RECARGA10** - 10% desconto para recargas BRL R$ 6.000+
- **USDRECARGA5** - 5% discount for USD $150+ recharges
- **USDRECARGA10** - 10% discount for USD $1,500+ recharges
- **WELCOME** - 15% desconto de boas-vindas
- **BRASIL200** - 20% desconto no plano Brasil mensal
- **EXTERIOR40** - 25% discount on International monthly plan

## 🌐 URLs e Endpoints

### Páginas Frontend
- **Checkout Atualizado**: `http://localhost:3000/checkout-updated.html`
- **Checkout Original**: `http://localhost:3000/checkout.html`
- **Admin Dashboard**: `http://localhost:3000/admin-dashboard.html`

### API Endpoints

#### Catálogo Público
```
GET /api/catalog/public              # Catálogo completo
GET /api/catalog/products            # Produtos por categoria
GET /api/catalog/promo-code/validate # Validar código promo
POST /api/catalog/checkout           # Criar checkout
```

#### Dashboard Admin
```
GET /api/admin/financial/dashboard   # Dashboard principal
GET /api/admin/financial/realtime    # Métricas tempo real
GET /api/admin/financial/export      # Exportar dados
POST /api/admin/financial/reconcile  # Reconciliação
```

#### Produtos Stripe
```
GET /api/stripe/products             # Listar produtos
POST /api/stripe/products            # Criar produto
PUT /api/stripe/products/:id         # Atualizar produto
DELETE /api/stripe/products/:id      # Deletar produto
POST /api/stripe/checkout            # Criar checkout
POST /api/stripe/webhook             # Webhook Stripe
```

## 💰 Fluxo de Pagamentos

### 1. Assinaturas
```
Usuário → Checkout → Stripe → Webhook → Ativação do Plano
```

### 2. Pré-pagos
```
Usuário → Checkout → Stripe → Webhook → Crédito no Saldo
```

### 3. Afiliados
```
Operação Positiva → Cálculo Comissão → Saldo Afiliado → Pagamento/Crédito
```

### 4. Saques
```
Solicitação → Validação → WhatsApp → Processamento Manual
```

## 🔄 Sistema de Conversão

- **Operações**: Sempre em USD
- **Comissões**: Convertidas para BRL
- **Taxas**: Atualizadas diariamente
- **APIs**: Fixer.io, ExchangeRate-API, Banco Central

## 📱 Notificações WhatsApp

- **Solicitações de Saque**: Automáticas
- **Confirmações**: Manuais
- **Alertas Admin**: Configuráveis
- **Templates**: Personalizáveis

## 🔐 Segurança

- **JWT Authentication**: Tokens seguros
- **Webhook Verification**: Assinatura Stripe
- **Role-based Access**: Admin/User
- **Audit Logs**: Rastreamento completo
- **Environment Variables**: Configuração segura

## 📈 Monitoramento

### Métricas Disponíveis
- Receita bruta/líquida por moeda
- Crescimento de usuários
- Conversão de vendas
- Performance de afiliados
- Status de reconciliação

### Alertas Configuráveis
- Falhas de pagamento
- Problemas de webhook
- Inconsistências financeiras
- Volumes anômalos

## 🚀 Deploy em Produção

### 1. Railway (Recomendado)
```bash
# Configurar Railway CLI
railway login
railway init
railway add --service postgresql
railway up
```

### 2. Webhook Configuration
```
URL: https://your-domain.railway.app/api/stripe/webhook
Events: checkout.session.completed, invoice.payment_succeeded
```

### 3. Environment Variables
Configure todas as variáveis no Railway dashboard.

## 🧪 Testes

### Testes de Pagamento
1. Use Stripe Test Mode
2. Cartões de teste: `4242 4242 4242 4242`
3. Verifique webhooks no Stripe Dashboard

### Testes de API
```bash
# Testar catálogo
curl http://localhost:3000/api/catalog/public

# Testar dashboard (com token admin)
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/admin/financial/dashboard
```

## 📚 Documentação Adicional

- **Stripe Documentation**: https://stripe.com/docs
- **Node.js Best Practices**: Seguidas no código
- **PostgreSQL**: Schema otimizado
- **Express.js**: Padrões RESTful

## 🆘 Suporte e Troubleshooting

### Problemas Comuns

1. **Webhook não funciona**
   - Verifique STRIPE_WEBHOOK_SECRET
   - Confirme URL no Stripe Dashboard

2. **Erro de conexão DB**
   - Verifique DATABASE_URL
   - Confirme migrações executadas

3. **Falha na conversão de moeda**
   - Verifique API keys
   - Fallback para taxa fixa configurada

### Logs de Debug
```bash
# Ativar logs detalhados
export DEBUG=coinbitclub:*
node api-gateway/index.js
```

## 🔄 Atualizações

O sistema está pronto para produção com todas as funcionalidades implementadas:

- ✅ Sistema de pagamentos completo
- ✅ Dashboard administrativo funcional
- ✅ Integração Stripe completa
- ✅ Sistema de afiliados operacional
- ✅ Controles financeiros implementados
- ✅ Documentação completa

Para atualizações futuras, considere:
- Implementação de analytics avançados
- Sistema de cupons mais complexo
- Integração com mais gateways
- Mobile app integration

---

**CoinBitClub Team** - Sistema pronto para produção! 🚀
