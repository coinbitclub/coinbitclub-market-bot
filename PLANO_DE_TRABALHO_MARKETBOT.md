# 🚀 PLANO DE TRABALHO COMPLETO - MARKETBOT BACKEND
## Sistema Enterprise de Trading Automático para 1000+ usuários simultâneos

**Data de Criação:** 20 de Agosto de 2025  
**Prazo de Entrega:** 20 semanas (5 meses)  
**Ambiente:** Railway (PostgreSQL já configurado)  
**Arquitetura:** Node.js + TypeScript + PostgreSQL + APIs Externas  

---

## 📋 **ESPECIFICAÇÕES TÉCNICAS CRÍTICAS**

### **🎯 PRIORIDADES OPERACIONAIS**
- ✅ **MAINNET TEM PRIORIDADE ABSOLUTA** sobre testnet na fila de execução
- ✅ **CONFIGURAÇÕES DE TRADING** alteráveis pelo admin via frontend
- ✅ **CÁLCULO DE OPERAÇÃO**: % do saldo do usuário na exchange (não no sistema)
- ✅ **COMISSIONAMENTO APENAS SOBRE LUCRO** (nunca sobre prejuízo)
- ✅ **COMISSÃO AFILIADO** descontada da comissão da empresa (não adicional)

### **💰 ESTRUTURA DE COMISSIONAMENTO**
```
OPERAÇÃO LUCRATIVA = USD 100
├── ex. PLANO MENSAL (10%): Comissão Empresa = USD 10
│   ├── Afiliado Normal (1.5%): USD 1.50 (descontado dos USD 10)
│   └── Afiliado VIP (5%): USD 5.00 (descontado dos USD 10)
└── ex. PLANO PRÉ-PAGO (20%): Comissão Empresa = USD 20
    ├── Afiliado Normal (1.5%): USD 3.00 (descontado dos USD 20)
    └── Afiliado VIP (5%): USD 10.00 (descontado dos USD 20)
```

### **⚖️ SISTEMA DE PRIORIDADES NA FILA**
```
PRIORIDADE 1: MAINNET - Usuários com saldo
PRIORIDADE 2: MAINNET - Usuários com cupom administrativo
PRIORIDADE 3: TESTNET - Todos os usuários
```

---

## **🏗️ FASE 1: ESTRUTURA BASE E CONFIGURAÇÃO (Semana 1-2)**

### **1.1 Setup do Projeto Enterprise**
- ✅ **Estrutura Node.js + TypeScript** com arquitetura modular
- ✅ **PostgreSQL Railway** (já configurado - validar conexão)
- ✅ **Docker** para desenvolvimento local
- ✅ **ESLint + Prettier** para padronização de código
- ✅ **Husky + Lint-staged** para commits seguros

**Estrutura de Pastas:**
```
backend/
├── src/
│   ├── controllers/          # Controladores das rotas
│   ├── services/            # Lógica de negócio
│   ├── models/              # Modelos do banco de dados
│   ├── middleware/          # Middlewares (auth, validation, etc)
│   ├── routes/              # Definição das rotas
│   ├── utils/               # Utilitários e helpers
│   ├── config/              # Configurações (database, apis, etc)
│   ├── validators/          # Validação de dados
│   ├── integrations/        # Integrações externas (Stripe, Exchanges, etc)
│   └── types/               # Definições de tipos TypeScript
├── migrations/              # Migrations do banco de dados
├── tests/                   # Testes automatizados
├── docs/                    # Documentação técnica
└── scripts/                 # Scripts utilitários
```

### **1.2 Database Schema Completo**
- ✅ **Design ER** para suporte a 1000+ usuários simultâneos
- ✅ **Migrations** sequenciais para todas as tabelas
- ✅ **Índices otimizados** para performance crítica
- ✅ **Triggers** para auditoria automática
- ✅ **Views** para relatórios complexos

### **1.3 Configuração de Segurança Base**
- ✅ **Variáveis de ambiente** seguras e criptografadas
- ✅ **Rate limiting** por IP e por usuário
- ✅ **CORS** configurado para produção
- ✅ **Helmet.js** para headers de segurança
- ✅ **Morgan** para logging de requisições

---

## **🔐 FASE 2: SISTEMA DE USUÁRIOS E AUTENTICAÇÃO (Semana 3-4)**

