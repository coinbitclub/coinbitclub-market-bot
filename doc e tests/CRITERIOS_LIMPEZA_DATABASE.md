# 🧹 CRITÉRIOS DE LIMPEZA E MANUTENÇÃO DO BANCO DE DADOS
## MARKETBOT - Sistema de Limpeza Automática Enterprise

**Data de Criação:** 20 de Agosto de 2025  
**Frequência:** Execução automática diária às 02:00 UTC  
**Objetivo:** Manter performance ótima para 1000+ usuários simultâneos  

---

## 📋 **ROTINAS DE LIMPEZA AUTOMÁTICA**

### **🕐 CRONOGRAMA DE EXECUÇÃO**
```bash
# Limpeza Principal (Diário às 02:00 UTC)
CLEANUP_SCHEDULE="0 2 * * *"

# Limpeza de Logs (Semanal aos Domingos às 03:00 UTC)  
LOG_CLEANUP_SCHEDULE="0 3 * * 0"

# Limpeza de Sessões (A cada 6 horas)
SESSION_CLEANUP_SCHEDULE="0 */6 * * *"

# Limpeza de Dados Obsoletos (A cada 24 horas)
OBSOLETE_DATA_CLEANUP="0 */24 * * *"
```

### **⚠️ DADOS OBSOLETOS - LIMPEZA A CADA 24H**
> **IMPORTANTE**: Sinais de webhook, dados de mercado e logs não críticos se tornam obsoletos rapidamente
> e devem ser limpos a cada 24 horas para manter a performance do sistema.

- ✅ **Logs Sistema Não Críticos**: 24h (INFO, DEBUG, WARN)
- ✅ **Sinais TradingView**: 24h (perdem validade)
- ✅ **Market Data Cache**: 24h (dados desatualizados)  
- ✅ **Fear & Greed Index**: 24h (análise temporal)
- ✅ **Market Pulse Data**: 24h (dados de volume obsoletos)

---

## 🗂️ **CRITÉRIOS POR TABELA**

### **1. LOGS E AUDITORIA**

#### **1.1 Logs de Sistema (system_logs)**
- ✅ **Retenção**: 24 horas para logs não críticos (INFO, DEBUG, WARN)
- ✅ **Retenção**: 1 ano para logs críticos (ERROR, CRITICAL)
- ✅ **Critério**: Por nível de severidade

```sql
-- Limpeza de logs não críticos (24 horas)
DELETE FROM system_logs 
WHERE created_at < NOW() - INTERVAL '24 hours'
  AND log_level IN ('INFO', 'DEBUG', 'WARN');

-- Limpeza de logs críticos (1 ano)
DELETE FROM system_logs 
WHERE created_at < NOW() - INTERVAL '1 year'
  AND log_level IN ('ERROR', 'CRITICAL');
```

#### **1.2 Logs de Login (login_attempts)**
- ✅ **Retenção**: 7 dias para tentativas falhadas
- ✅ **Retenção**: 30 dias para logins bem-sucedidos
- ✅ **Critério**: Por tipo de resultado

```sql
-- Limpeza tentativas de login falhadas (7 dias)
DELETE FROM login_attempts 
WHERE created_at < NOW() - INTERVAL '7 days'
  AND success = false;

-- Limpeza logins bem-sucedidos (30 dias)
DELETE FROM login_attempts 
WHERE created_at < NOW() - INTERVAL '30 days'
  AND success = true;
```

### **2. SESSÕES E TOKENS**

#### **2.1 Sessões Expiradas (user_sessions)**
- ✅ **Retenção**: Imediata após expiração
- ✅ **Critério**: `expires_at < NOW()`

```sql
-- Limpeza de sessões expiradas
DELETE FROM user_sessions 
WHERE expires_at < NOW();

-- Limpeza de refresh tokens expirados
DELETE FROM refresh_tokens 
WHERE expires_at < NOW();
```

#### **2.2 Tokens JWT Blacklist (jwt_blacklist)**
- ✅ **Retenção**: 7 dias após expiração
- ✅ **Critério**: `expires_at < NOW() - INTERVAL '7 days'`

```sql
-- Limpeza de tokens na blacklist
DELETE FROM jwt_blacklist 
WHERE expires_at < NOW() - INTERVAL '7 days';
```

