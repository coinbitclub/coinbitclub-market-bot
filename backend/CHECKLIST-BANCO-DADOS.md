# ✅ CHECKLIST DE VERIFICAÇÃO DO BANCO DE DADOS
## Pós-Migração Railway V2

### 📋 VERIFICAÇÕES OBRIGATÓRIAS

#### 🔍 **1. CONECTIVIDADE**
```bash
# Testar conexão básica
curl https://[NOVA-URL]/health

# Verificar status do banco no health check
curl https://[NOVA-URL]/api/health
```

**✅ Resultado esperado:**
- Status: "healthy"
- Database: "connected"
- Sem erros de timeout

---

#### 🗄️ **2. ESTRUTURA DO BANCO**
```sql
-- Conectar ao novo banco
railway connect postgres

-- Verificar tabelas criadas
\dt

-- Verificar estrutura da tabela principal
\d raw_webhook

-- Verificar configurações
SELECT * FROM system_config;
```

**✅ Resultado esperado:**
- Tabelas básicas criadas (raw_webhook, system_config)
- Índices aplicados corretamente
- Configurações de migração presentes

---

#### 📊 **3. FUNCIONALIDADE DE WEBHOOKS**
```bash
# Testar webhook TradingView
curl -X POST https://[NOVA-URL]/api/webhooks/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "token": "coinbitclub_webhook_secret_2024",
    "symbol": "BTCUSDT",
    "action": "BUY", 
    "price": 45000,
    "strategy": "test-migration"
  }'
```

**✅ Resultado esperado:**
- Status 200
- Response com success: true
- database_saved: true
- signal_id gerado

---

#### 🔍 **4. PERSISTÊNCIA DE DADOS**
```sql
-- Verificar se webhook foi salvo
SELECT * FROM raw_webhook 
WHERE source = 'TRADINGVIEW_V2' 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar campos salvos
SELECT 
  id,
  source,
  payload->>'symbol' as symbol,
  payload->>'action' as action,
  status,
  created_at,
  server_id,
  version
FROM raw_webhook 
ORDER BY created_at DESC 
LIMIT 3;
```

**✅ Resultado esperado:**
- Registros de teste presentes
- Dados JSON salvos corretamente
- Timestamps atuais
- Server_id e version preenchidos

---

#### ⚡ **5. PERFORMANCE**
```bash
# Testar múltiplos webhooks simultâneos
for i in {1..5}; do
  curl -X POST https://[NOVA-URL]/api/webhooks/tradingview \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"coinbitclub_webhook_secret_2024\",\"symbol\":\"TEST$i\",\"action\":\"BUY\",\"price\":1000}" &
done
wait
```

**✅ Resultado esperado:**
- Todos os 5 requests retornam 200
- Tempo de resposta < 2 segundos
- Todos salvos no banco sem conflitos

---

#### 🔄 **6. MIGRAÇÃO DE DADOS HISTÓRICOS**
```sql
-- Verificar se dados antigos foram migrados (se aplicável)
SELECT 
  COUNT(*) as total_webhooks,
  COUNT(DISTINCT source) as sources,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM raw_webhook;

-- Verificar integridade por fonte
SELECT 
  source,
  COUNT(*) as count,
  MIN(created_at) as first,
  MAX(created_at) as last
FROM raw_webhook 
GROUP BY source
ORDER BY source;
```

**✅ Resultado esperado:**
- Contagem consistente com dados originais
- Datas preservadas corretamente
- Todas as fontes presentes

---

#### 🛡️ **7. SEGURANÇA E SSL**
```bash
# Verificar se SSL está funcionando
curl -I https://[NOVA-URL]/health

# Testar conexão SSL do banco
railway variables get DATABASE_SSL
```

**✅ Resultado esperado:**
- HTTPS funcionando corretamente
- DATABASE_SSL=true configurado
- Certificados válidos

---

### 🚨 **RESOLUÇÃO DE PROBLEMAS**

#### ❌ **Problema: Banco não conecta**
```bash
# Verificar variáveis do banco
railway variables | grep DATABASE

# Reconectar ao banco
railway add postgresql

# Verificar logs
railway logs | grep -i database
```

#### ❌ **Problema: Tabelas não existem**
```sql
-- Aplicar backup manualmente
\i migration-backup-[TIMESTAMP].sql

-- Verificar se foi aplicado
\dt
```

#### ❌ **Problema: Webhooks não salvam**
```bash
# Verificar logs de erro
railway logs | grep -i error

# Testar endpoint isoladamente
curl https://[NOVA-URL]/api/health
```

#### ❌ **Problema: Performance lenta**
```sql
-- Verificar índices
SELECT schemaname,tablename,indexname,indexdef 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Criar índices se necessário
CREATE INDEX IF NOT EXISTS idx_raw_webhook_created_at ON raw_webhook(created_at);
```

---

### 📋 **CHECKLIST FINAL**

Marque cada item após verificação:

- [ ] ✅ **Conectividade**: Health check retorna "healthy"
- [ ] ✅ **Estrutura**: Tabelas e índices criados
- [ ] ✅ **Webhooks**: TradingView webhook funciona
- [ ] ✅ **Persistência**: Dados são salvos corretamente
- [ ] ✅ **Performance**: Resposta < 2 segundos
- [ ] ✅ **Migração**: Dados históricos preservados (se aplicável)
- [ ] ✅ **Segurança**: SSL e variables configurados
- [ ] ✅ **Logs**: Sem erros críticos nos logs
- [ ] ✅ **Monitoramento**: Métricas normais

---

### 🎯 **VALIDAÇÃO COMPLETA**

Execute o teste automatizado:
```bash
node test-migration.js https://[NOVA-URL]
```

**✅ Se todos os testes passarem:**
- ✅ Banco de dados está 100% funcional
- ✅ Migração foi bem-sucedida
- ✅ Sistema pronto para produção

**❌ Se algum teste falhar:**
- 🔍 Analise os logs detalhados
- 🔄 Execute rollback se necessário: `.\rollback-migration.ps1`
- 🛠️ Corrija problemas específicos
- 🔁 Execute novos testes

---

### 📞 **SUPORTE DE EMERGÊNCIA**

#### 🆘 **Em caso de problemas críticos:**
1. **Rollback imediato**: `.\rollback-migration.ps1 -Force`
2. **Verificar projeto antigo**: Voltar para URL original
3. **Análise de logs**: `railway logs -f`
4. **Suporte Railway**: https://railway.app/help

#### 📋 **Informações para suporte:**
- ID do novo projeto: [OBTIDO DURANTE MIGRAÇÃO]
- URL nova: [NOVA-URL]
- Arquivo de backup: migration-backup-[TIMESTAMP].sql
- Data da migração: [DATA]

---

**🎉 BANCO DE DADOS MIGRADO COM SUCESSO!**

> **Nota**: Mantenha este checklist para futuras referências e documentação da migração.
