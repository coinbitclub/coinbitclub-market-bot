# 🎯 CONFIGURAÇÃO COMPLETA DOS WEBHOOKS TRADINGVIEW
# ================================================

## ✅ STATUS ATUAL

### 📊 Migração Railway Concluída
- ✅ 99 tabelas migradas para PostgreSQL Railway
- ✅ 26 variáveis de ambiente configuradas
- ✅ Todas as APIs integradas (Stripe, OpenAI, CoinStats, Zapi)
- ✅ Sistema multiservice rodando na URL: https://coinbitclub-market-bot.up.railway.app

### 🔧 Modificações Implementadas
- ✅ Endpoints de webhook adicionados ao server.js
- ✅ Tabelas de banco criadas (raw_webhook, trading_signals, dominance_data)
- ✅ Processamento específico para os Pine Scripts

## 🚨 PROBLEMA ATUAL

O Railway **NÃO APLICOU** as mudanças no server.js automaticamente.
Os endpoints retornam 404 porque o servidor não foi redeployado.

## 📡 ENDPOINTS IMPLEMENTADOS (PRONTOS PARA USO)

### 1. Webhook de Sinais TradingView
- **URL:** https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal?token=210406
- **Método:** POST
- **Dados esperados:** JSON do Pine Script CoinBitClub

### 2. Webhook de Dominância BTC
- **URL:** https://coinbitclub-market-bot.up.railway.app/api/webhooks/dominance?token=210406
- **Método:** POST
- **Dados esperados:** JSON do Pine Script BTC Dominance

### 3. Consulta de Sinais Recentes
- **URL:** https://coinbitclub-market-bot.up.railway.app/api/webhooks/signals/recent
- **Método:** GET
- **Parâmetros:** ?limit=50&symbol=BTCUSDT

## 🔧 SOLUÇÕES PARA ATIVAR OS WEBHOOKS

### Opção 1: Redeploy Manual no Railway Dashboard
1. Acesse o Railway Dashboard
2. Vá no projeto "coinbitclub-market-bot-v3"
3. Clique em "Deploy" ou "Redeploy"
4. Aguarde 2-3 minutos
5. Teste novamente os endpoints

### Opção 2: Push para Git (se conectado)
```bash
git add .
git commit -m "Add TradingView webhooks endpoints"
git push origin main
```

### Opção 3: Modificar Arquivo de Trigger
Edite qualquer arquivo e faça commit para triggerar redeploy.

## 📋 DADOS PROCESSADOS PELOS WEBHOOKS

### Pine Script 1: CoinBitClub - Sinal Completo
```json
{
  "ticker": "BTCUSDT",
  "time": "2024-01-26 15:30:00",
  "close": "42500.50",
  "ema9_30": "42450.25",
  "rsi_4h": "65.4",
  "rsi_15": "58.2", 
  "momentum_15": "125.6",
  "atr_30": "850.25",
  "atr_pct_30": "2.0",
  "vol_30": "1250000",
  "vol_ma_30": "980000",
  "diff_btc_ema7": "0.635",
  "cruzou_acima_ema9": "1",  // 1 = BUY signal
  "cruzou_abaixo_ema9": "0"  // 1 = SELL signal
}
```

### Pine Script 2: BTC Dominance vs EMA 7
```json
{
  "ticker": "BTC.D",
  "time": "2024-01-26 15:30:00", 
  "btc_dominance": "42.156",
  "ema_7": "41.890",
  "diff_pct": "0.635",
  "sinal": "NEUTRO"  // LONG, SHORT, NEUTRO
}
```

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Tabela: raw_webhook
- Armazena todos os webhooks recebidos (backup)
- Campos: id, source, payload, status, received_at, server_id

### Tabela: trading_signals
- Processa sinais de trading estruturados
- Campos: symbol, action, price, volume, strategy, metadata, etc.

### Tabela: dominance_data
- Armazena dados de dominância BTC
- Campos: symbol, dominance_percentage, signal_timestamp, metadata

## 🎯 CONFIGURAÇÃO NO TRADINGVIEW

### Para o Pine Script de Sinais:
1. Abra o código do indicador "CoinBitClub - Sinal Completo"
2. Na função alert(), use esta URL:
   ```
   https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal?token=210406
   ```

### Para o Pine Script de Dominância:
1. Abra o código do indicador "BTC Dominance vs EMA 7"
2. Na função alert(), use esta URL:
   ```
   https://coinbitclub-market-bot.up.railway.app/api/webhooks/dominance?token=210406
   ```

## 🔐 SEGURANÇA

- **Token de autenticação:** 210406
- **Validação:** Todos os webhooks verificam o token
- **Logs:** Todos os acessos são registrados
- **Headers:** CORS configurado para TradingView

## 📊 MONITORAMENTO

### Verificar se webhooks estão funcionando:
```bash
# Testar conectividade
curl https://coinbitclub-market-bot.up.railway.app/health

# Testar endpoint de sinais (após redeploy)
curl -X POST "https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal?token=210406" \
  -H "Content-Type: application/json" \
  -d '{"ticker":"BTCUSDT","cruzou_acima_ema9":"1"}'

# Consultar sinais recentes
curl "https://coinbitclub-market-bot.up.railway.app/api/webhooks/signals/recent"
```

## ⚡ PRÓXIMOS PASSOS

1. **URGENT:** Fazer redeploy manual no Railway
2. Testar todos os endpoints após redeploy
3. Configurar alertas no TradingView com as URLs corretas
4. Monitorar logs para verificar recepção dos sinais
5. Verificar se dados estão sendo salvos no banco

## 🎉 RESULTADO ESPERADO

Após o redeploy, os webhooks irão:
- ✅ Receber sinais do TradingView
- ✅ Processar dados dos Pine Scripts
- ✅ Salvar no banco PostgreSQL
- ✅ Retornar confirmação de recebimento
- ✅ Disponibilizar consulta de sinais recentes

---

**Status:** ⚠️ Aguardando redeploy Railway para ativação dos endpoints