### **2.1 Gestão de Usuários Multinível**
- ✅ **Tipos de usuário**: ADMIN, GESTOR, OPERADOR, AFFILIATE_VIP, AFFILIATE
- ✅ **CRUD completo** com validação robusta
- ✅ **Middleware de permissões** granular por endpoint
- ✅ **Redirecionamento automático** baseado no user_type

### **2.2 Sistema de Autenticação Completo**
- ✅ **JWT com refresh tokens** (15min access + 7d refresh)
- ✅ **Bcrypt** para hash de senhas (saltRounds: 12)
- ✅ **Verificação de email** obrigatória via Twilio
- ✅ **Recuperação de senha** via SMS com código 6 dígitos
- ✅ **Two-factor authentication (2FA)** com Google Authenticator
- ✅ **Bloqueio automático** após 5 tentativas falhas (1h)

### **2.3 Sistema de Afiliados Completo**
- ✅ **Códigos únicos**: Formato CBC + 6 caracteres alfanuméricos
- ✅ **Links de afiliado**: `https://domain.com/register?ref=CBC123456`
- ✅ **Hierarquia**: Vinculação até 48h após cadastro
- ✅ **Comissões diferenciadas**:
  - AFFILIATE: 1.5% da comissão da empresa
  - AFFILIATE_VIP: 5.0% da comissão da empresa
- ✅ **Dashboard de performance** com métricas em tempo real
- ✅ **Conversão automática**: Comissão → Crédito administrativo (+10% bônus)

### **2.4 Sistema de Links e Códigos**
- ✅ **Geração automática de links** personalizados
- ✅ **Tracking de cliques** e conversões
- ✅ **Materiais de marketing** downloadáveis
- ✅ **QR Codes** para compartilhamento mobile

---

## **💰 FASE 3: SISTEMA FINANCEIRO COMPLETO (Semana 5-7)**

### **3.1 Gestão de Saldos Múltiplos**
- ✅ **Saldo Real BRL/USD** (Stripe - PODE SACAR)
- ✅ **Saldo Administrativo BRL/USD** (Cupons - NÃO PODE SACAR - Expira 30 dias)
- ✅ **Saldo Comissão BRL/USD** (PODE SACAR ou CONVERTER +10%)
- ✅ **Conversão automática** BRL ↔ USD com taxa atualizada
- ✅ **Histórico completo** de todas as movimentações
- ✅ **Auditoria financeira** com logs imutáveis

### **3.2 Integração Stripe Enterprise**
- ✅ **Planos de Assinatura**:
  - Brasil: R$ 297,00/mês (10% comissão)
  - Exterior: $50.00/mês (10% comissão)
- ✅ **Recargas Flexíveis**:
  - Mínimo: R$ 150 / $30
  - Bônus: +10% acima de R$ 1.000 / $300
- ✅ **Webhooks robustos** para todos os eventos
- ✅ **Período trial** de 7 dias gratuitos
- ✅ **Upgrade/downgrade** automático entre planos
- ✅ **Suporte PIX** para Brasil e cartão internacional

### **3.3 Sistema de Cupons Administrativos Avançado**
- ✅ **Tipos de cupom**:
  - Valor fixo: R$ 200 / $35 (BASIC)
  - Valor fixo: R$ 500 / $100 (PREMIUM)  
  - Valor fixo: R$ 1.000 / $200 (VIP)
  - Percentual: 5%, 10%, 15%, 20% de desconto
- ✅ **Geração automática** de códigos únicos (8 caracteres)
- ✅ **Controle de uso**:
  - Um cupom por usuário por tipo
  - Expiração automática em 30 dias
  - Validação de IP, telefone e User-Agent
- ✅ **Interface admin** para criação em massa
- ✅ **Logs completos** de utilização e auditoria

### **3.4 Sistema de Saques Profissional**
- ✅ **Regras de saque**:
  - Valor mínimo: R$ 50 / $10
  - Taxa fixa: R$ 10 / $2
  - Apenas saldo REAL (Stripe)
- ✅ **Datas fixas** de pagamento: dias 05 e 20 de cada mês
- ✅ **Aprovação automática** se usuário tem saldo suficiente
- ✅ **Validação obrigatória** de dados bancários
- ✅ **Notificações SMS** de status via Twilio
- ✅ **Interface admin** para aprovação manual

