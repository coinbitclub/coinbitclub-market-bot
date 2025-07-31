# 📊 RELATÓRIO TÉCNICO PARA EQUIPE FRONTEND
## CoinBitClub Market Bot V3.0.0 - Integração Frontend

---

### 🎯 **OBJETIVO**
Este relatório fornece todas as informações necessárias para integração do frontend com o backend do sistema de trading automatizado.

---

## 🔗 **ENDPOINTS DA API**

### **BASE URL**
```
Desenvolvimento: http://localhost:3000
Produção: https://api.coinbitclub.com
```

### **🎛️ CONTROLE DO SISTEMA**

#### **Ligar Sistema**
```http
POST /api/system/start
Headers: {
  "Authorization": "Bearer JWT_TOKEN",
  "Content-Type": "application/json"
}
Body: {
  "mode": "PRODUCTION",  // ou "TESTNET"
  "auto_trading": true,
  "ai_assistance": true
}

Response: {
  "success": true,
  "message": "Sistema ativado com sucesso",
  "system_id": "uuid",
  "status": "ACTIVE",
  "timestamp": "2025-01-31T15:30:00.000Z"
}
```

#### **Desligar Sistema**
```http
POST /api/system/stop
Headers: {
  "Authorization": "Bearer JWT_TOKEN"
}

Response: {
  "success": true,
  "message": "Sistema desativado com segurança",
  "stopped_operations": 5,
  "timestamp": "2025-01-31T15:30:00.000Z"
}
```

#### **Status do Sistema**
```http
GET /api/system/status
Headers: {
  "Authorization": "Bearer JWT_TOKEN"
}

Response: {
  "status": "OPERATIONAL",
  "version": "3.0.0",
  "uptime": 86400,
  "services": {
    "database": "CONNECTED",
    "redis": "CONNECTED", 
    "trading": "ACTIVE",
    "ai": "OPERATIONAL",
    "monitoring": "ACTIVE"
  },
  "current_users": 25,
  "operations_today": 156,
  "system_load": 45.2
}
```

### **📊 DASHBOARD PRINCIPAL**

#### **Métricas Gerais**
```http
GET /api/dashboard
Headers: {
  "Authorization": "Bearer JWT_TOKEN"
}

Response: {
  "metrics": {
    "total_operations": 1250,
    "operations_today": 156,
    "success_rate": 87.5,
    "total_pnl": 15750.25,
    "daily_pnl": 1250.75,
    "active_users": 25,
    "avg_profit_per_operation": 12.50
  },
  "top_performers": [
    {
      "user_id": "uuid",
      "email": "user@example.com",
      "daily_pnl": 125.50,
      "operations": 12,
      "success_rate": 91.7
    }
  ],
  "recent_operations": [
    {
      "id": "uuid",
      "ticker": "BTCUSDT",
      "side": "BUY",
      "quantity": "0.001",
      "price": "45000.00",
      "pnl": 12.50,
      "status": "CLOSED",
      "user_email": "user@example.com",
      "created_at": "2025-01-31T15:30:00.000Z"
    }
  ]
}
```

### **👥 GESTÃO DE USUÁRIOS**

#### **Listar Usuários**
```http
GET /api/users?page=1&limit=20&status=active
Headers: {
  "Authorization": "Bearer JWT_TOKEN"
}

Response: {
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "João Silva",
      "status": "ACTIVE",
      "plan": "PREMIUM",
      "balance": 5000.00,
      "api_keys_configured": true,
      "last_operation": "2025-01-31T15:30:00.000Z",
      "total_operations": 45,
      "success_rate": 89.2,
      "total_pnl": 567.89
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_users": 100,
    "limit": 20
  }
}
```

