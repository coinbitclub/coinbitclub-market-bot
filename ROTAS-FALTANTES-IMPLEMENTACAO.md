# 🚨 ROTAS FALTANTES: Backend Implementation Required

## 📋 Implementação Imediata Necessária

### 1. **GET /api/auth/verify** - Verificação de Token
```javascript
// backend/api-gateway/src/controllers/authController.js
export const verify = handleAsyncError(async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token não fornecido' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db('users').where({ id: decoded.id }).first();
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }

    await verifyUserStatus(user);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Token inválido' 
    });
  }
});
```

### 2. **GET /api/signals/realtime** - Sinais em Tempo Real
```javascript
// backend/api-gateway/src/controllers/signalsController.js
export const getRealtimeSignals = handleAsyncError(async (req, res) => {
  try {
    // Buscar sinais dos últimos 15 minutos
    const signals = await db('trading_signals')
      .where('created_at', '>=', db.raw("datetime('now', '-15 minutes')"))
      .orderBy('created_at', 'desc')
      .limit(20);

    res.json({
      success: true,
      data: signals.map(signal => ({
        id: signal.id,
        symbol: signal.symbol,
        action: signal.action,
        price: signal.price,
        confidence: signal.confidence,
        timestamp: signal.created_at,
        source: signal.source || 'tradingview'
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar sinais em tempo real'
    });
  }
});
```

### 3. **GET /api/dashboard** - Dashboard Unificado
```javascript
// backend/api-gateway/src/controllers/dashboardController.js
export const getDashboard = handleAsyncError(async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar dados do usuário
    const user = await db('users').where({ id: userId }).first();
    
    // Buscar posições ativas
    const positions = await db('user_positions')
      .where({ user_id: userId, status: 'OPEN' })
      .limit(10);
    
    // Buscar sinais recentes
    const recentSignals = await db('trading_signals')
      .orderBy('created_at', 'desc')
      .limit(5);
    
    // Calcular estatísticas
    const stats = await db('user_positions')
      .where({ user_id: userId, status: 'CLOSED' })
      .select(
        db.raw('COUNT(*) as total_trades'),
        db.raw('SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades'),
        db.raw('SUM(pnl) as total_pnl')
      )
      .first();

    const winRate = stats.total_trades > 0 
      ? (stats.winning_trades / stats.total_trades * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        balance: user.balance || 0,
        positions: positions,
        recent_signals: recentSignals,
        statistics: {
          total_trades: stats.total_trades || 0,
          winning_trades: stats.winning_trades || 0,
          total_pnl: stats.total_pnl || 0,
          win_rate: parseFloat(winRate)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao carregar dashboard'
    });
  }
});
```

### 4. **POST /api/trading/positions** - Criar Posição
```javascript
// backend/api-gateway/src/controllers/tradingController.js
export const createPosition = handleAsyncError(async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, side, amount, price } = req.body;

    // Validações
    if (!symbol || !side || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Symbol, side e amount são obrigatórios'
      });
    }

    if (!['BUY', 'SELL'].includes(side)) {
      return res.status(400).json({
        success: false,
        error: 'Side deve ser BUY ou SELL'
      });
    }

    // Verificar saldo do usuário
    const user = await db('users').where({ id: userId }).first();
    const requiredBalance = amount * (price || 100); // Preço estimado se não fornecido
    
    if (user.balance < requiredBalance) {
      return res.status(400).json({
        success: false,
        error: 'Saldo insuficiente'
      });
    }

    // Criar posição
    const [position] = await db('user_positions').insert({
      user_id: userId,
      symbol,
      side,
      amount,
      entry_price: price || null,
      current_price: price || null,
      status: 'OPEN',
      opened_at: db.fn.now(),
      created_at: db.fn.now()
    }).returning('*');

    res.status(201).json({
      success: true,
      data: {
        id: position.id,
        symbol: position.symbol,
        side: position.side,
        amount: position.amount,
        entry_price: position.entry_price,
        current_price: position.current_price,
        pnl: 0,
        status: position.status,
        opened_at: position.opened_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao criar posição'
    });
  }
});
```

