# Sistema de Pagamentos CoinBitClub - Documentação da API

## Visão Geral

Sistema completo de pagamentos com Stripe, saques automáticos, controle de operações e comissões de afiliados.

## Funcionalidades Principais

### 1. Sistema de Pagamentos
- Pagamentos por assinatura (Stripe Subscriptions)
- Pagamentos pré-pagos (Stripe PaymentIntents) 
- Suporte multi-moeda (BRL/USD)
- Bônus automático para recarga
- Reconciliação automática com Stripe

### 2. Sistema de Saques
- Saques automáticos em horário comercial
- Múltiplas formas de pagamento (PIX, transferência, crypto)
- Taxas diferenciadas por método
- Controle de lucros para admin

### 3. Controle de Operações
- Verificação de saldo mínimo
- Logs detalhados de operações
- Bloqueio automático por saldo insuficiente

### 4. Sistema de Afiliados
- Comissões diferenciadas (1.5% normal, 5% VIP)
- Comissões baseadas em lucros reais
- Processamento automático

## Endpoints da API

### Pagamentos (`/api/payments`)

#### POST `/api/payments/create-prepaid`
Criar pagamento pré-pago

```json
{
  "amount": 100.00,
  "currency": "BRL",
  "description": "Recarga de saldo"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "payment_id": "pay_123",
    "client_secret": "pi_123_secret_xyz",
    "amount": 100.00,
    "currency": "BRL",
    "bonus_amount": 10.00,
    "total_credit": 110.00
  }
}
```

#### POST `/api/payments/create-subscription`
Criar assinatura

```json
{
  "plan_id": "plan_123",
  "currency": "BRL"
}
```

#### GET `/api/payments/my-payments`
Listar pagamentos do usuário

**Query params:**
- `page`: Página (padrão: 1)
- `limit`: Itens por página (padrão: 20)
- `type`: Filtro por tipo (`subscription`, `prepaid`)

#### GET `/api/payments/balance`
Obter saldo atual

**Resposta:**
```json
{
  "success": true,
  "data": {
    "prepaid_balance_brl": 150.00,
    "prepaid_balance_usd": 25.50,
    "subscription_status": "active",
    "subscription_plan": "premium"
  }
}
```

### Saques (`/api/withdrawals`)

#### POST `/api/withdrawals/request`
Solicitar saque

```json
{
  "amount": 50.00,
  "currency": "BRL",
  "withdrawal_method": "pix",
  "pix_key": "user@email.com"
}
```

**Para transferência bancária:**
```json
{
  "amount": 50.00,
  "currency": "BRL", 
  "withdrawal_method": "bank_transfer",
  "bank_details": {
    "bank_code": "001",
    "agency": "1234",
    "account": "12345-6",
    "account_type": "corrente",
    "holder_name": "João Silva",
    "holder_document": "12345678900"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "withdrawal_id": "wd_123",
    "amount": 50.00,
    "currency": "BRL",
    "fee_amount": 2.50,
    "net_amount": 47.50,
    "status": "pending",
    "estimated_processing": "Até 2 horas em horário comercial"
  }
}
```

#### GET `/api/withdrawals/my-withdrawals`
Listar saques do usuário

#### POST `/api/withdrawals/cancel/:withdrawalId`
Cancelar saque pendente

#### GET `/api/withdrawals/details/:withdrawalId`
Obter detalhes de um saque

### Controle de Operações (`/api/operations`)

#### GET `/api/operations/check-eligibility`
Verificar se pode realizar operação

