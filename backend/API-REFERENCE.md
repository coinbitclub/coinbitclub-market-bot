# 📡 API Reference - CoinBitClub Market Bot

![API](https://img.shields.io/badge/API-REST-blue.svg)
![WebSocket](https://img.shields.io/badge/WebSocket-Supported-green.svg)
![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)

## 📋 Índice

- [🌐 Visão Geral](#visão-geral)
- [🔐 Autenticação](#autenticação)
- [📊 APIs de Monitoramento](#apis-de-monitoramento)
- [🎯 APIs de Trading](#apis-de-trading)
- [👥 APIs de Usuários](#apis-de-usuários)
- [🔑 APIs de Chaves](#apis-de-chaves)
- [🤖 APIs de IA](#apis-de-ia)
- [📈 APIs Financeiras](#apis-financeiras)
- [🔄 WebSocket](#websocket)
- [📝 Webhooks](#webhooks)
- [❌ Códigos de Erro](#códigos-de-erro)

---

## 🌐 Visão Geral

A API do CoinBitClub Market Bot oferece endpoints REST completos para monitoramento, controle e integração com o sistema de trading automatizado.

### 🔗 Base URLs

- **Desenvolvimento:** `http://localhost:3000`
- **Produção:** `https://your-railway-url.railway.app`

### 📊 Formato de Resposta

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-07-31T16:30:00Z",
  "version": "3.0.0"
}
```

### 📋 Headers Necessários

```http
Content-Type: application/json
Accept: application/json
User-Agent: CoinBitClub-Client/1.0
```

---

## 🔐 Autenticação

### 🔑 API Key Authentication

```http
Authorization: Bearer YOUR_API_KEY
```

### 🛡️ Rate Limiting

- **Geral:** 100 requests/minute
- **Monitoring:** 200 requests/minute
- **Trading:** 50 requests/minute
- **Webhooks:** 1000 requests/minute

---

## 📊 APIs de Monitoramento

### 🏥 Health Check

#### `GET /api/health`

**Descrição:** Verificação básica de saúde do sistema

```bash
curl -X GET "http://localhost:3000/api/health"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": "2h 30m 15s",
    "version": "3.0.0",
    "timestamp": "2025-07-31T16:30:00Z"
  }
}
```

### 📊 Status Completo do Sistema

#### `GET /api/monitoring/status`

**Descrição:** Status detalhado de todos os componentes

```bash
curl -X GET "http://localhost:3000/api/monitoring/status"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "server": {
      "status": "online",
      "uptime": "2h 30m 15s",
      "cpu_usage": "15%",
      "memory_usage": "45%",
      "load_average": [0.8, 0.9, 1.0]
    },
    "database": {
      "status": "connected",
      "ping": "12ms",
      "connections": 8,
      "queries_per_second": 25
    },
    "websocket": {
      "status": "active",
      "connections": 3,
      "messages_per_minute": 120
    },
    "gestores": {
      "total": 6,
      "ativos": 6,
      "status": "operational",
      "last_cycle": "2025-07-31T16:29:30Z"
    },
    "supervisors": {
      "total": 2,
      "ativos": 2,
      "status": "monitoring",
      "financeiro": "active",
      "trade_tempo_real": "active"
    },
    "trading": {
      "signals_24h": 45,
      "operations_active": 12,
      "success_rate": "78%",
      "total_volume": "125000.00"
    }
  }
}
```

### 📡 Sinais Recentes

#### `GET /api/monitoring/signals`

**Descrição:** Últimos sinais processados do TradingView

**Query Parameters:**
- `limit` - Número de sinais (default: 20, max: 100)
- `symbol` - Filtrar por símbolo (opcional)
- `action` - Filtrar por ação: BUY, SELL (opcional)

```bash
curl -X GET "http://localhost:3000/api/monitoring/signals?limit=10&symbol=BTCUSDT"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "signals": [
      {
        "id": "uuid-123",
        "symbol": "BTCUSDT",
        "action": "BUY",
        "price": 67850.50,
        "quantity": 0.001,
        "timestamp": "2025-07-31T16:25:00Z",
        "processed": true,
        "status": "executed"
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 10
  }
}
```

### 💰 Operações Ativas

#### `GET /api/monitoring/operations`

**Descrição:** Trades atualmente ativos

```bash
curl -X GET "http://localhost:3000/api/monitoring/operations"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "operations": [
      {
        "id": "op-456",
        "user_id": "user-123",
        "user_name": "PALOMA AMARAL",
        "symbol": "ADAUSDT",
        "side": "LONG",
        "entry_price": 0.45,
        "current_price": 0.45,
        "quantity": 1000,
        "pnl": "0.00",
        "pnl_percentage": "0.00%",
        "status": "active",
        "opened_at": "2025-07-31T15:30:00Z"
      }
    ],
    "total_active": 12,
    "total_volume": "125000.00"
  }
}
```

### 🔑 Status das Chaves API

#### `GET /api/monitoring/api-keys`

**Descrição:** Status das chaves API dos usuários

```bash
curl -X GET "http://localhost:3000/api/monitoring/api-keys"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-123",
        "name": "PALOMA AMARAL",
        "plan_type": "VIP",
        "api_status": "active",
        "api_valid": true,
        "last_validated": "2025-07-31T16:00:00Z",
        "trading_enabled": true
      }
    ],
    "summary": {
      "total_users": 3,
      "active_keys": 2,
      "vip_users": 2,
      "basic_users": 1
    }
  }
}
```

### 🤖 Status dos Gestores

#### `GET /api/monitoring/gestores`

**Descrição:** Status detalhado dos gestores

```bash
curl -X GET "http://localhost:3000/api/monitoring/gestores"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gestores": [
      {
        "name": "GestorOperacoes",
        "status": "active",
        "last_execution": "2025-07-31T16:29:30Z",
        "cycles_completed": 1250,
        "success_rate": "95%"
      },
      {
        "name": "GestorMonitoramentoEncerramento",
        "status": "active",
        "monitored_positions": 12,
        "auto_closes_today": 5
      }
    ],
    "summary": {
      "total": 6,
      "active": 6,
      "last_cycle": "2025-07-31T16:29:30Z"
    }
  }
}
```

### 🧠 Status dos IA Supervisors

#### `GET /api/monitoring/supervisors`

**Descrição:** Status dos supervisores de IA

```bash
curl -X GET "http://localhost:3000/api/monitoring/supervisors"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "supervisors": [
      {
        "name": "IA Supervisor Financeiro",
        "status": "active",
        "monitoring_since": "2025-07-31T14:00:00Z",
        "alerts_issued": 3,
        "last_check": "2025-07-31T16:29:45Z"
      },
      {
        "name": "IA Supervisor Trade Tempo Real",
        "status": "active",
        "trades_monitored": 150,
        "anomalies_detected": 0
      }
    ],
    "summary": {
      "total": 2,
      "active": 2,
      "monitoring": true
    }
  }
}
```

---

## 🎯 APIs de Trading

### 📊 Fear & Greed Index

#### `GET /api/trading/fear-greed`

**Descrição:** Último valor do Fear & Greed Index

```bash
curl -X GET "http://localhost:3000/api/trading/fear-greed"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "value": 45,
    "classification": "FEAR",
    "direction_allowed": ["LONG", "SHORT"],
    "updated_at": "2025-07-31T16:15:00Z",
    "source": "alternative.me"
  }
}
```

### 🎯 Validar Sinal

#### `POST /api/trading/validate-signal`

**Descrição:** Validar um sinal antes de executar

**Request Body:**
```json
{
  "symbol": "BTCUSDT",
  "action": "BUY",
  "price": 67850.50,
  "user_id": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "reason": "Signal validated successfully",
    "fear_greed_compatible": true,
    "user_eligible": true,
    "risk_assessment": "low"
  }
}
```

### 📈 Executar Ordem

#### `POST /api/trading/execute-order`

**Descrição:** Executar uma ordem de trading

**Request Body:**
```json
{
  "user_id": "user-123",
  "symbol": "BTCUSDT",
  "side": "Buy",
  "qty": 0.001,
  "order_type": "Market"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_id": "order-789",
    "status": "filled",
    "executed_price": 67851.20,
    "executed_qty": 0.001,
    "commission": 0.05,
    "execution_time": "2025-07-31T16:30:15Z"
  }
}
```

---

## 👥 APIs de Usuários

### 📋 Listar Usuários

#### `GET /api/users`

**Descrição:** Lista todos os usuários

**Query Parameters:**
- `plan_type` - Filtrar por plano: VIP, BASIC
- `status` - Filtrar por status: active, inactive
- `limit` - Número de usuários (default: 50)

```bash
curl -X GET "http://localhost:3000/api/users?plan_type=VIP&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-123",
        "name": "PALOMA AMARAL",
        "email": "paloma@example.com",
        "plan_type": "VIP",
        "status": "active",
        "created_at": "2025-07-01T00:00:00Z",
        "last_login": "2025-07-31T15:00:00Z"
      }
    ],
    "total": 3,
    "page": 1,
    "limit": 10
  }
}
```

### 👤 Detalhes do Usuário

#### `GET /api/users/{user_id}`

**Descrição:** Detalhes completos de um usuário

```bash
curl -X GET "http://localhost:3000/api/users/user-123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "name": "PALOMA AMARAL",
      "email": "paloma@example.com",
      "plan_type": "VIP",
      "status": "active",
      "api_keys_configured": true,
      "trading_enabled": true,
      "operations_total": 150,
      "operations_active": 3,
      "total_pnl": "2500.75",
      "success_rate": "82%",
      "created_at": "2025-07-01T00:00:00Z"
    }
  }
}
```

---

## 🔑 APIs de Chaves

### 🔐 Validar Chaves API

#### `POST /api/keys/validate`

**Descrição:** Validar chaves API de um usuário

**Request Body:**
```json
{
  "user_id": "user-123",
  "api_key": "bybit_api_key",
  "api_secret": "bybit_api_secret"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "permissions": ["read", "trade"],
    "balance_available": true,
    "testnet": false,
    "validated_at": "2025-07-31T16:30:00Z"
  }
}
```

---

## 🤖 APIs de IA

### 🧠 Status IA Guardian

#### `GET /api/ai/guardian/status`

**Descrição:** Status do IA Guardian

```bash
curl -X GET "http://localhost:3000/api/ai/guardian/status"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "active",
    "protection_level": "high",
    "signals_analyzed": 1250,
    "threats_detected": 3,
    "last_analysis": "2025-07-31T16:29:50Z"
  }
}
```

### 📊 Análise de Risco

#### `POST /api/ai/risk-assessment`

**Descrição:** Análise de risco para uma operação

**Request Body:**
```json
{
  "symbol": "BTCUSDT",
  "action": "BUY",
  "quantity": 0.001,
  "user_id": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "risk_level": "low",
    "score": 25,
    "factors": [
      "Market volatility: normal",
      "User exposure: 15%",
      "Symbol liquidity: high"
    ],
    "recommendation": "proceed"
  }
}
```

---

## 📈 APIs Financeiras

### 💰 Resumo Financeiro

#### `GET /api/financial/summary`

**Descrição:** Resumo financeiro geral

```bash
curl -X GET "http://localhost:3000/api/financial/summary"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_volume_24h": "125000.00",
    "total_pnl_24h": "2500.75",
    "active_operations": 12,
    "completed_operations_24h": 35,
    "commission_earned_24h": "125.50",
    "success_rate_24h": "78%"
  }
}
```

### 📊 Comissões

#### `GET /api/financial/commissions`

**Descrição:** Relatório de comissões

**Query Parameters:**
- `period` - Período: day, week, month
- `user_id` - Filtrar por usuário

```bash
curl -X GET "http://localhost:3000/api/financial/commissions?period=day"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "commissions": [
      {
        "user_id": "user-123",
        "user_name": "PALOMA AMARAL",
        "operation_id": "op-456",
        "commission_amount": "12.50",
        "commission_rate": "10%",
        "processed_at": "2025-07-31T16:00:00Z"
      }
    ],
    "total_commission": "125.50",
    "period": "day"
  }
}
```

---

## 🔄 WebSocket

### 📡 Conexão WebSocket

**URL:** `ws://localhost:3016` (desenvolvimento)  
**URL:** `wss://your-railway-url.railway.app` (produção)

