🚀 WEBHOOKS TRADINGVIEW - CONFIGURAÇÃO FINAL
============================================

## ✅ STATUS: WEBHOOKS ATIVOS E FUNCIONANDO

### 📊 RESULTADOS DOS TESTES:
- ✅ **Endpoint Principal**: `/api/webhooks/signal` - **FUNCIONANDO 100%**
- ✅ **Validação**: Dados obrigatórios validados corretamente
- ✅ **Resposta**: JSON estruturado com ID do sinal
- ✅ **Banco de Dados**: Sinais sendo salvos corretamente

### 🔗 ENDPOINT PRINCIPAL (RECOMENDADO):
```
URL: https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal
Method: POST
Content-Type: application/json
```

## 📋 CONFIGURAÇÃO NO TRADINGVIEW

### 1. 🎯 **URL DO WEBHOOK:**
```
https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal
```

### 2. 📦 **PAYLOAD RECOMENDADO:**
```json
{
  "symbol": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": "{{close}}",
  "quantity": "{{strategy.order.contracts}}",
  "strategy": "{{strategy.order.comment}}",
  "timeframe": "{{interval}}",
  "alert_message": "{{strategy.order.alert_message}}"
}
```

### 3. 📝 **PAYLOAD MÍNIMO (FUNCIONAL):**
```json
{
  "symbol": "{{ticker}}",
  "action": "BUY"
}
```

### 4. 🔒 **CONFIGURAÇÃO DE SEGURANÇA (OPCIONAL):**
Se quiser usar autenticação, adicione header:
```
Authorization: Bearer SEU_TOKEN_SECRETO
```

## 📊 CAMPOS SUPORTADOS

### ✅ **OBRIGATÓRIOS:**
- `symbol` - Par de trading (ex: "BTCUSDT")
- `action` - Ação a ser executada ("BUY" ou "SELL")

### 🔧 **OPCIONAIS:**
- `price` - Preço do ativo (número)
- `quantity` - Quantidade a negociar (número)
- `strategy` - Nome da estratégia (texto)
- `timeframe` - Timeframe do gráfico (ex: "1h", "5m")
- `alert_message` - Mensagem personalizada (texto)

## 🧪 EXEMPLOS DE PAYLOADS

### 📈 **SINAL DE COMPRA COMPLETO:**
```json
{
  "symbol": "BTCUSDT",
  "action": "BUY",
  "price": 45000.50,
  "quantity": 0.001,
  "strategy": "breakout_strategy",
  "timeframe": "1h",
  "alert_message": "BTC breaking resistance at $45,000"
}
```

### 📉 **SINAL DE VENDA SIMPLES:**
```json
{
  "symbol": "ETHUSDT",
  "action": "SELL",
  "price": 2500.00
}
```

### 🎯 **SINAL COM DADOS TRADINGVIEW:**
```json
{
  "symbol": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": {{close}},
  "quantity": {{strategy.order.contracts}},
  "strategy": "{{strategy.order.comment}}",
  "timeframe": "{{interval}}",
  "alert_message": "Signal from {{exchange}} - {{ticker}} at {{close}}"
}
```

## 📊 RESPOSTAS DO SERVIDOR

### ✅ **SUCESSO (200 OK):**
```json
{
  "success": true,
  "message": "Sinal processado com sucesso",
  "signalId": 123,
  "timestamp": "2025-07-30T15:27:33.190Z"
}
```

### ❌ **ERRO DE VALIDAÇÃO (400 Bad Request):**
```json
{
  "error": "Dados inválidos - symbol e action são obrigatórios"
}
```

### 🔒 **ERRO DE AUTENTICAÇÃO (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

## 🔧 CONFIGURAÇÃO PASSO A PASSO

### 1. **NO TRADINGVIEW:**
1. Abra sua estratégia ou indicador
2. Vá em "Alertas" 
3. Clique em "Criar Alerta"
4. Configure:
   - **Condição**: Sua condição de entrada/saída
   - **Ações**: Marque "Webhook URL"
   - **URL**: `https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal`
   - **Mensagem**: Use um dos payloads JSON acima

### 2. **TESTE MANUAL:**
Use curl para testar:
```bash
curl -X POST https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","action":"BUY","price":45000}'
```

## 📈 MONITORAMENTO

### 🔍 **VERIFICAR SINAIS RECEBIDOS:**
Os sinais são salvos na tabela `signals` do banco de dados com:
- ID único incremental
- Timestamp de recebimento
- Todos os dados do payload
- Status de processamento

### 📊 **LOGS DO SISTEMA:**
O sistema registra logs detalhados de:
- Webhooks recebidos
- Payloads processados
- Erros de validação
- Headers das requisições

## 🎉 SISTEMA PRONTO PARA PRODUÇÃO

### ✅ **CONFIRMAÇÕES:**
- Endpoint funcionando em produção
- Banco de dados configurado
- Validações implementadas
- Logs detalhados ativos
- Testes realizados com sucesso

### 🚀 **PRÓXIMOS PASSOS:**
1. Configure seus alertas no TradingView
2. Use a URL: `https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal`
3. Teste com payloads simples primeiro
4. Monitore os logs para verificar recebimento
5. Expanda para estratégias mais complexas

---

📅 **Configuração validada em:** 30/07/2025, 12:30:00  
🏆 **Status:** PRODUÇÃO ATIVA  
✅ **Teste realizado:** Sinais recebidos com IDs 2 e 3  
🎯 **Pronto para:** Operações reais do TradingView