**Query params:**
- `operation_type`: Tipo da operação
- `amount`: Valor da operação
- `currency`: Moeda (BRL/USD)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "can_operate": true,
    "reason": "sufficient_balance",
    "current_balance": 100.00,
    "minimum_required": 50.00,
    "remaining_after_operation": 40.00
  }
}
```

#### POST `/api/operations/debit`
Executar débito de operação

```json
{
  "operation_type": "trade",
  "amount": 10.00,
  "currency": "BRL",
  "description": "Operação de trading"
}
```

#### POST `/api/operations/credit`
Executar crédito de operação

```json
{
  "operation_type": "trade_profit",
  "amount": 15.00,
  "currency": "BRL",
  "description": "Lucro da operação"
}
```

#### POST `/api/operations/affiliate-commission`
Processar comissão de afiliado

```json
{
  "profit_amount": 100.00,
  "currency": "BRL",
  "operation_type": "trade_profit"
}
```

#### GET `/api/operations/my-stats`
Obter estatísticas de operações

#### GET `/api/operations/my-info`
Obter informações de operação e saldo

### Endpoints Admin

#### Saques Admin (`/api/withdrawals/admin`)

#### POST `/api/withdrawals/admin/request`
Solicitar saque de lucros (admin)

#### GET `/api/withdrawals/admin/profits`
Obter lucros disponíveis

#### GET `/api/withdrawals/admin/all`
Listar todos os saques

#### POST `/api/withdrawals/admin/process/:withdrawalId`
Processar saque manualmente

```json
{
  "action": "approve", // ou "reject"
  "notes": "Aprovado após verificação"
}
```

#### GET `/api/withdrawals/admin/stats`
Obter estatísticas de saques

#### Operações Admin (`/api/operations/admin`)

#### GET `/api/operations/admin/stats`
Obter estatísticas globais

#### GET `/api/operations/admin/logs`
Listar logs de operações

#### GET `/api/operations/admin/settings`
Obter configurações do sistema

#### POST `/api/operations/admin/settings`
Atualizar configurações

```json
{
  "min_balance_for_operations_brl": "50.00",
  "min_balance_for_operations_usd": "10.00",
  "affiliate_commission_normal": "1.5",
  "affiliate_commission_vip": "5.0"
}
```

## Webhooks

### POST `/api/webhooks/stripe`
Webhook do Stripe para eventos de pagamento

**Eventos processados:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Configurações de Taxa

### Taxas de Saque por Método

| Método | Taxa BRL | Taxa USD |
|--------|----------|----------|
| PIX | 2.5% (mín R$ 2,00) | N/A |
| Transferência | 3.0% (mín R$ 5,00) | 3.0% (mín $2.00) |
| Crypto | 2.0% (mín R$ 3,00) | 2.0% (mín $1.50) |

### Bônus de Recarga

| Valor Recarga | Bônus |
|---------------|-------|
| R$ 100 - R$ 499 | 10% |
| R$ 500 - R$ 999 | 15% |
| R$ 1000+ | 20% |

### Comissões de Afiliado

| Tipo | Taxa |
|------|------|
| Normal | 1.5% sobre lucros |
| VIP | 5.0% sobre lucros |

## Horários de Processamento

### Saques Automáticos
- **Horário:** Segunda a Sexta, 8h às 18h
- **Frequência:** A cada 30 minutos
- **Delay mínimo:** 5 minutos após solicitação

### Reconciliação
- **Frequência:** A cada hora
- **Relatórios:** Diários às 6h

### Limpeza de Dados
- **Frequência:** Domingos às 2h
- **Logs de operação:** Mantidos por 6 meses
- **Audit logs:** Mantidos por 1 ano

## Códigos de Status

### Status de Pagamento
- `pending`: Aguardando pagamento
- `processing`: Processando
- `succeeded`: Sucesso
- `failed`: Falhou
- `canceled`: Cancelado

### Status de Saque
- `pending`: Pendente de processamento
- `processing`: Sendo processado
- `completed`: Concluído
- `failed`: Falhou
- `canceled`: Cancelado

## Exemplos de Integração

### Frontend - Pagamento Pré-pago

```javascript
// 1. Criar pagamento
const response = await fetch('/api/payments/create-prepaid', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    amount: 100.00,
    currency: 'BRL'
  })
});

const { data } = await response.json();

// 2. Confirmar no frontend com Stripe
const stripe = Stripe('pk_...');
const { error } = await stripe.confirmPayment({
  clientSecret: data.client_secret,
  elements,
  confirmParams: {
    return_url: 'https://yoursite.com/success'
  }
});
```

### Frontend - Solicitação de Saque

```javascript
const response = await fetch('/api/withdrawals/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    amount: 50.00,
    currency: 'BRL',
    withdrawal_method: 'pix',
    pix_key: 'user@email.com'
  })
});

const result = await response.json();
```

### Backend - Verificar Operação

```javascript
// Antes de executar uma operação
const canOperate = await fetch(`/api/operations/check-eligibility?operation_type=trade&amount=10&currency=BRL`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

if (canOperate.data.can_operate) {
  // Executar débito
  await fetch('/api/operations/debit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      operation_type: 'trade',
      amount: 10.00,
      currency: 'BRL'
    })
  });
}
```

## Segurança

### Autenticação
- Bearer token JWT obrigatório para todas as rotas protegidas
- Middleware de autenticação valida token e carrega dados do usuário

### Autorização
- Rotas admin exigem role 'admin'
- Usuários só podem acessar seus próprios dados
- Validação de propriedade em operações sensíveis

### Validação
- Joi schema validation em todos os endpoints
- Sanitização de dados de entrada
- Verificação de limites e saldos

### Auditoria
- Log detalhado de todas as operações financeiras
- Rastreamento de alterações em configurações
- Histórico completo de transações

## Monitoramento

### Logs
- Logs estruturados com Winston/Pino
- Níveis: error, warn, info, debug
- Contexto detalhado para troubleshooting

### Métricas
- Tempo de processamento de saques
- Taxa de sucesso de pagamentos
- Volume de transações por período
- Alertas automáticos para discrepâncias

### Alertas
- Falhas em saques automáticos
- Discrepâncias na reconciliação
- Volumes anômalos de transações
- Erros críticos no sistema

Este sistema oferece uma solução completa e profissional para pagamentos, saques e controle financeiro com automação inteligente e segurança robusta.