### **3.5 Comissionamento Inteligente**
- ✅ **Cobrança APENAS sobre LUCRO** (never loss)
- ✅ **Conversão USD → BRL** automática com taxa do dia
- ✅ **Cálculo de comissão**:
  ```
  Lucro USD 100 → BRL 525 (câmbio 5.25)
  PLANO MENSAL (10%): R$ 52,50
  ├── Empresa: R$ 51,71
  └── Afiliado Normal (1.5%): R$ 0,79
  
  PLANO PRÉ-PAGO (20%): R$ 105,00
  ├── Empresa: R$ 99,75
  └── Afiliado VIP (5%): R$ 5,25
  ```
- ✅ **Distribuição automática** para afiliados
- ✅ **Relatórios detalhados** por período

---

## **📊 FASE 4: SISTEMA DE INTELIGÊNCIA DE MERCADO (Semana 8-9)**

### **4.1 Fear & Greed Index Integration**
- ✅ **API CoinStats** com fallback para múltiplas fontes
- ✅ **Regras de decisão**:
  - F&G < 30: SOMENTE_LONG (prevalece sempre)
  - F&G > 80: SOMENTE_SHORT (prevalece sempre)
  - F&G 30-80: NEUTRO (segue análise técnica)
- ✅ **Cache inteligente** (5min) para otimização
- ✅ **Logs históricos** para análise de padrões

### **4.2 Market Pulse TOP 100 Binance**
- ✅ **Coleta automática** TOP 100 pares USDT por volume
- ✅ **Cálculos em tempo real**:
  - % Moedas Positivas (PM+)
  - % Moedas Negativas (PM-)
  - Variação Ponderada por Volume (VWΔ)
- ✅ **Regras de decisão**:
  - LONG: PM+ ≥ 60% E VWΔ > +0.5%
  - SHORT: PM- ≥ 60% E VWΔ < -0.5%
  - AMBOS: PM+ 40-60% OU VWΔ -0.5% a +0.5%
- ✅ **Histórico de tendências** (15/30/45min vs Now)

### **4.3 Dominância BTC**
- ✅ **Monitoramento tendência** BTC em tempo real
- ✅ **Regras informativas**:
  - ≥50% subindo: Short Altcoins
  - ≤45% caindo: Long Altcoins
  - Estável: Neutro
- ✅ **Integração com decisões** de trading

### **4.4 Sistema IA OpenAI GPT-4 Otimizado**
- ✅ **Prompts estruturados** para máxima eficiência
- ✅ **Análise de confiança** 1-100
- ✅ **Detecção de divergências** automática
- ✅ **Sistema fallback** sem IA para emergências
- ✅ **Otimização de tokens** para reduzir custos
- ✅ **Cache de decisões** similares

---

## **⚡ FASE 5: SISTEMA DE EXECUÇÃO DE ORDENS ENTERPRISE (Semana 10-12)**

### **5.1 Integração Exchanges Múltiplas**
- ✅ **Binance API v3** (Futures USDT-M prioritário)
- ✅ **Bybit API v5** (Unified Trading Account)
- ✅ **Auto-detecção** testnet/mainnet por chaves API
- ✅ **CCXT unificado** para padronização
- ✅ **Sistema de failover** entre exchanges
- ✅ **IP fixo NGROK** para webhooks

### **5.2 Configurações de Trading Alteráveis pelo Admin**
- ✅ **Interface admin** para alteração via frontend:
  ```
  CONFIGURAÇÕES DEFAULT (alteráveis):
  ├── Alavancagem: 5x (máx 10x permitido)
  ├── Stop Loss: 2x alavancagem = 10% (2-5x permitido)
  ├── Take Profit: 3x alavancagem = 15% (até 6x permitido)
  ├── Tamanho Posição: 30% do saldo exchange (10-50% permitido)
  ├── Max Posições Simultâneas: 2 por usuário
  └── Bloqueio Moeda: 120 min após operação
  ```
- ✅ **Configurações personalizadas** por usuário
- ✅ **Validação em tempo real** dos limites
- ✅ **Logs de alterações** pelo admin

### **5.3 Cálculo de Operação baseado no Saldo da Exchange**
- ✅ **Consulta saldo real** na exchange via API
- ✅ **Cálculo do valor**: % configurado × saldo_exchange
- ✅ **Validação de saldo mínimo** para mainnet
- ✅ **Backup para testnet** se saldo insuficiente
- ✅ **Log detalhado** de cada cálculo

### **5.4 Sistema de Fila com Prioridades**
- ✅ **PRIORIDADE 1**: MAINNET + Saldo Real (Stripe)
- ✅ **PRIORIDADE 2**: MAINNET + Saldo Administrativo (Cupons)
- ✅ **PRIORIDADE 3**: TESTNET + Qualquer usuário
- ✅ **Processamento paralelo** por prioridade
- ✅ **Rate limiting** por exchange

