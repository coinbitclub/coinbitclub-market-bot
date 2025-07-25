# Sistema de Pagamentos CoinBitClub - Documentação Completa

## 📋 Visão Geral

Sistema completo de pagamentos integrado com Stripe, suportando:
- ✅ **Pagamentos pré-pagos** com sistema de bônus
- ✅ **Assinaturas recorrentes** 
- ✅ **Reconciliação automática** de pagamentos
- ✅ **Webhooks robustos** do Stripe
- ✅ **Dashboard financeiro** completo
- ✅ **Relatórios automatizados**

## 🗂️ Estrutura do Sistema

### Tabelas Principais

1. **`payments`** - Registro central de todos os pagamentos
2. **`payment_reconciliation`** - Conciliação com dados do gateway
3. **`user_prepaid_balance`** - Saldos pré-pagos dos usuários  
4. **`prepaid_transactions`** - Histórico de transações pré-pagas
5. **`payment_settings`** - Configurações do sistema
6. **`webhook_logs`** - Logs de webhooks recebidos
7. **`financial_reports`** - Relatórios financeiros automatizados

### Serviços Implementados

- **`PaymentService`** - Gestão de pagamentos e saldos
- **`ReconciliationService`** - Conciliação automática
- **`FinancialCronJobs`** - Jobs automatizados

## 🚀 Endpoints da API

### Pagamentos Pré-pagos

```bash
# Criar pagamento pré-pago
POST /api/v1/payments/prepaid
{
  "amount": 100.00,
  "currency": "BRL",
  "payment_method_id": "pm_1234567890" // Opcional
}

# Confirmar pagamento
POST /api/v1/payments/prepaid/confirm
{
  "payment_intent_id": "pi_1234567890"
}

# Consultar saldo
GET /api/v1/payments/prepaid/balance?currency=BRL

# Histórico de transações
GET /api/v1/payments/prepaid/transactions?page=1&limit=20&type=credit
```

### Pagamentos (Admin)

```bash
# Listar todos os pagamentos
GET /api/v1/payments/payments?status=succeeded&type=prepaid&page=1

# Detalhes de um pagamento
GET /api/v1/payments/payments/{paymentId}

# Debitar saldo (admin apenas)
POST /api/v1/payments/prepaid/debit/{userId}
{
  "amount": 50.00,
  "description": "Taxa de serviço",
  "reference_id": "service_123"
}

# Estatísticas
GET /api/v1/payments/stats?period=30d
```

### Reconciliação (Admin)

```bash
# Executar reconciliação manual
POST /api/v1/payments/reconciliation/run
{
  "date_from": "2024-01-01",
  "date_to": "2024-01-31"
}

# Discrepâncias pendentes
GET /api/v1/payments/reconciliation/discrepancies

# Resolver discrepância
POST /api/v1/payments/reconciliation/resolve/{reconciliationId}
{
  "resolution": "approved",
  "notes": "Diferença justificada por taxa adicional"
}

# Gerar relatório
GET /api/v1/payments/reconciliation/report?date_from=2024-01-01&date_to=2024-01-31
```

## 💳 Fluxo de Pagamento Pré-pago

### 1. Frontend → Backend
```javascript
// 1. Criar pagamento
const response = await fetch('/api/v1/payments/prepaid', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 100.00,
    currency: 'BRL'
  })
});

const { client_secret, bonus_amount, total_credit } = await response.json();

// 2. Confirmar com Stripe (frontend)
const { paymentIntent } = await stripe.confirmCardPayment(client_secret, {
  payment_method: {
    card: cardElement,
    billing_details: { name: 'João Silva' }
  }
});

// 3. Confirmar no backend
if (paymentIntent.status === 'succeeded') {
  await fetch('/api/v1/payments/prepaid/confirm', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      payment_intent_id: paymentIntent.id
    })
  });
}
```

### 2. Processamento Automático

1. **Webhook do Stripe** → `payment_intent.succeeded`
2. **Reconciliação automática** → Validação de valores
3. **Crédito do saldo** → `user_prepaid_balance` + `prepaid_transactions`
4. **Bônus aplicado** → Conforme configuração em `payment_settings`

## 🔄 Sistema de Reconciliação

### Reconciliação Automática
- **Executada a cada 30 minutos** para pagamentos pendentes
- **Diariamente às 2:00 AM** para o dia anterior
- **Compara valores** do sistema vs Stripe
- **Detecta discrepâncias** automaticamente

### Status de Reconciliação
- `pending` - Aguardando reconciliação
- `matched` - Valores conferem
- `discrepancy` - Diferença encontrada
- `manual_review` - Requer revisão manual