### 📊 Eventos Disponíveis

#### **system_status**
Status geral do sistema atualizado em tempo real

```json
{
  "event": "system_status",
  "data": {
    "timestamp": "2025-07-31T16:30:00Z",
    "server": "online",
    "database": "connected",
    "gestores_active": 6,
    "supervisors_active": 2
  }
}
```

#### **new_signal**
Novo sinal recebido e processado

```json
{
  "event": "new_signal",
  "data": {
    "id": "signal-789",
    "symbol": "BTCUSDT",
    "action": "BUY",
    "price": 67850.50,
    "processed": true,
    "timestamp": "2025-07-31T16:30:00Z"
  }
}
```

#### **operation_update**
Atualização de operação ativa

```json
{
  "event": "operation_update",
  "data": {
    "operation_id": "op-456",
    "symbol": "ADAUSDT",
    "current_price": 0.46,
    "pnl": "10.00",
    "pnl_percentage": "2.22%",
    "timestamp": "2025-07-31T16:30:00Z"
  }
}
```

### 📤 Comandos WebSocket

#### **subscribe**
Inscrever-se em eventos específicos

```json
{
  "command": "subscribe",
  "events": ["system_status", "new_signal", "operation_update"]
}
```

#### **unsubscribe**
Cancelar inscrição