### **3. CUPONS E PROMOÇÕES**

#### **3.1 Cupons Expirados (coupons)**
- ✅ **Retenção**: 1 dia após expiração
- ✅ **Critério**: `expires_at < NOW() - INTERVAL '1 day'`
- ✅ **Preservar**: Logs de uso para auditoria

```sql
-- Limpeza de cupons expirados não utilizados
DELETE FROM coupons 
WHERE expires_at < NOW() - INTERVAL '1 day'
  AND used_at IS NULL
  AND status = 'EXPIRED';
```

#### **3.2 Logs de Cupons (coupon_usage_logs)**
- ✅ **Retenção**: 1 ano para auditoria fiscal
- ✅ **Critério**: `created_at < NOW() - INTERVAL '1 year'`

### **4. OPERAÇÕES DE TRADING**

#### **4.1 Operações Antigas (trading_operations)**
- ✅ **Retenção**: 2 anos para dados fiscais
- ✅ **Critério**: `created_at < NOW() - INTERVAL '2 years'`
- ✅ **Preservar**: Operações com status PENDING ou PROCESSING

```sql
-- Limpeza de operações antigas finalizadas
DELETE FROM trading_operations 
WHERE created_at < NOW() - INTERVAL '2 years'
  AND status IN ('SUCCESS', 'FAILED', 'CANCELLED');
```

#### **4.2 Sinais TradingView (tradingview_signals)**
- ✅ **Retenção**: 24 horas (dados se tornam obsoletos)
- ✅ **Critério**: `created_at < NOW() - INTERVAL '24 hours'`

```sql
-- Limpeza de sinais obsoletos (24h)
DELETE FROM tradingview_signals 
WHERE created_at < NOW() - INTERVAL '24 hours';
```

### **5. DADOS FINANCEIROS**

#### **5.1 Transações Financeiras (transactions)**
- ✅ **NUNCA DELETAR**: Obrigatório para auditoria fiscal
- ✅ **Compressão**: Transações > 1 ano são comprimidas
- ✅ **Arquivamento**: Transações > 7 anos vão para tabela histórica

```sql
-- Compressão de transações antigas (1 ano)
UPDATE transactions 
SET metadata = COMPRESS(metadata::text), is_compressed = true
WHERE created_at < NOW() - INTERVAL '1 year'
  AND is_compressed = false;
```

#### **5.2 Comissões (commissions)**
- ✅ **NUNCA DELETAR**: Dados fiscais obrigatórios
- ✅ **Compressão**: Apenas metadados após 1 ano

### **6. DADOS TEMPORÁRIOS**

#### **6.1 Cache de Market Data (market_data_cache)**
- ✅ **Retenção**: 24 horas (dados se tornam obsoletos)
- ✅ **Critério**: `created_at < NOW() - INTERVAL '24 hours'`

```sql
-- Limpeza de cache de mercado obsoleto
DELETE FROM market_data_cache 
WHERE created_at < NOW() - INTERVAL '24 hours';
```

#### **6.2 Fear & Greed Index (fear_greed_data)**
- ✅ **Retenção**: 24 horas (dados se tornam obsoletos)
- ✅ **Critério**: `created_at < NOW() - INTERVAL '24 hours'`

```sql
-- Limpeza de dados Fear & Greed obsoletos
DELETE FROM fear_greed_data 
WHERE created_at < NOW() - INTERVAL '24 hours';
```

#### **6.3 Market Pulse Data (market_pulse_data)**
- ✅ **Retenção**: 24 horas (dados se tornam obsoletos)
- ✅ **Critério**: `created_at < NOW() - INTERVAL '24 hours'`

```sql
-- Limpeza de dados Market Pulse obsoletos
DELETE FROM market_pulse_data 
WHERE created_at < NOW() - INTERVAL '24 hours';
```

#### **6.4 Validações de API (api_validations)**
- ✅ **Retenção**: 7 dias
- ✅ **Critério**: `created_at < NOW() - INTERVAL '7 days'`

### **7. NOTIFICAÇÕES**