#### **Detalhes do Usuário**
```http
GET /api/users/:userId
Headers: {
  "Authorization": "Bearer JWT_TOKEN"
}

Response: {
  "user": {
    "id": "uuid",
    "email": "user@example.com", 
    "name": "João Silva",
    "status": "ACTIVE",
    "plan": {
      "name": "PREMIUM",
      "features": ["AI_ANALYSIS", "UNLIMITED_OPERATIONS", "SMS_ALERTS"],
      "expires_at": "2025-12-31T23:59:59.000Z"
    },
    "balance": {
      "total": 5000.00,
      "available": 4500.00,
      "in_operations": 500.00
    },
    "api_keys": {
      "bybit_configured": true,
      "last_verified": "2025-01-31T10:00:00.000Z",
      "status": "VALID"
    },
    "statistics": {
      "total_operations": 156,
      "success_rate": 87.5,
      "total_pnl": 1250.75,
      "avg_operation_size": 100.00,
      "best_day": 125.50,
      "worst_day": -45.20
    }
  }
}
```

### **📈 OPERAÇÕES**

#### **Operações Abertas**
```http
GET /api/operations/open?user_id=uuid
Headers: {
  "Authorization": "Bearer JWT_TOKEN"
}

Response: {
  "open_operations": [
    {
      "id": "uuid",
      "signal_id": "uuid",
      "user_id": "uuid",
      "ticker": "BTCUSDT",
      "side": "BUY",
      "quantity": "0.001",
      "entry_price": "45000.00",
      "current_price": "45125.00",
      "unrealized_pnl": 1.25,
      "stop_loss": "44500.00",
      "take_profit": "46000.00",
      "status": "OPEN",
      "created_at": "2025-01-31T15:30:00.000Z",
      "duration": "00:15:30"
    }
  ],
  "summary": {
    "total_open": 5,
    "total_value": 2250.00,
    "unrealized_pnl": 125.50
  }
}
```

#### **Histórico de Operações**
```http
GET /api/operations/history?user_id=uuid&page=1&limit=20&date_from=2025-01-01&date_to=2025-01-31
Headers: {
  "Authorization": "Bearer JWT_TOKEN"
}

Response: {
  "operations": [
    {
      "id": "uuid",
      "ticker": "BTCUSDT",
      "side": "BUY", 
      "quantity": "0.001",
      "entry_price": "45000.00",
      "exit_price": "45125.00",
      "pnl": 1.25,
      "pnl_percentage": 0.28,
      "status": "CLOSED",
      "duration": "00:15:30",
      "signal_source": "TradingView",
      "ai_confidence": 85.2,
      "created_at": "2025-01-31T15:30:00.000Z",
      "closed_at": "2025-01-31T15:45:30.000Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_operations": 200
  },
  "summary": {
    "total_pnl": 567.89,
    "success_rate": 87.5,
    "avg_duration": "00:25:15",
    "best_operation": 25.50,
    "worst_operation": -8.75
  }
}
```

### **🤖 IA E ANÁLISES**

#### **Análise de Sentimento**
```http
GET /api/ai/sentiment?ticker=BTCUSDT
Headers: {
  "Authorization": "Bearer JWT_TOKEN"
}

Response: {
  "sentiment": {
    "score": 0.75,
    "label": "BULLISH",
    "confidence": 89.5,
    "factors": [
      {
        "source": "social_media",
        "weight": 0.3,
        "score": 0.8,
        "description": "Sentimento positivo no Twitter"
      },
      {
        "source": "news_analysis", 
        "weight": 0.4,
        "score": 0.7,
        "description": "Notícias favoráveis sobre adoção"
      }
    ],
    "updated_at": "2025-01-31T15:30:00.000Z"
  }
}
```

#### **Predições de IA**
```http
GET /api/ai/predictions?ticker=BTCUSDT&timeframe=1h
Headers: {
  "Authorization": "Bearer JWT_TOKEN"
}

Response: {
  "prediction": {
    "direction": "UP",
    "confidence": 78.5,
    "target_price": 46250.00,
    "time_horizon": "1h",
    "probability": {
      "up": 78.5,
      "down": 21.5
    },
    "technical_indicators": {
      "rsi": 65.2,
      "macd": "BULLISH",
      "moving_averages": "BULLISH",
      "volume": "INCREASING"
    },
    "generated_at": "2025-01-31T15:30:00.000Z"
  }
}
```