### **5.5 Webhooks TradingView Robustos**
- ✅ **Endpoints múltiplos**: `/api/webhooks/signal` e `/webhook`
- ✅ **Autenticação Bearer Token** obrigatória
- ✅ **Rate limiting**: 300 req/hora por IP
- ✅ **Validação de schema** JSON obrigatória
- ✅ **Janela de validade**: 30s validação + 120s execução
- ✅ **Sinais suportados**:
  - Abertura: "SINAL LONG FORTE" / "SINAL SHORT FORTE"
  - Fechamento: "FECHE LONG" / "FECHE SHORT"

### **5.6 Validações de Risco Rigorosas**
- ✅ **Máximo 2 operações** simultâneas por usuário
- ✅ **Bloqueio de moeda** por 120min pós-operação
- ✅ **Validação de saldo** para mainnet
- ✅ **Stop Loss e Take Profit** OBRIGATÓRIOS
- ✅ **Validação de chaves API** com cache (30min)

---

## **📱 FASE 6: MONITORAMENTO E NOTIFICAÇÕES (Semana 13-14)**

### **6.1 Monitoramento em Tempo Real**
- ✅ **WebSocket** para updates instantâneos
- ✅ **Status tracking**: PENDING → PROCESSING → SUCCESS/FAILED
- ✅ **Fechamento automático** por SL/TP atingido
- ✅ **Fechamento por sinal** "FECHE LONG/SHORT"
- ✅ **Cobrança automática** de comissão pós-operação

### **6.2 Sistema de Notificações Twilio**
- ✅ **SMS críticos**:
  - Operação aberta/fechada
  - Saque aprovado/processado
  - Login suspeito detectado
  - Saldo insuficiente
- ✅ **Relatórios automáticos**:
  - Diário: Performance do dia
  - Semanal: Resumo semanal
  - Mensal: Relatório completo
- ✅ **Personalização** por usuário

### **6.3 Dashboard Admin Real-time**
- ✅ **Métricas de sistema**:
  - Usuários ativos/operações em andamento
  - Performance das exchanges
  - Status das APIs externas
  - Métricas financeiras
- ✅ **Monitoramento de operações** em tempo real
- ✅ **Logs de auditoria** acessíveis
- ✅ **Alertas automáticos** para problemas

---

## **🔧 FASE 7: OTIMIZAÇÃO PARA 1000+ USUÁRIOS (Semana 15-16)**

### **7.1 Performance e Escalabilidade**
- ✅ **Redis Cache** para dados frequentes:
  - Sessões de usuário
  - Dados de mercado
  - Validações de API
- ✅ **Connection Pooling** PostgreSQL otimizado
- ✅ **Índices compostos** para queries complexas
- ✅ **Compressão gzip** nas respostas
- ✅ **Clustering Node.js** para múltiplos cores

### **7.2 Sistema de Logs Centralizado**
- ✅ **Winston** para logs estruturados
- ✅ **Níveis de log**: error, warn, info, debug
- ✅ **Rotação automática** de arquivos
- ✅ **Logs de auditoria** imutáveis
- ✅ **Dashboard de logs** para admin

### **7.3 Monitoramento e Alertas**
- ✅ **Health checks** automatizados
- ✅ **Métricas de performance** em tempo real
- ✅ **Alertas por Slack/Discord** para admin
- ✅ **Backup automático** PostgreSQL 24/7
- ✅ **Disaster recovery** testado

### **7.4 Segurança Enterprise**
- ✅ **HTTPS obrigatório** com SSL/TLS 1.3
- ✅ **Validação rigorosa** de todos os inputs
- ✅ **Proteção SQL injection** com prepared statements
- ✅ **Rate limiting avançado** por endpoint
- ✅ **WAF (Web Application Firewall)** configurado

---

## **🧪 FASE 8: TESTES COMPLETOS (Semana 17-18)**

### **8.1 Testes Automatizados**
- ✅ **Unit Tests** (Jest) - Cobertura mínima 95%
- ✅ **Integration Tests** para todas as APIs externas
- ✅ **Load Testing** com 1000+ usuários simultâneos
- ✅ **Security Testing** e penetration tests
- ✅ **End-to-end Testing** das jornadas críticas

