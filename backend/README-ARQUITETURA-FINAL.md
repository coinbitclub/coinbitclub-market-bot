# 🤖 SISTEMA COINBITCLUB - ARQUITETURA FINAL

## 📋 VISÃO GERAL

Sistema completo de trading automatizado com **IA SUPERVISORA** que monitora, calcula e emite ordens para microserviços, mas **NUNCA EXECUTA DIRETAMENTE** operações financeiras.

## 🏗️ ARQUITETURA DE MICROSERVIÇOS

### 🤖 IA SYSTEMS (Supervisores)

#### 1. IA Guardian (`ia-sequence-guardian.js`)
- **Função**: Garantir sequência Fear&Greed → Sinal → Operação
- **Executa**: Atualização de dados, busca web quando APIs falham
- **NÃO Executa**: Trading direto

#### 2. IA Supervisor Financeiro (`ia-supervisor-financeiro.js`)
- **Função**: Supervisionar cálculos, comissões, contabilização
- **Executa**: Emissão de ordens para microserviços
- **NÃO Executa**: Pagamentos, transferências, alterações financeiras

### 🔧 SISTEMAS DE TRADING

#### 3. Sistema Integrado Completo (`sistema-integrado-completo.js`)
- **Função**: Coordenação geral do trading
- **Integra**: IA Guardian + TradingView + Fear&Greed

#### 4. Sistema Final Integrado (`sistema-final-integrado.js`)
- **Função**: Orquestração de todos os subsistemas
- **Coordena**: Trading System + Supervisor Financeiro

### 📡 COMUNICAÇÃO E APIS

#### 5. Servidor Webhook (`servidor-webhook-completo.js`)
- **Função**: Receber sinais do TradingView
- **Endpoints**: `/webhook/tradingview`, `/health`, `/status`

#### 6. Processador de Sinais (`processador-sinais-tradingview-real.js`)
- **Função**: Processar sinais reais do Pine Script
- **Sinais**: "SINAL LONG", "SINAL SHORT", "FECHE LONG", etc.

### 📊 DADOS E MONITORAMENTO

#### 7. Fear & Greed Integration (`fear-greed-integration.js`)
- **Função**: Múltiplas fontes + fallback web
- **APIs**: CoinStats, Alternative.me, CoinGecko

## 🎯 RESPONSABILIDADES DA IA

### ✅ A IA EXECUTA APENAS:
- Atualização de dados em tempo real
- Manutenção de informações
- Logs e registros
- Busca de dados web (fallback)
- Emissão de ordens para microserviços

### ❌ A IA NÃO EXECUTA:
- Trading direto
- Pagamentos financeiros
- Transferências bancárias
- Alterações em saldos
- Modificações de posições

### 🎛️ A IA SUPERVISIONA:
- Robô Financeiro (cálculos)
- Sistema de Comissões (afiliados)
- Contabilização (registros)
- Microserviços (health check)

## 🔄 FLUXO DE OPERAÇÃO

### 1. Recepção de Sinal
```
TradingView → Webhook → IA Guardian → Validação Fear&Greed
```

### 2. Processamento
```
IA Guardian → Sistema Trading → Execução → Notificação Supervisor
```

### 3. Supervisão Financeira
```
Supervisor IA → Análise → Ordem para Microserviço → Execução
```

### 4. Monitoramento
```
Monitoramento Cruzado → Verificação Status → Registro Logs
```

## 📊 CONFIGURAÇÕES DE TRADING

### Parâmetros Padrão:
- **Alavancagem**: 5x
- **Take Profit**: 15% (3x alavancagem)
- **Stop Loss**: 10% (2x alavancagem)
- **Percentual por trade**: 30% do saldo
- **Max posições**: 2 simultâneas

### Limites Máximos:
- **Alavancagem máxima**: 10x
- **Take Profit máximo**: 5x alavancagem
- **Stop Loss máximo**: 4x alavancagem

## 🤝 SISTEMA DE AFILIADOS

### Comissionamento:
- **Taxa padrão**: 1.5%
- **Taxa VIP**: 5%
- **Base**: Lucro das operações
- **Processamento**: Automático via supervisor

### Pagamentos:
- **Mínimo**: $50
- **Frequência**: Mensal
- **Status**: Pending → Approved → Paid

## 🗄️ DATABASE STRUCTURE

### Tabelas Principais:
- `users` - Usuários e afiliados
- `user_operations` - Operações de trading
- `affiliate_commissions` - Comissões calculadas
- `company_financial` - Registros contábeis
- `ai_analysis` - Logs da IA
- `system_status` - Status do sistema

## 🚀 SCRIPTS DE EXECUÇÃO

### Produção:
```bash
npm start                    # Sistema Final Completo
npm run sistema-final        # Sistema Final Integrado
```

### Desenvolvimento:
```bash
npm run dev                  # Desenvolvimento com nodemon
npm run test-supervisor      # Testar Supervisor Financeiro
npm run test-ia              # Testar IA Guardian
```

### Configuração:
```bash
npm run configurar-db        # Configurar parâmetros TP/SL
```

### Componentes Individuais:
```bash
npm run webhook-server       # Apenas servidor webhook
npm run sistema-completo     # Sistema trading completo
npm run supervisor-financeiro # Apenas supervisor
```

## 🔍 MONITORAMENTO

### Health Checks:
- **Microserviços**: A cada 1 minuto
- **Operações**: A cada 30 segundos  
- **Comissões**: A cada 1 minuto
- **Status Geral**: A cada 10 minutos

### Endpoints de Status:
- `GET /health` - Health check completo
- `GET /status` - Status detalhado
- `GET /fear-greed` - Fear & Greed atual

## 🔐 SEGURANÇA

### Princípios:
- IA nunca executa operações financeiras diretamente
- Todas as ações passam por microserviços especializados
- Logs completos de todas as operações
- Validação em múltiplas camadas

### Failsafes:
- Fallback para dados web quando APIs falham
- Health checks contínuos
- Timeout em todas as operações
- Registro de ordens pendentes

## 📈 INTEGRAÇÃO TRADINGVIEW

### Sinais Aceitos:
- `"SINAL LONG"` / `"SINAL LONG FORTE"` → Abre LONG
- `"SINAL SHORT"` / `"SINAL SHORT FORTE"` → Abre SHORT  
- `"FECHE LONG"` → Fecha posições LONG
- `"FECHE SHORT"` → Fecha posições SHORT
- `"CONFIRMAÇÃO LONG"` / `"CONFIRMAÇÃO SHORT"` → Confirmações

### Webhook Configuration:
```
URL: http://your-domain.com/webhook/tradingview
Method: POST
Content-Type: application/json
```

### Payload Example:
```json
{
  "action": "SINAL_LONG",
  "symbol": "BTCUSDT", 
  "price": 45000,
  "message": "Sinal gerado pelo Pine Script"
}
```

## 🎯 PRÓXIMOS PASSOS

### Para Produção:
1. Deploy do sistema final no Railway/Heroku
2. Configuração dos webhooks do TradingView
3. Teste end-to-end com dados reais
4. Monitoramento ativo 24/7

### Para Desenvolvimento:
1. Implementação dos microserviços de pagamento
2. Dashboard web para monitoramento
3. APIs REST para gestão
4. Notificações por email/SMS

---

**Desenvolvido por**: CoinBitClub Team  
**Versão**: 2.0.0  
**Data**: Julho 2025  
**Arquitetura**: Microserviços + IA Supervisora