### 5. **POST /api/trading/positions/:id/close** - Fechar Posição
```javascript
export const closePosition = handleAsyncError(async (req, res) => {
  try {
    const userId = req.user.id;
    const positionId = req.params.id;
    const { close_price } = req.body;

    // Buscar posição
    const position = await db('user_positions')
      .where({ id: positionId, user_id: userId, status: 'OPEN' })
      .first();

    if (!position) {
      return res.status(404).json({
        success: false,
        error: 'Posição não encontrada ou já fechada'
      });
    }

    // Calcular PnL
    const entryPrice = position.entry_price || position.current_price;
    const currentPrice = close_price || position.current_price;
    let pnl = 0;

    if (position.side === 'BUY') {
      pnl = (currentPrice - entryPrice) * position.amount;
    } else {
      pnl = (entryPrice - currentPrice) * position.amount;
    }

    // Atualizar posição
    await db('user_positions')
      .where({ id: positionId })
      .update({
        status: 'CLOSED',
        close_price: currentPrice,
        pnl: pnl,
        closed_at: db.fn.now(),
        updated_at: db.fn.now()
      });

    // Atualizar saldo do usuário
    await db('users')
      .where({ id: userId })
      .increment('balance', pnl);

    res.json({
      success: true,
      data: {
        position_id: positionId,
        pnl: pnl,
        close_price: currentPrice,
        closed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao fechar posição'
    });
  }
});
```

## 📁 **Estrutura de Arquivos Necessária**

### Criar Controllers Faltantes:
```
backend/api-gateway/src/controllers/
├── signalsController.js     ✅ Criar
├── tradingController.js     ✅ Criar  
└── dashboardController.js   ✅ Atualizar
```

### Atualizar Rotas:
```javascript
// backend/api-gateway/src/routes.js
import signalsController from './controllers/signalsController.js';
import tradingController from './controllers/tradingController.js';

// Adicionar novas rotas
router.get('/auth/verify', auth.verify);
router.get('/signals/realtime', authenticateToken, signalsController.getRealtimeSignals);
router.get('/dashboard', authenticateToken, dashboard.getDashboard);
router.post('/trading/positions', authenticateToken, tradingController.createPosition);
router.post('/trading/positions/:id/close', authenticateToken, tradingController.closePosition);
```

## 🗄️ **Tabelas de Banco Necessárias**

```sql
-- Tabela de sinais de trading
CREATE TABLE IF NOT EXISTS trading_signals (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    action VARCHAR(10) NOT NULL,
    price DECIMAL(18,8),
    confidence INTEGER DEFAULT 0,
    source VARCHAR(50) DEFAULT 'tradingview',
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de posições do usuário
CREATE TABLE IF NOT EXISTS user_positions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    amount DECIMAL(18,8) NOT NULL,
    entry_price DECIMAL(18,8),
    current_price DECIMAL(18,8),
    close_price DECIMAL(18,8),
    pnl DECIMAL(18,8) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'OPEN',
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_trading_signals_created_at ON trading_signals(created_at DESC);
CREATE INDEX idx_user_positions_user_status ON user_positions(user_id, status);
```

## ⚡ **Script de Implementação Rápida**

```bash
# Criar arquivos de controller
cd backend/api-gateway/src/controllers
touch signalsController.js tradingController.js

# Executar migrations de banco
node -e "
const { db } = require('../../../common/db.js');
// Executar SQLs acima
"

# Reiniciar servidor
npm restart
```

## 🎯 **Prioridade de Implementação**

1. **🔥 CRÍTICO**: GET /api/auth/verify (autenticação)
2. **🔥 CRÍTICO**: GET /api/dashboard (dashboard principal)  
3. **🟡 MÉDIO**: GET /api/signals/realtime (tempo real)
4. **🟡 MÉDIO**: POST /api/trading/positions (trading)
5. **🟢 BAIXO**: POST /api/trading/positions/:id/close (finalização)

**Tempo Estimado**: 4-6 horas para implementação completa.