### **8.2 Validação com Dados Reais**
- ✅ **Testnet completo** com usuários beta
- ✅ **Todas as integrações** validadas
- ✅ **Sistema financeiro** testado com valores reais
- ✅ **Comissionamento** validado matematicamente
- ✅ **Failover e recovery** testados

### **8.3 Teste de Stress do Sistema**
- ✅ **1000+ usuários simultâneos** executando operações
- ✅ **Webhooks em massa** para simular TradingView
- ✅ **Pagamentos simultâneos** via Stripe
- ✅ **Failover de exchanges** em tempo real
- ✅ **Recovery de falhas** críticas

---

## **🚀 FASE 9: DEPLOY E GO-LIVE (Semana 19-20)**

### **9.1 Deploy Produção Railway**
- ✅ **Pipeline CI/CD** GitHub → Railway automatizado
- ✅ **Environment variables** produção configuradas
- ✅ **SSL/TLS** com certificado válido
- ✅ **Domain** customizado configurado
- ✅ **Backup final** e validação

### **9.2 Operação 24/7 Enterprise**
- ✅ **Monitoramento contínuo** automatizado
- ✅ **Alertas críticos** configurados
- ✅ **Suporte técnico** estruturado
- ✅ **Rotinas de manutenção** programadas
- ✅ **Updates zero-downtime** configurados
- ✅ **Escalabilidade automática** ativa

---

## **📈 CRONOGRAMA DETALHADO DE ENTREGA**

| **Semana** | **Fase** | **Entregáveis Principais** | **% Conclusão** |
|------------|----------|---------------------------|-----------------|
| 1-2 | Estrutura Base | Database + Auth + Setup | 10% |
| 3-4 | Usuários + Auth | Sistema completo usuários + Afiliados + Links | 25% |
| 5-7 | Sistema Financeiro | Stripe + Saldos + Cupons + Comissões | 50% |
| 8-9 | IA + Market Data | Fear&Greed + AI + Market Pulse | 65% |
| 10-12 | Execução Trading | Webhooks + Exchanges + Fila Prioridades | 80% |
| 13-14 | Monitoramento | Real-time + Notifications + Dashboard | 90% |
| 15-16 | Otimização | Performance + Security + Cache | 95% |
| 17-18 | Testes | Load Testing + Validação + Stress Test | 98% |
| 19-20 | Go-Live | Produção + Operação 24/7 + Suporte | 100% |

---

## **🎯 MÉTRICAS DE SUCESSO**

### **Performance**
- ✅ Suporte a **1000+ usuários simultâneos**
- ✅ Latência < **200ms** para 95% das requisições
- ✅ Uptime > **99.9%** (menos de 8h downtime/ano)
- ✅ Processamento de webhook < **30 segundos**

### **Financeiro**
- ✅ **100% de precisão** no cálculo de comissões
- ✅ **Zero discrepâncias** entre saldos
- ✅ **Auditoria completa** de todas as transações
- ✅ **Reconciliação automática** com Stripe

### **Segurança**
- ✅ **Zero vulnerabilidades** críticas ou altas
- ✅ **Logs de auditoria** completos e imutáveis
- ✅ **Rate limiting** efetivo contra ataques
- ✅ **Backup e recovery** < 15 minutos

---

## **💡 INOVAÇÕES TÉCNICAS IMPLEMENTADAS**

### **1. Sistema de Fila Inteligente**
- Priorização automática mainnet vs testnet
- Processamento paralelo por nível de prioridade
- Rate limiting dinâmico por exchange

### **2. Comissionamento Inteligente**
- Cálculo apenas sobre lucro real
- Conversão automática USD→BRL
- Distribuição automática para afiliados

### **3. IA Híbrida**
- OpenAI GPT-4 para análise complexa
- Sistema fallback algorítmico
- Otimização de tokens para reduzir custos

### **4. Configurações Dinâmicas**
- Admin pode alterar defaults via frontend
- Usuários podem personalizar dentro dos limites
- Validação em tempo real

---

## **📞 PRÓXIMOS PASSOS IMEDIATOS**

1. ✅ **Validar conexão PostgreSQL Railway**
2. ✅ **Criar estrutura base do projeto**
3. ✅ **Implementar sistema de migrations**
4. ✅ **Configurar autenticação JWT**
5. ✅ **Testar integração Stripe**

**PRONTO PARA COMEÇAR O DESENVOLVIMENTO! 🚀**

---

*Documento criado em 20/08/2025 - Versão 1.0*  
*Próxima revisão: Ao final de cada fase*