### **📊 MONITORAMENTO**

#### **Status do Monitoramento**
```http
GET /api/monitoring/status
Headers: {
  "Authorization": "Bearer JWT_TOKEN"
}

Response: {
  "monitoring": {
    "system_health": "GOOD",
    "last_check": "2025-01-31T15:30:00.000Z",
    "services": {
      "trading_engine": {
        "status": "OPERATIONAL",
        "latency": 125,
        "uptime": 99.98
      },
      "ai_service": {
        "status": "OPERATIONAL", 
        "response_time": 850,
        "accuracy": 87.5
      },
      "notification_service": {
        "status": "OPERATIONAL",
        "delivery_rate": 99.2
      }
    },
    "alerts": [
      {
        "level": "WARNING",
        "message": "Alta latência detectada no serviço de IA",
        "timestamp": "2025-01-31T15:25:00.000Z"
      }
    ]
  }
}
```

---

## 🔐 **AUTENTICAÇÃO**

### **Login**
```http
POST /api/auth/login
Body: {
  "email": "admin@coinbitclub.com",
  "password": "senha_segura",
  "remember_me": true
}

Response: {
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "uuid",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "admin@coinbitclub.com",
    "role": "ADMIN",
    "permissions": ["SYSTEM_CONTROL", "USER_MANAGEMENT", "VIEW_ANALYTICS"]
  }
}
```

### **Refresh Token**
```http
POST /api/auth/refresh
Body: {
  "refresh_token": "uuid"
}

Response: {
  "token": "novo_jwt_token",
  "expires_in": 3600
}
```

---

## 📱 **WEBSOCKETS (REAL-TIME)**

### **Conexão**
```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'JWT_TOKEN'
  }
});
```

### **Eventos Disponíveis**

#### **Novas Operações**
```javascript
socket.on('new_operation', (data) => {
  console.log('Nova operação:', data);
  // {
  //   operation_id: "uuid",
  //   user_id: "uuid", 
  //   ticker: "BTCUSDT",
  //   side: "BUY",
  //   status: "FILLED"
  // }
});
```

#### **Operações Fechadas**
```javascript
socket.on('operation_closed', (data) => {
  console.log('Operação fechada:', data);
  // {
  //   operation_id: "uuid",
  //   pnl: 12.50,
  //   status: "CLOSED",
  //   duration: "00:15:30"
  // }
});
```

#### **Métricas em Tempo Real**
```javascript
socket.on('metrics_update', (data) => {
  console.log('Métricas atualizadas:', data);
  // {
  //   operations_today: 156,
  //   success_rate: 87.5,
  //   total_pnl: 1250.75,
  //   active_operations: 8
  // }
});
```

#### **Alertas do Sistema**
```javascript
socket.on('system_alert', (data) => {
  console.log('Alerta:', data);
  // {
  //   level: "WARNING",
  //   message: "Alta latência detectada",
  //   timestamp: "2025-01-31T15:30:00.000Z",
  //   action_required: false
  // }
});
```

---

## 🎨 **COMPONENTES SUGERIDOS**

### **Dashboard Principal**
```jsx
// Componentes necessários:
- SystemStatus (liga/desliga, status geral)
- MetricsCards (operações, PnL, taxa sucesso)
- RealTimeChart (gráfico de performance)
- RecentOperations (últimas operações)
- TopPerformers (melhores usuários)
- AlertsPanel (alertas do sistema)
```

### **Gestão de Usuários**
```jsx
// Componentes necessários:
- UsersList (tabela com paginação)
- UserDetails (modal com detalhes)
- UserBalance (saldo e operações)
- UserStatistics (gráficos de performance)
- APIKeysStatus (status das chaves)
```