### Tolerâncias Configuráveis
```sql
-- Configuração de tolerância (1 centavo)
INSERT INTO payment_settings (key, value) VALUES (
  'auto_reconciliation',
  '{"enabled": true, "max_discrepancy": 0.01}'
);
```

## 🎁 Sistema de Bônus Pré-pago

### Configuração de Tiers
```sql
-- Configuração de bônus por valor
INSERT INTO payment_settings (key, value) VALUES (
  'prepaid_bonus',
  '{
    "enabled": true,
    "tiers": [
      {"minimum": 100, "bonus_percentage": 5},
      {"minimum": 500, "bonus_percentage": 10},
      {"minimum": 1000, "bonus_percentage": 15}
    ]
  }'
);
```

### Exemplo de Cálculo
- Recarga de **R$ 100** → Bônus de **5%** → **R$ 5** extra
- Recarga de **R$ 500** → Bônus de **10%** → **R$ 50** extra  
- Recarga de **R$ 1000** → Bônus de **15%** → **R$ 150** extra

## 📊 Webhooks do Stripe

### Eventos Suportados
- `payment_intent.succeeded` → Pagamento confirmado
- `payment_intent.payment_failed` → Pagamento falhou
- `invoice.payment_succeeded` → Assinatura paga
- `invoice.payment_failed` → Falha na assinatura
- `charge.refunded` → Reembolso processado
- `charge.dispute.created` → Disputa criada

### Configuração
```bash
# URL do webhook
https://sua-api.com/api/v1/webhooks/stripe

# Eventos necessários no Stripe Dashboard:
payment_intent.succeeded
payment_intent.payment_failed
payment_intent.requires_action
invoice.payment_succeeded
invoice.payment_failed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
charge.succeeded
charge.failed
charge.refunded
charge.dispute.created
```

## 🤖 Jobs Automatizados

### Cron Jobs Configurados
```javascript
// Reconciliação diária - 2:00 AM
'0 2 * * *' → ReconciliationService.reconcilePayments()

// Limpeza de logs - Domingo 3:00 AM  
'0 3 * * 0' → Limpar webhook_logs > 30 dias

// Relatório semanal - Segunda 9:00 AM
'0 9 * * 1' → Gerar relatório financeiro

// Verificar pendentes - A cada 30 min
'*/30 * * * *' → Verificar pagamentos pendentes > 1h

// Estatísticas diárias - A cada hora
'0 * * * *' → Atualizar financial_reports
```

## 🛠️ Configurações de Ambiente

### Variáveis Necessárias
```env
# Stripe
STRIPE_SECRET_KEY=sk_live_ou_test_...
STRIPE_PUBLISHABLE_KEY=pk_live_ou_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=seu_jwt_secret_seguro
```

## 📈 Dashboard e Relatórios

### Métricas Disponíveis
- **Volume total** por período
- **Taxa de sucesso** dos pagamentos
- **Ticket médio**
- **Volume por tipo** (pré-pago vs assinatura)
- **Status de reconciliação**
- **Discrepâncias pendentes**

### Relatórios Automatizados
- **Diário** - Atualizado a cada hora
- **Semanal** - Gerado toda segunda-feira
- **Reconciliação** - Sob demanda ou automático

## 🔒 Segurança

### Validação de Webhooks
- **Verificação de assinatura** obrigatória
- **Logs completos** de todos os eventos
- **Retry automático** para falhas temporárias

### Controle de Acesso
- **Endpoints de pagamento** → Usuário autenticado
- **Endpoints admin** → Role 'admin' obrigatória
- **Webhooks** → Sem autenticação (verificação por assinatura)

### Auditoria
- **Todos os pagamentos** logados em `audit_logs`
- **Reconciliações manuais** rastreadas
- **Alterações de saldo** registradas

## 🚀 Deployment

### Migração do Banco
```bash
# Executar nova migração
npm run db:migrate

# Executar seed (desenvolvimento)
npm run db:seed
```

### Verificação de Funcionamento
```bash
# 1. Testar webhook
curl -X POST https://sua-api.com/api/v1/webhooks/stripe \
  -H "stripe-signature: test" \
  -d '{"type":"test"}'

# 2. Testar criação de pagamento
curl -X POST https://sua-api.com/api/v1/payments/prepaid \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"currency":"BRL"}'

# 3. Verificar reconciliação
curl -X GET https://sua-api.com/api/v1/payments/reconciliation/discrepancies \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 📞 Próximos Passos

1. **Configurar Stripe** com as chaves corretas
2. **Executar migração** `0025_create_payments_system.js`
3. **Configurar webhook** no dashboard do Stripe
4. **Testar fluxo completo** em ambiente de desenvolvimento
5. **Configurar monitoramento** das métricas financeiras

Este sistema está **completamente integrado** e pronto para produção! 🎉