```json
{
  "command": "unsubscribe",
  "events": ["operation_update"]
}
```

---

## 📝 Webhooks

### 🎯 TradingView Webhook

#### `POST /webhook/tradingview`

**Descrição:** Receber sinais do TradingView

**Request Body:**
```json
{
  "symbol": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": "{{close}}",
  "time": "{{time}}",
  "exchange": "{{exchange}}"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "signal_id": "signal-789",
    "processed": true,
    "message": "Signal received and processed successfully"
  }
}
```

### 🔔 Notification Webhook

#### `POST /webhook/notification`

**Descrição:** Receber notificações externas

**Request Body:**
```json
{
  "type": "alert",
  "message": "High volatility detected",
  "severity": "warning",
  "source": "external_monitor"
}
```

---

## ❌ Códigos de Erro

### 📋 HTTP Status Codes

| Código | Descrição | Significado |
|--------|-----------|-------------|
| `200` | OK | Requisição bem-sucedida |
| `201` | Created | Recurso criado com sucesso |
| `400` | Bad Request | Parâmetros inválidos |
| `401` | Unauthorized | Autenticação necessária |
| `403` | Forbidden | Acesso negado |
| `404` | Not Found | Recurso não encontrado |
| `429` | Too Many Requests | Rate limit excedido |
| `500` | Internal Server Error | Erro interno do servidor |
| `503` | Service Unavailable | Serviço temporariamente indisponível |