### **Operações**
```jsx
// Componentes necessários:
- OpenOperationsTable (operações em aberto)
- OperationsHistory (histórico com filtros)
- OperationDetails (detalhes da operação)
- PnLChart (gráfico de lucros/perdas)
- PerformanceMetrics (métricas de performance)
```

### **Monitoramento**
```jsx
// Componentes necessários:
- SystemHealth (status dos serviços)
- ServicesStatus (grid de serviços)
- AlertsHistory (histórico de alertas)
- PerformanceCharts (gráficos de performance)
- LogsViewer (visualizador de logs)
```

---

## 🔄 **ESTADOS E LOADING**

### **Estados do Sistema**
```javascript
const SYSTEM_STATES = {
  STARTING: 'Iniciando sistema...',
  ACTIVE: 'Sistema ativo',
  STOPPING: 'Parando sistema...',
  STOPPED: 'Sistema parado',
  ERROR: 'Erro no sistema',
  MAINTENANCE: 'Em manutenção'
};
```

### **Estados das Operações**
```javascript
const OPERATION_STATES = {
  PENDING: 'Pendente',
  FILLED: 'Executada',
  OPEN: 'Aberta',
  CLOSED: 'Fechada',
  CANCELLED: 'Cancelada',
  ERROR: 'Erro'
};
```

### **Loading States**
```javascript
// Sugestão de loading states
const LOADING_STATES = {
  LOADING_DASHBOARD: 'Carregando dashboard...',
  LOADING_USERS: 'Carregando usuários...',
  LOADING_OPERATIONS: 'Carregando operações...',
  STARTING_SYSTEM: 'Iniciando sistema...',
  STOPPING_SYSTEM: 'Parando sistema...'
};
```

---

## ⚠️ **TRATAMENTO DE ERROS**

### **Códigos de Erro Comuns**
```javascript
const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMIT: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Estrutura padrão de erro
{
  "error": true,
  "code": "UNAUTHORIZED",
  "message": "Token inválido ou expirado",
  "details": "O token JWT fornecido não é válido",
  "timestamp": "2025-01-31T15:30:00.000Z"
}
```

### **Interceptador de Erro (Axios)**
```javascript
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado - redirecionar para login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 📱 **RESPONSIVIDADE**

### **Breakpoints Sugeridos**
```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### **Componentes Mobile**
```jsx
// Componentes otimizados para mobile:
- MobileDashboard (versão simplificada)
- MobileOperations (tabela compacta)
- MobileAlerts (notificações push)
- SwipeActions (ações por gesture)
```

---

## 🎯 **PRIORIDADES DE DESENVOLVIMENTO**

### **FASE 1 - Essencial** (Semana 1-2)
1. ✅ Sistema de login/autenticação
2. ✅ Dashboard principal com métricas
3. ✅ Controle liga/desliga do sistema
4. ✅ Lista de usuários básica
5. ✅ Operações em tempo real

### **FASE 2 - Funcional** (Semana 3-4)
1. ✅ Gestão completa de usuários
2. ✅ Histórico de operações com filtros
3. ✅ Gráficos de performance
4. ✅ Alertas e notificações
5. ✅ Monitoramento de sistema

### **FASE 3 - Avançado** (Semana 5-6)
1. ✅ Analytics avançado
2. ✅ Relatórios customizados
3. ✅ IA e predições
4. ✅ Configurações avançadas
5. ✅ Mobile optimization

---

## 📞 **CONTATO E SUPORTE**

### **Equipe Backend**
- **Tech Lead**: backend@coinbitclub.com
- **API Support**: api@coinbitclub.com
- **Slack**: #backend-support

### **Documentação Adicional**
- **Swagger/OpenAPI**: `http://localhost:3000/docs`
- **Postman Collection**: `docs/CoinBitClub-API.postman_collection.json`
- **Changelog**: `CHANGELOG.md`

---

**🚀 Sistema Backend V3.0.0 - Pronto para Integração!**

**Última Atualização**: 31 de Janeiro de 2025
**Versão da API**: 3.0.0
**Status**: PRODUCTION READY ✅