#### **7.1 Notificações Enviadas (notifications)**
- ✅ **Retenção**: 30 dias
- ✅ **Critério**: `created_at < NOW() - INTERVAL '30 days'`
- ✅ **Preservar**: Notificações críticas por 90 dias

```sql
-- Limpeza de notificações antigas
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '30 days'
  AND priority NOT IN ('CRITICAL', 'HIGH');

-- Limpeza de notificações críticas (90 dias)
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '90 days'
  AND priority IN ('CRITICAL', 'HIGH');
```

---

## 🔧 **ROTINAS DE OTIMIZAÇÃO**

### **1. REINDEX AUTOMÁTICO**
- ✅ **Frequência**: Semanal aos Domingos às 04:00 UTC
- ✅ **Tabelas críticas**: users, trading_operations, transactions

```sql
-- Reindex tabelas críticas
REINDEX TABLE users;
REINDEX TABLE trading_operations;
REINDEX TABLE transactions;
REINDEX TABLE commissions;
```

### **2. ANÁLISE DE ESTATÍSTICAS**
- ✅ **Frequência**: Diário após limpeza
- ✅ **Comando**: `ANALYZE` em todas as tabelas

```sql
-- Atualização de estatísticas
ANALYZE users;
ANALYZE trading_operations;
ANALYZE transactions;
ANALYZE market_data_cache;
```

### **3. VACUUM AUTOMÁTICO**
- ✅ **Configuração**: PostgreSQL autovacuum habilitado
- ✅ **Threshold**: 20% de tuplas mortas
- ✅ **Scale Factor**: 0.1

---

## 📊 **MÉTRICAS DE MONITORAMENTO**

### **1. Tamanho das Tabelas**
```sql
-- Query para monitorar tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### **2. Registros por Tabela**
```sql
-- Query para contar registros
SELECT 
    table_name,
    (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
    SELECT 
        table_name, 
        table_schema,
        query_to_xml(format('select count(*) as cnt from %I.%I', table_schema, table_name), false, true, '') as xml_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
) t;
```

---

## 🚨 **ALERTAS E NOTIFICAÇÕES**

### **1. Alertas Críticos**
- ✅ **Tabela > 10GB**: Alerta imediato para admin
- ✅ **Limpeza falhada**: Notificação por SMS
- ✅ **Performance degradada**: Alerta automático

### **2. Relatórios de Limpeza**
- ✅ **Frequência**: Diário após execução
- ✅ **Conteúdo**: 
  - Registros removidos por tabela
  - Espaço liberado
  - Tempo de execução
  - Eventuais erros

### **3. Dashboard de Monitoramento**
- ✅ **Métricas em tempo real**:
  - Tamanho total do banco
  - Taxa de crescimento
  - Performance das queries
  - Status das limpezas

---

## 🔒 **BACKUP ANTES DA LIMPEZA**

### **1. Backup Automático**
- ✅ **Frequência**: Antes de cada limpeza principal
- ✅ **Retenção**: 7 backups rotativos
- ✅ **Compressão**: gzip para otimizar espaço

```bash
# Backup antes da limpeza
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### **2. Rollback de Emergência**
- ✅ **Procedimento documentado** para restauração
- ✅ **Testes mensais** de recuperação
- ✅ **RTO**: 15 minutos
- ✅ **RPO**: 24 horas

---

## 📈 **BENEFÍCIOS ESPERADOS**

### **1. Performance**
- ✅ **Redução de 80%** no tamanho das tabelas de log
- ✅ **Melhoria de 50%** na velocidade das queries
- ✅ **Redução de 90%** no tempo de backup

### **2. Custos**
- ✅ **Redução de 60%** no uso de storage
- ✅ **Otimização de recursos** Railway
- ✅ **Menor custo de backup**

### **3. Manutenibilidade**
- ✅ **Limpeza automática** sem intervenção manual
- ✅ **Monitoramento proativo** de problemas
- ✅ **Relatórios automatizados** para auditoria

---

**IMPLEMENTAÇÃO:** Integrada ao sistema principal com execução automática  
**MONITORAMENTO:** Dashboard admin em tempo real  
**MANUTENÇÃO:** Zero intervenção manual necessária  

---

*Documento criado em 20/08/2025 - Versão 1.0*  
*Próxima revisão: Mensal ou conforme necessidade*
