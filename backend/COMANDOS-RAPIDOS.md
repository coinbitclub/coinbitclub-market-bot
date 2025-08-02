# 🚀 CoinBitClub - Comandos Rápidos

## ⚡ CONTROLE DO SISTEMA

### 🎛️ Comandos Principais
```bash
# 🚀 INICIAR SISTEMA COMPLETO
node system-controller.js start

# 🛑 PARAR SISTEMA COMPLETO  
node system-controller.js stop

# 🔄 REINICIAR SISTEMA
node system-controller.js restart

# 📊 STATUS DOS SERVIÇOS
node system-controller.js status

# 🏥 VERIFICAÇÃO DE SAÚDE COMPLETA
node system-controller.js health

# 📝 VER LOGS DO SISTEMA
node system-controller.js logs
```

## 🔗 LINKS DE ACESSO

### 📊 Interfaces Web
- **Dashboard Principal:** http://localhost:3009
- **WebSocket Health:** http://localhost:3015/health  
- **API Indicadores:** http://localhost:3016/health
- **Trading Status:** http://localhost:9003/api/status

### 🌐 WebSocket
- **Conexão WebSocket:** ws://localhost:3015

## 📈 APIS DISPONÍVEIS

### 🤖 Trading API (Porta 9003)
```bash
# Status do trading
GET http://localhost:9003/api/status

# Executar trade
POST http://localhost:9003/api/trade
{
    "userId": "user-id",
    "symbol": "BTCUSDT", 
    "side": "buy",
    "quantity": 0.001,
    "price": 45000
}

# Posições ativas
GET http://localhost:9003/api/positions

# Histórico
GET http://localhost:9003/api/history
```

### 📊 Indicadores API (Porta 3016)
```bash
# Listar indicadores
GET http://localhost:3016/api/indicators

# Indicadores por símbolo
GET http://localhost:3016/api/indicators/BTCUSDT

# Calcular indicadores customizados
POST http://localhost:3016/api/indicators
{
    "symbol": "ETHUSDT",
    "prices": [3200, 3250, 3180],
    "indicators": ["rsi", "sma_20"]
}
```

## 🗄️ BANCO DE DADOS

### 📊 Verificações de Banco
```bash
# Testar conexão
node analisar-estrutura-banco.js

# Corrigir dados
node corrigir-dados-banco.js

# Ajustar tabelas
node ajustar-tabelas.js
```

### 👥 Usuários Configurados
- **luiza_maria** - lmariadapinto@gmail.com
- **admin** - faleconosco@coinbitclub.vip  
- **paloma** - pamaral15@hotmail.com
- **erica** - erica.andrade.santos@hotmail.com

## 🔧 RESOLUÇÃO DE PROBLEMAS

### ❌ Serviço não inicia
```bash
# Parar todos
node system-controller.js stop

# Aguardar 5 segundos
timeout 5

# Iniciar novamente  
node system-controller.js start
```

### 🔍 Verificar portas ocupadas
```bash
# Verificar todas as portas do sistema
netstat -ano | findstr "3009 3015 3016 9003"

# Matar processo específico (substitua PID)
taskkill /PID [PID] /F
```

### 📝 Limpar logs
```bash
# Backup do log atual
copy system.log system.log.backup

# Limpar log
echo. > system.log
```

## 🎯 MONITORAMENTO

### 📊 Status Rápido
```bash
# Status dos 4 serviços principais
node system-controller.js status
```

### 🏥 Saúde Completa  
```bash
# Relatório detalhado com tempos de resposta
node relatorio-saude-final.js
```

### 📈 Verificação de Performance
```bash
# Usar com system-controller para logs automáticos
node system-controller.js health
```

## 🚀 DEPLOY E PRODUÇÃO

### ✅ Checklist Pré-Deploy
1. ✅ Todos os 4 serviços ativos
2. ✅ Banco de dados conectado
3. ✅ Usuários configurados
4. ✅ APIs respondendo
5. ✅ Dashboard carregando

### 🔄 Manutenção Regular
```bash
# Verificação diária
node system-controller.js health

# Verificação semanal completa  
node relatorio-saude-final.js

# Restart semanal
node system-controller.js restart
```

## 🎉 SISTEMA 100% OPERACIONAL

**Status:** ✅ Todos os 4 componentes ativos
**Saúde:** 🎯 100% - Sistema funcionando perfeitamente
**Acesso:** 📊 Dashboard em http://localhost:3009

---
*Atualizado em: 31/07/2025*