### 🔍 Códigos de Erro Específicos

```json
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "API key is invalid or expired",
    "details": "The provided API key could not be validated",
    "timestamp": "2025-07-31T16:30:00Z"
  }
}
```

#### **Códigos Comuns:**

- `INVALID_API_KEY` - Chave API inválida
- `RATE_LIMIT_EXCEEDED` - Rate limit excedido
- `DATABASE_CONNECTION_ERROR` - Erro de conexão com banco
- `INSUFFICIENT_BALANCE` - Saldo insuficiente
- `INVALID_SYMBOL` - Símbolo inválido
- `TRADING_DISABLED` - Trading desabilitado para usuário
- `FEAR_GREED_INCOMPATIBLE` - Sinal incompatível com Fear & Greed
- `SYSTEM_MAINTENANCE` - Sistema em manutenção

---

## 📚 Exemplos de Uso

### 🔄 Monitoramento Completo

```javascript
// Verificar status completo do sistema
const response = await fetch('/api/monitoring/status');
const status = await response.json();

if (status.data.gestores.ativos === 6) {
  console.log('✅ Todos os gestores estão ativos');
} else {
  console.log('⚠️ Alguns gestores podem estar inativos');
}
```

### 📊 WebSocket Real-time

```javascript
const ws = new WebSocket('ws://localhost:3016');

ws.onopen = () => {
  // Inscrever-se em eventos
  ws.send(JSON.stringify({
    command: 'subscribe',
    events: ['system_status', 'new_signal', 'operation_update']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.event) {
    case 'new_signal':
      console.log('📡 Novo sinal:', data.data);
      break;
    case 'operation_update':
      console.log('💰 Operação atualizada:', data.data);
      break;
  }
};
```

### 🎯 Validação e Execução

```javascript
// 1. Validar sinal
const validateResponse = await fetch('/api/trading/validate-signal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbol: 'BTCUSDT',
    action: 'BUY',
    price: 67850.50,
    user_id: 'user-123'
  })
});

const validation = await validateResponse.json();

// 2. Se válido, executar
if (validation.data.valid) {
  const executeResponse = await fetch('/api/trading/execute-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'user-123',
      symbol: 'BTCUSDT',
      side: 'Buy',
      qty: 0.001,
      order_type: 'Market'
    })
  });
  
  const execution = await executeResponse.json();
  console.log('✅ Ordem executada:', execution.data);
}
```

---

**📡 API completa e documentada para integração total!** 🚀
